targetScope = 'resourceGroup'

param name string
param location string = 'southeastasia'
param storageName string
param vaultName string
param environmentId string
@maxLength(130)
param image string
param bootstrapId string
param expiresAt int
@allowed(['init', 'commit'])
param phase string = 'init'
@secure()
param envelope string = ''

var digest = last(split(image, ':'))
var digestIsHex = empty(filter(range(0, length(digest)), i => !contains('0123456789abcdef', substring(digest, i, 1))))
var imageIsValid = startsWith(image, 'ghcr.io/turbo998/voice-agent-lab@sha256:') && length(digest) == 64 && digestIsHex
var verifiedImage = imageIsValid ? image : fail('A verified digest-pinned Voice Agent Lab image is required.')

resource storage 'Microsoft.Storage/storageAccounts@2025-06-01' existing = { name: storageName }
resource vault 'Microsoft.KeyVault/vaults@2024-11-01' existing = { name: vaultName }

module identity 'br/public:avm/res/managed-identity/user-assigned-identity:0.6.0' = {
  name: 'temporary-bootstrap-identity'
  params: {
    name: 'id-${name}-bootstrap'
    location: location
    tags: { project: 'voice-agent-lab', purpose: 'temporary-bootstrap' }
    enableTelemetry: false
  }
}

resource blobRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, name, 'temporary-bootstrap-blob')
  scope: storage
  properties: {
    principalId: identity.outputs.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  }
}
resource queueRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, name, 'temporary-bootstrap-queue')
  scope: storage
  properties: {
    principalId: identity.outputs.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '974c5e8b-45b9-4653-ba55-5f855dd0fb88')
  }
}
resource vaultRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(vault.id, name, 'temporary-bootstrap-secrets')
  scope: vault
  properties: {
    principalId: identity.outputs.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7')
  }
}

module job 'br/public:avm/res/app/job:0.7.2' = {
  name: 'private-bootstrap-job'
  dependsOn: [blobRole, queueRole, vaultRole]
  params: {
    name: 'job-${name}-bootstrap'
    location: location
    tags: { project: 'voice-agent-lab', purpose: 'temporary-bootstrap' }
    environmentResourceId: environmentId
    managedIdentities: { userAssignedResourceIds: [identity.outputs.resourceId] }
    workloadProfileName: 'Consumption'
    triggerType: 'Manual'
    replicaTimeout: 120
    replicaRetryLimit: 0
    manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }
    containers: [{
      name: 'bootstrap'
      image: verifiedImage
      command: ['node']
      args: ['dist/server/integrations/private/bootstrap-job.js']
      resources: { cpu: json('0.25'), memory: '0.5Gi' }
      env: [
        { name: 'LAB_MODE', value: 'azure' }
        { name: 'AZURE_CLIENT_ID', value: identity.outputs.clientId }
        { name: 'AZURE_STORAGE_BLOB_ENDPOINT', value: storage.properties.primaryEndpoints.blob }
        { name: 'AZURE_STORAGE_QUEUE_ENDPOINT', value: storage.properties.primaryEndpoints.queue }
        { name: 'BOOTSTRAP_VAULT_URI', value: vault.properties.vaultUri }
        { name: 'BOOTSTRAP_PHASE', value: phase }
        { name: 'BOOTSTRAP_ID', value: bootstrapId }
        { name: 'BOOTSTRAP_EXPIRES_AT', value: string(expiresAt) }
        { name: 'BOOTSTRAP_ENVELOPE', value: envelope }
      ]
    }]
    enableTelemetry: false
  }
}

output jobName string = job.outputs.name
output temporaryIdentityId string = identity.outputs.resourceId
output temporaryPrincipalId string = identity.outputs.principalId
output temporaryRoleIds array = [blobRole.id, queueRole.id, vaultRole.id]

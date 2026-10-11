targetScope = 'resourceGroup'

param name string
param location string = 'southeastasia'
param storageName string
param vaultName string

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
output temporaryIdentityId string = identity.outputs.resourceId
output temporaryClientId string = identity.outputs.clientId
output temporaryPrincipalId string = identity.outputs.principalId
output temporaryRoleIds array = [blobRole.id, queueRole.id, vaultRole.id]

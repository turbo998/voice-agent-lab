targetScope = 'resourceGroup'

param name string
param jobName string
param location string = 'southeastasia'
param environmentId string
param identityId string
param identityClientId string
param blobEndpoint string
param queueEndpoint string
param vaultUri string
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

module job 'br/public:avm/res/app/job:0.7.2' = {
  name: 'private-bootstrap-job'
  params: {
    name: jobName
    location: location
    tags: { project: 'voice-agent-lab', purpose: 'temporary-bootstrap' }
    environmentResourceId: environmentId
    managedIdentities: { userAssignedResourceIds: [identityId] }
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
      resources: { cpu: '0.25', memory: '0.5Gi' }
      env: [
        { name: 'LAB_MODE', value: 'azure' }
        { name: 'AZURE_CLIENT_ID', value: identityClientId }
        { name: 'AZURE_STORAGE_BLOB_ENDPOINT', value: blobEndpoint }
        { name: 'AZURE_STORAGE_QUEUE_ENDPOINT', value: queueEndpoint }
        { name: 'BOOTSTRAP_VAULT_URI', value: vaultUri }
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

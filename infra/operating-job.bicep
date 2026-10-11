targetScope = 'resourceGroup'

param name string
param location string = 'southeastasia'
param image string
param environmentId string
param identityId string
param identityClientId string
param blobEndpoint string
param appIds array
@allowed(['reserve', 'block'])
param action string
@minValue(1)
@maxValue(180)
param minutes int = 30

var digest = last(split(image, ':'))
var digestIsHex = empty(filter(range(0, length(digest)), i => !contains('0123456789abcdef', substring(digest, i, 1))))
var verifiedImage = startsWith(image, 'ghcr.io/turbo998/voice-agent-lab@sha256:') && length(digest) == 64 && digestIsHex ? image : fail('Verified image required.')
module job 'br/public:avm/res/app/job:0.7.2' = {
  name: 'finite-window-operation'
  params: {
    name: 'job-${name}-window'
    location: location
    tags: { project: 'voice-agent-lab', purpose: 'temporary-window-operator' }
    environmentResourceId: environmentId
    managedIdentities: { userAssignedResourceIds: [identityId] }
    workloadProfileName: 'Consumption'
    triggerType: 'Manual'
    replicaTimeout: 120
    replicaRetryLimit: 0
    manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }
    containers: [{
      name: 'window'
      image: verifiedImage
      command: ['node']
      args: ['dist/server/integrations/private/window-operator.js']
      resources: { cpu: '0.25', memory: '0.5Gi' }
      env: [
        { name: 'LAB_MODE', value: 'azure' }
        { name: 'AZURE_CLIENT_ID', value: identityClientId }
        { name: 'AZURE_STORAGE_BLOB_ENDPOINT', value: blobEndpoint }
        { name: 'OPERATING_APP_IDS', value: string(appIds) }
        { name: 'OPERATING_ACTION', value: action }
        { name: 'OPERATING_MINUTES', value: string(minutes) }
      ]
    }]
    enableTelemetry: false
  }
}

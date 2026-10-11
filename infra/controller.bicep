targetScope = 'resourceGroup'

param name string
param location string = 'southeastasia'
param image string
param environmentId string
param identityId string
param identityClientId string
param blobEndpoint string
param appIds array
param jobName string = 'job-${name}-controller'
@allowed(['Schedule', 'Manual'])
param triggerType string = 'Schedule'

var digest = last(split(image, ':'))
var digestIsHex = empty(filter(range(0, length(digest)), i => !contains('0123456789abcdef', substring(digest, i, 1))))
var verifiedImage = startsWith(image, 'ghcr.io/turbo998/voice-agent-lab@sha256:') && length(digest) == 64 && digestIsHex ? image : fail('Verified image required.')

module controller 'br/public:avm/res/app/job:0.7.2' = {
  name: 'independent-runtime-controller'
  params: {
    name: jobName
    location: location
    tags: { project: 'voice-agent-lab', purpose: 'independent-stop' }
    environmentResourceId: environmentId
    managedIdentities: { userAssignedResourceIds: [identityId] }
    workloadProfileName: 'Consumption'
    triggerType: triggerType
    replicaTimeout: 30
    replicaRetryLimit: 0
    scheduleTriggerConfig: triggerType == 'Schedule' ? {
      cronExpression: '*/20 * * * *'
      parallelism: 1
      replicaCompletionCount: 1
    } : null
    manualTriggerConfig: triggerType == 'Manual' ? { parallelism: 1, replicaCompletionCount: 1 } : null
    containers: [{
      name: 'controller'
      image: verifiedImage
      command: ['node']
      args: ['controller.cjs']
      resources: { cpu: '0.25', memory: '0.5Gi' }
      env: [
        { name: 'LAB_MODE', value: 'azure' }
        { name: 'AZURE_CLIENT_ID', value: identityClientId }
        { name: 'AZURE_STORAGE_BLOB_ENDPOINT', value: blobEndpoint }
        { name: 'OPERATING_APP_IDS', value: string(appIds) }
      ]
    }]
    enableTelemetry: false
  }
}

targetScope = 'resourceGroup'

param name string
param location string
param tags object
param image string
param environmentId string
param identityId string
param identityClientId string
param storageBlobEndpoint string
param storageQueueEndpoint string
param vaultUri string
param liveProviderEndpoint string
param liveReasoningEndpoint string

var verifiedImage = startsWith(image, 'ghcr.io/turbo998/voice-agent-lab@sha256:') && length(last(split(image, ':'))) == 64
  ? image
  : fail('A digest-pinned public Voice Agent Lab image is required.')

resource environment 'Microsoft.App/managedEnvironments@2025-01-01' existing = {
  name: last(split(environmentId, '/'))
}
var operatorName = 'ca-${name}-retell'
var liveName = 'ca-${name}-live'
var operatorOrigin = 'https://${operatorName}.${environment.properties.defaultDomain}'
var liveOrigin = 'https://${liveName}.${environment.properties.defaultDomain}'
var commonEnv = [
  { name: 'LAB_MODE', value: 'azure' }
  { name: 'PORT', value: '8080' }
  { name: 'AZURE_CLIENT_ID', value: identityClientId }
  { name: 'AZURE_STORAGE_BLOB_ENDPOINT', value: storageBlobEndpoint }
  { name: 'AZURE_STORAGE_QUEUE_ENDPOINT', value: storageQueueEndpoint }
  { name: 'TOKEN_SECRET', secretRef: 'token-secret' }
  { name: 'OPERATOR_PASSWORD_HASH', secretRef: 'operator-password-hash' }
  { name: 'REMOTE_CALLS_ENABLED', value: 'false' }
  { name: 'LIVE_CALLS_ENABLED', value: 'false' }
]
var commonSecrets = [
  { name: 'token-secret', keyVaultUrl: '${vaultUri}secrets/token-secret', identity: identityId }
  { name: 'operator-password-hash', keyVaultUrl: '${vaultUri}secrets/operator-password-hash', identity: identityId }
]

module app 'br/public:avm/res/app/container-app:0.23.0' = [for kind in ['retell', 'live']: {
  name: 'app-${kind}'
  params: {
    name: kind == 'retell' ? operatorName : liveName
    location: location
    tags: union(tags, { service: kind })
    environmentResourceId: environmentId
    workloadProfileName: 'Consumption'
    managedIdentities: { userAssignedResourceIds: [identityId] }
    ingressExternal: true
    ingressAllowInsecure: false
    ingressTargetPort: 8080
    ingressTransport: 'http'
    activeRevisionsMode: 'Single'
    maxInactiveRevisions: 0
    terminationGracePeriodSeconds: 30
    scaleSettings: {
      minReplicas: 0
      maxReplicas: 1
      rules: [{
        name: 'http'
        http: { metadata: { concurrentRequests: '2' } }
      }]
    }
    secrets: commonSecrets
    containers: [{
      name: 'lab'
      image: verifiedImage
      command: ['node']
      args: [kind == 'retell' ? 'dist/server/apps/retell-demo/server/index.js' : 'dist/server/apps/gpt-live/server/index.js']
      resources: { cpu: json('0.25'), memory: '0.5Gi' }
      env: concat(commonEnv, [
        { name: 'APP_ORIGIN', value: kind == 'retell' ? operatorOrigin : liveOrigin }
        { name: 'OPERATOR_APP_URL', value: operatorOrigin }
        { name: 'GPT_LIVE_URL', value: liveOrigin }
      ], kind == 'live' ? [
        { name: 'LIVE_PROVIDER_ENDPOINT', value: liveProviderEndpoint }
        { name: 'LIVE_REASONING_ENDPOINT', value: liveReasoningEndpoint }
      ] : [])
      probes: [
        { type: 'Startup', tcpSocket: { port: 8080 }, periodSeconds: 5, failureThreshold: 30 }
        { type: 'Liveness', tcpSocket: { port: 8080 }, periodSeconds: 30 }
        { type: 'Readiness', tcpSocket: { port: 8080 }, periodSeconds: 10 }
      ]
    }]
    enableTelemetry: false
  }
}]

module worker 'br/public:avm/res/app/job:0.7.2' = {
  name: 'postcall-worker'
  params: {
    name: 'job-${name}-postcall'
    location: location
    tags: union(tags, { service: 'postcall-worker' })
    environmentResourceId: environmentId
    managedIdentities: { userAssignedResourceIds: [identityId] }
    workloadProfileName: 'Consumption'
    triggerType: 'Event'
    replicaTimeout: 60
    replicaRetryLimit: 0
    secrets: commonSecrets
    eventTriggerConfig: {
      parallelism: 1
      replicaCompletionCount: 1
      scale: {
        minExecutions: 0
        maxExecutions: 1
        pollingInterval: 60
        rules: [{
          name: 'postcall'
          type: 'azure-queue'
          identity: identityId
          metadata: {
            queueName: 'postcall'
            queueLength: '1'
            accountName: first(split(last(split(storageQueueEndpoint, '//')), '.'))
          }
        }]
      }
    }
    containers: [{
      name: 'worker'
      image: verifiedImage
      command: ['node']
      args: ['dist/server/apps/retell-demo/server/worker.js']
      resources: { cpu: json('0.25'), memory: '0.5Gi' }
      env: concat(commonEnv, [{ name: 'APP_ORIGIN', value: operatorOrigin }])
    }]
    enableTelemetry: false
  }
}

output operatorUrl string = operatorOrigin
output gptLiveUrl string = liveOrigin

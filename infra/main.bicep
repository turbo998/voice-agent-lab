targetScope = 'subscription'

@description('Unique lab environment name. Creates only a new rg-voice-lab-* resource group.')
@minLength(3)
@maxLength(12)
param environmentName string

@allowed(['southeastasia'])
param location string = 'southeastasia'

@description('Apps are a second stage, after private secret provisioning and digest-pinned images.')
param deployApps bool = false

@description('Public GHCR image digest, not a mutable tag. Required only when deployApps is true.')
param image string = ''

@description('Discovered Azure OpenAI resource roots, validated privately after foundation deployment.')
param liveProviderEndpoint string = ''
param liveReasoningEndpoint string = ''

var suffix = take(uniqueString(subscription().id, environmentName), 6)
var tags = {
  workload: 'voice-agent-lab'
  environment: environmentName
  data: 'synthetic-only'
  stage: 'bounded-poc'
}

resource rg 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: 'rg-voice-lab-${environmentName}-${suffix}'
  location: location
  tags: tags
}

module foundation 'modules/foundation.bicep' = {
  name: 'voice-lab-foundation'
  scope: rg
  params: {
    name: 'vl${suffix}'
    location: location
    tags: tags
  }
}

module apps 'modules/apps.bicep' = if (deployApps) {
  name: 'voice-lab-apps'
  scope: rg
  params: {
    name: 'vl${suffix}'
    location: location
    tags: tags
    image: image
    environmentId: foundation.outputs.environmentId
    identityId: foundation.outputs.identityId
    identityClientId: foundation.outputs.identityClientId
    storageBlobEndpoint: foundation.outputs.blobEndpoint
    storageQueueEndpoint: foundation.outputs.queueEndpoint
    vaultUri: foundation.outputs.vaultUri
    liveProviderEndpoint: liveProviderEndpoint
    liveReasoningEndpoint: liveReasoningEndpoint
  }
}

output resourceGroupName string = rg.name
output runtime object = foundation.outputs.runtime
output operatorUrl string = deployApps ? apps!.outputs.operatorUrl : ''
output gptLiveUrl string = deployApps ? apps!.outputs.gptLiveUrl : ''

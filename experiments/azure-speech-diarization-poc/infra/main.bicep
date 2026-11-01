targetScope = 'subscription'

@description('Azure region for the resource group and Speech account.')
param location string = 'eastus2'

@description('Dedicated resource group for the Speech diarization PoC.')
param resourceGroupName string = 'rg-speech-poc-example'

@description('Globally unique Azure AI Speech account name.')
param speechAccountName string = 'spchpoc${uniqueString(subscription().id, resourceGroupName)}'

@description('Microsoft Entra object ID that receives Cognitive Services Speech User.')
param principalId string

@description('Resource tags applied to the resource group and Speech account.')
param tags object = {
  purpose: 'speech-diarization-poc'
  environment: 'nonproduction'
}

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-11-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module speech 'speech.bicep' = {
  name: 'speech-diarization-poc'
  scope: resourceGroup
  params: {
    accountName: speechAccountName
    location: location
    principalId: principalId
    tags: tags
  }
}

output resourceGroupName string = resourceGroup.name
output speechAccountName string = speech.outputs.accountName
output speechEndpoint string = speech.outputs.endpoint

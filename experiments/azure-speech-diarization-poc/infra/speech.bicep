@description('Globally unique Azure AI Speech account name.')
param accountName string

@description('Azure region for the Speech account.')
param location string

@description('Microsoft Entra object ID that receives Cognitive Services Speech User.')
param principalId string

@description('Resource tags applied to the Speech account.')
param tags object

var cognitiveServicesSpeechUserRoleId = 'f2dc8367-1007-4938-bd23-fe263f013447'

resource speech 'Microsoft.CognitiveServices/accounts@2025-06-01' = {
  name: accountName
  location: location
  kind: 'SpeechServices'
  sku: {
    name: 'S0'
  }
  tags: tags
  properties: {
    allowProjectManagement: false
    customSubDomainName: accountName
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

resource speechUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(speech.id, principalId, cognitiveServicesSpeechUserRoleId)
  scope: speech
  properties: {
    principalId: principalId
    principalType: 'User'
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      cognitiveServicesSpeechUserRoleId
    )
    description: 'Allow the approved PoC operator to use Azure AI Speech.'
  }
}

output accountName string = speech.name
output endpoint string = speech.properties.endpoint

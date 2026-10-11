targetScope = 'resourceGroup'

param name string
param location string = 'southeastasia'
param storageName string

resource storage 'Microsoft.Storage/storageAccounts@2025-01-01' existing = {
  name: storageName
}
resource blob 'Microsoft.Storage/storageAccounts/blobServices@2025-01-01' existing = {
  parent: storage
  name: 'default'
}
resource control 'Microsoft.Storage/storageAccounts/blobServices/containers@2025-01-01' existing = {
  parent: blob
  name: 'lab-control'
}
module identity 'br/public:avm/res/managed-identity/user-assigned-identity:0.6.0' = {
  name: 'temporary-window-identity'
  params: {
    name: 'id-${name}-window'
    location: location
    tags: { project: 'voice-agent-lab', purpose: 'temporary-window-operator' }
    enableTelemetry: false
  }
}
resource writer 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(control.id, name, 'temporary-window-writer')
  scope: control
  properties: {
    principalId: identity.outputs.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  }
}

output identityId string = identity.outputs.resourceId
output clientId string = identity.outputs.clientId
output principalId string = identity.outputs.principalId
output writerRoleId string = writer.id

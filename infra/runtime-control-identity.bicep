targetScope = 'resourceGroup'

param name string
param location string = 'southeastasia'
param storageName string
param runtimePrincipalId string

resource storage 'Microsoft.Storage/storageAccounts@2025-01-01' existing = {
  name: storageName
}
resource blob 'Microsoft.Storage/storageAccounts/blobServices@2025-01-01' existing = {
  parent: storage
  name: 'default'
}
resource state 'Microsoft.Storage/storageAccounts/blobServices/containers@2025-01-01' existing = {
  parent: blob
  name: 'lab-private'
}
resource control 'Microsoft.Storage/storageAccounts/blobServices/containers@2025-01-01' existing = {
  parent: blob
  name: 'lab-control'
}
module identity 'br/public:avm/res/managed-identity/user-assigned-identity:0.6.0' = {
  name: 'independent-controller-identity'
  params: {
    name: 'id-${name}-controller'
    location: location
    tags: { project: 'voice-agent-lab', purpose: 'independent-stop' }
    enableTelemetry: false
  }
}
var readerRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1')
var contributorRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
resource runtimeState 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(state.id, runtimePrincipalId, contributorRole)
  scope: state
  properties: { principalId: runtimePrincipalId, principalType: 'ServicePrincipal', roleDefinitionId: contributorRole }
}
resource runtimeControl 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(control.id, runtimePrincipalId, readerRole)
  scope: control
  properties: { principalId: runtimePrincipalId, principalType: 'ServicePrincipal', roleDefinitionId: readerRole }
}
resource controllerControl 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(control.id, name, 'independent-controller-reader')
  scope: control
  properties: { principalId: identity.outputs.principalId, principalType: 'ServicePrincipal', roleDefinitionId: readerRole }
}
resource stopRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: guid(resourceGroup().id, 'voice-lab-revision-stop')
  properties: {
    roleName: '${name}-revision-stop'
    description: 'Read and deactivate lab app revisions only; no activation, secrets or app changes.'
    type: 'CustomRole'
    permissions: [{
      actions: [
        'Microsoft.App/containerApps/revisions/read'
        'Microsoft.App/containerApps/revisions/deactivate/action'
      ]
      notActions: []
      dataActions: []
      notDataActions: []
    }]
    assignableScopes: [resourceGroup().id]
  }
}

output controllerIdentityId string = identity.outputs.resourceId
output controllerClientId string = identity.outputs.clientId
output controllerPrincipalId string = identity.outputs.principalId
output stopRoleId string = stopRole.id
output runtimeStateRoleId string = runtimeState.id
output runtimeControlRoleId string = runtimeControl.id
output controllerControlRoleId string = controllerControl.id

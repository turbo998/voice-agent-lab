targetScope = 'resourceGroup'

param name string
param location string
param tags object
param accountName string
param projectName string
param runtimePrincipalId string

resource account 'Microsoft.CognitiveServices/accounts@2025-06-01' existing = {
  name: accountName
}
resource project 'Microsoft.CognitiveServices/accounts/projects@2025-06-01' existing = {
  parent: account
  name: projectName
}

module search 'br/public:avm/res/search/search-service:0.13.0' = {
  name: 'free-simple-search'
  params: {
    name: 'srch-${name}'
    location: location
    tags: tags
    sku: 'free'
    replicaCount: 1
    partitionCount: 1
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
    roleAssignments: [
      {
        name: guid(resourceGroup().id, name, 'foundry-search-data')
        principalId: account.identity.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Search Index Data Contributor'
      }
      {
        name: guid(resourceGroup().id, name, 'foundry-search-service')
        principalId: account.identity.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Search Service Contributor'
      }
      {
        name: guid(resourceGroup().id, name, 'runtime-search-read')
        principalId: runtimePrincipalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Search Index Data Reader'
      }
    ]
    enableTelemetry: false
  }
}

resource connection 'Microsoft.CognitiveServices/accounts/projects/connections@2025-06-01' = {
  parent: project
  name: 'lumanest-search'
  properties: {
    category: 'CognitiveSearch'
    authType: 'AAD'
    target: 'https://${search.outputs.name}.search.windows.net'
    isSharedToAll: true
    metadata: {
      ApiType: 'Azure'
      ResourceId: search.outputs.resourceId
    }
  }
}

output searchName string = search.outputs.name
output connectionId string = connection.id

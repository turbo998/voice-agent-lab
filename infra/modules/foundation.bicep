targetScope = 'resourceGroup'

param name string
param location string
param tags object

module identity 'br/public:avm/res/managed-identity/user-assigned-identity:0.6.0' = {
  name: 'runtime-identity'
  params: {
    name: 'id-${name}'
    location: location
    tags: tags
    enableTelemetry: false
  }
}

module logs 'br/public:avm/res/operational-insights/workspace:0.16.1' = {
  name: 'bounded-logs'
  params: {
    name: 'log-${name}'
    location: location
    tags: tags
    skuName: 'PerGB2018'
    dataRetention: 30
    dailyQuotaGb: '0.1'
    forceCmkForQuery: false
    enableTelemetry: false
  }
}

module storage 'br/public:avm/res/storage/storage-account:0.33.1' = {
  name: 'private-state'
  params: {
    name: 'st${name}${take(uniqueString(resourceGroup().id), 8)}'
    location: location
    tags: tags
    skuName: 'Standard_LRS'
    kind: 'StorageV2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    publicNetworkAccess: 'Disabled'
    networkAcls: {
      bypass: 'None'
      defaultAction: 'Allow'
    }
    requireInfrastructureEncryption: true
    blobServices: {
      containers: [{ name: 'lab-private' }]
      deleteRetentionPolicyEnabled: true
      deleteRetentionPolicyDays: 7
      containerDeleteRetentionPolicyEnabled: true
      containerDeleteRetentionPolicyDays: 7
      isVersioningEnabled: false
    }
    queueServices: {
      queues: [{ name: 'postcall' }, { name: 'postcall-poison' }]
    }
    roleAssignments: [
      {
        name: guid(resourceGroup().id, name, 'runtime-blob')
        principalId: identity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Storage Blob Data Contributor'
      }
      {
        name: guid(resourceGroup().id, name, 'runtime-queue')
        principalId: identity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Storage Queue Data Contributor'
      }
    ]
    enableTelemetry: false
  }
}

module vault 'br/public:avm/res/key-vault/vault:0.14.2' = {
  name: 'runtime-vault'
  params: {
    name: 'kv-${name}'
    location: location
    tags: tags
    sku: 'standard'
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
    enableVaultForDeployment: false
    enableVaultForTemplateDeployment: false
    enableVaultForDiskEncryption: false
    publicNetworkAccess: 'Disabled'
    roleAssignments: [{
      name: guid(resourceGroup().id, name, 'runtime-secrets')
      principalId: identity.outputs.principalId
      principalType: 'ServicePrincipal'
      roleDefinitionIdOrName: 'Key Vault Secrets User'
    }]
    enableTelemetry: false
  }
}

module environment 'br/public:avm/res/app/managed-environment:0.16.0' = {
  name: 'consumption-environment'
  params: {
    name: 'cae-${name}'
    location: location
    tags: tags
    zoneRedundant: false
    publicNetworkAccess: 'Enabled'
    internal: false
    peerTrafficEncryption: true
    workloadProfiles: [{ name: 'Consumption', workloadProfileType: 'Consumption' }]
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsWorkspaceResourceId: logs.outputs.resourceId
    }
    enableTelemetry: false
  }
}

module foundry 'br/public:avm/ptn/ai-ml/ai-foundry:0.7.0' = {
  name: 'basic-foundry-project'
  params: {
    baseName: name
    baseUniqueName: take(uniqueString(resourceGroup().id), 5)
    location: location
    tags: tags
    includeAssociatedResources: false
    aiModelDeployments: []
    aiFoundryConfiguration: {
      sku: 'S0'
      accountName: 'ai-${name}'
      disableLocalAuth: true
      allowProjectManagement: true
      createCapabilityHosts: false
      project: {
        name: 'lumanest'
        displayName: 'LumaNest browser voice lab'
        desc: 'Original synthetic diagnosis only; no hosted compute or external writes.'
      }
      roleAssignments: [{
        name: guid(resourceGroup().id, name, 'runtime-foundry-inference')
        principalId: identity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
      }]
    }
    enableTelemetry: false
  }
}

resource foundryAccount 'Microsoft.CognitiveServices/accounts@2025-06-01' existing = {
  name: 'ai-${name}'
}
resource project 'Microsoft.CognitiveServices/accounts/projects@2025-06-01' existing = {
  parent: foundryAccount
  name: 'lumanest'
}

resource projectUse 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(project.id, resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', 'id-${name}'), 'azure-ai-user')
  scope: project
  dependsOn: [foundry]
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '53ca6127-db72-4b80-b1b0-d745d6d5456d')
    principalId: identity.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

module grounding 'search-grounding.bicep' = {
  name: 'search-grounding'
  params: {
    name: name
    location: location
    tags: tags
    accountName: foundry.outputs.aiServicesName
    projectName: foundry.outputs.aiProjectName
    runtimePrincipalId: identity.outputs.principalId
  }
}

module liveAccount 'br/public:avm/res/cognitive-services/account:0.19.1' = {
  name: 'independent-live-account'
  params: {
    name: 'aoai-live-${name}'
    location: 'southindia'
    tags: tags
    kind: 'OpenAI'
    sku: 'S0'
    customSubDomainName: 'aoai-live-${name}'
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
    deployments: []
    roleAssignments: [{
      name: guid(resourceGroup().id, name, 'runtime-live-inference')
      principalId: identity.outputs.principalId
      principalType: 'ServicePrincipal'
      roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
    }]
    enableTelemetry: false
  }
}

output identityId string = identity.outputs.resourceId
output identityClientId string = identity.outputs.clientId
output environmentId string = environment.outputs.resourceId
output vaultUri string = vault.outputs.uri
output blobEndpoint string = 'https://${storage.outputs.name}.blob.${az.environment().suffixes.storage}'
output queueEndpoint string = 'https://${storage.outputs.name}.queue.${az.environment().suffixes.storage}'
output runtime object = {
  identityId: identity.outputs.resourceId
  identityClientId: identity.outputs.clientId
  environmentName: environment.outputs.name
  storageName: storage.outputs.name
  keyVaultName: vault.outputs.name
  foundryAccountName: foundry.outputs.aiServicesName
  foundryProjectName: foundry.outputs.aiProjectName
  searchName: grounding.outputs.searchName
  searchConnectionId: grounding.outputs.connectionId
  liveAccountName: liveAccount.outputs.name
  logWorkspaceId: logs.outputs.resourceId
}

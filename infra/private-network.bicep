targetScope = 'resourceGroup'

param name string
param location string = 'southeastasia'
param storageName string
param vaultName string
param logWorkspaceName string
param addressPrefix string
param appSubnetPrefix string
param endpointSubnetPrefix string
param tags object = { project: 'voice-agent-lab', stage: 'private-foundation' }

resource storage 'Microsoft.Storage/storageAccounts@2025-06-01' existing = { name: storageName }
resource vault 'Microsoft.KeyVault/vaults@2024-11-01' existing = { name: vaultName }
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = { name: logWorkspaceName }

module network 'br/public:avm/res/network/virtual-network:0.10.0' = {
  name: 'private-lab-vnet'
  params: {
    name: 'vnet-${name}-private'
    location: location
    tags: tags
    addressPrefixes: [addressPrefix]
    subnets: [
      {
        name: 'apps'
        addressPrefix: appSubnetPrefix
        delegation: 'Microsoft.App/environments'
      }
      {
        name: 'endpoints'
        addressPrefix: endpointSubnetPrefix
        privateEndpointNetworkPolicies: 'Disabled'
      }
    ]
    enableTelemetry: false
  }
}

var services = [
  { group: 'blob', zone: 'privatelink.blob.core.windows.net', target: storage.id }
  { group: 'queue', zone: 'privatelink.queue.core.windows.net', target: storage.id }
  { group: 'vault', zone: 'privatelink.vaultcore.azure.net', target: vault.id }
]

module zones 'br/public:avm/res/network/private-dns-zone:0.8.0' = [for service in services: {
  name: 'dns-${service.group}'
  params: {
    name: service.zone
    tags: tags
    virtualNetworkLinks: [{
      name: '${name}-private'
      virtualNetworkResourceId: network.outputs.resourceId
      registrationEnabled: false
    }]
    enableTelemetry: false
  }
}]

module endpoints 'br/public:avm/res/network/private-endpoint:0.12.0' = [for (service, index) in services: {
  name: 'pe-${service.group}'
  params: {
    name: 'pe-${name}-${service.group}'
    location: location
    tags: tags
    subnetResourceId: '${network.outputs.resourceId}/subnets/endpoints'
    privateLinkServiceConnections: [{
      name: service.group
      properties: {
        privateLinkServiceId: service.target
        groupIds: [service.group]
      }
    }]
    privateDnsZoneGroup: {
      name: 'default'
      privateDnsZoneGroupConfigs: [{ name: service.group, privateDnsZoneResourceId: zones[index].outputs.resourceId }]
    }
    enableTelemetry: false
  }
}]

module environment 'br/public:avm/res/app/managed-environment:0.16.0' = {
  name: 'private-consumption-environment'
  params: {
    name: 'cae-${name}-private'
    location: location
    tags: tags
    zoneRedundant: false
    internal: false
    publicNetworkAccess: 'Enabled'
    infrastructureSubnetResourceId: '${network.outputs.resourceId}/subnets/apps'
    infrastructureResourceGroupName: 'rg-${name}-private-managed'
    peerTrafficEncryption: true
    workloadProfiles: [{ name: 'Consumption', workloadProfileType: 'Consumption' }]
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsWorkspaceResourceId: logs.id
    }
    enableTelemetry: false
  }
}

output environmentId string = environment.outputs.resourceId
output networkId string = network.outputs.resourceId
output privateEndpointIds array = [for (service, index) in services: endpoints[index].outputs.resourceId]

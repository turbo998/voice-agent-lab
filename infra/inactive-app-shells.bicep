targetScope = 'resourceGroup'

param name string
param location string = 'southeastasia'
param image string
param environmentId string
param controllerPrincipalId string
param stopRoleId string

var digest = last(split(image, ':'))
var digestIsHex = empty(filter(range(0, length(digest)), i => !contains('0123456789abcdef', substring(digest, i, 1))))
var verifiedImage = startsWith(image, 'ghcr.io/turbo998/voice-agent-lab@sha256:') && length(digest) == 64 && digestIsHex ? image : fail('Verified image required.')

resource apps 'Microsoft.App/containerApps@2025-01-01' = [for kind in ['retell', 'live']: {
  name: 'ca-${name}-${kind}'
  location: location
  tags: { project: 'voice-agent-lab', stage: 'inactive-stop-acceptance' }
  properties: {
    managedEnvironmentId: environmentId
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Single'
      maxInactiveRevisions: 1
    }
    template: {
      containers: [{
        name: 'lab'
        image: verifiedImage
        command: ['node']
        args: ['-e', 'console.error("INACTIVE_SHELL_UNEXPECTED_START");process.exit(1)']
        resources: { cpu: json('0.25'), memory: '0.5Gi' }
      }]
      scale: { minReplicas: 0, maxReplicas: 1 }
    }
  }
}]
resource grants 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (kind, i) in ['retell', 'live']: {
  name: guid(resourceGroup().id, name, kind, 'independent-stop')
  scope: apps[i]
  properties: {
    principalId: controllerPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: stopRoleId
  }
}]

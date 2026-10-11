targetScope = 'resourceGroup'

param jobName string
param location string = 'southeastasia'
param environmentId string
param identityId string
param image string
param vaultUri string
param versions object

var secretNames = ['token-secret', 'operator-password-hash', 'retell-api-key', 'retell-webhook-signing-key']
var digest = last(split(image, ':'))
var digestIsHex = empty(filter(range(0, length(digest)), i => !contains('0123456789abcdef', substring(digest, i, 1))))
var verifiedImage = startsWith(image, 'ghcr.io/turbo998/voice-agent-lab@sha256:') && length(digest) == 64 && digestIsHex ? image : fail('Verified image required.')

module probe 'br/public:avm/res/app/job:0.7.2' = {
  name: 'private-secret-reference-probe'
  params: {
    name: jobName
    location: location
    tags: { project: 'voice-agent-lab', purpose: 'temporary-bootstrap' }
    environmentResourceId: environmentId
    managedIdentities: { userAssignedResourceIds: [identityId] }
    workloadProfileName: 'Consumption'
    triggerType: 'Manual'
    replicaTimeout: 30
    replicaRetryLimit: 0
    manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }
    secrets: [for secretName in secretNames: {
      name: secretName
      keyVaultUrl: '${vaultUri}secrets/${secretName}/${versions[secretName]}'
      identity: identityId
    }]
    containers: [{
      name: 'probe'
      image: verifiedImage
      command: ['node']
      args: [
        '-e'
        'const e=process.env;if(!/^[a-f0-9]{96}$/.test(e.PROBE_0||"")||!/^scrypt\\$[a-f0-9]{32}\\$[a-f0-9]{128}$/.test(e.PROBE_1||"")||[e.PROBE_2,e.PROBE_3].some(v=>!v||v.length<16)){console.error("SECRET_REFERENCE_PROBE_FAILED");process.exit(1)}console.log(JSON.stringify({event:"secret_references_resolved",count:4}))'
      ]
      resources: { cpu: '0.25', memory: '0.5Gi' }
      env: [for (secretName, i) in secretNames: { name: 'PROBE_${i}', secretRef: secretName }]
    }]
    enableTelemetry: false
  }
}

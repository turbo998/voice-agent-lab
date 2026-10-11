targetScope = 'resourceGroup'

param name string
param location string = 'southeastasia'
param image string
param environmentId string
param identityId string
param identityClientId string
param blobEndpoint string
param queueEndpoint string
param vaultUri string
param versions object

var secretNames = ['token-secret', 'operator-password-hash', 'retell-api-key', 'retell-webhook-signing-key']
var referenceEnv = [for (secretName, i) in secretNames: { name: 'PROBE_${i}', secretRef: secretName }]
var digest = last(split(image, ':'))
var digestIsHex = empty(filter(range(0, length(digest)), i => !contains('0123456789abcdef', substring(digest, i, 1))))
var verifiedImage = startsWith(image, 'ghcr.io/turbo998/voice-agent-lab@sha256:') && length(digest) == 64 && digestIsHex ? image : fail('Verified image required.')
module job 'br/public:avm/res/app/job:0.7.2' = {
  name: 'finite-runtime-access-proof'
  params: {
    name: 'job-${name}-access'
    location: location
    tags: { project: 'voice-agent-lab', purpose: 'temporary-access-probe' }
    environmentResourceId: environmentId
    managedIdentities: { userAssignedResourceIds: [identityId] }
    workloadProfileName: 'Consumption'
    triggerType: 'Manual'
    replicaTimeout: 120
    replicaRetryLimit: 0
    manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }
    secrets: [for secretName in secretNames: {
      name: secretName
      keyVaultUrl: '${vaultUri}secrets/${secretName}/${versions[secretName]}'
      identity: identityId
    }]
    containers: [{
      name: 'access'
      image: verifiedImage
      command: ['node']
      args: [
        '--input-type=module'
        '-e'
        '''
import {BlobServiceClient} from "@azure/storage-blob";
import {QueueServiceClient} from "@azure/storage-queue";
import {randomUUID} from "node:crypto";
import {azureCredential} from "./dist/server/integrations/azure/credential.js";
import {AzureControlStore} from "./dist/server/integrations/private/control-store.js";
let stage="reference";
let denialStatus=null;
let denialCode=null;
try {
const e=process.env;
if(!/^[a-f0-9]{96}$/.test(e.PROBE_0||"")||!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(e.PROBE_1||"")||[e.PROBE_2,e.PROBE_3].some(v=>!v||v.length<16))throw Error("REFERENCE_INVALID");
const c=azureCredential("azure");
stage="control_read";
const b=new BlobServiceClient(e.AZURE_STORAGE_BLOB_ENDPOINT,c,{retryOptions:{maxTries:1,tryTimeoutInMs:3000}});
const state=await new AzureControlStore(e.AZURE_STORAGE_BLOB_ENDPOINT).read();
if(!state.blocked)throw Error("CONTROL_NOT_BLOCKED");
stage="blob_cas";
const probe=b.getContainerClient("lab-private").getBlockBlobClient(randomUUID()+".probe");
await probe.uploadData(Buffer.from("synthetic-probe"),{conditions:{ifNoneMatch:"*"}});
const r=await probe.download();if(!r.etag)throw Error("ETAG_MISSING");await r.readableStreamBody?.destroy();
await probe.uploadData(Buffer.from("synthetic-updated"),{conditions:{ifMatch:r.etag}});
await probe.delete();
stage="queue_metadata";
await new QueueServiceClient(e.AZURE_STORAGE_QUEUE_ENDPOINT,c,{retryOptions:{maxTries:1,tryTimeoutInMs:3000}}).getQueueClient("postcall").getProperties();
async function denied(fn){try{await fn()}catch(x){denialStatus=Number.isInteger(x?.statusCode)?x.statusCode:null;denialCode=x?.code==="AuthorizationPermissionMismatch"?x.code:null;if(denialStatus===403&&denialCode)return;throw Error("DENIAL_UNCONFIRMED")}throw Error("EXCESS_PERMISSION")}
stage="control_write_denial";
const deniedProbe=b.getContainerClient("lab-control").getBlockBlobClient(randomUUID()+".denial-probe");
await denied(async()=>{await deniedProbe.upload("synthetic-denial-probe",22,{conditions:{ifNoneMatch:"*"}});await deniedProbe.delete()});
stage="bootstrap_read_denial";
await denied(()=>b.getContainerClient("bootstrap-private").listBlobsFlat().byPage({maxPageSize:1}).next());
console.log(JSON.stringify({event:"runtime_access_verified",references:4,controlRead:true,controlWriteDenied:true,bootstrapReadDenied:true,blobCas:true,queue:true}));
}catch(x){console.error(JSON.stringify({event:"runtime_access_failed",stage,httpStatus:Number.isInteger(x?.statusCode)?x.statusCode:denialStatus,authorizationCode:denialCode,code:["REFERENCE_INVALID","CONTROL_NOT_BLOCKED","ETAG_MISSING","DENIAL_UNCONFIRMED","EXCESS_PERMISSION"].includes(x?.message)?x.message:"ACCESS_UNCONFIRMED"}));process.exitCode=1}
'''
      ]
      resources: { cpu: '0.25', memory: '0.5Gi' }
      env: concat([
        { name: 'LAB_MODE', value: 'azure' }
        { name: 'AZURE_CLIENT_ID', value: identityClientId }
        { name: 'AZURE_STORAGE_BLOB_ENDPOINT', value: blobEndpoint }
        { name: 'AZURE_STORAGE_QUEUE_ENDPOINT', value: queueEndpoint }
      ], referenceEnv)
    }]
    enableTelemetry: false
  }
}

import { BlobServiceClient } from "@azure/storage-blob";
import { QueueServiceClient } from "@azure/storage-queue";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { z } from "zod";
import { azureCredential } from "../azure/credential.js";
import { decryptBootstrap, generateBootstrapKeys } from "./bootstrap-crypto.js";

async function main(): Promise<void> {
const config = z.object({
  BOOTSTRAP_PHASE: z.enum(["init", "commit"]),
  BOOTSTRAP_ID: z.string().uuid(),
  BOOTSTRAP_EXPIRES_AT: z.coerce.number().int().positive(),
  BOOTSTRAP_ENVELOPE: z.string().max(24_000).optional(),
  AZURE_STORAGE_BLOB_ENDPOINT: z.url(),
  AZURE_STORAGE_QUEUE_ENDPOINT: z.url(),
  BOOTSTRAP_VAULT_URI: z.url(),
}).parse(process.env);
const binding = { bootstrapId: config.BOOTSTRAP_ID, expiresAt: config.BOOTSTRAP_EXPIRES_AT };
if (binding.expiresAt <= Date.now() || binding.expiresAt - Date.now() > 15 * 60_000) {
  throw new Error("BOOTSTRAP_WINDOW_INVALID");
}
const credential = azureCredential("azure");
const blobUrl = new URL(config.AZURE_STORAGE_BLOB_ENDPOINT);
const queueUrl = new URL(config.AZURE_STORAGE_QUEUE_ENDPOINT);
const vaultUrl = new URL(config.BOOTSTRAP_VAULT_URI);
for (const [url, suffix] of [
  [blobUrl, ".blob.core.windows.net"],
  [queueUrl, ".queue.core.windows.net"],
  [vaultUrl, ".vault.azure.net"],
] as const) {
  if (url.protocol !== "https:" || !url.hostname.endsWith(suffix) ||
      url.username || url.password || url.port || url.search || url.hash || url.pathname !== "/") {
    throw new Error("BOOTSTRAP_ENDPOINT_INVALID");
  }
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => {
    if (isIP(address) !== 4) return true;
    const octets = address.split(".").map(Number);
    return !(octets[0] === 10 || (octets[0] === 172 && octets[1]! >= 16 && octets[1]! <= 31) ||
      (octets[0] === 192 && octets[1] === 168));
  })) throw new Error("BOOTSTRAP_PRIVATE_DNS_REQUIRED");
}
const blobService = new BlobServiceClient(blobUrl.href, credential, {
  retryOptions: { maxTries: 1, tryTimeoutInMs: 15_000 },
});
const queue = new QueueServiceClient(queueUrl.href, credential, {
  retryOptions: { maxTries: 1, tryTimeoutInMs: 15_000 },
}).getQueueClient("postcall");
const container = blobService.getContainerClient("bootstrap-private");
const manifest = container.getBlockBlobClient(`${binding.bootstrapId}.json`);
const keyBlob = container.getBlockBlobClient(`${binding.bootstrapId}.key`);

async function vaultRequest(path: string, method = "GET", body?: object): Promise<Response> {
  const token = await credential.getToken("https://vault.azure.net/.default");
  if (!token) throw new Error("BOOTSTRAP_VAULT_AUTH_FAILED");
  const response = await fetch(new URL(`${path}?api-version=7.4`, vaultUrl), {
    method, headers: {
      Authorization: `Bearer ${token.token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`BOOTSTRAP_VAULT_HTTP_${response.status}`);
  return response;
}
async function writeManifest(status: string, conditions: { leaseId?: string; ifNoneMatch?: string } = {}) {
  const body = JSON.stringify({ version: 1, ...binding, status });
  await manifest.upload(body, Buffer.byteLength(body), {
    conditions, blobHTTPHeaders: { blobContentType: "application/json" },
  });
}

if (config.BOOTSTRAP_PHASE === "init") {
  await container.createIfNotExists();
  await blobService.getContainerClient("lab-private").createIfNotExists();
  await queue.createIfNotExists();
  await queue.getProperties();
  // Metadata-only KV request: no secret values are collected or emitted.
  await (await vaultRequest("secrets")).body?.cancel();
  const keys = generateBootstrapKeys();
  try {
    await writeManifest("initializing", { ifNoneMatch: "*" });
    await keyBlob.uploadData(keys.privateKey, { conditions: { ifNoneMatch: "*" } });
    await writeManifest("ready");
    console.log(JSON.stringify({ event: "bootstrap_ready", ...binding, publicKey: keys.publicKey }));
  } finally {
    keys.privateKey.fill(0);
  }
} else {
  if (!config.BOOTSTRAP_ENVELOPE) throw new Error("BOOTSTRAP_ENVELOPE_REQUIRED");
  const lease = manifest.getBlobLeaseClient();
  await lease.acquireLease(60);
  let privateKey: Buffer | undefined;
  let claimed = false;
  try {
    const state = z.object({
      version: z.literal(1), bootstrapId: z.string().uuid(),
      expiresAt: z.number().int(), status: z.literal("ready"),
    }).strict().parse(JSON.parse((await manifest.downloadToBuffer()).toString("utf8")));
    if (state.bootstrapId !== binding.bootstrapId || state.expiresAt !== binding.expiresAt) {
      throw new Error("BOOTSTRAP_MANIFEST_MISMATCH");
    }
    privateKey = await keyBlob.downloadToBuffer();
    const values = decryptBootstrap(JSON.parse(config.BOOTSTRAP_ENVELOPE), privateKey, binding);
    await writeManifest("applying", { leaseId: lease.leaseId });
    claimed = true;
    for (const [name, value] of Object.entries(values)) {
      if (Date.now() >= binding.expiresAt) throw new Error("BOOTSTRAP_EXPIRED_DURING_WRITE");
      await lease.renewLease();
      await (await vaultRequest(`secrets/${name}`, "PUT", { value })).body?.cancel();
    }
    await writeManifest("complete", { leaseId: lease.leaseId });
    console.log(JSON.stringify({ event: "bootstrap_complete", secretCount: Object.keys(values).length }));
  } catch (error) {
    if (claimed) await writeManifest("failed_requires_operator", { leaseId: lease.leaseId });
    throw error;
  } finally {
    privateKey?.fill(0);
    if (claimed) await keyBlob.delete();
    await lease.releaseLease();
  }
}
}

await main().catch((error: unknown) => {
  const code = error instanceof Error && /^BOOTSTRAP_[A-Z0-9_]+$/.test(error.message)
    ? error.message : "BOOTSTRAP_UNCONFIRMED";
  console.error(JSON.stringify({ event: "bootstrap_failed", code }));
  process.exitCode = 1;
});

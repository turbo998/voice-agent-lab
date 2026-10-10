import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { BlobServiceClient } from "@azure/storage-blob";
import { azureCredential } from "../../../integrations/azure/credential.js";
import { initialState, type LabState, type StateStore } from "../../../packages/business-core/state.js";
import { LabError } from "../../../packages/business-core/contracts.js";
import { pruneState, stateSchema } from "../../../packages/business-core/state-schema.js";

function decode(text: string): LabState {
  if (Buffer.byteLength(text) > 2 * 1024 * 1024) throw new LabError("STATE_CAPACITY", 503, "Durable state exceeds the bounded lab size.");
  const value = stateSchema.safeParse(JSON.parse(text));
  if (!value.success) {
    throw new LabError("STATE_CORRUPT", 503, "Persistent state has an unsupported schema.");
  }
  return value.data;
}

export class MemoryStore implements StateStore {
  private state = initialState();
  async read() { return structuredClone(this.state); }
  async update<T>(mutate: (state: LabState) => T) {
    const next = structuredClone(this.state);
    const result = mutate(next);
    next.revision++;
    this.state = next;
    return result;
  }
}

export class FileStore implements StateStore {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private path: string) {}
  async read(): Promise<LabState> {
    try { return decode(await readFile(this.path, "utf8")); }
    catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return initialState();
      throw error;
    }
  }
  async update<T>(mutate: (state: LabState) => T): Promise<T> {
    const operation = this.tail.then(async () => {
      const next = await this.read();
      pruneState(next);
      const result = mutate(next);
      next.revision++;
      stateSchema.parse(next);
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = `${this.path}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(next), { mode: 0o600, flag: "wx" });
      await rename(temporary, this.path);
      return result;
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
}

export class AzureBlobStore implements StateStore {
  private blob;
  constructor(endpoint: string) {
    this.blob = new BlobServiceClient(endpoint, azureCredential("azure"))
      .getContainerClient("lab-private").getBlockBlobClient("state.json");
  }
  async read(): Promise<LabState> {
    return (await this.download()).state;
  }
  private async download() {
    try {
      const response = await this.blob.download();
      return { state: decode(await response.blobBody?.then(b => b.text()) ??
        await streamText(response.readableStreamBody)), etag: response.etag };
    } catch (error) {
      if (statusCode(error) === 404) return { state: initialState(), etag: undefined };
      throw new LabError("STATE_UNAVAILABLE", 503, "Durable state unavailable; new operations are blocked.");
    }
  }
  async update<T>(mutate: (state: LabState) => T): Promise<T> {
    for (let attempt = 0; attempt < 6; attempt++) {
      const { state, etag } = await this.download();
      pruneState(state);
      const result = mutate(state);
      state.revision++;
      stateSchema.parse(state);
      const body = JSON.stringify(state);
      try {
        await this.blob.upload(body, Buffer.byteLength(body), {
          conditions: etag ? { ifMatch: etag } : { ifNoneMatch: "*" },
          blobHTTPHeaders: { blobContentType: "application/json" },
        });
        return result;
      } catch (error) {
        if (statusCode(error) !== 412 && statusCode(error) !== 409) {
          throw new LabError("STATE_UNAVAILABLE", 503, "Durable commit failed; operation not acknowledged.");
        }
      }
    }
    throw new LabError("STATE_CONTENTION", 503, "Durable state is busy; retry the same operation.");
  }
}
function statusCode(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error ? error.statusCode : undefined;
}
async function streamText(stream: NodeJS.ReadableStream | undefined) {
  if (!stream) throw new LabError("STATE_UNAVAILABLE", 503, "Empty durable state response.");
  const buffers: Buffer[] = [];
  for await (const chunk of stream) buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(buffers).toString("utf8");
}

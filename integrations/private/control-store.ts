import { BlobServiceClient } from "@azure/storage-blob";
import { azureCredential } from "../azure/credential.js";
import { controlSchema, type OperatingControl } from "./operating-windows.js";

export class AzureControlStore {
  private blob;
  constructor(endpoint: string, mode = "azure") {
    this.blob = new BlobServiceClient(endpoint, azureCredential(mode), {
      retryOptions: { maxTries: 1, tryTimeoutInMs: 3_000 },
    }).getContainerClient("lab-control").getBlockBlobClient("operating-windows.json");
  }
  async read(): Promise<OperatingControl> {
    return (await this.snapshot()).state;
  }
  private async snapshot(): Promise<{ state: OperatingControl; etag: string }> {
    const response = await this.blob.download();
    if (!response.etag || !response.readableStreamBody) throw new Error("OPERATING_CONTROL_EMPTY");
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of response.readableStreamBody) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      length += buffer.length;
      if (length > 128 * 1024) throw new Error("OPERATING_CONTROL_CAPACITY");
      chunks.push(buffer);
    }
    return {
      state: controlSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8"))),
      etag: response.etag,
    };
  }
  async update(mutate: (state: OperatingControl) => OperatingControl): Promise<OperatingControl> {
    for (let i = 0; i < 3; i++) {
      const { state, etag } = await this.snapshot();
      const next = controlSchema.parse(mutate(state));
      const body = JSON.stringify(next);
      try {
        await this.blob.upload(body, Buffer.byteLength(body), {
          conditions: { ifMatch: etag }, blobHTTPHeaders: { blobContentType: "application/json" },
        });
        return next;
      } catch (error) {
        if (!(error && typeof error === "object" && "statusCode" in error && error.statusCode === 412)) {
          throw error;
        }
      }
    }
    throw new Error("OPERATING_CONTROL_CONTENTION");
  }
}

import { z } from "zod";
import { azureCredential } from "../azure/credential.js";
import { AzureControlStore } from "./control-store.js";
import { stopOutsideWindows } from "./stop-controller.js";

async function main(): Promise<void> {
  const config = z.object({
    AZURE_STORAGE_BLOB_ENDPOINT: z.url(),
    OPERATING_APP_IDS: z.string().max(2048),
  }).parse(process.env);
  const appIds = z.array(z.string().regex(
    /^\/subscriptions\/[a-f0-9-]{36}\/resourceGroups\/[a-zA-Z0-9_-]+\/providers\/Microsoft\.App\/containerApps\/[a-z0-9-]+$/,
  )).length(2).parse(JSON.parse(config.OPERATING_APP_IDS));
  if (appIds[0] === appIds[1]) throw new Error("OPERATING_TARGETS_INVALID");
  const store = new AzureControlStore(config.AZURE_STORAGE_BLOB_ENDPOINT);
  const token = await azureCredential("azure").getToken("https://management.azure.com/.default");
  if (!token) throw new Error("OPERATING_MANAGEMENT_AUTH_FAILED");
  async function request(path: string, method = "GET"): Promise<Response> {
    const response = await fetch(`https://management.azure.com${path}?api-version=2025-01-01`, {
      method, headers: { Authorization: `Bearer ${token!.token}` },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`OPERATING_MANAGEMENT_HTTP_${response.status}`);
    }
    return response;
  }
  const result = await stopOutsideWindows({
    readControl: () => store.read(),
    revisions: async appId => {
      const response = await request(`${appId}/revisions`);
      if (response.status === 404) return [];
      const value = z.object({
        value: z.array(z.object({
          name: z.string().regex(/^[a-z0-9-]+$/),
          properties: z.object({ active: z.boolean() }),
        })).max(25),
        nextLink: z.string().nullable().optional(),
      }).parse(await response.json());
      if (value.nextLink) throw new Error("OPERATING_REVISION_LIST_TRUNCATED");
      return value.value.map(r => ({ name: r.name, active: r.properties.active }));
    },
    deactivate: async (appId, revision) => {
      const response = await request(`${appId}/revisions/${revision}/deactivate`, "POST");
      if (response.status === 404) throw new Error("OPERATING_DEACTIVATION_UNCONFIRMED");
      await response.body?.cancel();
    },
  }, appIds);
  console.log(JSON.stringify({ event: "operating_controller_completed", ...result }));
}
void main().catch(() => {
  console.error(JSON.stringify({ event: "operating_controller_failed", code: "DEACTIVATION_UNCONFIRMED" }));
  process.exitCode = 1;
});

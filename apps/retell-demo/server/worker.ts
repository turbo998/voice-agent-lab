import { loadConfig } from "./config.js";
import { AzureBlobStore, FileStore } from "./store.js";
import { EventInbox } from "./events.js";
import { AzureControlStore } from "../../../integrations/private/control-store.js";
import { operatingWindowAllowed } from "../../../integrations/private/operating-windows.js";

const config = loadConfig();
if (config.LAB_MODE === "azure") {
  if (!config.OPERATING_APP_ID || !operatingWindowAllowed(
    await new AzureControlStore(config.AZURE_STORAGE_BLOB_ENDPOINT!).read(), config.OPERATING_APP_ID,
  )) {
    console.error(JSON.stringify({ event: "worker_window_closed" }));
    process.exit(0);
  }
}
const store = config.LAB_MODE === "azure" ? new AzureBlobStore(config.AZURE_STORAGE_BLOB_ENDPOINT!) : new FileStore(config.LOCAL_STATE_PATH);
const inbox = new EventInbox(store, config.AZURE_STORAGE_QUEUE_ENDPOINT);
await inbox.drain();
console.log(JSON.stringify({ event: "worker_completed" }));

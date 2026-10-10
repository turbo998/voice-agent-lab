import { loadConfig } from "./config.js";
import { AzureBlobStore, FileStore } from "./store.js";
import { EventInbox } from "./events.js";

const config = loadConfig();
const store = config.LAB_MODE === "azure" ? new AzureBlobStore(config.AZURE_STORAGE_BLOB_ENDPOINT!) : new FileStore(config.LOCAL_STATE_PATH);
const inbox = new EventInbox(store, config.AZURE_STORAGE_QUEUE_ENDPOINT);
await inbox.drain();
console.log(JSON.stringify({ event: "worker_completed" }));

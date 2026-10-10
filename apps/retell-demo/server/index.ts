import { loadConfig } from "./config.js";
import { AzureBlobStore, FileStore } from "./store.js";
import { createApp } from "./app.js";
import { FoundryDiagnoser } from "../../../integrations/foundry/diagnoser.js";

const config = loadConfig();
const store = config.LAB_MODE === "azure" ? new AzureBlobStore(config.AZURE_STORAGE_BLOB_ENDPOINT!) : new FileStore(config.LOCAL_STATE_PATH);
const diagnoser = config.FOUNDRY_PROJECT_ENDPOINT ? new FoundryDiagnoser(config, store) : undefined;
const { server, inbox } = createApp(config, store, { diagnoser });
const localWorker = config.LAB_MODE === "local" ? setInterval(() => {
  void inbox.drain().catch(() => console.error(JSON.stringify({ event: "local_worker_failed", code: "STATE_UNAVAILABLE" })));
}, 2000) : undefined;
server.listen(config.PORT, config.LAB_MODE === "azure" ? "0.0.0.0" : "127.0.0.1", () => {
  console.log(JSON.stringify({ event: "server_ready", port: config.PORT, mode: config.LAB_MODE }));
});
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => {
  if (localWorker) clearInterval(localWorker);
  server.close(() => process.exit(0));
});

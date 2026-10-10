import { startServer } from "../../../experiments/gpt-live/server.mjs";
import { loadConfig } from "../../retell-demo/server/config.js";
import { AzureBlobStore, FileStore } from "../../retell-demo/server/store.js";
import { FoundryDiagnoser } from "../../../integrations/foundry/diagnoser.js";
import { createLiveRuntime } from "../../../integrations/gpt-live/runtime.js";

const config = loadConfig();
const store = config.LAB_MODE === "azure" ? new AzureBlobStore(config.AZURE_STORAGE_BLOB_ENDPOINT!) : new FileStore(config.LOCAL_STATE_PATH);
const diagnoser = config.FOUNDRY_PROJECT_ENDPOINT ? new FoundryDiagnoser(config, store) : undefined;
const cloud = await createLiveRuntime(config, store, { diagnoser });
const application = await startServer({ host: "0.0.0.0", port: config.PORT, mode: "remote", publicOrigin: config.APP_ORIGIN, cloud, quiet: true });
console.log(JSON.stringify({ event: "live_app_started", port: config.PORT, callsEnabled: config.LIVE_CALLS_ENABLED === "true" }));
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
  application.close().then(() => process.exit(0), () => { console.error(JSON.stringify({ event: "live_shutdown_unconfirmed" })); process.exitCode = 1; });
});

import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const destination = join("dist", "server", "experiments", "gpt-live");
await mkdir(destination, { recursive: true });
for (const name of ["public", "package.json", "LICENSE", "PROVENANCE.json", "server.mjs", "config.mjs",
  "backend.mjs", "tools.mjs", "connections.mjs", "delivery.mjs", "fast-time.mjs", "auth.mjs", "settings-store.mjs", "ui-messages.mjs"]) {
  await cp(join("experiments", "gpt-live", name), join(destination, name), { recursive: true });
}

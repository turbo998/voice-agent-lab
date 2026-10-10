import { randomBytes, scryptSync } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const directory = join(process.cwd(), ".private");
await mkdir(directory, { recursive: true });
const target = join(directory, "lab.env");
try {
  await access(target);
  throw new Error("Private configuration already exists; refusing to overwrite it.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16).toString("hex");
const hash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
await writeFile(target, [
  "LAB_MODE=local", "APP_ORIGIN=http://127.0.0.1:8080", "PORT=8080",
  `OPERATOR_PASSWORD_HASH=${hash}`, `TOKEN_SECRET=${randomBytes(48).toString("hex")}`,
  "LOCAL_STATE_PATH=.private/state.json", "REMOTE_CALLS_ENABLED=false",
].join("\n") + "\n", { flag: "wx", mode: 0o600 });
await writeFile(join(directory, "operator.password.txt"), password + "\n", { flag: "wx", mode: 0o600 });
console.log("Local configuration created in ignored .private. Read operator.password.txt privately; credentials are not printed.");

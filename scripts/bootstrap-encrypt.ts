import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { encryptBootstrap } from "../integrations/private/bootstrap-crypto.js";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath || process.argv.length !== 4) {
  throw new Error("BOOTSTRAP_PUBLIC_INPUT_AND_CIPHERTEXT_OUTPUT_PATH_REQUIRED");
}
const publicInput = z.object({
  event: z.literal("bootstrap_ready"),
  bootstrapId: z.string().uuid(), expiresAt: z.number().int().positive(),
  publicKey: z.string().max(2048),
}).strict().parse(JSON.parse(await readFile(inputPath, "utf8")));
const runtime = z.object({
  TOKEN_SECRET: z.string().min(32),
  OPERATOR_PASSWORD_HASH: z.string().min(32),
  RETELL_API_KEY: z.string().min(16),
  RETELL_WEBHOOK_SIGNING_KEY: z.string().min(16),
}).parse(process.env);
const envelope = encryptBootstrap({
  "token-secret": runtime.TOKEN_SECRET,
  "operator-password-hash": runtime.OPERATOR_PASSWORD_HASH,
  "retell-api-key": runtime.RETELL_API_KEY,
  "retell-webhook-signing-key": runtime.RETELL_WEBHOOK_SIGNING_KEY,
}, publicInput.publicKey, {
  bootstrapId: publicInput.bootstrapId, expiresAt: publicInput.expiresAt,
});
await writeFile(outputPath, JSON.stringify(envelope), { flag: "wx", mode: 0o600 });
console.log(JSON.stringify({ event: "bootstrap_ciphertext_created", plaintextPersisted: false }));

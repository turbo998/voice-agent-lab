import {
  constants, createCipheriv, createDecipheriv, generateKeyPairSync,
  privateDecrypt, publicEncrypt, randomBytes,
} from "node:crypto";
import { z } from "zod";

const secretValues = z.object({
  "token-secret": z.string().min(32).max(512),
  "operator-password-hash": z.string().min(32).max(512),
  "retell-api-key": z.string().min(16).max(512).optional(),
  "retell-webhook-signing-key": z.string().min(16).max(512).optional(),
}).strict();
const envelopeSchema = z.object({
  version: z.literal(1),
  bootstrapId: z.string().uuid(),
  expiresAt: z.number().int().positive(),
  wrappedKey: z.string().max(1024),
  nonce: z.string().max(32),
  tag: z.string().max(32),
  ciphertext: z.string().max(16_384),
}).strict();
export type BootstrapSecrets = z.infer<typeof secretValues>;
export type BootstrapEnvelope = z.infer<typeof envelopeSchema>;
export interface BootstrapBinding { bootstrapId: string; expiresAt: number }
const bindingSchema = z.object({
  bootstrapId: z.string().uuid(), expiresAt: z.number().int().positive(),
}).strict();

function checkBinding(binding: BootstrapBinding, now: number): void {
  bindingSchema.parse(binding);
  if (!Number.isSafeInteger(now) || binding.expiresAt <= now || binding.expiresAt - now > 15 * 60_000) {
    throw new Error("BOOTSTRAP_WINDOW_INVALID");
  }
}
function associatedData(binding: BootstrapBinding): Buffer {
  return Buffer.from(JSON.stringify({
    version: 1, bootstrapId: binding.bootstrapId, expiresAt: binding.expiresAt,
  }));
}
function decode(value: string, length?: number): Buffer {
  const result = Buffer.from(value, "base64");
  if (result.toString("base64") !== value || (length !== undefined && result.length !== length)) {
    throw new Error("BOOTSTRAP_ENCODING_INVALID");
  }
  return result;
}

export function generateBootstrapKeys(): { publicKey: string; privateKey: Buffer } {
  const keys = generateKeyPairSync("rsa", {
    modulusLength: 3072,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey: keys.publicKey, privateKey: Buffer.from(keys.privateKey) };
}

export function encryptBootstrap(
  secrets: BootstrapSecrets, publicKey: string, binding: BootstrapBinding, now = Date.now(),
): BootstrapEnvelope {
  checkBinding(binding, now);
  const plaintext = Buffer.from(JSON.stringify(secretValues.parse(secrets)));
  const key = randomBytes(32);
  const nonce = randomBytes(12);
  try {
    const cipher = createCipheriv("aes-256-gcm", key, nonce);
    cipher.setAAD(associatedData(binding));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const wrappedKey = publicEncrypt({
      key: publicKey, oaepHash: "sha256", padding: constants.RSA_PKCS1_OAEP_PADDING,
    }, key);
    return {
      version: 1, ...binding, wrappedKey: wrappedKey.toString("base64"),
      nonce: nonce.toString("base64"), tag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    };
  } finally {
    key.fill(0);
    plaintext.fill(0);
  }
}

export function decryptBootstrap(
  input: unknown, privateKey: Buffer, binding: BootstrapBinding, now = Date.now(),
): BootstrapSecrets {
  checkBinding(binding, now);
  const envelope = envelopeSchema.parse(input);
  if (envelope.bootstrapId !== binding.bootstrapId || envelope.expiresAt !== binding.expiresAt) {
    throw new Error("BOOTSTRAP_BINDING_MISMATCH");
  }
  const wrapped = decode(envelope.wrappedKey, 384);
  const nonce = decode(envelope.nonce, 12);
  const tag = decode(envelope.tag, 16);
  const ciphertext = decode(envelope.ciphertext);
  const key = privateDecrypt({
    key: privateKey, oaepHash: "sha256", padding: constants.RSA_PKCS1_OAEP_PADDING,
  }, wrapped);
  let plaintext: Buffer | undefined;
  try {
    if (key.length !== 32) throw new Error("BOOTSTRAP_KEY_INVALID");
    const cipher = createDecipheriv("aes-256-gcm", key, nonce);
    cipher.setAAD(associatedData(binding));
    cipher.setAuthTag(tag);
    plaintext = Buffer.concat([cipher.update(ciphertext), cipher.final()]);
    return secretValues.parse(JSON.parse(plaintext.toString("utf8")));
  } finally {
    key.fill(0);
    plaintext?.fill(0);
  }
}

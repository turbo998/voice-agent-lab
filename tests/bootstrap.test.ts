import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptBootstrap, encryptBootstrap, generateBootstrapKeys,
} from "../integrations/private/bootstrap-crypto.js";

test("private bootstrap authenticates purpose, expiry and ciphertext without exposing plaintext", () => {
  const now = 1_800_000_000_000;
  const binding = { bootstrapId: randomUUID(), expiresAt: now + 60_000 };
  const keys = generateBootstrapKeys();
  const secrets = {
    "token-secret": "synthetic-token-value-for-offline-test-only",
    "operator-password-hash": "synthetic-password-hash-for-offline-test-only",
    "retell-api-key": "synthetic-offline-key",
  };
  try {
    const envelope = encryptBootstrap(secrets, keys.publicKey, binding, now);
    assert.ok(!JSON.stringify(envelope).includes(secrets["token-secret"]));
    assert.deepEqual(decryptBootstrap(envelope, keys.privateKey, binding, now), secrets);
    assert.throws(() => decryptBootstrap(envelope, keys.privateKey,
      { ...binding, bootstrapId: randomUUID() }, now), /BINDING_MISMATCH/);
    assert.throws(() => decryptBootstrap(envelope, keys.privateKey, binding, binding.expiresAt),
      /WINDOW_INVALID/);
    assert.throws(() => encryptBootstrap(secrets, keys.publicKey,
      { ...binding, expiresAt: now + 16 * 60_000 }, now), /WINDOW_INVALID/);
    const ciphertext = Buffer.from(envelope.ciphertext, "base64");
    ciphertext[0] = ciphertext[0]! ^ 1;
    assert.throws(() => decryptBootstrap({
      ...envelope, ciphertext: ciphertext.toString("base64"),
    }, keys.privateKey, binding, now));
    assert.throws(() => decryptBootstrap({ ...envelope, extra: true },
      keys.privateKey, binding, now));
    assert.throws(() => encryptBootstrap({ ...secrets, unexpected: "not-allowed" } as typeof secrets,
      keys.publicKey, binding, now));
  } finally {
    keys.privateKey.fill(0);
  }
});

import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { LabError } from "../../../packages/business-core/contracts.js";
import type { StateStore } from "../../../packages/business-core/state.js";

export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("base64url");

export function verifyPassword(password: string, stored: string): boolean {
  const [, salt, digest] = stored.split("$");
  if (!salt || !digest || password.length > 512) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function verifyRetellSignature(raw: Buffer, signature: string | undefined, key: string | undefined, now = Date.now()) {
  if (!signature || !key) return false;
  const match = /^v=(\d{13}),d=([0-9a-f]{64})$/.exec(signature);
  if (!match?.[1] || !match[2] || Math.abs(now - Number(match[1])) > 300000) return false;
  const computed = createHmac("sha256", key).update(raw).update(match[1]).digest();
  return timingSafeEqual(computed, Buffer.from(match[2], "hex"));
}
export async function authenticate(store: StateStore, cookie: string | undefined, cookieName = "lab_session") {
  const prefix = `${cookieName}=`;
  const credential = cookie?.split(";").map(v => v.trim()).find(v => v.startsWith(prefix))?.slice(prefix.length);
  if (!credential) throw new LabError("AUTH_REQUIRED", 401, "Operator login required.");
  const auth = (await store.read()).auth[hash(credential)];
  if (!auth || auth.expiresAt < Date.now()) throw new LabError("AUTH_EXPIRED", 401, "Operator session expired.");
  return auth;
}
export function checkCsrf(origin: string | undefined, provided: string | undefined, expected: string, configuredOrigin: string) {
  if (origin !== configuredOrigin || !provided || provided !== expected) {
    throw new LabError("CSRF_REJECTED", 403, "Request origin or CSRF token rejected.");
  }
}

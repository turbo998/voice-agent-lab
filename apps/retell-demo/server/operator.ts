import { LabError } from "../../../packages/business-core/contracts.js";
import type { StateStore } from "../../../packages/business-core/state.js";
import { authenticate, hash, token, verifyPassword } from "./security.js";

export class OperatorAuth {
  constructor(private store: StateStore, private config: {
    origin: string; passwordHash: string; tokenSecret: string; cookieName?: string;
  }) {}
  async login(password: string, origin: string | undefined, address: string | undefined) {
    if (origin !== this.config.origin) throw new LabError("ORIGIN_REJECTED", 403, "Use the configured app origin.");
    if (typeof password !== "string" || !password || password.length > 512) throw new LabError("LOGIN_REJECTED", 401, "Invalid operator password.");
    const identity = hash(`${this.config.tokenSecret}:${address}`);
    await this.store.update(state => {
      const now = Date.now();
      for (const [key, value] of Object.entries(state.loginAttempts)) if (value.resetsAt < now) delete state.loginAttempts[key];
      const attempt = state.loginAttempts[identity] ?? { count: 0, resetsAt: now + 60000 };
      if (attempt.count >= 5) throw new LabError("LOGIN_RATE_LIMIT", 429, "Too many attempts; wait one minute.");
      attempt.count++; state.loginAttempts[identity] = attempt;
    });
    if (!verifyPassword(password, this.config.passwordHash)) throw new LabError("LOGIN_REJECTED", 401, "Invalid operator password.");
    const credential = token(), csrf = token(), expiresAt = Date.now() + 4 * 3600000;
    await this.store.update(state => {
      delete state.loginAttempts[identity];
      for (const [key, value] of Object.entries(state.auth)) if (value.expiresAt < Date.now()) delete state.auth[key];
      state.auth[hash(credential)] = { owner: "demo-operator", csrf, expiresAt };
    });
    return { credential, csrf, expiresAt, owner: "demo-operator" };
  }
  require(cookie: string | undefined) {
    return authenticate(this.store, cookie, this.config.cookieName);
  }
  async logout(cookie: string | undefined) {
    const prefix = `${this.config.cookieName ?? "lab_session"}=`;
    const credential = cookie?.split(";").map(v => v.trim()).find(v => v.startsWith(prefix))?.slice(prefix.length);
    if (credential) await this.store.update(state => { delete state.auth[hash(credential)]; });
  }
}

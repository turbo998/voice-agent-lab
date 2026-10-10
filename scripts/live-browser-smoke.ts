import { chromium } from "@playwright/test";
import { randomBytes, randomInt, scryptSync } from "node:crypto";
import { startServer } from "../experiments/gpt-live/server.mjs";
import { createLiveRuntime } from "../integrations/gpt-live/runtime.js";
import { loadConfig } from "../apps/retell-demo/server/config.js";
import { MemoryStore } from "../apps/retell-demo/server/store.js";

const port = randomInt(40000, 65000), origin = `http://127.0.0.1:${port}`;
const password = randomBytes(24).toString("hex"), salt = randomBytes(16).toString("hex");
const store = new MemoryStore();
const cloud = await createLiveRuntime(loadConfig({
  APP_ORIGIN: origin, TOKEN_SECRET: randomBytes(48).toString("hex"),
  OPERATOR_PASSWORD_HASH: `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`,
  LIVE_PROVIDER_ENDPOINT: "https://synthetic-live.openai.azure.com",
  LIVE_REASONING_ENDPOINT: "https://synthetic-reasoning.openai.azure.com",
  OPERATOR_APP_URL: "https://ops.example.invalid",
}), store, { credential: { getToken: async () => { throw new Error("Offline browser must not request provider credentials."); } } });
const app = await startServer({ host: "127.0.0.1", port, mode: "local", cloud, quiet: true });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${origin}/api/health`);
  const authenticated = await page.request.post(`${origin}/api/auth/login`, {
    headers: { Origin: origin }, data: { password },
  });
  if (!authenticated.ok()) throw new Error("Offline cloud fixture authentication failed.");
  await page.goto(origin);
  await page.locator("#operatorApprovalLink").waitFor({ state: "visible" });
  if (await page.locator("#operatorApprovalLink").getAttribute("href") !== "https://ops.example.invalid/") {
    throw new Error("Operator link did not use the server-configured origin.");
  }
  await page.locator(".advanced-settings > summary").click();
  await page.locator("#instructionsInput").fill("Synthetic draft must survive UI language changes.");
  for (const language of ["en", "zh-CN"]) {
    await page.locator("#uiLanguageSelect").selectOption(language);
    await page.locator("#liveGateNotice").waitFor({ state: "visible" });
    const label = language === "en" ? "Open operator approvals" : "打开运营审批";
    if (await page.locator("#operatorApprovalLink").textContent() !== label) throw new Error("Approval link translation failed.");
    if (!await page.locator("#connectButton").isDisabled()) throw new Error("Unverified cloud voice became enabled.");
    if (await page.locator("#languageSelect").inputValue() !== "en-US") throw new Error("UI language changed voice language.");
    if (await page.locator("#instructionsInput").inputValue() !== "Synthetic draft must survive UI language changes.") {
      throw new Error("UI language change overwrote the draft.");
    }
  }
  if (errors.length || Object.keys((await store.read()).liveCalls).length) throw new Error("Unexpected browser error or voice session.");
  console.log(JSON.stringify({ browser: "gpt_cloud_bilingual_gate_passed", realVoice: false, modelCalls: 0 }));
} finally {
  await browser?.close();
  await app.close();
}

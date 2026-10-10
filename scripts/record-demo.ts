import { chromium } from "@playwright/test";
import { randomBytes, randomInt, scryptSync } from "node:crypto";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { createApp } from "../apps/retell-demo/server/app.js";
import { MemoryStore } from "../apps/retell-demo/server/store.js";
import { loadConfig } from "../apps/retell-demo/server/config.js";

const password = randomBytes(24).toString("hex"), salt = randomBytes(16).toString("hex");
const port = randomInt(40000, 65000), origin = `http://127.0.0.1:${port}`;
const { server } = createApp(loadConfig({
  APP_ORIGIN: origin, TOKEN_SECRET: randomBytes(48).toString("hex"),
  OPERATOR_PASSWORD_HASH: `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`,
}), new MemoryStore());
server.listen(port, "127.0.0.1");
await once(server, "listening");
let browser;
try {
  await mkdir(".private\\evidence\\video", { recursive: true });
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 },
    recordVideo: { dir: ".private\\evidence\\video", size: { width: 1600, height: 1000 } } });
  const login = await context.request.post(`${origin}/api/login`, { headers: { Origin: origin }, data: { password } });
  if (!login.ok()) throw new Error("Synthetic video fixture login failed.");
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin);
  await page.getByRole("button", { name: "运行合成业务演练" }).waitFor();
  await page.evaluate(() => {
    const disclosure = document.createElement("div");
    disclosure.textContent = "合成 UI 演练 · 无人声 / 无供应商调用 · 私有视频草稿";
    disclosure.setAttribute("style", "position:fixed;bottom:12px;left:12px;z-index:9999;padding:12px;background:#14283f;color:white;font:16px sans-serif;border-radius:8px;");
    document.body.append(disclosure);
  });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "运行合成业务演练" }).click();
  await page.getByRole("button", { name: "审核并批准" }).waitFor();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "审核并批准" }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "提交批准版本" }).click();
  await page.getByText("committed · v1", { exact: true }).waitFor();
  await page.waitForTimeout(2500);
  await page.getByLabel("同意证据").fill("SYNTHETIC consent: demonstration plan only; never contact a real person.");
  await page.getByLabel("我已核实其同意范围和计划时间").check();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "记录同意并保存计划" }).click();
  await page.locator(".plan").getByText("planned_not_dialed", { exact: true }).waitFor();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "撤回同意 / 取消计划" }).click();
  await page.locator(".plan").getByText("cancelled", { exact: true }).waitFor();
  await page.waitForTimeout(2500);
  if (errors.length || await page.getByRole("alert").count()) throw new Error("Video contains a failed UI operation.");
  const video = page.video();
  if (!video) throw new Error("Browser recording did not start.");
  await context.close();
  await video.saveAs(".private\\evidence\\synthetic-ui-draft.webm");
  console.log(JSON.stringify({ recording: "private_synthetic_draft", humanAudio: false, providerCalls: 0,
    artifact: ".private/evidence/synthetic-ui-draft.webm", publishApproved: false }));
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
}

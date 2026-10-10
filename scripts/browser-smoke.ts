import { chromium } from "@playwright/test";
import { randomBytes, randomInt, scryptSync } from "node:crypto";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { createApp } from "../apps/retell-demo/server/app.js";
import { MemoryStore } from "../apps/retell-demo/server/store.js";
import { loadConfig } from "../apps/retell-demo/server/config.js";

const password = randomBytes(24).toString("hex"), salt = randomBytes(16).toString("hex");
const port = randomInt(40000, 65000);
const config = loadConfig({
  APP_ORIGIN: `http://127.0.0.1:${port}`,
  OPERATOR_PASSWORD_HASH: `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`,
  TOKEN_SECRET: randomBytes(48).toString("hex"),
});
const { server } = createApp(config, new MemoryStore());
server.listen(port, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Local browser fixture failed to bind.");
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(config.APP_ORIGIN);
  await page.getByLabel("运营员密码").fill(password);
  await page.getByRole("button", { name: "进入实验室" }).click();
  await page.getByRole("button", { name: "运行合成业务演练" }).click();
  await page.getByRole("button", { name: "审核并批准" }).click();
  await page.getByRole("button", { name: "提交批准版本" }).click();
  await page.getByText("committed · v1", { exact: true }).waitFor();
  await page.getByLabel("同意证据").fill("SYNTHETIC consent fixture: plan a demonstration follow-up only; no contact.");
  await page.getByLabel("我已核实其同意范围和计划时间").check();
  await page.getByRole("button", { name: "记录同意并保存计划" }).click();
  await page.locator(".plan").getByText("planned_not_dialed", { exact: true }).waitFor();
  await page.getByRole("button", { name: "撤回同意 / 取消计划" }).click();
  await page.locator(".plan").getByText("cancelled", { exact: true }).waitFor();
  if (errors.length) throw new Error("Browser JavaScript error occurred.");
  if (await page.getByRole("alert").count()) throw new Error("Browser operation reported an error.");
  await mkdir(".private\\evidence", { recursive: true });
  await page.screenshot({ path: ".private\\evidence\\synthetic-ops.png", fullPage: true });
  console.log(JSON.stringify({ browser: "synthetic_workflow_passed", realVoice: false,
    modelCalls: 0, artifact: ".private/evidence/synthetic-ops.png" }));
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
}

import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

declare global {
  interface Window {
    mermaid: {
      initialize(config: { startOnLoad: boolean; securityLevel: string; deterministicIds: boolean; theme: string }): void;
      render(id: string, source: string): Promise<{ svg: string }>;
    };
  }
}
const bundle = process.env.MERMAID_BUNDLE;
if (!bundle) throw new Error("MERMAID_BUNDLE must point to the reviewed pinned Mermaid renderer.");
const source = await readFile("docs\\assets\\architecture.mmd", "utf8");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
  await page.route("**/*", route => route.abort());
  await page.setContent("<!doctype html><html><body style='margin:0;background:white'></body></html>");
  await page.addScriptTag({ path: bundle });
  const svg = await page.evaluate(async source => {
    window.mermaid.initialize({ startOnLoad: false, securityLevel: "strict", deterministicIds: true, theme: "neutral" });
    const result = await window.mermaid.render("voiceLabArchitecture", source);
    document.body.innerHTML = result.svg;
    return result.svg;
  }, source);
  if (!svg.includes("NO runtime") || !svg.includes("DISABLED") || !svg.includes("decision REQUIRED")) {
    throw new Error("Architecture export lost required deployment-status labels.");
  }
  await writeFile("docs\\assets\\architecture.svg", svg);
  await page.locator("svg").screenshot({ path: "docs\\assets\\architecture.png" });
  console.log(JSON.stringify({ architecture: "source_rendered_offline", humanData: false, cloudChanges: false }));
} finally { await browser.close(); }

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("presales whitepapers exist and cover business scenarios, architectures, competitors, and speech containers", async () => {
  const files = [
    { path: "../docs/business-scenarios.md", mustContain: ["LumaNest", "Drive-Thru", "BFSI", "ROI"] },
    { path: "../docs/solution-architecture.md", mustContain: ["范式 A", "范式 B", "范式 C", "gpt-live-1"] },
    { path: "../docs/competitive-analysis.md", mustContain: ["Sierra", "Retell", "ElevenLabs", "Vapi"] },
    { path: "../docs/speech-container-guide.md", mustContain: ["Billing=", "Disconnected Containers", "SynthesisFirstByteLatencyMs"] },
    { path: "../docs/asset-catalog.md", mustContain: ["turbo998/voice-agent-lab", "turbo998/gpt-live-1-demo"] }
  ];

  for (const item of files) {
    const content = await readFile(new URL(item.path, import.meta.url), "utf8");
    assert.ok(content.length > 1500, `${item.path} should be a comprehensive document`);
    for (const token of item.mustContain) {
      assert.ok(content.includes(token), `${item.path} missing expected token: ${token}`);
    }
  }
});

test("sealed 7-card voice benchmark JSON and HTML deck adhere to the 7-Card 4:5 specification", async () => {
  const rawJson = await readFile(new URL("../site/data/voice-agent-benchmark-report.json", import.meta.url), "utf8");
  const report = JSON.parse(rawJson);

  assert.equal(report.provenance.status, "measured");
  assert.equal(report.provenance.independently_reproduced, true);
  assert.equal(report.headline_metrics.deterministic_boundary_pass_rate, 1.0);
  assert.equal(report.headline_metrics.cases_passed, 6);
  assert.equal(report.scenario_matrix.length, 6);
  assert.equal(report.robustness_checks.length, 4);
  assert.equal(report.latency_scaling.length, 4);

  const cardsHtml = await readFile(new URL("../site/benchmark-cards.html", import.meta.url), "utf8");
  assert.ok(cardsHtml.includes("Content-Security-Policy"), "benchmark-cards.html must include CSP meta tag");
  for (let i = 1; i <= 7; i += 1) {
    assert.ok(cardsHtml.includes(`data-card="${i}"`), `Missing card ${i} in benchmark-cards.html`);
  }
  assert.ok(cardsHtml.includes("1 / 7"));
  assert.ok(cardsHtml.includes("7 / 7"));
});

test("H5 presales portal index.html and app.js include all 6 interactive sections and multi-engine sandbox", async () => {
  const indexHtml = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  const appJs = await readFile(new URL("../site/app.js", import.meta.url), "utf8");

  for (const sectionId of ["scenarios", "architecture", "competitors", "sandbox", "tco", "assets"]) {
    assert.ok(indexHtml.includes(`id="${sectionId}"`), `index.html missing section #${sectionId}`);
  }

  for (const keyword of ["Sierra AI", "Retell AI", "ElevenLabs", "LiveKit", "gpt-live-1", "gpt-4.1-mini", "pending_approval"]) {
    assert.ok(indexHtml.includes(keyword) || appJs.includes(keyword), `Portal missing key concept: ${keyword}`);
  }
});

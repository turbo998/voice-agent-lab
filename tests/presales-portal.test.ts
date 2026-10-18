import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("presales whitepapers exist and cover business scenarios, architectures, competitors, playbook, evaluation rubric, and speech containers", async () => {
  const files = [
    { path: "../docs/business-scenarios.md", mustContain: ["LumaNest", "Drive-Thru", "BFSI", "eCall", "PCI-DSS", "12345", "GOV-GAS-01", "LOG-TCPA-01", "ROI"] },
    { path: "../docs/solution-architecture.md", mustContain: ["范式 A", "范式 B", "范式 C", "gpt-live-1", "Warm Transfer", "Speculative", "G.711", "AMD", "Multi-Agent Swarm"] },
    { path: "../docs/competitive-analysis.md", mustContain: ["Sierra", "Retell", "ElevenLabs", "Vapi", "PolyAI", "Bland AI", "Cartesia Sonic", "Deepgram", "Hume"] },
    { path: "../docs/presales-playbook.md", mustContain: ["Discovery", "Sierra AI", "Retell AI", "ElevenLabs", "POC", "照妖镜", "阶段一"] },
    { path: "../docs/voice-agent-evaluation-rubric.md", mustContain: ["A01", "L01", "T02", "S01", "S05", "PCI-DSS"] },
    { path: "../docs/speech-container-guide.md", mustContain: ["Billing=", "Disconnected Containers", "SynthesisFirstByteLatencyMs"] },
    { path: "../docs/asset-catalog.md", mustContain: ["turbo998/voice-agent-lab", "turbo998/gpt-live-1-demo", "deck.html", "voice-agent-evaluation-rubric.md", "2026-10-18.md"] },
    { path: "../docs/daily/2026-10-18.md", mustContain: ["Voice Live", "Cartesia", "GOV-GAS-01", "LOG-TCPA-01"] }
  ];

  for (const item of files) {
    const content = await readFile(new URL(item.path, import.meta.url), "utf8");
    assert.ok(content.length > 1500, `${item.path} should be a comprehensive document`);
    for (const token of item.mustContain) {
      assert.ok(content.includes(token), `${item.path} missing expected token: ${token}`);
    }
  }
});

test("12-slide Azure executive presentation deck (site/deck.html) adheres to CSP and slide structure", async () => {
  const deckHtml = await readFile(new URL("../site/deck.html", import.meta.url), "utf8");
  assert.ok(deckHtml.includes("Content-Security-Policy"), "deck.html must include CSP meta tag");
  const slideMatches = deckHtml.match(/<section class="slide[\s"]/g) || [];
  assert.equal(slideMatches.length, 12, "deck.html should contain exactly 12 slides");
  for (const keyword of ["Sierra AI", "Retell AI", "ElevenLabs", "gpt-live-1", "gpt-4.1-mini", "MACC"]) {
    assert.ok(deckHtml.includes(keyword), `deck.html missing expected keyword: ${keyword}`);
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
  assert.ok(Array.isArray(report.latency_waterfalls), "Missing latency_waterfalls array in report JSON");
  assert.equal(report.latency_waterfalls.length, 5);
  assert.equal(report.latency_waterfalls[0].p50_total_ms, 620);

  const cardsHtml = await readFile(new URL("../site/benchmark-cards.html", import.meta.url), "utf8");
  assert.ok(cardsHtml.includes("Content-Security-Policy"), "benchmark-cards.html must include CSP meta tag");
  for (let i = 1; i <= 7; i += 1) {
    assert.ok(cardsHtml.includes(`data-card="${i}"`), `Missing card ${i} in benchmark-cards.html`);
  }
  assert.ok(cardsHtml.includes("1 / 7"));
  assert.ok(cardsHtml.includes("7 / 7"));
});

test("H5 presales portal index.html and app.js include all 6 interactive sections, live mic/custom prompt, and multi-engine sandbox", async () => {
  const indexHtml = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  const appJs = await readFile(new URL("../site/app.js", import.meta.url), "utf8");

  for (const sectionId of ["scenarios", "architecture", "competitors", "sandbox", "tco", "assets"]) {
    assert.ok(indexHtml.includes(`id="${sectionId}"`), `index.html missing section #${sectionId}`);
  }
  assert.ok(indexHtml.includes("id=\"livePromptInput\""), "index.html missing #livePromptInput");
  assert.ok(indexHtml.includes("id=\"sandboxWaterfallBox\""), "index.html missing #sandboxWaterfallBox");
  assert.ok(indexHtml.includes("./deck.html"), "index.html missing link to ./deck.html");

  for (const keyword of [
    "Sierra AI",
    "Retell AI",
    "ElevenLabs",
    "LiveKit",
    "PolyAI",
    "Cartesia Sonic",
    "gpt-live-1",
    "gpt-4.1-mini",
    "pending_approval",
    "elevenlabs_agents",
    "bfsi_fnol_claim",
    "automotive_ecall_triage",
    "travel_pci_rebooking",
    "gov_12345_gas_emergency",
    "logistics_amd_rebooking",
    "L04 · Spec Hallucination Block",
    "T04 · Post-Takeover Late-Write Block",
    "probeMatrixData",
    "generateCustomProposalMarkdown",
    "handleCustomUtterance"
  ]) {
    assert.ok(indexHtml.includes(keyword) || appJs.includes(keyword), `Portal missing key concept: ${keyword}`);
  }
});

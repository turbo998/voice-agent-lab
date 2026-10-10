import test from "node:test";
import assert from "node:assert/strict";
import { createFlow, agentSettings } from "../integrations/retell/flow.js";
test("native flow graph retains deterministic routing and no telephony nodes", () => {
  const flow = createFlow("https://lab.example.invalid");
  const ids = new Set(flow.nodes.map(node => node.id));
  assert.equal(ids.size, flow.nodes.length); assert.ok(ids.has(flow.start_node_id!));
  for (const node of flow.nodes) {
    if ("edges" in node) for (const edge of node.edges ?? []) assert.ok(!edge.destination_node_id || ids.has(edge.destination_node_id));
    if ("else_edge" in node && node.else_edge?.destination_node_id) assert.ok(ids.has(node.else_edge.destination_node_id));
    assert.ok(!["transfer_call", "sms", "press_digit", "agent_swap"].includes(node.type));
  }
  assert.ok(flow.nodes.some(n => n.type === "subagent"));
  assert.ok(flow.nodes.some(n => n.type === "function"));
  assert.ok(flow.nodes.some(n => n.type === "extract_dynamic_variables"));
  assert.ok(flow.nodes.some(n => n.type === "branch"));
  assert.ok(flow.nodes.some(n => n.global_node_setting));
  assert.equal(flow.flex_mode, false);
});
test("functions use fixed signed endpoints, strict schema and no unsafe retries", () => {
  for (const tool of createFlow("https://lab.example.invalid").tools ?? []) {
    assert.equal(tool.type, "custom");
    assert.equal(tool.url, "https://lab.example.invalid/api/retell/functions");
    assert.equal(tool.max_retry, 0); assert.equal(tool.args_at_root, false);
    assert.equal(tool.method, "POST"); assert.ok(tool.parameters?.properties);
  }
});
test("MCP remains optional, read-only and scoped by per-call headers", () => {
  assert.equal(createFlow("https://lab.example.invalid").mcps, undefined);
  const flow = createFlow("https://lab.example.invalid", "synthetic-static-bootstrap".repeat(3));
  assert.equal(flow.mcps?.[0]?.headers?.["X-Lab-Session"], "{{lab_session_id}}");
  assert.equal(flow.mcps?.[0]?.headers?.["X-Lab-Grant"], "{{lab_tool_grant}}");
  assert.ok(flow.nodes.some(n => n.type === "mcp" && n.mcp_tool_name === "get_product_catalog"));
});
test("published agent settings cannot dial and enforce three-minute retention controls", () => {
  const settings = agentSettings("https://lab.example.invalid", "conversation_flow_synthetic", 7);
  assert.equal(settings.max_call_duration_ms, 180000);
  assert.equal(settings.language, "en-US");
  assert.equal(settings.allow_user_dtmf, false);
  assert.equal(settings.data_storage_retention_days, 7);
  assert.equal(settings.data_storage_setting, "basic_attributes_only");
  assert.equal(settings.response_engine.type, "conversation-flow");
  assert.equal("llm_websocket_url" in settings.response_engine, false);
});

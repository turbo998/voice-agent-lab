import Retell from "retell-sdk";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { createFlow, agentSettings } from "./flow.js";

if (!process.env.RETELL_API_KEY) throw new Error("Retell API key must be injected into the server process.");
if (!process.env.APP_ORIGIN?.startsWith("https:")) throw new Error("Deployed HTTPS APP_ORIGIN required.");
const client = new Retell({ apiKey: process.env.RETELL_API_KEY, maxRetries: 0, timeout: 20000 });
const journalSchema = z.object({ flowId: z.string().optional(), flowVersion: z.number().int().optional(), agentId: z.string().optional(), agentVersion: z.number().int().optional(), published: z.boolean().optional() });
let journal: z.infer<typeof journalSchema> = {};
try { journal = journalSchema.parse(JSON.parse(await readFile(".private/retell-config.json", "utf8"))); }
catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
await mkdir(".private", { recursive: true });
const save = () => writeFile(".private/retell-config.json", JSON.stringify(journal, null, 2) + "\n", { mode: 0o600 });
if (!journal.flowId) {
  const flow = await client.conversationFlow.create(createFlow(process.env.APP_ORIGIN, process.env.RETELL_MCP_TOKEN));
  journal.flowId = flow.conversation_flow_id; journal.flowVersion = flow.version; await save();
}
if (!journal.agentId) {
  const agent = await client.agent.create(agentSettings(process.env.APP_ORIGIN, journal.flowId, journal.flowVersion!, process.env.RETELL_VOICE_ID));
  journal.agentId = agent.agent_id; journal.agentVersion = agent.version; await save();
}
if (!journal.published) {
  await client.agent.publish(journal.agentId, { version: journal.agentVersion! });
  journal.published = true; await save();
}
const published = await client.agent.retrieve(journal.agentId, { version: journal.agentVersion });
if (!published.is_published || published.max_call_duration_ms !== 180000 || published.response_engine.type !== "conversation-flow") {
  throw new Error("Published native agent did not preserve the required version/duration/engine.");
}
console.log("Native Retell agent configured and published; private version journal saved. No call or test credit was consumed by this script.");

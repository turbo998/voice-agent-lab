import { AIProjectClient } from "@azure/ai-projects";
import { SearchClient } from "@azure/search-documents";
import { AzureKeyCredential } from "@azure/core-auth";
import type { Config } from "../../apps/retell-demo/server/config.js";
import type { Diagnoser } from "../../apps/retell-demo/server/business.js";
import { reserve, settle } from "../../apps/retell-demo/server/budget.js";
import { diagnosisSchema, LabError, type Diagnosis } from "../../packages/business-core/contracts.js";
import { knowledge } from "../../packages/business-core/fixtures.js";
import type { StateStore } from "../../packages/business-core/state.js";
import { azureCredential } from "../azure/credential.js";

export class FoundryDiagnoser implements Diagnoser {
  private client;
  constructor(private config: Config, private store: StateStore) {
    this.client = new AIProjectClient(config.FOUNDRY_PROJECT_ENDPOINT!, azureCredential(config.LAB_MODE)).getOpenAIClient({ maxRetries: 0, timeout: 9000 });
  }
  async diagnose(productId: string, symptom: string, sessionId: string): Promise<Diagnosis> {
    if (!this.config.FOUNDRY_AGENT_NAME || !this.config.FOUNDRY_AGENT_VERSION || !this.config.KNOWLEDGE_COMMIT) {
      throw new LabError("FOUNDRY_NOT_CONFIGURED", 503, "Published Foundry agent version is required; no model fallback is assumed.");
    }
    const reservation = await reserve(this.store, "model", sessionId, 10);
    const started = performance.now();
    let providerResponded = false;
    try {
      const response = await this.client.responses.create({
        input: JSON.stringify({ product_id: productId, symptom, instruction: "Diagnose using only LumaNest indexed synthetic knowledge. Cite Kxx identifiers in source_refs. Do not execute business writes." }),
        max_output_tokens: 1000,
      }, { body: { agent_reference: { type: "agent_reference", name: this.config.FOUNDRY_AGENT_NAME, version: this.config.FOUNDRY_AGENT_VERSION }, tool_choice: "required" } });
      providerResponded = true;
      if (response.status !== "completed" || !response.output_text) throw new LabError("FOUNDRY_INCOMPLETE", 502, "Foundry did not complete a structured diagnosis.");
      const parsed = diagnosisSchema.safeParse(JSON.parse(response.output_text));
      if (!parsed.success || parsed.data.mode !== "foundry_grounded" || parsed.data.source_refs.some(id => !knowledge.some(k => k.id === id))) {
        throw new LabError("GROUNDING_INVALID", 502, "Diagnosis schema or citation identifiers could not be verified.");
      }
      const cited = new Set<string>();
      for (const item of response.output) if (item.type === "message") for (const part of item.content) {
        if (part.type !== "output_text") continue;
        for (const annotation of part.annotations) if (annotation.type === "url_citation") {
          const url = new URL(annotation.url);
          if (url.protocol === "https:" && url.hostname === "github.com" &&
              url.pathname === `/turbo998/voice-agent-lab/blob/${this.config.KNOWLEDGE_COMMIT}/docs/knowledge.md` &&
              !url.username && !url.password && !url.port && !url.search &&
              /^#k(?:0[1-9]|1[0-2])$/.test(url.hash)) cited.add(url.hash.slice(1).toUpperCase());
        }
      }
      if (parsed.data.source_refs.some(id => !cited.has(id))) throw new LabError("GROUNDING_MISSING", 502, "Foundry did not return citations for every claimed source; escalate rather than invent an answer.");
      await settle(this.store, reservation.id, "ended");
      console.log(JSON.stringify({ event: "diagnosis_completed", mode: "foundry_grounded", elapsedMs: Math.round(performance.now() - started), inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens }));
      return parsed.data;
    } catch (error) {
      await settle(this.store, reservation.id, providerResponded ? "ended" : "uncertain");
      if (error instanceof LabError) throw error;
      throw new LabError("FOUNDRY_FAILED", 502, "Grounded diagnosis failed or timed out; request operator review.");
    }
  }
}
export async function simpleSearch(config: Config, text: string) {
  if (!config.SEARCH_ENDPOINT) throw new LabError("SEARCH_NOT_CONFIGURED", 503, "Azure Search is not configured.");
  const credential = config.SEARCH_QUERY_KEY && config.LAB_MODE !== "azure"
    ? new AzureKeyCredential(config.SEARCH_QUERY_KEY) : azureCredential(config.LAB_MODE);
  const client = new SearchClient<{ id: string; title: string; content: string; source: string }>(config.SEARCH_ENDPOINT, "lumanest-knowledge", credential);
  const response = await client.search(text.slice(0, 500), { top: 4, queryType: "simple", select: ["id", "title", "content", "source"] });
  const results = [];
  for await (const row of response.results) results.push(row.document);
  return results;
}

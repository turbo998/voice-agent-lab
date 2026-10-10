import { SearchClient, SearchIndexClient } from "@azure/search-documents";
import { AzureKeyCredential } from "@azure/core-auth";
import { azureCredential } from "../azure/credential.js";
import { knowledge } from "../../packages/business-core/fixtures.js";

const endpoint = process.env.SEARCH_ENDPOINT;
if (!endpoint) throw new Error("Private SEARCH_ENDPOINT is required.");
const auth = process.env.SEARCH_ADMIN_KEY && process.env.LAB_MODE !== "azure"
  ? new AzureKeyCredential(process.env.SEARCH_ADMIN_KEY) : azureCredential();
const revision = process.env.KNOWLEDGE_REVISION;
if (!revision || !/^[0-9a-f]{40}$/.test(revision)) throw new Error("KNOWLEDGE_REVISION must identify the published immutable source commit.");
const indexClient = new SearchIndexClient(endpoint, auth);
await indexClient.createOrUpdateIndex({
  name: "lumanest-knowledge",
  fields: [
    { name: "id", type: "Edm.String", key: true, filterable: true },
    { name: "title", type: "Edm.String", searchable: true },
    { name: "content", type: "Edm.String", searchable: true },
    { name: "productId", type: "Edm.String", filterable: true },
    { name: "source", type: "Edm.String" },
  ],
});
const client = new SearchClient<{ id: string; title: string; content: string; productId: string; source: string }>(endpoint, "lumanest-knowledge", auth);
const sourceBase = `https://github.com/turbo998/voice-agent-lab/blob/${revision}/docs/knowledge.md#`;
const response = await client.uploadDocuments(knowledge.map(k => ({ id: k.id, title: k.title, content: k.text, productId: k.productId, source: sourceBase + k.id.toLowerCase() })));
if (response.results.some(row => !row.succeeded)) throw new Error("One or more original knowledge documents failed indexing.");
const result = await client.search("2.4 GHz pairing", { queryType: "simple", top: 3 });
let found = 0;
for await (const row of result.results) if (typeof row.document.id === "string") found++;
if (!found) throw new Error("Index created but functional search returned no documents.");
console.log(`Indexed ${knowledge.length} original synthetic documents; simple search returned ${found} results.`);

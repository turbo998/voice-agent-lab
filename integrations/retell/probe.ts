import Retell from "retell-sdk";

if (!process.env.RETELL_API_KEY) throw new Error("Inject the private scoped API credential into the server process.");
const client = new Retell({ apiKey: process.env.RETELL_API_KEY, maxRetries: 0, timeout: 15000 });
try {
  await client.agent.list({ limit: 1 });
  console.log(JSON.stringify({ operation: "list_agents", authorized: true, callsCreated: 0, paidTestsStarted: 0 }));
} catch (error) {
  const status = error instanceof Error && "status" in error ? error.status : undefined;
  console.error(JSON.stringify({ operation: "list_agents", authorized: false, status, code: "RETELL_READ_AUTH_FAILED" }));
  process.exitCode = 1;
}

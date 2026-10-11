import { z } from "zod";

const schema = z.object({
  LAB_MODE: z.enum(["local", "azure"]).default("local"),
  PORT: z.coerce.number().int().min(1024).max(65535).default(8080),
  APP_ORIGIN: z.string().url(),
  OPERATOR_PASSWORD_HASH: z.string().regex(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/),
  TOKEN_SECRET: z.string().min(48),
  LOCAL_STATE_PATH: z.string().default(".private/state.json"),
  AZURE_STORAGE_BLOB_ENDPOINT: z.string().url().optional(),
  AZURE_STORAGE_QUEUE_ENDPOINT: z.string().url().optional(),
  OPERATING_APP_ID: z.string().optional(),
  RETELL_API_KEY: z.string().min(10).optional(),
  RETELL_WEBHOOK_SIGNING_KEY: z.string().min(10).optional(),
  RETELL_AGENT_ID: z.string().regex(/^agent_[\w-]+$/).optional(),
  RETELL_AGENT_VERSION: z.coerce.number().int().nonnegative().optional(),
  RETELL_RATE_CENTS_PER_MINUTE: z.coerce.number().positive().max(100).optional(),
  RETELL_MCP_TOKEN: z.string().min(48).optional(),
  RETELL_TRIAL_VERIFIED_AT: z.coerce.number().int().positive().optional(),
  RETELL_TRIAL_BALANCE_CENTS: z.coerce.number().int().min(300).max(1000).optional(),
  RETELL_NO_PAYMENT_NO_RECHARGE: z.literal("true").optional(),
  REMOTE_CALLS_ENABLED: z.enum(["true", "false"]).default("false"),
  FOUNDRY_PROJECT_ENDPOINT: z.string().url().optional(),
  FOUNDRY_AGENT_NAME: z.string().optional(),
  FOUNDRY_AGENT_VERSION: z.string().optional(),
  FOUNDRY_MODEL_DEPLOYMENT: z.string().default("reasoning"),
  SEARCH_ENDPOINT: z.string().url().optional(),
  SEARCH_QUERY_KEY: z.string().optional(),
  GPT_LIVE_URL: z.string().url().optional(),
  LIVE_CALLS_ENABLED: z.enum(["true", "false"]).default("false"),
  LIVE_PROVIDER_ENDPOINT: z.string().url().optional(),
  LIVE_MODEL_DEPLOYMENT: z.string().default("gpt-live-1"),
  LIVE_REASONING_ENDPOINT: z.string().url().optional(),
  LIVE_RATE_CENTS_PER_MINUTE: z.coerce.number().positive().max(100).optional(),
  LIVE_PROVIDER_MAX_SECONDS: z.coerce.number().int().min(180).max(7200).optional(),
  LIVE_CONTROL_VERIFIED_AT: z.coerce.number().int().positive().optional(),
  KNOWLEDGE_COMMIT: z.string().regex(/^[a-f0-9]{40}$/).optional(),
  OPERATOR_APP_URL: z.string().url().optional(),
});
export type Config = z.infer<typeof schema>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = schema.safeParse(env);
  if (!result.success) throw new Error(`Invalid server configuration fields: ${result.error.issues.map(i => i.path.join(".")).join(", ")}`);
  const config = result.data;
  if (config.LAB_MODE === "azure" && (!config.AZURE_STORAGE_BLOB_ENDPOINT || !config.APP_ORIGIN.startsWith("https:"))) {
    throw new Error("Azure mode requires durable storage and an HTTPS origin.");
  }
  return config;
}
export function retellReady(config: Config, now = Date.now()) {
  return config.REMOTE_CALLS_ENABLED === "true" && Boolean(config.RETELL_API_KEY && config.RETELL_AGENT_ID &&
    config.RETELL_AGENT_VERSION !== undefined && config.RETELL_RATE_CENTS_PER_MINUTE &&
    config.RETELL_WEBHOOK_SIGNING_KEY && config.RETELL_NO_PAYMENT_NO_RECHARGE === "true" &&
    config.RETELL_TRIAL_BALANCE_CENTS && config.RETELL_TRIAL_VERIFIED_AT &&
    now >= config.RETELL_TRIAL_VERIFIED_AT && now - config.RETELL_TRIAL_VERIFIED_AT <= 3600000);
}

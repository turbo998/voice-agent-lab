import { z } from "zod";

export class LabError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
    this.name = "LabError";
  }
}

export const customerId = z.enum(["demo-sg", "demo-my", "demo-th"]);
export const productId = z.enum(["cam-air", "plug-mini", "clean-orbit"]);
export const toolSchemas = {
  get_product_catalog: z.object({ product_id: productId.optional() }).strict(),
  get_order_status: z.object({ order_id: z.string().regex(/^LN-(SG|MY|TH)-\d{4}$/) }).strict(),
  diagnose_device: z.object({ product_id: productId, symptom: z.string().min(3).max(800) }).strict(),
  draft_support_ticket: z.object({ product_id: productId, summary: z.string().min(8).max(600), priority: z.enum(["normal", "safety"]).default("normal") }).strict(),
  commit_approved_ticket: z.object({ draft_id: z.string().uuid(), version: z.number().int().positive() }).strict(),
  schedule_consented_followup: z.object({ consent_id: z.string().uuid(), window: z.string().datetime({ offset: true }) }).strict(),
};
export const toolName = z.enum(Object.keys(toolSchemas) as [keyof typeof toolSchemas, ...(keyof typeof toolSchemas)[]]);
export type ToolName = z.infer<typeof toolName>;
export const diagnosisSchema = z.object({
  spoken_summary: z.string().min(1).max(1000),
  recommended_steps: z.array(z.string().max(300)).max(5),
  source_refs: z.array(z.string().regex(/^K\d{2}$/)).min(1).max(6),
  needs_human: z.boolean(),
  uncertainty_reason: z.string().max(500).nullable(),
  mode: z.enum(["deterministic_local", "foundry_grounded"]),
}).strict();
export type Diagnosis = z.infer<typeof diagnosisSchema>;
export const diagnosisJsonSchema = z.toJSONSchema(diagnosisSchema);

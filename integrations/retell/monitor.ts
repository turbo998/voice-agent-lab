import { z } from "zod";
const common = { id: z.string().max(200), time_sec: z.number().finite().nonnegative() };
const utterance = z.discriminatedUnion("role", [
  z.object({ ...common, role: z.enum(["user", "agent", "transfer_target"]), content: z.string().max(10000) }).strip(),
  z.object({ ...common, role: z.literal("node_transition"), former_node_id: z.string().max(120),
    former_node_name: z.string().max(200), new_node_id: z.string().max(120), new_node_name: z.string().max(200) }).strip(),
]);
export function safeMonitorFrame(raw: string) {
  const value: unknown = JSON.parse(raw);
  const envelope = z.object({ type: z.enum(["transcript_snapshot", "transcript_updated", "call_ended"]),
    transcripts: z.array(z.unknown()).max(1000).optional(), pre_session_transcripts: z.array(z.unknown()).max(1000).optional(),
    event_timestamp: z.number().finite().nonnegative().optional(), disconnection_reason: z.string().max(100).optional() }).strip().parse(value);
  const filter = (items: unknown[] | undefined) => items?.flatMap(item => {
    const parsed = utterance.safeParse(item); return parsed.success ? [parsed.data] : [];
  }).slice(-200);
  return { type: envelope.type, transcripts: filter(envelope.transcripts), pre_session_transcripts: filter(envelope.pre_session_transcripts),
    event_timestamp: envelope.event_timestamp, disconnection_reason: envelope.disconnection_reason };
}

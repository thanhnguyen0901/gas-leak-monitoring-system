import { z } from 'zod';
export const deviceId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
export const state = z.enum(['SAFE', 'WARNING', 'DANGER']);
export const readingSchema = z.object({
  version: z.literal(1), deviceId, bootId: z.string().regex(/^[a-fA-F0-9]{16}$/),
  sequence: z.number().int().min(0).max(0xffffffff), uptimeMs: z.number().int().min(0).max(0xffffffff),
  rawAdc: z.number().int().min(0).max(4095), state, previousState: state,
  fanOn: z.boolean(), simulated: z.boolean(),
}).strict();
export type Reading = z.infer<typeof readingSchema> & { receivedAt: string };
export type Alert = Reading & { id: string; recovery: boolean };
export type Device = { id: string; latest: Reading | null; lastSeen: string; online: boolean };
export function parseReading(topic: string, data: Buffer) {
  const match = /^gas-monitor\/device\/([A-Za-z0-9_-]{1,64})\/(telemetry|alert)$/.exec(topic);
  if (!match || data.length > 4096) throw new Error('Invalid topic or payload size');
  const value = readingSchema.parse(JSON.parse(data.toString('utf8')));
  if (value.deviceId !== match[1]) throw new Error('Topic and device ID mismatch');
  if (value.fanOn !== (value.state !== 'SAFE')) throw new Error('Inconsistent fan policy');
  return { kind: match[2], value };
}

import { z } from 'zod';
import { ACCESSORY_OPTIONS, ACCESSORY_GROUPS } from '../../demo/avatar-studio-accessories.js';

export const LIMITS = Object.freeze({ inputBytes: 32768, outputBytes: 750000, pixelSize: 512, gifSize: 128, gifFrames: 12, activeRenders: 2, renderTimeoutMs: 5000, requestsPerMinute: 120 });
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/).transform(value => value.toLowerCase());
export const AvatarConfig = z.strictObject({
  body: hex.default('#08090b'),
  eyes: hex.default('#ffffff'),
  accessoryColor: hex.default('#ffffff'),
  matchEyes: z.boolean().default(false),
  accessory: z.enum(Object.keys(ACCESSORY_OPTIONS)).default('none'),
  eyeSize: z.number().finite().min(60).max(125).default(100),
  spacing: z.number().finite().min(-12).max(12).default(0),
  headRoundness: z.number().finite().min(0).max(100).default(50),
  expression: z.enum(['idle', 'happy', 'sad', 'angry', 'sleep', 'surprise']).default('idle'),
});
export const CreateInput = z.strictObject({
  config: AvatarConfig.default({}),
  format: z.enum(['svg', 'png', 'gif']).default('svg'),
  size: z.number().int().min(32).max(LIMITS.pixelSize).default(256),
}).refine(input => input.format !== 'gif' || input.size <= LIMITS.gifSize, { message: 'GIF size must be at most 128 pixels.', path: ['size'] });
export const CatalogInput = z.strictObject({ category: z.enum(Object.keys(ACCESSORY_GROUPS)).optional() });
export const ValidateInput = z.strictObject({ config: AvatarConfig });
export const TOOL_SCHEMAS = Object.freeze({ list_accessories: CatalogInput, validate_avatar: ValidateInput, create_avatar: CreateInput });

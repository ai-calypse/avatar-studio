import { z } from 'zod';
import { avatarActions, behaviorDefaults } from '../../src/avatar-studio-controls.js';
import { ACCESSORY_OPTIONS, ACCESSORY_GROUPS } from '../../src/avatar-studio-accessories.js';

export const LIMITS = Object.freeze({ inputBytes: 32768, outputBytes: 750000, pixelSize: 512, gifSize: 128, gifFrames: 12, activeRenders: 2, renderTimeoutMs: 5000, requestsPerMinute: 120, batchCount: 12, spriteCount: 16, spriteCellSize: 128 });
export const EXPRESSIONS = ['idle', 'happy', 'sad', 'angry', 'sleep', 'surprise'];
export const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/).transform(value => value.toLowerCase());
const fields = {
  antenna: z.boolean(),
  bodyShape: z.enum(['classic', 'random']), shapeSeed: z.number().int().min(0).max(0xffffffff),
  body: hex, eyes: hex, accessoryColor: hex, matchEyes: z.boolean(),
  accessory: z.enum(Object.keys(ACCESSORY_OPTIONS)), eyeSize: z.number().finite().min(60).max(125),
  spacing: z.number().finite().min(-12).max(12), headRoundness: z.number().finite().min(0).max(100), expression: z.enum(EXPRESSIONS),
};
const defaults = { antenna: true, bodyShape: 'classic', shapeSeed: 0, body: '#08090b', eyes: '#ffffff', accessoryColor: '#ffffff', matchEyes: false, accessory: 'none', eyeSize: 100, spacing: 0, headRoundness: 50, expression: 'idle' };
export const AvatarConfig = z.strictObject(Object.fromEntries(Object.entries(fields).map(([name, schema]) => [name, schema.default(defaults[name])])));
export const AvatarPatch = z.strictObject(fields).partial();
export const Presentation = z.strictObject({ background: z.union([hex, z.literal('transparent')]).default('transparent'), frame: z.enum(['none', 'circle', 'rounded']).default('none'), padding: z.number().finite().min(0).max(24).default(0), status: z.enum(['none', 'online', 'away', 'busy', 'offline']).default('none') });
const presentation = Presentation.default({});
export const CreateInput = z.strictObject({ config: AvatarConfig.default({}), presentation, format: z.enum(['svg', 'png', 'gif']).default('svg'), size: z.number().int().min(32).max(LIMITS.pixelSize).default(256) }).refine(input => input.format !== 'gif' || input.size <= LIMITS.gifSize, { message: 'GIF size must be at most 128 pixels.', path: ['size'] });
const seed = z.string().min(1).max(128).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/);
const id = z.string().min(1).max(32).regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
const item = z.strictObject({ id, config: AvatarConfig });
const batchFields = { format: z.enum(['svg', 'png']).default('svg'), size: z.number().int().min(32).max(256).default(128), presentation };
const uniqueIds = entries => new Set(entries.map(entry => entry.id)).size === entries.length;
export const IdentityInput = z.strictObject({ seed, overrides: AvatarPatch.default({}) });
export const PaletteInput = z.strictObject({ primary: hex, accent: hex.optional(), mode: z.enum(['dark', 'light']).default('dark') });
export const BatchInput = z.strictObject({ items: z.array(item).min(1).max(LIMITS.batchCount), ...batchFields }).refine(input => uniqueIds(input.items), { message: 'Item IDs must be unique.', path: ['items'] });
export const VariantsInput = z.strictObject({ config: AvatarConfig.default({}), seed: seed.default('avatar-studio'), count: z.number().int().min(1).max(LIMITS.batchCount).default(6), vary: z.enum(['accessories', 'colors', 'look']).default('accessories'), ...batchFields });
export const ExpressionPackInput = z.strictObject({ config: AvatarConfig.default({}), expressions: z.array(z.enum(EXPRESSIONS)).min(1).max(6).default(EXPRESSIONS), ...batchFields }).refine(input => new Set(input.expressions).size === input.expressions.length, { message: 'Expressions must be unique.', path: ['expressions'] });
export const SpriteInput = z.strictObject({ items: z.array(item).min(1).max(LIMITS.spriteCount), format: z.enum(['svg', 'png']).default('png'), cellSize: z.number().int().min(32).max(LIMITS.spriteCellSize).default(128), columns: z.number().int().min(1).max(4).default(4), presentation }).refine(input => uniqueIds(input.items) && Math.ceil(input.items.length / input.columns) * input.cellSize <= 512, { message: 'IDs must be unique and sheet dimensions at most 512 pixels.', path: ['items'] });
export const CatalogInput = z.strictObject({ category: z.enum(Object.keys(ACCESSORY_GROUPS)).optional() });
export const ValidateInput = z.strictObject({ config: AvatarConfig });
export const BehaviorConfig = z.strictObject({ antennaFlash: z.boolean(), pointerFollow: z.boolean(), loop: z.boolean(), pressSqueeze: z.boolean(), antennaDrag: z.boolean(), motion: z.enum(['auto','reduce','full']), wakeOn: z.enum(['activity','interaction','manual']), autoSleep: z.number().int().min(0).max(86400000) }).partial().transform(value => ({...behaviorDefaults,...value}));
export const ComponentInput = z.strictObject({ config: AvatarConfig.omit({expression:true}).prefault({}), behavior: BehaviorConfig.prefault({}), action: z.enum(avatarActions).default('idle'), size: z.number().int().min(32).max(512).default(170) });
export const TOOL_SCHEMAS = Object.freeze({ create_avatar_component: ComponentInput, list_accessories: CatalogInput, validate_avatar: ValidateInput, create_avatar: CreateInput, get_capabilities: z.strictObject({}), generate_identity: IdentityInput, suggest_brand_palette: PaletteInput, create_avatar_batch: BatchInput, create_avatar_variants: VariantsInput, create_expression_pack: ExpressionPackInput, create_sprite_sheet: SpriteInput });

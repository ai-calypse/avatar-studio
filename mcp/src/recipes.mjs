import { createHash } from 'node:crypto';
import { ACCESSORY_GROUPS } from '../../src/avatar-studio-accessories.js';
import { AvatarConfig, IdentityInput, PaletteInput, VariantsInput, ExpressionPackInput } from './schema.mjs';

export const RECIPE_VERSION = '1';
const colors = ['#182725', '#263b69', '#663344', '#4b3869', '#66442a', '#204c52', '#3c5029', '#3a3a4f'];
const ids = Object.values(ACCESSORY_GROUPS).flat();
const digest = seed => createHash('sha256').update(`avatar-studio:identity:v${RECIPE_VERSION}:${seed}`).digest();
const rgb = color => [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
const color = values => '#' + values.map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('');
const luminance = value => rgb(value).map(channel => channel / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
export function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
const eyeColor = body => contrast(body, '#ffffff') >= contrast(body, '#08090b') ? '#ffffff' : '#08090b';

export function generateIdentity(input) {
  const { seed, overrides } = IdentityInput.parse(input);
  const hash = digest(seed);
  const body = colors[hash[0] % colors.length];
  const config = AvatarConfig.parse({ body, eyes: eyeColor(body), accessory: ids[hash[1] % ids.length], matchEyes: true, eyeSize: 80 + hash[2] % 36, spacing: -6 + hash[3] % 13, headRoundness: hash[4] % 101, shapeSeed: hash.readUInt32BE(5), ...overrides });
  // The raw user ID is never returned. This fingerprint is not an anonymity guarantee.
  return { recipeVersion: RECIPE_VERSION, fingerprint: hash.toString('hex'), config };
}

export function suggestPalette(input) {
  const { primary, accent, mode } = PaletteInput.parse(input);
  const values = rgb(primary);
  const body = color(values.map(channel => mode === 'dark' ? channel * .45 : channel * .25 + 255 * .75));
  const eyes = eyeColor(body);
  const accessoryColor = accent || primary;
  return { config: AvatarConfig.parse({ body, eyes, accessoryColor }), palette: { primary, body, eyes, accessoryColor, background: mode === 'dark' ? '#f5f5ef' : '#182725' }, contrast: { eyesOnBody: Number(contrast(eyes, body).toFixed(2)), accessoryOnBody: Number(contrast(accessoryColor, body).toFixed(2)) }, note: 'Contrast measurements describe colors, not a full accessibility audit. If the accessory contrast is low, enable matchEyes or choose another accent.' };
}

export function variantItems(input) {
  const parsed = VariantsInput.parse(input);
  const hash = digest(parsed.seed);
  return Array.from({ length: parsed.count }, (_, index) => {
    const config = { ...parsed.config };
    if (parsed.vary !== 'colors') config.accessory = ids[(hash[0] + index) % ids.length];
    if (parsed.vary !== 'accessories') {
      const base = rgb(colors[(hash[1] + index) % colors.length]);
      config.body = color(base.map((channel, n) => channel + index * (n + 1)));
      config.eyes = eyeColor(config.body);
    }
    if (parsed.vary === 'look') { config.shapeSeed = (hash.readUInt32BE(5) + index) >>> 0; config.eyeSize = 80 + (hash[2] + index * 7) % 36; config.spacing = -6 + (hash[3] + index) % 13; config.headRoundness = (hash[4] + index * 17) % 101; }
    return { id: `variant-${index + 1}`, config: AvatarConfig.parse(config) };
  });
}

export function expressionItems(input) {
  const parsed = ExpressionPackInput.parse(input);
  return parsed.expressions.map(expression => ({ id: expression, config: { ...parsed.config, expression } }));
}

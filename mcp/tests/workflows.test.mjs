import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { fileURLToPath } from 'node:url';
import { TOOL_SCHEMAS, LIMITS } from '../src/schema.mjs';
import { generateIdentity, suggestPalette, variantItems, expressionItems } from '../src/recipes.mjs';
import { renderJob } from '../src/jobs.mjs';
import { renderAvatar, rasterize, renderPresentedSVG } from '../src/render.mjs';

async function connect(t) {
  const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('../src/index.mjs', import.meta.url))], stderr: 'pipe', env: {} });
  const client = new Client({ name: 'workflow-tests', version: '1' });
  let errors = ''; transport.stderr?.on('data', data => { errors += data; });
  await client.connect(transport);
  t.after(async () => { await client.close(); assert.equal(errors, ''); });
  return client;
}

function decode(block) { return block.type === 'image' ? Buffer.from(block.data, 'base64') : block.resource.text ? Buffer.from(block.resource.text) : Buffer.from(block.resource.blob, 'base64'); }

test('identities are repeatable, customizable, private in responses, and stable across processes', async t => {
  const input = { seed: 'user-2048' };
  const a = generateIdentity(input), b = generateIdentity(input);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.config, generateIdentity({ seed: 'user-2049' }).config);
  assert.ok(!JSON.stringify(a).includes(input.seed));
  const branded = generateIdentity({ ...input, overrides: { body: '#ff1234', matchEyes: false } });
  assert.deepEqual({ ...branded.config, body: a.config.body, matchEyes: a.config.matchEyes }, a.config);
  assert.equal(branded.config.body, '#ff1234');
  const client = await connect(t);
  const result = await client.callTool({ name: 'generate_identity', arguments: input });
  assert.deepEqual(result.structuredContent, a);
  const rendered = await client.callTool({ name: 'create_avatar', arguments: { config: result.structuredContent.config, format: 'png', size: 64, presentation: { frame: 'circle', background: '#eeeeee', padding: 8, status: 'online' } } });
  assert.notEqual(rendered.isError, true);
  assert.equal(decode(rendered.content[1]).readUInt32BE(16), 64);
});

test('brand suggestions provide usable high-contrast eyes in light and dark modes', async t => {
  for (const primary of ['#000000', '#ffffff', '#eeee00', '#ff0000', '#0088ff']) for (const mode of ['dark', 'light']) {
    const result = suggestPalette({ primary, mode, accent: '#aa44ff' });
    assert.ok(result.contrast.eyesOnBody >= 4.5);
    assert.equal(result.config.accessoryColor, '#aa44ff');
    assert.equal(TOOL_SCHEMAS.validate_avatar.safeParse({ config: result.config }).success, true);
  }
  const client = await connect(t);
  const capabilities = await client.callTool({ name: 'get_capabilities', arguments: {} });
  assert.equal(capabilities.structuredContent.tools.length, 11);
  assert.equal(capabilities.structuredContent.limits.batchCount, 12);
  const palette = await client.callTool({ name: 'suggest_brand_palette', arguments: { primary: '#5588cc' } });
  const variants = await client.callTool({ name: 'create_avatar_variants', arguments: { config: palette.structuredContent.config, count: 4, vary: 'accessories' } });
  assert.equal(variants.structuredContent.count, 4);
  for (const record of variants.structuredContent.artifacts) assert.equal(record.config.body, palette.structuredContent.config.body);
});

test('variants keep selected controls fixed and expression packs preserve identity', () => {
  for (const vary of ['accessories', 'colors', 'look']) {
    const input = { config: { body: '#123456', eyes: '#abcdef', accessory: 'wizard' }, vary, count: 12, seed: 'brand-demo' };
    const items = variantItems(input);
    assert.deepEqual(items, variantItems(input));
    assert.equal(new Set(items.map(item => JSON.stringify(item.config))).size, 12);
    if (vary === 'accessories') for (const item of items) { assert.equal(item.config.body, '#123456'); assert.equal(item.config.eyes, '#abcdef'); }
    if (vary === 'colors') for (const item of items) assert.equal(item.config.accessory, 'wizard');
  }
  const frames = expressionItems({ config: { accessory: 'headphones', body: '#182725' } });
  assert.equal(frames.length, 6);
  for (const frame of frames) { assert.equal(frame.config.accessory, 'headphones'); assert.equal(frame.config.body, '#182725'); }
});

test('batch and expression protocol results carry verified manifests and distinct files', async t => {
  const client = await connect(t);
  const batch = await client.callTool({ name: 'create_avatar_batch', arguments: { format: 'png', size: 128, items: [{ id: 'support', config: { accessory: 'headphones' } }, { id: 'guide', config: { accessory: 'wizard' } }], presentation: { frame: 'rounded', background: '#f5f5ef', padding: 6 } } });
  assert.equal(batch.structuredContent.count, 2);
  assert.deepEqual(batch.structuredContent.artifacts.map(record => record.id), ['support', 'guide']);
  batch.structuredContent.artifacts.forEach((record, index) => {
    const binary = decode(batch.content[index + 1]);
    assert.equal(binary.length, record.bytes);
    assert.equal(createHash('sha256').update(binary).digest('hex'), record.sha256);
  });
  const expressions = await client.callTool({ name: 'create_expression_pack', arguments: { config: { accessory: 'crown' } } });
  assert.equal(expressions.structuredContent.count, 6);
  assert.equal(new Set(expressions.structuredContent.artifacts.map(record => record.sha256)).size, 6);
  assert.ok(Buffer.byteLength(JSON.stringify(expressions)) < LIMITS.outputBytes);
});

test('sprite sheet preserves cell pixels and produces unique clipping IDs and frame coordinates', async t => {
  const items = [ { id: 'square', config: { headRoundness: 0, accessory: 'wizard', eyes: '#dbf59d', expression: 'angry' } }, { id: 'round', config: { headRoundness: 100, accessory: 'glasses', eyes: '#ff5577', expression: 'sad' } } ];
  const input = { items, columns: 2, cellSize: 64, format: 'svg', presentation: { frame: 'circle', background: '#cccccc', status: 'busy', padding: 6 } };
  const [sheet] = renderJob({ name: 'create_sprite_sheet', input }).artifacts;
  assert.equal(sheet.width, 128); assert.equal(sheet.height, 64);
  assert.equal(sheet.frames[1].x, 64); assert.equal(sheet.frames[1].y, 0);
  const markup = Buffer.from(sheet.data, 'base64').toString();
  const ids = [...markup.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  const pixels = rasterize(markup).pixels;
  for (let index = 0; index < items.length; index++) {
    const expected = rasterize(renderPresentedSVG(items[index].config, 64, input.presentation)).pixels;
    for (let row = 0; row < 64; row++) assert.deepEqual(pixels.subarray((row * 128 + index * 64) * 4, (row * 128 + index * 64 + 64) * 4), expected.subarray(row * 64 * 4, (row + 1) * 64 * 4));
  }
  const client = await connect(t);
  const result = await client.callTool({ name: 'create_sprite_sheet', arguments: { ...input, format: 'png' } });
  assert.equal(result.structuredContent.frames.length, 2);
  const png = decode(result.content[1]); assert.equal(png.readUInt32BE(16), 128); assert.equal(png.readUInt32BE(20), 64);
});

test('new tool schemas reject injection, unknown fields, duplicate IDs, and amplification', async t => {
  const bad = [
    ['generate_identity', { seed: 'https://evil.invalid/user' }], ['generate_identity', { seed: 'x'.repeat(129) }], ['generate_identity', { seed: 'user', overrides: { svg: '<svg/>' } }],
    ['suggest_brand_palette', { primary: 'url(file:///etc/passwd)' }], ['get_capabilities', { path: '/etc/passwd' }],
    ['create_avatar', { presentation: { background: '#fff" onload="evil' } }], ['create_avatar', { presentation: { padding: NaN } }],
    ['create_avatar_batch', { items: Array.from({ length: 13 }, (_, i) => ({ id: `item-${i}`, config: {} })) }],
    ['create_avatar_batch', { items: [{ id: 'same', config: {} }, { id: 'same', config: {} }] }], ['create_avatar_batch', { items: [{ id: '../file', config: {} }] }],
    ['create_avatar_variants', { count: 99999 }], ['create_expression_pack', { expressions: ['idle', 'idle'] }],
    ['create_sprite_sheet', { columns: 1, cellSize: 128, items: Array.from({ length: 5 }, (_, i) => ({ id: `item-${i}`, config: {} })) }],
    ['create_sprite_sheet', { items: [{ id: 'safe', config: {} }], url: 'https://evil.invalid' }],
  ];
  for (const [name, input] of bad) assert.equal(TOOL_SCHEMAS[name].safeParse(input).success, false, name);
  assert.throws(() => renderJob({ name: 'read_file', input: {} }));
  assert.throws(() => renderJob({ name: 'create_avatar_batch', input: bad[7][1] }));
  const client = await connect(t);
  for (const [name, input] of bad.filter(([, input]) => !Number.isNaN(input.presentation?.padding))) await assert.rejects(client.callTool({ name, arguments: input }), /Invalid avatar tool or arguments/);
  const safe = await client.callTool({ name: 'create_avatar_variants', arguments: { count: 2 } });
  assert.notEqual(safe.isError, true);
});

test('maximum batch and sprite jobs stay bounded and presentation output remains inert', () => {
  const items = variantItems({ count: 12, vary: 'look' });
  const batch = renderJob({ name: 'create_avatar_batch', input: { items, size: 256, format: 'png' } });
  assert.equal(batch.artifacts.length, 12);
  assert.ok(Buffer.byteLength(JSON.stringify(batch)) < LIMITS.outputBytes - 65536);
  const spriteItems = [...items, ...items.slice(0, 4).map(item => ({ ...item, id: `extra-${item.id}` }))];
  const [sheet] = renderJob({ name: 'create_sprite_sheet', input: { items: spriteItems, columns: 4, cellSize: 128 } }).artifacts;
  assert.equal(sheet.width, 512); assert.equal(sheet.height, 512);
  for (const frame of ['none', 'circle', 'rounded']) for (const status of ['none', 'online', 'away', 'busy', 'offline']) {
    const rendered = renderAvatar({ presentation: { frame, status, background: '#112233', padding: 8 }, format: 'svg' });
    const svg = Buffer.from(rendered.data, 'base64').toString();
    assert.doesNotMatch(svg, /<(?:script|image|foreignObject|iframe)\b|(?:href|onload|onclick)=|file:|https?:\/\/(?!www\.w3\.org)/i);
    assert.ok(!svg.includes('NaN'));
  }
});

test('bulk tools share the global worker quota and cancellation releases their capacity', async t => {
  const client = await connect(t);
  const input = { count: 12, format: 'png', size: 256, vary: 'look' };
  const pending = Array.from({ length: 6 }, () => client.callTool({ name: 'create_avatar_variants', arguments: input }));
  const results = await Promise.all(pending);
  assert.ok(results.some(result => result.isError && result.content[0].text.includes('busy')));
  assert.ok(results.filter(result => !result.isError).length <= 2);
  await new Promise(resolve => setTimeout(resolve, 100));
  const controller = new AbortController();
  const cancelled = client.callTool({ name: 'create_avatar_variants', arguments: input }, { signal: controller.signal });
  controller.abort();
  await assert.rejects(cancelled);
  await new Promise(resolve => setTimeout(resolve, 100));
  const result = await client.callTool({ name: 'create_expression_pack', arguments: { expressions: ['happy', 'sad'], format: 'png' } });
  assert.notEqual(result.isError, true);
  assert.equal(result.structuredContent.count, 2);
});

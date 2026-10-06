import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { CreateInput, TOOL_SCHEMAS, LIMITS } from '../src/schema.mjs';
import { GuardedTransport, safeMessage } from '../src/security.mjs';
import { renderAvatar } from '../src/render.mjs';
import { ACCESSORY_OPTIONS } from '../../demo/avatar-studio-accessories.js';

const hostile = [
  { config: { body: '#fff" onload="alert(1)' } },
  { config: { eyes: 'url(file:///etc/passwd)' } },
  { config: { accessoryColor: 'url(http://169.254.169.254/latest/meta-data/)' } },
  { config: { accessory: '../../secret' } },
  { config: { accessory: '__proto__' } },
  { config: { svg: '<svg><script>alert(1)</script></svg>' } },
  { config: { body: '<script>' } }, { outputPath: '/etc/passwd' },
  { url: 'https://attacker.invalid' }, { code: 'process.exit()' },
  { size: 999999 }, { size: -1 }, { size: 128.5 },
  { config: { spacing: Infinity } }, { config: { eyeSize: NaN } },
  { config: { headRoundness: 101 } }, { config: { matchEyes: 'true' } },
  { format: 'gif', size: 512 }, { config: { seed: 'x'.repeat(40000) } },
];

test('strict schemas reject hostile, unknown, oversized and non-finite inputs', () => {
  for (const input of hostile) assert.equal(CreateInput.safeParse(input).success, false);
  assert.equal(TOOL_SCHEMAS.list_accessories.safeParse({ category: '__proto__' }).success, false);
  assert.equal(CreateInput.safeParse({ config: JSON.parse('{"__proto__":{"polluted":true}}') }).success, false);
  assert.equal({}.polluted, undefined);
});

test('renderer validates independently and exports only inert self-contained SVG', () => {
  for (const input of hostile) assert.throws(() => renderAvatar(input));
  const markup = new Set();
  for (const accessory of Object.keys(ACCESSORY_OPTIONS)) {
    const result = renderAvatar({ config: { accessory, matchEyes: true, eyes: '#ab3456' }, format: 'svg' });
    const svg = Buffer.from(result.data, 'base64').toString();
    assert.doesNotMatch(svg, /<(?:script|image|foreignObject|iframe)\b|(?:href|onload|onclick)=|file:|https?:\/\/(?!www\.w3\.org)|var\(/i);
    assert.match(svg, /#ab3456/);
    assert.ok(result.bytes < LIMITS.outputBytes);
    markup.add(svg);
  }
  assert.equal(markup.size, Object.keys(ACCESSORY_OPTIONS).length);
});

test('SVG/PNG/GIF are deterministic and within byte and dimension limits', () => {
  for (const format of ['svg', 'png', 'gif']) {
    const input = { format, size: 128, config: { accessory: 'headphones', headRoundness: 100 } };
    const a = renderAvatar(input), b = renderAvatar(input);
    assert.equal(a.sha256, b.sha256);
    assert.equal(a.data, b.data);
    const binary = Buffer.from(a.data, 'base64');
    if (format === 'png') { assert.equal(binary.readUInt32BE(16), 128); assert.equal(binary[25], 6); }
    if (format === 'gif') { assert.equal(binary.subarray(0,6).toString(), 'GIF89a'); assert.equal(binary.readUInt16LE(6), 128); assert.equal(binary.at(-1), 59); }
  }
});

test('transport closes for oversized frames and blocks prototype/depth abuse', async () => {
  const stdin = new PassThrough(), stdout = new PassThrough();
  const transport = new GuardedTransport(stdin, stdout);
  let closed = false; transport.onclose = () => { closed = true; };
  transport.onerror = () => {};
  await transport.start();
  stdin.write('x'.repeat(LIMITS.inputBytes + 1));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(closed, true);
  assert.equal(safeMessage(JSON.parse('{"params":{"__proto__":{"x":1}}}')), false);
  let nested = {}; for (let i = 0; i < 20; i++) nested = { x: nested };
  assert.equal(safeMessage(nested), false);
  await transport.close();
});

test('transport rejects malicious tool input without echoing it to the model', async () => {
  const stdin = new PassThrough(), stdout = new PassThrough();
  const transport = new GuardedTransport(stdin, stdout);
  let output = ''; stdout.on('data', chunk => { output += chunk; });
  let dispatched = false; transport.onmessage = () => { dispatched = true; };
  await transport.start();
  stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 42, method: 'tools/call', params: { name: 'create_avatar', arguments: { outputPath: 'DO_NOT_ECHO_THIS_SECRET' } } }) + '\n');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(dispatched, false);
  assert.equal(JSON.parse(output).error.code, -32602);
  assert.doesNotMatch(output, /DO_NOT_ECHO_THIS_SECRET/);
  await transport.close();
});

test('transport throttles protocol floods before unlimited work can queue', async () => {
  const stdin = new PassThrough(), stdout = new PassThrough();
  const transport = new GuardedTransport(stdin, stdout);
  let dispatched = 0, closed = false;
  transport.onmessage = () => { dispatched++; };
  transport.onclose = () => { closed = true; };
  await transport.start();
  for (let i = 0; i < LIMITS.requestsPerMinute + 20; i++) stdin.write(JSON.stringify({jsonrpc:'2.0',method:'ping',id:i})+'\n');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(dispatched, LIMITS.requestsPerMinute);
  assert.equal(closed, true);
  await transport.close();
});

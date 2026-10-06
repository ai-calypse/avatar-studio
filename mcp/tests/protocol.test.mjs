import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

async function connect(t) {
  const transport = new StdioClientTransport({ command: process.execPath, args: ['--max-old-space-size=192', fileURLToPath(new URL('../src/index.mjs', import.meta.url))], stderr: 'pipe', env: {} });
  const client = new Client({ name: 'avatar-studio-tests', version: '1.0.0' });
  let stderr = ''; transport.stderr?.on('data', chunk => { stderr += chunk; });
  await client.connect(transport);
  t.after(async () => { await client.close(); assert.equal(stderr, ''); });
  return client;
}

test('real stdio client discovers tools and creates SVG, PNG, GIF artifacts', async t => {
  const client = await connect(t);
  const tools = (await client.listTools()).tools;
  assert.deepEqual(tools.map(tool => tool.name), ['list_accessories', 'validate_avatar', 'create_avatar']);
  for (const tool of tools) {
    assert.equal(tool.annotations.openWorldHint, false);
    assert.equal(tool.annotations.destructiveHint, false);
    assert.equal(tool.inputSchema.additionalProperties, false);
  }
  const catalog = await client.callTool({ name: 'list_accessories', arguments: {} });
  assert.equal(Object.values(JSON.parse(catalog.content[0].text).categories).flat().length, 50);
  const config = await client.callTool({ name: 'validate_avatar', arguments: { config: { body: '#FF5577', accessory: 'crown' } } });
  assert.equal(config.structuredContent.config.body, '#ff5577');
  for (const format of ['svg', 'png', 'gif']) {
    const result = await client.callTool({ name: 'create_avatar', arguments: { format, size: 128, config: { accessory: 'crown', matchEyes: true } } });
    assert.notEqual(result.isError, true);
    assert.equal(result.structuredContent.format, format);
    assert.equal(result.structuredContent.sha256.length, 64);
    if (format === 'png') assert.equal(result.content[1].type, 'image');
    else assert.equal(result.content[1].type, 'resource');
  }
});

test('protocol rejects unknown tools and host-input injection, then stays usable', async t => {
  const client = await connect(t);
  for (const params of [
    {name:'read_file',arguments:{path:'/etc/passwd'}},
    {name:'create_avatar',arguments:{config:{eyes:'<script>exfiltrate()</script>'}}},
    {name:'create_avatar',arguments:{url:'http://169.254.169.254/'}},
    {name:'create_avatar',arguments:{config:{accessory:'constructor'}}},
    {name:'create_avatar',arguments:{format:'gif',size:512}},
  ]) await assert.rejects(client.callTool(params), /Invalid avatar tool or arguments/);
  const result = await client.callTool({name:'create_avatar',arguments:{config:{accessory:'none'}}});
  assert.equal(result.structuredContent.format, 'svg');
});

test('process exits after stdin closes and produces no non-protocol stdout', async () => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../src/index.mjs', import.meta.url))], { stdio: ['pipe','pipe','pipe'] });
  let stdout = ''; child.stdout.on('data', chunk => { stdout += chunk; });
  child.stdin.end();
  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(Error('Process failed to exit')); }, 3000);
    child.once('exit', code => { clearTimeout(timer); resolve(code); });
  });
  assert.equal(code, 0); assert.equal(stdout, '');
});

test('concurrent generation is bounded and a cancelled request releases capacity', async t => {
  const client = await connect(t);
  const calls = Array.from({length:6}, () => client.callTool({name:'create_avatar',arguments:{format:'gif',size:128,config:{accessory:'headphones'}}}));
  const results = await Promise.all(calls);
  assert.ok(results.some(result => result.isError && result.content[0].text.includes('busy')));
  assert.ok(results.filter(result => !result.isError).length <= 2);
  await new Promise(resolve => setTimeout(resolve, 100));
  const controller = new AbortController();
  const pending = client.callTool({name:'create_avatar',arguments:{format:'gif',size:128}}, {signal:controller.signal});
  controller.abort();
  await assert.rejects(pending);
  await new Promise(resolve => setTimeout(resolve, 100));
  const result = await client.callTool({name:'create_avatar',arguments:{format:'png',size:64}});
  assert.notEqual(result.isError, true);
});

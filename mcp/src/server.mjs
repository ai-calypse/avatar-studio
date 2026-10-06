import { McpServer } from '@modelcontextprotocol/server';
import { Worker } from 'node:worker_threads';
import { ACCESSORY_OPTIONS, ACCESSORY_GROUPS } from '../../demo/avatar-studio-accessories.js';
import { TOOL_SCHEMAS, LIMITS } from './schema.mjs';

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const error = text => ({ isError: true, content: [{ type: 'text', text }] });
export function createServer() {
  const server = new McpServer({ name: 'avatar-studio', version: '0.1.0' });
  const active = new Set();
  server.registerTool('list_accessories', { description: 'List the 50 supported avatar accessories, optionally filtered by category. No external access.', inputSchema: TOOL_SCHEMAS.list_accessories, annotations }, ({ category }) => {
    const groups = category ? { [category]: ACCESSORY_GROUPS[category] } : ACCESSORY_GROUPS;
    const catalog = Object.fromEntries(Object.entries(groups).map(([name, keys]) => [name, keys.map(id => ({ id, name: ACCESSORY_OPTIONS[id][0] }))]));
    return { content: [{ type: 'text', text: JSON.stringify({ none: 'none', categories: catalog, limits: LIMITS }) }] };
  });
  server.registerTool('validate_avatar', { description: 'Validate and normalize a robot configuration before embedding it in an application. Only documented fields are allowed.', inputSchema: TOOL_SCHEMAS.validate_avatar, annotations }, ({ config }) => ({ content: [{ type: 'text', text: JSON.stringify(config) }], structuredContent: { config } }));
  server.registerTool('create_avatar', { description: 'Generate a self-contained robot avatar as SVG, PNG, or a looping GIF. Returns an in-memory artifact; never reads/writes files or fetches URLs. SVG/PNG size: 32–512; GIF size: 32–128 (set size explicitly for GIF).', inputSchema: TOOL_SCHEMAS.create_avatar, annotations }, async (input, context) => {
    if (active.size >= LIMITS.activeRenders) return error('Renderer busy. Retry after the current request finishes.');
    if (context?.signal?.aborted) return error('Avatar generation cancelled.');
    const worker = new Worker(new URL('./worker.mjs', import.meta.url), { workerData: input, env: {}, resourceLimits: { maxOldGenerationSizeMb: 96, stackSizeMb: 4 }, stdout: true, stderr: true });
    active.add(worker);
    // Drain private worker output without echoing payloads to either MCP stream.
    worker.stdout.resume(); worker.stderr.resume();
    return new Promise(resolve => {
      let settled = false;
      const finish = result => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        context?.signal?.removeEventListener('abort', cancel);
        void worker.terminate().finally(() => active.delete(worker));
        resolve(result);
      };
      const timer = setTimeout(() => finish(error('Avatar generation timed out.')), LIMITS.renderTimeoutMs);
      const cancel = () => finish(error('Avatar generation cancelled.'));
      context?.signal?.addEventListener('abort', cancel, { once: true });
      worker.once('error', () => finish(error('Avatar generation failed.')));
      worker.once('exit', () => { if (!settled) finish(error('Avatar generation stopped.')); });
      worker.once('message', message => {
        if (!message.ok) { finish(error('Avatar generation failed.')); return; }
        const { data, ...metadata } = message.result;
        const uri = `avatar://generated/${metadata.sha256}/avatar.${metadata.format}`;
        const artifact = metadata.format === 'png'
          ? { type: 'image', mimeType: metadata.mimeType, data }
          : { type: 'resource', resource: metadata.format === 'svg'
            ? { uri, mimeType: metadata.mimeType, text: Buffer.from(data, 'base64').toString('utf8') }
            : { uri, mimeType: metadata.mimeType, blob: data } };
        finish({ content: [{ type: 'text', text: JSON.stringify(metadata) }, artifact], structuredContent: metadata });
      });
    });
  });
  return { server, async dispose() { await Promise.all([...active].map(worker => worker.terminate())); active.clear(); } };
}

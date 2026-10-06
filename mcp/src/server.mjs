import { McpServer } from '@modelcontextprotocol/server';
import { Worker } from 'node:worker_threads';
import { ACCESSORY_OPTIONS, ACCESSORY_GROUPS } from '../../src/avatar-studio-accessories.js';
import { TOOL_SCHEMAS, LIMITS, EXPRESSIONS } from './schema.mjs';
import { generateIdentity, suggestPalette, RECIPE_VERSION } from './recipes.mjs';

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const error = text => ({ isError: true, content: [{ type: 'text', text }] });
const json = value => ({ content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value });
const descriptions = {
  create_avatar: 'Generate a self-contained robot avatar as SVG, PNG, or looping GIF. Optional background, circular/rounded frame, padding, and presence badge. SVG/PNG: 32–512; GIF: 32–128 (set size explicitly). No files or network access.',
  create_avatar_batch: 'Generate up to 12 named avatars in one call for chat users, teams, or app fixtures. Returns individual SVG/PNG artifacts and a manifest. Unique safe item IDs required; size 32–256.',
  create_avatar_variants: 'Generate up to 12 deterministic design alternatives. Vary accessories only to preserve brand colors, colors only to preserve an accessory, or the whole look. Seed controls reproducibility. Returns SVG/PNG artifacts and a manifest.',
  create_expression_pack: 'Generate matching idle/happy/sad/angry/sleep/surprise avatar images for chat, onboarding, or app states. Preserves the same appearance; returns named SVG/PNG artifacts and a manifest. Not a full animated interaction runtime.',
  create_sprite_sheet: 'Pack up to 16 named avatar configurations into a single transparent SVG/PNG sprite sheet, with pixel coordinates and configs in a frame manifest. Cell size 32–128; maximum sheet dimensions 512×512. For CSS sprites, canvas, games, or expression sheets.',
};

function artifactResult(result, single) {
  const records = [], blocks = [];
  for (const generated of result.artifacts) {
    const { data, ...metadata } = generated;
    records.push(metadata);
    const uri = `avatar://generated/${metadata.sha256}/${metadata.id || 'avatar'}.${metadata.format}`;
    blocks.push(metadata.format === 'png'
      ? { type: 'image', mimeType: metadata.mimeType, data }
      : { type: 'resource', resource: metadata.format === 'svg'
        ? { uri, mimeType: metadata.mimeType, text: Buffer.from(data, 'base64').toString('utf8') }
        : { uri, mimeType: metadata.mimeType, blob: data } });
  }
  const metadata = single ? records[0] : { artifacts: records, count: records.length, totalBytes: records.reduce((sum, record) => sum + record.bytes, 0) };
  const response = { content: [{ type: 'text', text: JSON.stringify(metadata) }, ...blocks], structuredContent: metadata };
  return Buffer.byteLength(JSON.stringify(response)) <= LIMITS.outputBytes - 1024 ? response : error('Generated result exceeds response limit. Reduce count or size.');
}

export function createServer() {
  const server = new McpServer({ name: 'avatar-studio', version: '0.2.0' });
  const active = new Set();
  const register = (name, description, handler) => server.registerTool(name, { description, inputSchema: TOOL_SCHEMAS[name], annotations }, handler);
  register('list_accessories', 'List all 50 avatar accessory IDs grouped by category, optionally filtered by category. No external access.', ({ category }) => {
    const groups = category ? { [category]: ACCESSORY_GROUPS[category] } : ACCESSORY_GROUPS;
    const catalog = Object.fromEntries(Object.entries(groups).map(([name, keys]) => [name, keys.map(id => ({ id, name: ACCESSORY_OPTIONS[id][0] }))]));
    return json({ none: 'none', categories: catalog, limits: LIMITS });
  });
  register('validate_avatar', 'Validate and normalize a robot configuration before embedding it in an application. Only documented fields are allowed.', ({ config }) => json({ config }));
  register('get_capabilities', 'Discover formats, limits, expressions, identity recipe version, and recommended multi-tool workflows before planning an app integration.', () => json({
    version: '0.2.0', identityRecipeVersion: RECIPE_VERSION, tools: Object.keys(TOOL_SCHEMAS), limits: LIMITS, expressions: EXPRESSIONS,
    formats: { single: ['svg', 'png', 'gif'], batch: ['svg', 'png'], spriteSheet: ['svg', 'png'] },
    presentation: { backgrounds: 'transparent or six-digit hex', frames: ['none', 'circle', 'rounded'], padding: '0–24 percent on each side', statuses: ['none', 'online', 'away', 'busy', 'offline'] },
    workflows: [
      { useCase: 'Default user profile pictures', tools: ['generate_identity', 'create_avatar'], tip: 'Use an opaque stable user ID as seed. Store the returned config for long-term stability.' },
      { useCase: 'Branded team or multi-agent avatars', tools: ['suggest_brand_palette', 'create_avatar_variants'], tip: 'Use vary=accessories to preserve your brand colors.' },
      { useCase: 'Chat and onboarding states', tools: ['create_expression_pack'], tip: 'Use named expressions to map images to app states.' },
      { useCase: 'Game or canvas assets', tools: ['create_sprite_sheet'], tip: 'Use frame x/y/width/height metadata to sample the sheet.' },
      { useCase: 'Chat user fixtures and profile cards', tools: ['create_avatar_batch'], tip: 'Use IDs to associate returned artifacts with app records.' },
    ], artifactStorage: 'Results are in memory; avatar:// URIs are identifiers, not hosted URLs. Your app owns storage.',
  }));
  register('generate_identity', 'Derive a repeatable robot config from an opaque stable user ID or seed. No render or storage. Seed: 1–128 ASCII letters/digits plus . _ : -. Optional overrides keep brand colors or accessory fixed. Raw seed is never returned; fingerprints are not anonymity guarantees.', input => json(generateIdentity(input)));
  register('suggest_brand_palette', 'Suggest body, eye, and accessory colors from a primary brand hex color, optional accent, and light/dark mode. Includes measured contrast ratios; not a full accessibility audit. Pass the returned config to generation tools.', input => json(suggestPalette(input)));

  async function render(name, input, context) {
    if (active.size >= LIMITS.activeRenders) return error('Renderer busy. Retry after the current request finishes.');
    if (context?.signal?.aborted) return error('Avatar generation cancelled.');
    let worker;
    try { worker = new Worker(new URL('./worker.mjs', import.meta.url), { workerData: { name, input }, env: {}, resourceLimits: { maxOldGenerationSizeMb: 96, stackSizeMb: 4 }, stdout: true, stderr: true }); }
    catch { return error('Avatar generation unavailable.'); }
    active.add(worker);
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
      const timer = setTimeout(() => finish(error('Avatar generation timed out. Reduce count or size.')), LIMITS.renderTimeoutMs);
      const cancel = () => finish(error('Avatar generation cancelled.'));
      context?.signal?.addEventListener('abort', cancel, { once: true });
      worker.once('error', () => finish(error('Avatar generation failed.')));
      worker.once('exit', () => { if (!settled) finish(error('Avatar generation stopped.')); });
      worker.once('message', message => finish(message.ok ? artifactResult(message.result, name === 'create_avatar' || name === 'create_sprite_sheet') : error('Avatar generation failed or exceeded limits. Reduce count or size.')));
    });
  }
  for (const [name, description] of Object.entries(descriptions)) register(name, description, (input, context) => render(name, input, context));
  return { server, async dispose() { await Promise.all([...active].map(worker => worker.terminate())); active.clear(); } };
}

import { TOOL_SCHEMAS, LIMITS } from './schema.mjs';
import { renderAvatar, renderPresentedSVG, rasterize, artifact } from './render.mjs';
import { variantItems, expressionItems } from './recipes.mjs';

export const RENDER_TOOLS = ['create_avatar', 'create_avatar_batch', 'create_avatar_variants', 'create_expression_pack', 'create_sprite_sheet'];

export function renderJob({ name, input }) {
  if (!RENDER_TOOLS.includes(name)) throw Error('Unknown render task');
  input = TOOL_SCHEMAS[name].parse(input);
  let result;
  if (name === 'create_avatar') result = { artifacts: [renderAvatar(input)] };
  else if (name === 'create_sprite_sheet') {
    const columns = Math.min(input.columns, input.items.length);
    const rows = Math.ceil(input.items.length / columns);
    const width = columns * input.cellSize, height = rows * input.cellSize;
    const frames = input.items.map(({ id, config }, index) => ({ id, config, x: (index % columns) * input.cellSize, y: Math.floor(index / columns) * input.cellSize, width: input.cellSize, height: input.cellSize }));
    const cells = frames.map((frame, index) => renderPresentedSVG(frame.config, input.cellSize, input.presentation)
      .replace(/id="([^"]+)"/g, (_, id) => `id="cell-${index}-${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#cell-${index}-${id})`)
      .replace('<svg ', `<svg x="${frame.x}" y="${frame.y}" `)).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Avatar sprite sheet">${cells}</svg>`;
    const binary = input.format === 'svg' ? Buffer.from(svg) : rasterize(svg).asPng();
    result = { artifacts: [artifact(binary, { id: 'sprite-sheet', width, height, frames, presentation: input.presentation, format: input.format, mimeType: input.format === 'svg' ? 'image/svg+xml' : 'image/png' })] };
  } else {
    const items = name === 'create_avatar_variants' ? variantItems(input) : name === 'create_expression_pack' ? expressionItems(input) : input.items;
    const artifacts = [];
    let bytes = 0;
    // Render sequentially inside one bounded worker. No unbounded fan-out.
    for (const { id, config } of items) {
      const rendered = { id, ...renderAvatar({ config, presentation: input.presentation, format: input.format, size: input.size }) };
      bytes += Buffer.byteLength(JSON.stringify(rendered));
      if (bytes > LIMITS.outputBytes - 65536) throw Error('Batch exceeds response limit');
      artifacts.push(rendered);
    }
    result = { artifacts };
  }
  if (Buffer.byteLength(JSON.stringify(result)) > LIMITS.outputBytes - 65536) throw Error('Job exceeds response limit');
  return result;
}

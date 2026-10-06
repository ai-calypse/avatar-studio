import { Resvg } from '@resvg/resvg-js';
import { createHash } from 'node:crypto';
import { accessoryMarkup, HEADWEAR } from '../../src/avatar-studio-accessories.js';
import { encodeGIF } from '../../demo/avatar-studio-gif.js';
import { CreateInput, LIMITS, AvatarConfig, Presentation } from './schema.mjs';

// A fixed, numeric template; no strings from a prompt, URLs, paths, or raw SVG.
function headPath(roundness) {
  const points = [];
  const exponent = roundness <= 50 ? 10 + (3.7 - 10) * roundness / 50 : 3.7 + (2.2 - 3.7) * (roundness - 50) / 50;
  for (let i = 0; i < 160; i++) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 160;
    const c = Math.cos(angle), s = Math.sin(angle);
    const radius = 1 / Math.pow(Math.pow(Math.abs(c) / 100, exponent) + Math.pow(Math.abs(s) / 90, exponent), 1 / exponent);
    points.push({ x: 120 + c * radius, y: 120 + s * radius });
  }
  return `M ${points.map(p => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' L ')} Z`;
}

export function renderSVG(config, size, blink = 1) {
  const d = headPath(config.headRoundness);
  const facade = {
    _headShape: { getAttribute: () => d },
    _parseHeadPoints: value => {
      const nums = value.match(/-?\d*\.?\d+/g).map(Number);
      return Array.from({length: nums.length/2}, (_, i) => ({ x: nums[i*2], y: nums[i*2+1] }));
    },
  };
  const accessoryColor = config.matchEyes ? config.eyes : config.accessoryColor;
  // Replace the one internal CSS variable before handing our own markup to resvg.
  const accessory = accessoryMarkup(facade, config).replaceAll('var(--robot-accessory-color)', accessoryColor);
  const scale = config.eyeSize / 100;
  let rx = 27 * scale, ry = 29 * scale * blink;
  if (config.expression === 'happy') ry *= .4;
  if (config.expression === 'sleep') ry = 3 * scale;
  if (config.expression === 'surprise') { rx *= 1.18; ry *= 1.18; }
  const eyes = [86-config.spacing,154+config.spacing].map((x, i) => {
    if (config.expression === 'angry' || config.expression === 'sad') {
      const slope = (config.expression === 'angry' ? 1 : -1) * (i ? -1 : 1);
      const left = x - rx - 2, right = x + rx + 2;
      const yLeft = 118 - slope * 12, yRight = 118 + slope * 12;
      return `<defs><clipPath id="eye-cut-${i}"><polygon points="${left},${yLeft} ${right},${yRight} ${right},180 ${left},180"/></clipPath></defs><ellipse cx="${x}" cy="126" rx="${rx}" ry="${Math.max(2,ry)}" fill="${config.eyes}" clip-path="url(#eye-cut-${i})"/>`;
    }
    return `<ellipse cx="${x}" cy="126" rx="${rx}" ry="${Math.max(2,ry)}" fill="${config.eyes}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-16 -48 272 320" role="img" aria-label="Robot avatar"><defs><clipPath id="avatar-head-clip"><path d="${d}" transform="translate(7.2 7.2) scale(.94)"/></clipPath></defs><path d="${d}" fill="${config.body}" transform="translate(7.2 7.2) scale(.94)"/>${HEADWEAR.has(config.accessory) ? '' : `<circle cx="120" cy="12" r="15" fill="${config.body}"/>`}<g clip-path="url(#avatar-head-clip)">${eyes}</g>${accessory}</svg>`;
}

export function renderPresentedSVG(config, size, presentation = {}, blink = 1) {
  config = AvatarConfig.parse(config);
  const options = Presentation.parse(presentation);
  const inner = renderSVG(config, size, blink);
  if (options.background === 'transparent' && options.frame === 'none' && options.padding === 0 && options.status === 'none') return inner;
  const pad = options.padding * 2.56;
  const side = 256 - pad * 2;
  const shape = options.frame === 'circle' ? '<circle cx="128" cy="128" r="128"/>' : `<rect width="256" height="256" rx="${options.frame === 'rounded' ? 40 : 0}"/>`;
  const background = options.background === 'transparent' ? '' : `<rect width="256" height="256" fill="${options.background}"/>`;
  const statusColors = { online: '#22c55e', away: '#f59e0b', busy: '#ef4444', offline: '#94a3b8' };
  const badge = options.status === 'none' ? '' : `<circle cx="216" cy="216" r="18" fill="${statusColors[options.status]}" stroke="#ffffff" stroke-width="4"/>`;
  const nested = inner.replace('<svg ', `<svg x="${pad}" y="${pad}" `).replace(`width="${size}" height="${size}"`, `width="${side}" height="${side}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256" role="img" aria-label="Robot avatar"><defs><clipPath id="avatar-frame">${shape}</clipPath></defs><g clip-path="url(#avatar-frame)">${background}${nested}</g>${badge}</svg>`;
}

export function rasterize(svg, background) {
  const renderer = new Resvg(svg, { font: { loadSystemFonts: false, fontFiles: [], fontDirs: [] }, logLevel: 'off', ...(background ? { background } : {}) });
  if (renderer.imagesToResolve().length) throw Error('External images are forbidden');
  return renderer.render();
}

export function artifact(data, metadata) {
  data = Buffer.from(data);
  if (data.length > LIMITS.outputBytes / 1.5) throw Error('Artifact exceeds output limit');
  return { ...metadata, data: data.toString('base64'), sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length };
}

export function renderAvatar(input) {
  const { config, size, format, presentation } = CreateInput.parse(input);
  const svg = renderPresentedSVG(config, size, presentation);
  let data, mimeType;
  if (format === 'svg') { data = Buffer.from(svg); mimeType = 'image/svg+xml'; }
  if (format === 'png') { data = rasterize(svg).asPng(); mimeType = 'image/png'; }
  if (format === 'gif') {
    const frames = [];
    for (let i = 0; i < LIMITS.gifFrames; i++) {
      const blink = [5,7].includes(i) ? .5 : i === 6 ? .08 : 1;
      frames.push(rasterize(renderPresentedSVG(config, size, presentation, blink), '#f5f5ef').pixels);
    }
    data = Buffer.from(encodeGIF(frames, size, size, 100)); mimeType = 'image/gif';
  }
  return artifact(data, { config, presentation, size, format, mimeType });
}

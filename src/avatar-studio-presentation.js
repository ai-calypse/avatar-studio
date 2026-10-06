export function presentAvatarSVG(svg, size, input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key=>!['background','frame','padding','status'].includes(key))) throw new TypeError('Invalid presentation.');
  const { background = 'transparent', frame = 'none', padding = 0, status = 'none' } = input;
  if (typeof background !== 'string' || (background !== 'transparent' && !/^#[0-9a-f]{6}$/i.test(background)) || !['none','circle','rounded'].includes(frame) || !Number.isFinite(padding) || padding < 0 || padding > 24 || !['none','online','away','busy','offline'].includes(status)) throw new TypeError('Invalid presentation.');
  if (background === 'transparent' && frame === 'none' && padding === 0 && status === 'none') return svg;
  const pad = padding * 2.56, side = 256 - pad * 2;
  const shape = frame === 'circle' ? '<circle cx="128" cy="128" r="128"/>' : `<rect width="256" height="256" rx="${frame === 'rounded' ? 40 : 0}"/>`;
  const colors = { online:'#22c55e', away:'#f59e0b', busy:'#ef4444', offline:'#94a3b8' };
  const nested = svg.replace('<svg ',`<svg x="${pad}" y="${pad}" `).replace(`width="${size}" height="${size}"`,`width="${side}" height="${side}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256" role="img" aria-label="Robot avatar"><defs><clipPath id="avatar-frame">${shape}</clipPath></defs><g clip-path="url(#avatar-frame)">${background === 'transparent' ? '' : `<rect width="256" height="256" fill="${background}"/>`}${nested}</g>${status === 'none' ? '' : `<circle cx="216" cy="216" r="18" fill="${colors[status]}" stroke="#ffffff" stroke-width="4"/>`}</svg>`;
}

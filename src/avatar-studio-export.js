import { exportAvatarSVG } from './avatar-studio-customization.js';
import { presentAvatarSVG } from './avatar-studio-presentation.js';
import { encodeGIF } from './avatar-studio-gif.js';

async function raster(avatar, size, background, presentation) {
  const url = URL.createObjectURL(new Blob([presentAvatarSVG(exportAvatarSVG(avatar,size),size,presentation)],{type:'image/svg+xml'}));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    if (background) { context.fillStyle = background; context.fillRect(0,0,size,size); }
    context.drawImage(image,0,0,size,size);
    return canvas;
  } finally { URL.revokeObjectURL(url); }
}
export async function exportAvatar(avatar, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).some(key=>!['format','size','background','frames','delay','presentation'].includes(key))) throw new TypeError('Unknown export option.');
  const { format = 'svg', size = format === 'gif' ? 256 : 512, background, frames = 24, delay = 80, presentation = {} } = options;
  if (!['svg','png','gif'].includes(format) || !Number.isInteger(size) || size < 32 || size > (format === 'gif' ? 256 : 512)) throw new RangeError('Invalid export format or size.');
  if (background !== undefined && (typeof background !== 'string' || !/^#[0-9a-f]{6}$/i.test(background))) throw new TypeError('Background must be a hex color.');
  if (!Number.isInteger(frames) || frames < 2 || frames > 48 || !Number.isInteger(delay) || delay < 20 || delay > 500) throw new RangeError('Invalid GIF frame count or delay.');
  presentAvatarSVG(exportAvatarSVG(avatar,size),size,presentation);
  const frame = { ...presentation, ...(background ? {background} : {}) };
  if (format === 'svg') return new Blob([presentAvatarSVG(exportAvatarSVG(avatar,size),size,frame)],{type:'image/svg+xml'});
  if (format === 'png') {
    const canvas = await raster(avatar,size,undefined,frame);
    const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if (!blob) throw new Error('PNG export unavailable.');
    return blob;
  }
  const pixels = [];
  avatar.noteActivity();
  for(let i=0;i<frames;i++) {
    const canvas = await raster(avatar,size,'#f5f5ef',frame);
    pixels.push(canvas.getContext('2d').getImageData(0,0,size,size).data);
    if(i < frames-1) await new Promise(resolve=>setTimeout(resolve,delay));
  }
  return new Blob([encodeGIF(pixels,size,size,delay)],{type:'image/gif'});
}

// GIF89a with a fixed RGB palette. Frequent clear codes keep LZW at 9 bits.
// Small exports favor a simple, dependency-free encoder over compression.
export function encodeGIF(frames, width, height, delay = 80) {
  const bytes = [];
  const put = (...values) => bytes.push(...values);
  const word = value => put(value & 255, value >> 8);
  put(...Array.from('GIF89a', char => char.charCodeAt(0)));
  word(width); word(height); put(247, 0, 0);
  for (let i = 0; i < 256; i++) put(Math.round((i >> 5) * 255 / 7), Math.round(((i >> 2) & 7) * 255 / 7), Math.round((i & 3) * 255 / 3));
  put(33, 255, 11, ...Array.from('NETSCAPE2.0', c => c.charCodeAt(0)), 3, 1, 0, 0, 0);
  for (const rgba of frames) {
    put(33, 249, 4, 4); word(Math.round(delay / 10)); put(0, 0);
    put(44); word(0); word(0); word(width); word(height); put(0, 8);
    const data = [];
    let bits = 0, count = 0;
    const code = value => {
      bits |= value << count; count += 9;
      while (count >= 8) { data.push(bits & 255); bits >>>= 8; count -= 8; }
    };
    for (let pixel = 0; pixel < width * height; pixel++) {
      if (pixel % 200 === 0) code(256);
      const offset = pixel * 4;
      code((rgba[offset] >> 5) << 5 | (rgba[offset + 1] >> 5) << 2 | rgba[offset + 2] >> 6);
    }
    code(257);
    if (count) data.push(bits & 255);
    for (let i = 0; i < data.length; i += 255) { const chunk = data.slice(i, i + 255); put(chunk.length, ...chunk); }
    put(0);
  }
  put(59);
  return new Uint8Array(bytes);
}

// Seeded, low-frequency radial waves make a smooth, closed silhouette.
// Geometry is bounded and contains no caller-provided path data.
export function randomBodyPoints(seed = 0, roundness = 50) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Shape seed must be an unsigned 32-bit integer.');
  if (!Number.isFinite(roundness) || roundness < 0 || roundness > 100) throw new RangeError('Roundness must be from 0 to 100.');
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ state >>> 15, state | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const phases = Array.from({ length: 3 }, () => random() * Math.PI * 2);
  const amplitudes = [.035 + random() * .015, .045 + random() * .025, .01 + random() * .01];
  const halfW = 101 + random() * 4, halfH = 90 + random() * 4;
  const exponent = 2.2 + (100 - roundness) / 100 * 1.1;
  return Array.from({ length: 160 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 160;
    const c = Math.cos(angle), s = Math.sin(angle);
    const radius = 1 / Math.pow(Math.pow(Math.abs(c) / halfW, exponent) + Math.pow(Math.abs(s) / halfH, exponent), 1 / exponent);
    const wave = 1 + amplitudes.reduce((sum, amplitude, i) => sum + amplitude * Math.sin((i + 2) * angle + phases[i]), 0);
    return { x: 120 + c * radius * wave, y: 120 + s * radius * wave };
  });
}

export function randomBodyPath(seed, roundness) {
  return `M ${randomBodyPoints(seed, roundness).map(point => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')} Z`;
}

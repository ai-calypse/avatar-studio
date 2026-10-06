export const ACCESSORY_OPTIONS = {
  none: ['None', ''], glasses: ['Glasses', '👓'], headphones: ['Headphones', '🎧'], bow: ['Bow tie', '🎀'],
  sunglasses: ['Shades', '🕶️'], crown: ['Crown', '👑'], party: ['Party hat', '🥳'],
  halo: ['Halo', '😇'], beanie: ['Beanie', '🧢'], moustache: ['Moustache', '🥸'], flower: ['Flower', '🌸'],
  'round-glasses': ['Round glasses', '👓'], 'square-glasses': ['Square glasses', '👓'], 'cat-eye': ['Cat-eye glasses', '👓'],
  aviators: ['Aviators', '🕶️'], 'heart-glasses': ['Heart glasses', '💗'], 'star-glasses': ['Star glasses', '⭐'],
  monocle: ['Monocle', '🧐'], goggles: ['Goggles', '🥽'], visor: ['Visor', '🤖'], 'eye-patch': ['Eye patch', '🏴‍☠️'],
  'top-hat': ['Top hat', '🎩'], fedora: ['Fedora', '🎩'], cowboy: ['Cowboy hat', '🤠'], cap: ['Baseball cap', '🧢'],
  beret: ['Beret', '🎨'], bucket: ['Bucket hat', '👒'], wizard: ['Wizard hat', '🧙'], santa: ['Santa hat', '🎅'],
  chef: ['Chef hat', '👨‍🍳'], graduation: ['Graduation cap', '🎓'], pirate: ['Pirate hat', '🏴‍☠️'],
  'cat-ears': ['Cat ears', '🐱'], 'bunny-ears': ['Bunny ears', '🐰'], 'bear-ears': ['Bear ears', '🐻'], 'fox-ears': ['Fox ears', '🦊'],
  horns: ['Devil horns', '😈'], antlers: ['Antlers', '🦌'], 'alien-antennae': ['Alien antennae', '👽'],
  scarf: ['Scarf', '🧣'], tie: ['Necktie', '👔'], necklace: ['Necklace', '📿'], medal: ['Medal', '🏅'],
  choker: ['Choker', '💎'], bandana: ['Bandana', '🤠'],
  'star-pin': ['Star pin', '⭐'], 'heart-pin': ['Heart pin', '❤️'], 'lightning-pin': ['Lightning pin', '⚡'],
  'leaf-pin': ['Leaf pin', '🍃'], 'snowflake-pin': ['Snowflake pin', '❄️'], 'butterfly-pin': ['Butterfly pin', '🦋'],

};

export const ACCESSORY_GROUPS = {
  Eyewear: ['glasses', 'sunglasses', 'round-glasses', 'square-glasses', 'cat-eye', 'aviators', 'heart-glasses', 'star-glasses', 'monocle', 'goggles', 'visor', 'eye-patch'],
  'Hats & headwear': ['crown', 'party', 'halo', 'beanie', 'top-hat', 'fedora', 'cowboy', 'cap', 'beret', 'bucket', 'wizard', 'santa', 'chef', 'graduation', 'pirate'],
  'Ears & antennae': ['cat-ears', 'bunny-ears', 'bear-ears', 'fox-ears', 'horns', 'antlers', 'alien-antennae'],
  'Audio & face': ['headphones', 'moustache'],
  Neckwear: ['bow', 'scarf', 'tie', 'necklace', 'medal', 'choker', 'bandana'],
  'Flowers & pins': ['flower', 'star-pin', 'heart-pin', 'lightning-pin', 'leaf-pin', 'snowflake-pin', 'butterfly-pin'],
};

export const HEADWEAR = new Set(['crown', 'party', 'halo', 'beanie', 'top-hat', 'fedora', 'cowboy', 'cap', 'beret', 'bucket', 'wizard', 'santa', 'chef', 'graduation', 'pirate']);
const star = (x, y, radius, count = 5) => Array.from({length: count * 2}, (_, i) => {
  const angle = -Math.PI / 2 + i * Math.PI / count;
  const r = i % 2 ? radius * .45 : radius;
  return `${x + Math.cos(angle) * r},${y + Math.sin(angle) * r}`;
}).join(' ');

// Fit accessories to the actual SVG silhouette, including jelly deformations.
export function accessoryMarkup(face, settings) {
  const points = face._parseHeadPoints(face._headShape.getAttribute('d')).map(p => ({ x: p.x * .94 + 7.2, y: p.y * .94 + 7.2 }));
  if (!points.length) return '';
  const top = Math.min(...points.map(p => p.y));
  const bottom = Math.max(...points.map(p => p.y));
  const cx = (Math.min(...points.map(p => p.x)) + Math.max(...points.map(p => p.x))) / 2;
  const edges = y => {
    const hits = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) hits.push(a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y));
    }
    return hits.length ? [Math.min(...hits), Math.max(...hits)] : [cx - 50, cx + 50];
  };
  const upper = y => points.filter(p => p.y <= y).sort((a, b) => a.x - b.x);
  const line = ps => ps.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ');
  const ink = 'var(--robot-accessory-color)';
  const y = 124, [left, right] = edges(y);
  const [hatLeft, hatRight] = edges(top + 24);
  const half = 28 * settings.eyeSize / 100;
  const lx = 86 - settings.spacing, rx = 154 + settings.spacing;
  const glasses = shaded => `<g fill="${shaded ? ink : 'none'}" stroke="${ink}" stroke-width="4"><rect x="${lx-half}" y="${y-25}" width="${half*2}" height="48" rx="${shaded ? 9 : 13}"/><rect x="${rx-half}" y="${y-25}" width="${half*2}" height="48" rx="${shaded ? 9 : 13}"/><path d="M${lx+half} ${y-8} Q120 ${y-18} ${rx-half} ${y-8} M${left} ${y-17} L${lx-half} ${y-12} M${rx+half} ${y-12} L${right} ${y-17}"/>${shaded ? `<path d="M${lx-half+8} ${y-14} l12 -5 M${rx-half+8} ${y-14} l12 -5" stroke="white" stroke-opacity=".4" stroke-width="3"/>` : ''}</g>`;

  const kind = settings.accessory;
  const stroke = content => `<g fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${content}</g>`;
  const filled = content => `<g fill="${ink}">${content}</g>`;
  const heart = (x, y, size) => `<path d="M${x} ${y+size} C${x-size*2} ${y-size/2} ${x-size/2} ${y-size*1.6} ${x} ${y-size/2} C${x+size/2} ${y-size*1.6} ${x+size*2} ${y-size/2} ${x} ${y+size} Z"/>`;
  const bridge = `<path d="M${lx+half} ${y-4} Q${cx} ${y-14} ${rx-half} ${y-4} M${left} ${y-8} L${lx-half} ${y-8} M${rx+half} ${y-8} L${right} ${y-8}"/>`;
  const lenses = draw => stroke(draw(lx) + draw(rx) + bridge);
  if (kind === 'round-glasses') return lenses(x => `<circle cx="${x}" cy="${y}" r="${half}"/>`);
  if (kind === 'square-glasses') return lenses(x => `<rect x="${x-half}" y="${y-22}" width="${half*2}" height="44" rx="2"/>`);
  if (kind === 'cat-eye') return lenses(x => `<path d="M${x-half-5} ${y-23} Q${x} ${y-9} ${x+half+5} ${y-23} L${x+half} ${y+13} Q${x} ${y+29} ${x-half} ${y+13} Z"/>`);
  if (kind === 'aviators') return lenses(x => `<path d="M${x-half} ${y-21} Q${x} ${y-31} ${x+half} ${y-21} L${x+half-4} ${y+13} Q${x+6} ${y+34} ${x-half+2} ${y+16} Z"/>`);
  if (kind === 'heart-glasses') return stroke(heart(lx,y,half*.9) + heart(rx,y,half*.9) + bridge);
  if (kind === 'star-glasses') return lenses(x => `<polygon points="${star(x,y,half+5)}"/>`);
  if (kind === 'monocle') return stroke(`<circle cx="${rx}" cy="${y}" r="${half}"/><path d="M${rx+half} ${y} Q${right+3} ${y+25} ${right-12} ${y+62}"/>`);
  if (kind === 'goggles') return stroke(`<path d="M${left} ${y-5} H${right}"/><rect x="${lx-half-5}" y="${y-27}" width="${half*2+10}" height="54" rx="17"/><rect x="${rx-half-5}" y="${y-27}" width="${half*2+10}" height="54" rx="17"/><path d="M${lx-half+5} ${y-15} l10 -5 M${rx-half+5} ${y-15} l10 -5"/>`);
  if (kind === 'visor') return filled(`<rect x="${left+10}" y="${y-28}" width="${right-left-20}" height="50" rx="18" opacity=".8"/><path d="M${left+25} ${y-17} H${right-25}" stroke="white" stroke-opacity=".5" stroke-width="3"/>`);
  if (kind === 'eye-patch') return stroke(`<path d="M${left} ${y-29} L${right} ${y+29}"/>`) + filled(`<path d="M${rx-half} ${y-20} H${rx+half} V${y+7} Q${rx} ${y+42} ${rx-half} ${y+7} Z"/>`);
  const hats = {
    'top-hat': '<path d="M-39 8 V-40 H39 V8 Z M-60 7 H60 V16 H-60 Z"/><path d="M-39 -3 H39" stroke="white" stroke-width="6" stroke-opacity=".35"/>',
    fedora: '<path d="M-60 9 Q-46 19 0 17 Q46 19 60 9 L36 3 L29 -31 Q12 -38 0 -27 Q-12 -38 -29 -31 L-36 3 Z"/>',
    cowboy: '<path d="M-72 -3 Q-49 28 -31 3 L-24 -31 Q-8 -18 0 -30 Q8 -18 24 -31 L31 3 Q49 28 72 -3 Q62 31 0 21 Q-62 31 -72 -3"/>',
    cap: '<path d="M-47 7 Q-47 -38 0 -38 Q42 -35 44 7 Z M0 6 H77 Q55 27 0 16 Z"/><path d="M0 -33 V5" stroke="white" stroke-opacity=".3" stroke-width="3"/>',
    beret: '<path d="M-52 8 Q-73 -30 -10 -35 Q58 -40 55 -2 Q31 15 -52 8 Z"/><rect x="-5" y="-44" width="7" height="14" rx="3"/>',
    bucket: '<path d="M-36 -33 H36 L43 1 L58 18 H-58 L-43 1 Z"/><path d="M-40 -2 H40" stroke="white" stroke-opacity=".4" stroke-width="4"/>',
    wizard: `<path d="M-43 7 L8 -59 L36 7 L63 16 H-63 Z"/><polygon points="${star(4,-23,10)}" fill="white" opacity=".55"/>`,
    santa: '<path d="M-48 6 Q-28 -56 13 -44 Q36 -40 46 -20 L34 -17 Q11 -26 10 -12 L37 7 Z"/><rect x="-49" y="2" width="90" height="12" rx="6"/><circle cx="44" cy="-19" r="10"/>',
    chef: '<path d="M-36 14 V-8 Q-70 -9 -56 -32 Q-44 -48 -25 -36 Q-20 -59 0 -56 Q20 -59 25 -36 Q44 -48 56 -32 Q70 -9 36 -8 V14 Z"/><path d="M-30 2 H30" stroke="white" stroke-width="3" stroke-opacity=".4"/>',
    graduation: '<path d="M-65 -12 L0 -36 L65 -12 L0 10 Z M-32 -2 V17 Q0 32 32 17 V-2 Z"/><path d="M62 -10 V28" fill="none" stroke="var(--robot-accessory-color)" stroke-width="4"/><circle cx="62" cy="30" r="5"/>',
    pirate: '<path d="M-64 14 Q-49 -20 -32 -17 Q0 -66 32 -17 Q49 -20 64 14 Z"/><circle cx="0" cy="-15" r="9" fill="white" opacity=".6"/><path d="M-12 1 L12 -4 M-12 -4 L12 1" stroke="white" stroke-width="3" opacity=".6"/>',
  };
  if (hats[kind]) return `<g transform="translate(${cx} ${top+8}) scale(${(hatRight-hatLeft)/125} 1)" fill="${ink}">${hats[kind]}</g>`;
  const [earLeft, earRight] = edges(top+30);
  const ear = (x, flip, content) => `<g transform="translate(${x} ${top+20}) scale(${flip} 1)" fill="${ink}">${content}</g>`;
  const ears = {
    'cat-ears': '<path d="M-9 19 L-13 -34 L29 2 Z"/><path d="M-3 6 L-5 -21 L16 1 Z" fill="white" opacity=".45"/>',
    'bunny-ears': '<ellipse cx="8" cy="-23" rx="13" ry="37" transform="rotate(-12 8 -23)"/>',
    'bear-ears': '<circle cx="2" cy="-9" r="24"/><circle cx="2" cy="-9" r="13" fill="white" opacity=".4"/>',
    'fox-ears': '<path d="M-15 19 L-6 -43 L34 9 Z"/><path d="M-3 10 L0 -28 L20 6 Z" fill="white" opacity=".5"/>',
    horns: '<path d="M-12 11 Q-3 -7 -13 -42 Q21 -28 21 14 Z"/>',
    antlers: '<path d="M4 15 V-42 M4 -23 L-15 -33 V-48 M4 -33 L24 -42 V-54 M-15 -33 L-27 -28" fill="none" stroke="var(--robot-accessory-color)" stroke-width="6" stroke-linecap="round"/>',
    'alien-antennae': '<path d="M6 9 Q16 -16 -4 -39" fill="none" stroke="var(--robot-accessory-color)" stroke-width="5"/><circle cx="-4" cy="-39" r="10"/>',
  };
  if (ears[kind]) return ear(earLeft+12,1,ears[kind]) + ear(earRight-12,-1,ears[kind]);
  const neckY = bottom-14, [neckLeft, neckRight] = edges(neckY);
  const neck = `<path d="M${neckLeft} ${neckY} Q${cx} ${bottom+9} ${neckRight} ${neckY}" fill="none" stroke="${ink}" stroke-width="7"/>`;
  if (kind === 'scarf') return neck + filled(`<path d="M${cx+12} ${bottom-4} l18 4 -5 32 -19 -5 Z"/>`);
  if (kind === 'tie') return filled(`<path d="M${cx-9} ${bottom-16} H${cx+9} L${cx+5} ${bottom-5} L${cx+13} ${bottom+24} L${cx} ${bottom+33} L${cx-13} ${bottom+24} L${cx-5} ${bottom-5} Z"/>`);
  if (kind === 'necklace') return stroke(`<path d="M${neckLeft} ${neckY-2} Q${cx} ${bottom+16} ${neckRight} ${neckY-2}"/>`) + filled(`<path d="M${cx} ${bottom} l9 8 -9 10 -9 -10 Z"/>`);
  if (kind === 'medal') return filled(`<path d="M${cx-22} ${bottom-24} l18 30 h8 l18 -30 h-13 l-9 22 -9 -22 Z"/><circle cx="${cx}" cy="${bottom+9}" r="15"/><polygon points="${star(cx,bottom+9,9)}" fill="white" opacity=".6"/>`);
  if (kind === 'choker') return neck + filled(`<circle cx="${cx}" cy="${bottom-1}" r="8"/>`);
  if (kind === 'bandana') return filled(`<path d="M${neckLeft} ${neckY} Q${cx} ${bottom+6} ${neckRight} ${neckY} L${cx} ${bottom+29} Z"/>`);
  const px = hatRight-6, py = top+24;
  const pins = {
    'star-pin': `<polygon points="${star(0,0,20)}"/>`, 'heart-pin': heart(0,0,16),
    'lightning-pin': '<path d="M3 -25 L-17 4 H-3 L-8 26 L18 -4 H3 Z"/>',
    'leaf-pin': '<path d="M-17 19 Q-25 -16 20 -22 Q25 19 -17 19"/><path d="M-13 13 L13 -15" stroke="white" stroke-width="2" opacity=".5"/>',
    'snowflake-pin': '<path d="M0 -23 V23 M-20 -12 L20 12 M-20 12 L20 -12 M-6 -17 L0 -11 L6 -17 M-6 17 L0 11 L6 17" fill="none" stroke="var(--robot-accessory-color)" stroke-width="4" stroke-linecap="round"/>',
    'butterfly-pin': '<path d="M0 0 Q-36 -36 -23 -4 Q-35 27 -4 10 L0 2 L4 10 Q35 27 23 -4 Q36 -36 0 0"/><path d="M0 -6 V13" stroke="white" stroke-width="3" opacity=".5"/>',
  };
  if (pins[kind]) return `<g transform="translate(${px} ${py})" fill="${ink}">${pins[kind]}</g>`;
  switch (settings.accessory) {
    case 'glasses': return glasses(false);
    case 'sunglasses': return glasses(true);
    case 'headphones': return `<g fill="${ink}"><path d="M${left-2} ${y} L${line(upper(y).map(p => ({ x: p.x + (p.x < cx ? -4 : 4), y: p.y - 6 })))} L${right+2} ${y}" fill="none" stroke="${ink}" stroke-width="8"/><rect x="${left-13}" y="${y-26}" width="20" height="54" rx="9"/><rect x="${right-7}" y="${y-26}" width="20" height="54" rx="9"/></g>`;
    case 'bow': return `<path d="M${cx-2} ${bottom-7} l-27 -17 q-7 -3 -7 6 v25 q0 9 7 6 l27 -17 m4 -3 l27 -17 q7 -3 7 6 v25 q0 9 -7 6 l-27 -17" fill="${ink}"/><circle cx="${cx}" cy="${bottom-7}" r="5" fill="${ink}"/>`;
    case 'crown': return `<path d="M${hatLeft} ${top+24} L${hatLeft-4} ${top-21} L${cx-24} ${top-5} L${cx} ${top-34} L${cx+24} ${top-5} L${hatRight+4} ${top-21} L${hatRight} ${top+24} L${line(upper(top+24).reverse())} Z" fill="${ink}"/><circle cx="${cx}" cy="${top-11}" r="4" fill="white" opacity=".55"/>`;
    case 'party': return `<path d="M${cx-43} ${top+9} L${cx+4} ${top-55} L${cx+43} ${top+9} Q${cx} ${top-1} ${cx-43} ${top+9}" fill="${ink}"/><path d="M${cx-26} ${top-15} l45 13 M${cx-11} ${top-37} l21 6" stroke="white" stroke-opacity=".5" stroke-width="6"/><circle cx="${cx+4}" cy="${top-56}" r="6" fill="${ink}"/>`;
    case 'halo': return `<ellipse cx="${cx}" cy="${top-14}" rx="${(hatRight-hatLeft)/2}" ry="10" fill="none" stroke="${ink}" stroke-width="7"/>`;
    case 'beanie': return `<path d="M${hatLeft} ${top+23} Q${cx-65} ${top-35} ${cx} ${top-30} Q${cx+65} ${top-35} ${hatRight} ${top+23} L${line(upper(top+23).reverse())} Z" fill="${ink}"/><path d="M${line(upper(top+23))}" fill="none" stroke="${ink}" stroke-width="12"/><circle cx="${cx}" cy="${top-33}" r="12" fill="${ink}"/>`;
    case 'moustache': return `<path d="M${cx} 168 Q${cx-12} 150 ${cx-23} 165 Q${cx-38} 180 ${cx-43} 166 Q${cx-43} 192 ${cx-15} 184 Q${cx-4} 181 ${cx} 173 Q${cx+4} 181 ${cx+15} 184 Q${cx+43} 192 ${cx+43} 166 Q${cx+38} 180 ${cx+23} 165 Q${cx+12} 150 ${cx} 168" fill="${ink}"/>`;
    case 'flower': { const x = hatRight - 7, fy = top + 20; return `<g fill="${ink}">${Array.from({length:5}, (_,i) => `<ellipse cx="${x}" cy="${fy-13}" rx="8" ry="13" transform="rotate(${i*72} ${x} ${fy})"/>`).join('')}<circle cx="${x}" cy="${fy}" r="7" fill="white" opacity=".65"/></g>`; }
    default: return '';
  }
}

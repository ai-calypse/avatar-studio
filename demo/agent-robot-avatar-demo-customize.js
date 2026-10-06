import { ACCESSORY_OPTIONS, ACCESSORY_GROUPS } from './avatar-studio-accessories.js';
import { customizeAvatar, exportAvatarSVG } from '../agent-robot-avatar.js';
const face = document.getElementById('face');
const defaults = { body: '#08090b', eyes: '#ffffff', accessoryColor: '#ffffff', matchEyes: false, eyeSize: 100, spacing: 0, accessory: 'none', bodyShape: 'classic', shapeSeed: 0 };
let settings = { ...defaults };
try { settings = { ...defaults, ...JSON.parse(localStorage.getItem('robot-personalization') || '{}') }; } catch (_) {}
const panel = document.createElement('section');
panel.className = 'robot-customizer';
panel.setAttribute('aria-label', 'Customize your robot');
panel.innerHTML = `
  <div class="robot-customizer-heading">Make it yours <span>Robot customization</span></div>
  <div class="robot-customizer-fields">
    <label>Body <input type="color" data-setting="body" aria-label="Robot body color"></label>
    <label>Eyes <input type="color" data-setting="eyes" aria-label="Robot eye color"></label>
    <label>Accessory color <input type="color" data-setting="accessoryColor" aria-label="Robot accessory color"></label>
    <div class="body-shape-row"><label>Body shape <select data-setting="bodyShape" aria-label="Robot body shape"><option value="classic">Square → circle</option><option value="random">Fluid / random</option></select></label><button type="button" id="robot-shape-shuffle" aria-label="Shuffle body shape" title="New random shape">Shuffle</button></div>
    <label>Eye size <input type="range" min="60" max="125" data-setting="eyeSize" aria-label="Robot eye size"></label>
    <label>Eye spacing <input type="range" min="-12" max="12" data-setting="spacing" aria-label="Robot eye spacing"></label>
    <label>Accessory <select data-setting="accessory" aria-label="Robot accessory"><option value="none">None</option>${Object.entries(ACCESSORY_GROUPS).map(([group, values]) => `<optgroup label="${group}">${values.map(value => `<option value="${value}">${ACCESSORY_OPTIONS[value][0]}</option>`).join('')}</optgroup>`).join('')}</select></label>
    <label class="match-eyes-toggle"><input type="checkbox" data-setting="matchEyes" aria-label="Match accessory color to eyes">Match eyes</label>
    <button type="button" id="robot-custom-reset">Reset look</button>
    <button type="button" id="robot-custom-export">Download SVG</button>
  </div>`;
document.querySelector('.demo-control-stack').appendChild(panel);
function apply() {
  settings = Object.fromEntries(Object.keys(defaults).map(key => [key, settings[key] ?? defaults[key]]));
  if (!/^#[0-9a-f]{6}$/i.test(settings.body)) settings.body = defaults.body;
  if (!/^#[0-9a-f]{6}$/i.test(settings.eyes)) settings.eyes = defaults.eyes;
  if (!/^#[0-9a-f]{6}$/i.test(settings.accessoryColor)) settings.accessoryColor = defaults.accessoryColor;
  settings.eyeSize = Math.max(60, Math.min(125, Number(settings.eyeSize) || 100));
  settings.spacing = Math.max(-12, Math.min(12, Number(settings.spacing) || 0));
  settings.matchEyes = settings.matchEyes === true;
  if (!Object.hasOwn(ACCESSORY_OPTIONS, settings.accessory)) settings.accessory = 'none';
  if (!['classic', 'random'].includes(settings.bodyShape)) settings.bodyShape = 'classic';
  if (!Number.isInteger(settings.shapeSeed) || settings.shapeSeed < 0 || settings.shapeSeed > 0xffffffff) settings.shapeSeed = 0;
  customizeAvatar(face, settings);
  panel.querySelector('#robot-shape-shuffle').disabled = settings.bodyShape !== 'random';
  panel.querySelector('[data-setting="accessoryColor"]').disabled = Boolean(settings.matchEyes);
  try { localStorage.setItem('robot-personalization', JSON.stringify(settings)); } catch (_) {}
}
function syncFields() {
  panel.querySelectorAll('[data-setting]').forEach(input => { if (input.type === 'checkbox') input.checked = Boolean(settings[input.dataset.setting]); else input.value = settings[input.dataset.setting]; });
}
panel.addEventListener('input', event => {
  const key = event.target.dataset.setting;
  if (!key) return;
  settings[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.type === 'range' ? Number(event.target.value) : event.target.value;
  if (key === 'bodyShape' && settings.bodyShape === 'random') settings.shapeSeed = crypto.getRandomValues(new Uint32Array(1))[0];
  apply();
});
panel.querySelector('#robot-shape-shuffle').addEventListener('click', () => {
  settings.shapeSeed = crypto.getRandomValues(new Uint32Array(1))[0];
  apply();
});
panel.querySelector('#robot-custom-reset').addEventListener('click', () => {
  settings = { ...defaults };
  syncFields();
  apply();
});
export function avatarSVG() {
  return exportAvatarSVG(face);
}
export function saveDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
panel.querySelector('#robot-custom-export').addEventListener('click', () => {
  saveDownload(new Blob([avatarSVG()], { type: 'image/svg+xml' }), 'my-robot-avatar.svg');
});

const style = document.createElement('style');
style.textContent = `
.robot-customizer{width:min(640px,calc(100vw - 24px));padding:14px;background:rgba(255,255,255,.94);border:1px solid #e3e5e7;border-radius:16px;box-shadow:0 6px 24px #00000005}
.robot-customizer-heading{display:flex;justify-content:space-between;font-size:12px;font-weight:650;margin-bottom:12px;color:#383c42}.robot-customizer-heading span{font-size:10px;font-weight:400;color:#8a8f98}
.robot-customizer-fields{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px}.robot-customizer label{display:flex;align-items:center;gap:6px;font-size:11px;color:#747980}.robot-customizer input[type=color]{width:28px;height:28px;padding:2px;border:1px solid #ddd;border-radius:7px;background:#fff;cursor:pointer}.robot-customizer input[type=range]{width:76px;accent-color:#666b72}.robot-customizer select{font:inherit;padding:6px;border:1px solid #ddd;border-radius:7px;background:#fff;color:#555}.robot-customizer button{font-size:11px}
@media(max-width:600px){.canvas{min-height:max(100vh,960px)!important}.robot-customizer{padding:11px}.robot-customizer-fields{gap:9px}.robot-customizer-heading span{display:none}}
`;
document.head.appendChild(style);
syncFields();
apply();

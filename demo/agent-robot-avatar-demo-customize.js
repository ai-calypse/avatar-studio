import { ACCESSORY_OPTIONS, ACCESSORY_GROUPS, HEADWEAR, accessoryMarkup } from './avatar-studio-accessories.js';
const face = document.getElementById('face');
const defaults = { body: '#08090b', eyes: '#ffffff', accessoryColor: '#ffffff', matchEyes: false, eyeSize: 100, spacing: 0, accessory: 'none' };
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
    <label>Eye size <input type="range" min="60" max="125" data-setting="eyeSize" aria-label="Robot eye size"></label>
    <label>Eye spacing <input type="range" min="-12" max="12" data-setting="spacing" aria-label="Robot eye spacing"></label>
    <label>Accessory <select data-setting="accessory" aria-label="Robot accessory"><option value="none">None</option>${Object.entries(ACCESSORY_GROUPS).map(([group, values]) => `<optgroup label="${group}">${values.map(value => `<option value="${value}">${ACCESSORY_OPTIONS[value][0]}</option>`).join('')}</optgroup>`).join('')}</select></label>
    <label class="match-eyes-toggle"><input type="checkbox" data-setting="matchEyes" aria-label="Match accessory color to eyes">Match eyes</label>
    <button type="button" id="robot-custom-reset">Reset look</button>
    <button type="button" id="robot-custom-export">Download SVG</button>
  </div>`;
document.querySelector('.demo-control-stack').appendChild(panel);
const namespace = 'http://www.w3.org/2000/svg';
const wrappers = ['leftEye', 'rightEye'].map(id => {
  const eye = face.shadowRoot.getElementById(id);
  const wrapper = document.createElementNS(namespace, 'g');
  eye.parentNode.insertBefore(wrapper, eye);
  wrapper.appendChild(eye);
  return wrapper;
});
const accessory = document.createElementNS(namespace, 'g');
accessory.id = 'personal-accessory';
face._headMotion.appendChild(accessory);
const eyeStyle = document.createElement('style');
eyeStyle.textContent = '#leftBase,#rightBase,#leftInputBase,#rightInputBase{fill:var(--robot-eye-color,#fff)!important}';
face.shadowRoot.appendChild(eyeStyle);
const accessoryStyle = document.createElement('style');
face.shadowRoot.appendChild(accessoryStyle);
face.shadowRoot.querySelector('svg').setAttribute('viewBox', '-16 -48 272 320');
function renderAccessory() {
  accessory.innerHTML = accessoryMarkup(face, settings);
  accessoryStyle.textContent = HEADWEAR.has(settings.accessory) ? '#antennaDot{display:none!important}' : '';
}
new MutationObserver(renderAccessory).observe(face._headShape, { attributes: true, attributeFilter: ['d'] });
function apply() {
  if (!/^#[0-9a-f]{6}$/i.test(settings.body)) settings.body = defaults.body;
  if (!/^#[0-9a-f]{6}$/i.test(settings.eyes)) settings.eyes = defaults.eyes;
  if (!/^#[0-9a-f]{6}$/i.test(settings.accessoryColor)) settings.accessoryColor = defaults.accessoryColor;
  settings.eyeSize = Math.max(60, Math.min(125, Number(settings.eyeSize) || 100));
  settings.spacing = Math.max(-12, Math.min(12, Number(settings.spacing) || 0));
  settings.matchEyes = settings.matchEyes === true;
  if (!(settings.accessory in ACCESSORY_OPTIONS)) settings.accessory = 'none';
  face.setAttribute('color', settings.body);
  face.style.setProperty('--robot-eye-color', settings.eyes);
  face.style.setProperty('--robot-accessory-color', settings.matchEyes ? settings.eyes : settings.accessoryColor);
  wrappers.forEach((wrapper, index) => {
    const x = index ? 154 : 86;
    const spacing = settings.spacing * (index ? 1 : -1);
    wrapper.setAttribute('transform', `translate(${spacing} 0) translate(${x} 126) scale(${settings.eyeSize / 100}) translate(${-x} -126)`);
  });
  renderAccessory();
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
  apply();
});
panel.querySelector('#robot-custom-reset').addEventListener('click', () => {
  settings = { ...defaults };
  syncFields();
  apply();
});
export function avatarSVG() {
  const svg = face.shadowRoot.querySelector('svg').cloneNode(true);
  svg.setAttribute('xmlns', namespace);
  svg.setAttribute('width', '256');
  svg.setAttribute('height', '256');
  svg.style.setProperty('--robot-eye-color', settings.eyes);
  svg.style.setProperty('--robot-accessory-color', settings.matchEyes ? settings.eyes : settings.accessoryColor);
  svg.setAttribute('viewBox', '-16 -48 272 320');
  const exportedStyle = document.createElementNS(namespace, 'style');
  exportedStyle.textContent = eyeStyle.textContent + accessoryStyle.textContent;
  svg.prepend(exportedStyle);
  return new XMLSerializer().serializeToString(svg);
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

import { ACCESSORY_OPTIONS, ACCESSORY_GROUPS, HEADWEAR, accessoryMarkup } from './avatar-studio-accessories.js';

const namespace = 'http://www.w3.org/2000/svg';
const instances = new WeakMap();
const defaults = Object.freeze({ body: '#08090b', eyes: '#ffffff', accessoryColor: '#ffffff', matchEyes: false, eyeSize: 100, spacing: 0, accessory: 'none' });
const ranges = { eyeSize: [60, 125], spacing: [-12, 12], headRoundness: [0, 100] };

function validate(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('Appearance must be an object.');
  for (const [key, value] of Object.entries(patch)) {
    if (!Object.hasOwn(defaults, key) && key !== 'headRoundness') throw new TypeError(`Unknown appearance field: ${key}`);
    if (['body', 'eyes', 'accessoryColor'].includes(key) && (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value))) throw new TypeError(`${key} must be a six-digit hex color.`);
    if (key === 'accessory' && !Object.hasOwn(ACCESSORY_OPTIONS, value)) throw new TypeError('Unknown accessory.');
    if (key === 'matchEyes' && typeof value !== 'boolean') throw new TypeError('matchEyes must be a boolean.');
    if (Object.hasOwn(ranges, key) && (typeof value !== 'number' || !Number.isFinite(value) || value < ranges[key][0] || value > ranges[key][1])) throw new RangeError(`${key} is outside its supported range.`);
  }
}

function initialize(avatar) {
  if (!avatar?.isConnected || !avatar?.shadowRoot || !avatar._headMotion || !avatar._headShape || typeof avatar.setHeadRoundness !== 'function') throw new TypeError('Use a connected AgentRobotAvatar from the package entrypoint.');
  const wrappers = ['leftEye', 'rightEye'].map(id => {
    const eye = avatar.shadowRoot.getElementById(id);
    const wrapper = document.createElementNS(namespace, 'g');
    eye.parentNode.insertBefore(wrapper, eye);
    wrapper.appendChild(eye);
    return wrapper;
  });
  const accessory = document.createElementNS(namespace, 'g');
  accessory.id = 'personal-accessory';
  avatar._headMotion.appendChild(accessory);
  const style = document.createElement('style');
  avatar.shadowRoot.appendChild(style);
  avatar.shadowRoot.querySelector('svg').setAttribute('viewBox', '-16 -48 272 320');
  const state = { wrappers, accessory, style, config: { ...defaults, body: avatar.getAttribute('color') || defaults.body, headRoundness: avatar.getHeadRoundness() } };
  state.render = () => {
    state.accessory.innerHTML = accessoryMarkup(avatar, state.config);
    state.style.textContent = '#leftBase,#rightBase,#leftInputBase,#rightInputBase{fill:var(--robot-eye-color,#fff)!important}' + (HEADWEAR.has(state.config.accessory) ? '#antennaDot{display:none!important}' : '');
  };
  state.observer = new MutationObserver(state.render);
  state.observer.observe(avatar._headShape, { attributes: true, attributeFilter: ['d'] });
  instances.set(avatar, state);
  return state;
}

/** Apply a validated partial appearance; values are retained per element, never persisted globally. */
export function customizeAvatar(avatar, appearance = {}) {
  validate(appearance);
  const state = instances.get(avatar) || initialize(avatar);
  state.config = { ...state.config, ...appearance };
  const config = state.config;
  avatar.setAttribute('color', config.body);
  avatar.style.setProperty('--robot-eye-color', config.eyes);
  avatar.style.setProperty('--robot-accessory-color', config.matchEyes ? config.eyes : config.accessoryColor);
  if (Object.hasOwn(appearance, 'headRoundness')) avatar.setHeadRoundness(config.headRoundness);
  state.wrappers.forEach((wrapper, index) => {
    const x = index ? 154 : 86;
    const spacing = config.spacing * (index ? 1 : -1);
    wrapper.setAttribute('transform', `translate(${spacing} 0) translate(${x} 126) scale(${config.eyeSize / 100}) translate(${-x} -126)`);
  });
  state.render();
  return Object.freeze({ ...config, headRoundness: avatar.getHeadRoundness() });
}

/** Capture the current animated pose as a standalone, transparent SVG string. */
export function exportAvatarSVG(avatar, size = 256) {
  if (!Number.isInteger(size) || size < 32 || size > 512) throw new RangeError('SVG size must be an integer from 32 to 512.');
  const state = instances.get(avatar);
  if (!state) customizeAvatar(avatar);
  const current = instances.get(avatar);
  const svg = avatar.shadowRoot.querySelector('svg').cloneNode(true);
  svg.setAttribute('xmlns', namespace);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.style.setProperty('--robot-eye-color', current.config.eyes);
  svg.style.setProperty('--robot-accessory-color', current.config.matchEyes ? current.config.eyes : current.config.accessoryColor);
  const style = document.createElementNS(namespace, 'style');
  style.textContent = current.style.textContent;
  svg.prepend(style);
  return new XMLSerializer().serializeToString(svg);
}

export const accessories = Object.freeze(Object.entries(ACCESSORY_GROUPS).flatMap(([category, ids]) => ids.map(id => Object.freeze({ id, name: ACCESSORY_OPTIONS[id][0], category }))));

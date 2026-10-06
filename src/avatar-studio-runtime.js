import { customizeAvatar } from './avatar-studio-customization.js';
import { avatarActions, behaviorDefaults, validateBehavior } from './avatar-studio-controls.js';
const instances = new WeakMap();

/** Apply appearance, movement policies, and an optional repeating action. */
export function configureAvatar(avatar, settings = {}) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings) || Object.keys(settings).some(key => !['appearance','behavior','action'].includes(key))) throw new TypeError('Unknown avatar configuration.');
  const behavior = validateBehavior(settings.behavior ?? {});
  if (settings.action !== undefined && !avatarActions.includes(settings.action)) throw new TypeError('Unknown avatar action.');
  const appearance = customizeAvatar(avatar, settings.appearance ?? {});
  const previous = instances.get(avatar);
  if (previous) { clearTimeout(previous.timer); avatar.removeEventListener('action-state',previous.listener); }
  else {
    const reset = avatar.reset;
    avatar.reset = function(...args) {
      const state = instances.get(this);
      if (state && !state.initiating) { clearTimeout(state.timer); state.behavior.loop = false; }
      return reset.apply(this,args);
    };
  }
  const state = { behavior: { ...behaviorDefaults, ...previous?.behavior, ...behavior }, action: settings.action ?? previous?.action ?? 'idle', timer: null, pending: previous?.pending ?? null, initiating: true };
  const invoke = callback => {
    state.initiating = true;
    try { return callback(); } finally { state.initiating = false; }
  };
  const current = () => avatar.isConnected && instances.get(avatar) === state;
  const play = async () => {
    if (!current()) return;
    state.timer = null;
    const continuous = state.behavior.loop && ['waiting','wait','waiting-wrap'].includes(state.action);
    if (state.behavior.loop && state.action === 'wake' && !avatar._sleeping) {
      await Promise.resolve(invoke(()=>avatar.play('sleep')));
      if (!current() || !state.behavior.loop) return;
    }
    if (state.behavior.loop && ['input','sleep'].includes(state.action)) invoke(()=>avatar.reset());
    state.pending = Promise.resolve(invoke(()=>continuous ? avatar.startWaiting({variant:state.action === 'waiting-wrap' ? 'wrap' : 'default'}) : avatar.play(state.action)));
    await state.pending;
    state.pending = null;
    if (!current() || !state.behavior.loop || continuous) return;
    state.timer = setTimeout(()=>void play(),900);
  };
  state.listener = event => {
    if (event.detail.source === 'api' && ['start','cancel'].includes(event.detail.phase) && !state.initiating) {
      clearTimeout(state.timer); state.behavior.loop = false;
    }
  };
  instances.set(avatar,state);
  avatar.addEventListener('action-state',state.listener);
  avatar.setPointerFollow(state.behavior.pointerFollow);
  avatar.setAntennaFlash(state.behavior.antennaFlash);
  avatar.setPressSqueeze(state.behavior.pressSqueeze);
  avatar.setAntennaDrag(state.behavior.antennaDrag);
  avatar.setAttribute('motion',state.behavior.motion);
  avatar.setAttribute('wake-on',state.behavior.wakeOn);
  avatar.setAttribute('auto-sleep',String(state.behavior.autoSleep));
  if (!state.behavior.loop && previous?.behavior.loop && ['waiting','wait','waiting-wrap'].includes(previous.action)) invoke(()=>avatar.stopWaiting());
  queueMicrotask(()=>{
    if (settings.action !== undefined || (!previous?.behavior.loop && state.behavior.loop)) void play();
    else if (state.behavior.loop && previous?.timer) state.timer = setTimeout(()=>void play(),900);
    else if (state.behavior.loop && state.pending && !['waiting','wait','waiting-wrap'].includes(state.action)) {
      void state.pending.then(()=>{
        state.pending = null;
        if (current() && state.behavior.loop) state.timer = setTimeout(()=>void play(),900);
      });
    }
    state.initiating = false;
  });
  return Object.freeze({ appearance, behavior: Object.freeze({...state.behavior}), action: state.action });
}

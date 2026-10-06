export const avatarActions = Object.freeze(['idle','bored','waiting','wait','waiting-wrap','input','send','success','failure','failed','fail','warning','inspect','verify','review','angry','blocked','policy-blocked','error','system-error','connection-error','surprise','love','random','slot','sleep','wake']);
export const behaviorDefaults = Object.freeze({ antennaFlash: false, pointerFollow: true, loop: false, pressSqueeze: true, antennaDrag: true, motion: 'auto', wakeOn: 'activity', autoSleep: 0 });
export function validateBehavior(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Behavior must be an object.');
  for (const [key, item] of Object.entries(value)) {
    if (!Object.hasOwn(behaviorDefaults,key)) throw new TypeError('Unknown behavior field.');
    if (['motion','wakeOn'].includes(key)) {
      const values = key === 'motion' ? ['auto','reduce','full'] : ['activity','interaction','manual'];
      if (!values.includes(item)) throw new TypeError('Invalid behavior mode.');
    } else if (key === 'autoSleep') {
      if (!Number.isInteger(item) || item < 0 || item > 86400000) throw new RangeError('Auto-sleep must be 0–86400000 milliseconds.');
    } else if (typeof item !== 'boolean') throw new TypeError('Behavior switches must be booleans.');
  }
  return value;
}

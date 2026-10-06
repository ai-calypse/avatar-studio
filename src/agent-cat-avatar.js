import AgentRobotAvatar from './agent-robot-avatar-extension-host.js';

// Reuse the robot's expressive eyes, gaze, and motion for its feline companion.
class AgentCatAvatar extends AgentRobotAvatar {
  connectedCallback() {
    super.connectedCallback();
    if (this.shadowRoot.getElementById('catEars')) return;
    const style = document.createElement('style');
    style.textContent = '#antennaDot{display:none!important}';
    this.shadowRoot.appendChild(style);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.id = 'catEars';
    svg.innerHTML = `
      <path data-cat-color d="M32 82 L29 12 Q29 4 37 9 L88 46 Z"/>
      <path data-cat-color d="M208 82 L211 12 Q211 4 203 9 L152 46 Z"/>
      <path d="M43 49 L41 26 L62 43 Z M197 49 L199 26 L178 43 Z" fill="#fff"/>`;
    this._headMotion.insertBefore(svg, this._head);
    const muzzle = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    muzzle.id = 'catMuzzle';
    muzzle.innerHTML = `
      <path d="M115 167 Q120 164 125 167 L120 173 Z" fill="#fff"/>
      <path d="M120 173 V176 Q113 184 107 177 M120 176 Q127 184 133 177" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <path data-cat-stroke d="M13 147 L43 153 M11 163 L42 163 M197 153 L227 147 M198 163 L229 163" fill="none" stroke-width="4" stroke-linecap="round"/>`;
    this._headMotion.appendChild(muzzle);
    this.shadowRoot.querySelector('svg').setAttribute('aria-label', 'Agent cat avatar');
    this._applyColor(this.getAttribute('color'));
  }

  _applyColor(value) {
    super._applyColor(value);
    const color = value || '#08090b';
    this.shadowRoot?.querySelectorAll('[data-cat-color]').forEach(part => part.setAttribute('fill', color));
    this.shadowRoot?.querySelectorAll('[data-cat-stroke]').forEach(part => part.setAttribute('stroke', color));
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('agent-cat-avatar')) {
  customElements.define('agent-cat-avatar', AgentCatAvatar);
}
if (typeof window !== 'undefined') window.AgentCatAvatar = AgentCatAvatar;

export { AgentCatAvatar };

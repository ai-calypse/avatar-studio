import { avatarSVG, saveDownload } from './agent-robot-avatar-demo-customize.js';
import { exportAvatar, customizeAvatar } from '../agent-robot-avatar.js';
import { translateStudio, translatePhrase } from './avatar-studio-i18n.js';
import { mountUseCases } from './avatar-studio-use-cases.js';

const canvas = document.getElementById('canvas');
const face = document.getElementById('face');
const home = document.getElementById('home');
const stack = document.querySelector('.demo-control-stack');
document.querySelector('.title')?.remove();
const buildBadge = document.querySelector('.build-badge');
if (buildBadge) buildBadge.hidden = true;
const shell = document.createElement('div');
shell.className = 'studio-shell';
shell.innerHTML = `
<header class="studio-nav"><a href="#" class="studio-brand"><span class="brand-mark" aria-hidden="true">a<span>·</span></span> avatar studio</a><nav aria-label="Main navigation"><a href="../docs/">Docs</a><a href="#create">Create</a><a href="#showcase">In use</a></nav></header>

<main id="create" class="studio-workspace"><section class="studio-preview" aria-label="Live avatar preview"><div class="preview-heading"><span><i></i> LIVE PREVIEW</span><span class="preview-tag">01 / ROBOT</span></div><div class="studio-stage"></div><div class="preview-caption"><strong>Hello, little you.</strong><span>Move your cursor. Watch it come to life.</span></div><div class="studio-formats"><span>Made for your corner of the internet</span><div><span>Profile</span><span>Portfolio</span><span>App</span></div></div></section><section class="studio-editor" aria-label="Avatar editor"><div class="editor-heading"><div><h2>Make it yours</h2><p>Choose your colors. Give it character.</p></div></div><div class="editor-scroll"><div class="studio-design"></div><details class="studio-expression"><summary>Try an expression <span class="details-arrow">⌄</span></summary><div class="studio-actions"></div></details><details class="studio-behavior"><summary>Movement settings <span class="details-arrow">⌄</span></summary><div class="studio-options"></div></details></div><div class="studio-export"><div><h3>Download your avatar</h3><p>Download your avatar. No account needed.</p></div><div class="download-row"><button type="button" id="studio-svg">SVG <span>↗</span></button><button type="button" id="studio-png">PNG <span>↗</span></button><button type="button" id="studio-gif">GIF <span>↗</span></button></div><p id="export-status" role="status">SVG & PNG are transparent. GIF has a light background.</p></div></section></main>
<section id="showcase" class="studio-showcase"><div class="showcase-heading"><div><span class="studio-eyebrow">YOUR AVATAR, OUT IN THE WORLD</span><h2>One face. A place everywhere.</h2></div><p>These previews use your current design.<br>Change a color and see it follow you.</p></div><div class="showcase-grid">
<article class="use-card use-chat"><div class="use-card-label">01 / TEAM CHAT</div><div class="mock-chat-top"><span class="mock-channel"># design-team</span><span class="mock-online">● 4 online</span></div><div class="mock-chat-message"><img data-avatar-showcase alt="Your avatar as a chat profile"/><div><strong>You <small>10:24 AM</small></strong><p>New look. Same me. ✨</p><span class="mock-reaction">🙌 3</span></div></div><div class="mock-chat-message"><div class="mock-initial">J</div><div><strong>Jamie <small>10:25 AM</small></strong><p>Okay, that’s very you.</p></div></div><div class="mock-composer">Message #design-team <span>↵</span></div><h3>A familiar face in every conversation.</h3></article>
<article class="use-card use-profile"><div class="use-card-label">02 / YOUR PROFILE</div><div class="mock-profile-cover"></div><img data-avatar-showcase class="mock-profile-avatar" alt="Your avatar on a profile card"/><div class="mock-profile-copy"><strong>Alex Morgan <span>●</span></strong><span>@alexmakes</span><p>Designer. Builder. Collector of little ideas.</p><div><span><b>24</b> projects</span><span><b>128</b> connections</span></div></div><h3>A tiny introduction that feels like you.</h3></article>
<article class="use-card use-assistant"><div class="use-card-label">03 / APP COMPANION</div><div class="mock-app-top"><span>✦ Workspace</span><span>•••</span></div><div class="mock-assistant"><img data-avatar-showcase alt="Your avatar as an app assistant"/><span class="mock-assistant-status">READY TO HELP</span><strong>Good morning, Alex.</strong><p>Three tasks. One fresh start.<br>Let’s make something good.</p><span class="mock-app-button">View today’s tasks <span>↗</span></span></div><h3>Give your product a little personality.</h3></article>
<article class="use-card use-project"><div class="use-card-label">04 / PROJECT IDENTITY</div><div class="mock-project-top"><img data-avatar-showcase alt="Your avatar as a project logo"/><div><strong>Little Lab</strong><span>Your next big idea starts small.</span></div></div><div class="mock-project-chips"><span>Design system</span><span>In progress</span></div><div class="mock-task"><span>✓</span> Find the spark <small>Done</small></div><div class="mock-task"><span>◯</span> Build the first version <small>Today</small></div><div class="mock-task"><span>◯</span> Share it with the world <small>Next</small></div><h3>A mark for the things you’re making.</h3></article>
</div></section>
<section id="developers" class="studio-developers"><div><span class="studio-eyebrow">LITTLE FACES. BIG POSSIBILITIES.</span><h2>A companion for<br>what you’re building.</h2><p>Use your avatar in a profile, a product, or an application. Export a file today, or embed the animated component in your app.</p></div><div class="developer-card"><div class="developer-top"><span>BUILT TO GO PLACES</span><span class="roadmap-pill">Local MCP available</span></div><h3>Avatars, made by your agents.</h3><p>Connect the local MCP server to let your agent generate SVG, PNG, or GIF avatars for the applications you build.</p><div class="roadmap-item"><span>01</span> Design & export <strong>Available now</strong></div><div class="roadmap-item"><span>02</span> Animated web component <strong>Available now</strong></div><div class="roadmap-item"><span>03</span> Agent tools via MCP <strong>Available locally</strong></div><small>Local stdio transport. Strict configuration inputs. No public endpoint.</small><details class="mcp-connect"><summary>Connect your agent</summary><p>From your repository checkout, install and run:</p><code>npm ci --prefix mcp --ignore-scripts<br>npm run mcp:start</code><p>Configure your MCP client to launch <code>node mcp/src/index.mjs</code> using an absolute path. Full setup and security details are in <code>mcp/README.md</code>.</p></details></div></section>
<footer class="studio-footer"><a href="#" class="studio-brand">avatar studio<span>·</span></a><span>Small faces. Made personal.</span><span>Built with the open-source Agent Robot Avatar component.</span></footer>`;
canvas.appendChild(shell);
const stage = shell.querySelector('.studio-stage');
stage.appendChild(home);
stage.appendChild(document.getElementById('status'));
shell.querySelector('.studio-design').appendChild(document.querySelector('.robot-customizer'));
shell.querySelector('.studio-design').appendChild(document.querySelector('.demo-roundness-control'));
shell.querySelector('.studio-actions').appendChild(document.querySelector('.controls'));
const options = document.querySelector('.demo-options');
if (options) {
  shell.querySelector('.studio-options').appendChild(options);
  options.querySelector('#demoPanelToolbar').hidden = true;
  options.querySelector('#demoSettingsPanel').hidden = false;
  const language = document.createElement('select');
  language.className = 'studio-language';
  language.setAttribute('aria-label', 'Page language');
  const languages = [...options.querySelectorAll('.demo-language-option')];
  language.replaceChildren(...languages.map(button => new Option(button.textContent, button.dataset.lang, false, button.classList.contains('demo-language-active'))));
  language.addEventListener('change', () => languages.find(button => button.dataset.lang === language.value)?.click());
  shell.querySelector('.studio-nav nav').appendChild(language);
}
const movement = shell.querySelector('.studio-behavior');
const antennaControl = movement.querySelector('#demoAntenna');
antennaControl.addEventListener('change', () => customizeAvatar(face, { antenna: antennaControl.checked }));
movement.querySelector('summary').innerHTML = 'Movement <span class="details-arrow">⌄</span>';
shell.querySelector('.studio-preview').appendChild(movement);
const editorScroll = shell.querySelector('.editor-scroll');
editorScroll.tabIndex = 0;
editorScroll.setAttribute('role', 'region');
editorScroll.setAttribute('aria-label', 'Avatar customization options');
document.addEventListener('pointerdown', event => { if (!movement.contains(event.target)) movement.open = false; });
movement.addEventListener('keydown', event => { if (event.key === 'Escape') { movement.open = false; movement.querySelector('summary').focus(); } });
const hint = document.querySelector('.demo-chat-entry-hint');
if (hint) { hint.textContent = 'Double-click to try a conversation. Drag to play.'; shell.querySelector('.preview-caption').appendChild(hint); }
stack.remove();
face.setAttribute('size', '170');
document.querySelector('.robot-customizer-heading')?.remove();
const legacyExport = document.getElementById('robot-custom-export');
legacyExport.hidden = true;

// Put everyday customization in one small, predictable form.
const customizer = document.querySelector('.robot-customizer');
const fields = customizer.querySelector('.robot-customizer-fields');
const colorGroup = document.createElement('fieldset');
colorGroup.className = 'custom-group custom-colors';
colorGroup.innerHTML = '<legend>Colors</legend><div class="color-swatches"></div>';
for (const key of ['body', 'eyes']) colorGroup.querySelector('.color-swatches').appendChild(fields.querySelector(`[data-setting="${key}"]`).closest('label'));
const faceGroup = document.createElement('fieldset');
faceGroup.className = 'custom-group custom-face';
faceGroup.innerHTML = '<legend>Face</legend>';
faceGroup.appendChild(fields.querySelector('.body-shape-row'));
for (const key of ['eyeSize', 'spacing']) {
  const label = fields.querySelector(`[data-setting="${key}"]`).closest('label');
  faceGroup.appendChild(label);
}
const roundness = document.querySelector('.demo-roundness-control');
faceGroup.appendChild(roundness);
roundness.querySelector('input[type=range]').removeAttribute('list');
const unlock = roundness.querySelector('#demoHeadRoundnessUnlock');
unlock.checked = true;
unlock.dispatchEvent(new Event('change', { bubbles: true }));
const accessoryGroup = document.createElement('fieldset');
accessoryGroup.className = 'custom-group custom-accessories';
accessoryGroup.innerHTML = '<legend>Accessories</legend>';
const accessorySelect = fields.querySelector('[data-setting="accessory"]');
accessorySelect.closest('label').hidden = false;
accessoryGroup.appendChild(accessorySelect.closest('label'));
const accessoryColor = fields.querySelector('[data-setting="accessoryColor"]').closest('label');
accessoryColor.className = 'accessory-color-swatch';
accessoryColor.firstChild.textContent = 'Color ';
const accessoryColorRow = document.createElement('div');
accessoryColorRow.className = 'accessory-color-row';
accessoryColorRow.append(customizer.querySelector('.match-eyes-toggle'), accessoryColor);
accessoryGroup.appendChild(accessoryColorRow);
const reset = document.getElementById('robot-custom-reset');
shell.querySelector('.editor-heading').appendChild(reset);
fields.append(colorGroup, faceGroup, accessoryGroup);
const status = document.getElementById('export-status');
const renderStyle = document.createElement('fieldset');
renderStyle.className = 'custom-group render-style';
renderStyle.innerHTML = '<legend>Style</legend><div class="render-style-options"><button type="button" data-render-style="svg" aria-pressed="true">Classic SVG</button><button type="button" data-render-style="glossy" aria-pressed="false">Glossy 3D</button></div><p>Glossy 3D is a preview. Export PNG or GIF; SVG keeps the classic look.</p>';
fields.prepend(renderStyle);
const glossyContainer = document.createElement('div');
glossyContainer.className = 'glossy-preview';
glossyContainer.hidden = true;
stage.appendChild(glossyContainer);
let glossy, selectedStyle = 'svg';
function glossyConfig() {
  const design = Object.fromEntries([...fields.querySelectorAll('[data-setting]')].map(input => [input.dataset.setting, input.type === 'checkbox' ? input.checked : input.type === 'range' ? Number(input.value) : input.value]));
  return { ...design, loop: document.getElementById('demoLoop').checked, antenna: antennaControl.checked, antennaFlash: document.getElementById('demoAntennaFlash').checked, pointerFollow: document.getElementById('demoPointerFollow').checked, motion: face.getAttribute('motion') };
}
async function selectStyle(style) {
  renderStyle.querySelectorAll('button').forEach(button => button.disabled = true);
  try {
    if (style === 'glossy' && !glossy) {
      const { createGlossyPreview } = await import('./generated/glossy.js');
      glossy = createGlossyPreview(glossyContainer, face, glossyConfig);
    }
    selectedStyle = style;
    glossy?.setActive(style === 'glossy');
    if (style === 'glossy') glossy?.play(shell.querySelector('button[data-action].demo-active')?.dataset.action || 'idle');
    home.style.visibility = style === 'glossy' ? 'hidden' : '';
    if (hint) hint.hidden = style === 'glossy';
    stage.classList.toggle('is-glossy', style === 'glossy');
    renderStyle.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.renderStyle === style)));
  } catch {
    glossy?.dispose(); glossy = undefined; glossyContainer.hidden = true;
    home.style.visibility = ''; selectedStyle = 'svg'; stage.classList.remove('is-glossy');
    if (hint) hint.hidden = false;
    status.textContent = translatePhrase('Glossy 3D could not start. You can still use Classic SVG.', document.documentElement.lang);
  } finally {
    renderStyle.querySelectorAll('button').forEach(button => button.disabled = false);
  }
}
renderStyle.addEventListener('click', event => {
  const button = event.target.closest('[data-render-style]');
  if (button) void selectStyle(button.dataset.renderStyle);
});
let glossyUpdate;
function updateGlossy() {
  clearTimeout(glossyUpdate);
  glossyUpdate = setTimeout(() => { if (selectedStyle === 'glossy') glossy?.update(); }, 80);
}
shell.addEventListener('input', updateGlossy);
shell.addEventListener('change', updateGlossy);
// Capture on the ancestor: the original SVG controls consume clicks at their own capture listener.
shell.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (button && selectedStyle === 'glossy') glossy?.play(button.dataset.action);
}, true);
reset.addEventListener('click', () => { glossy?.play('idle'); updateGlossy(); });
document.getElementById('robot-shape-shuffle').addEventListener('click', updateGlossy);
window.addEventListener('pagehide', event => { if (!event.persisted) glossy?.dispose(); });
let exporting = false;
async function download(format) {
  if (exporting) return;
  exporting = true;
  shell.querySelectorAll('.download-row button').forEach(button => button.disabled = true);
  try {
    if (format === 'gif') status.textContent = 'Recording two seconds of your live avatar…';
    const blob = selectedStyle === 'glossy' && format !== 'svg' ? await glossy[format]() : await exportAvatar(face, { format });
    saveDownload(blob, `my-avatar${selectedStyle === 'glossy' && format !== 'svg' ? '-3d' : ''}.${format}`);
    status.textContent = `Your ${format.toUpperCase()} is ready. Make yourself at home anywhere.`;
  } catch {
    status.textContent = 'The download couldn’t be created. Please try again.';
  } finally {
    exporting = false;
    shell.querySelectorAll('.download-row button').forEach(button => button.disabled = false);
  }
}
for (const format of ['svg', 'png', 'gif']) document.getElementById(`studio-${format}`).addEventListener('click', () => download(format));

// Keep expression rows balanced as labels and available width change.
const actionPanel = shell.querySelector('.studio-actions');
const actionButtons = actionPanel.querySelector('.controls');
function balanceActions() {
  const buttons = [...actionButtons.querySelectorAll('button')];
  if (!buttons[0]?.offsetParent) return;
  const maximum = actionPanel.clientWidth;
  const rowsAt = width => {
    actionButtons.style.setProperty('--studio-actions-width', `${width}px`);
    return new Set(buttons.map(button => button.offsetTop)).size;
  };
  const rows = rowsAt(maximum);
  let low = Math.max(...buttons.map(button => button.offsetWidth)), high = maximum;
  while (high - low > 1) {
    const middle = Math.floor((high + low) / 2);
    if (rowsAt(middle) > rows) low = middle;
    else high = middle;
  }
  rowsAt(high);
}
let balanceFrame;
function scheduleBalance() { cancelAnimationFrame(balanceFrame); balanceFrame = requestAnimationFrame(balanceActions); }
window.addEventListener('resize', scheduleBalance);
shell.querySelector('.studio-expression').addEventListener('toggle', scheduleBalance);
new MutationObserver(scheduleBalance).observe(actionButtons, { childList: true, subtree: true, characterData: true });
scheduleBalance();
document.fonts?.ready.then(scheduleBalance);

let showcaseVisible = false;
const showcase = document.getElementById('showcase');
function refreshShowcases() {
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSVG())}`;
  showcase.querySelectorAll('[data-avatar-showcase]').forEach(image => { image.src = url; });
}
new IntersectionObserver(entries => {
  showcaseVisible = entries[0].isIntersecting;
  if (showcaseVisible) refreshShowcases();
}).observe(showcase);
setInterval(() => { if (showcaseVisible && !document.hidden) refreshShowcases(); }, 350);
refreshShowcases();
// Navigating to #create waits until the asynchronously mounted studio is ready.
if (location.hash === '#create') requestAnimationFrame(() => shell.querySelector('#create').scrollIntoView());

function translateInterface() {
  const language = document.documentElement.lang || 'en';
  translateStudio(shell, language);
  const picker = shell.querySelector('.studio-language');
  if (picker) picker.value = language;
  for (const docsLink of shell.querySelectorAll('.studio-nav nav a:first-child, .use-case-docs')) {
    const docsURL = new URL(docsLink.href);
    docsURL.searchParams.set('lang', language);
    if (docsLink.href !== docsURL.href) docsLink.href = docsURL.href;
  }
}
new MutationObserver(translateInterface).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
new MutationObserver(translateInterface).observe(shell, { childList: true, characterData: true, subtree: true });
translateInterface();

void mountUseCases(showcase).then(translateInterface);

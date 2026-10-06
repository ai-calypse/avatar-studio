import { test, expect } from '@playwright/test';

test('npm customization isolates avatars, retains updates, and exports fitted accessories', async ({ page }) => {
  await page.goto('/examples/basic.html');
  const result = await page.evaluate(async () => {
    const { customizeAvatar, exportAvatarSVG, accessories } = await import('/agent-robot-avatar.js');
    const first = document.createElement('agent-robot-avatar');
    const second = document.createElement('agent-robot-avatar');
    document.body.append(first, second);
    customizeAvatar(first, { body: '#182725', eyes: '#dbf59d', accessory: 'headphones', accessoryColor: '#ff5577', headRoundness: 0 });
    const square = first.shadowRoot.getElementById('personal-accessory').innerHTML;
    customizeAvatar(first, { headRoundness: 100, matchEyes: true });
    const round = first.shadowRoot.getElementById('personal-accessory').innerHTML;
    customizeAvatar(second, { body: '#334455', eyes: '#aabbcc', accessory: 'wizard' });
    const saved = customizeAvatar(first, { spacing: 8, eyeSize: 120 });
    const snapshot = exportAvatarSVG(first, 128);
    const count = first.shadowRoot.querySelectorAll('#personal-accessory').length;
    first.remove(); document.body.append(first);
    customizeAvatar(first, { accessory: 'glasses' });
    const reconnected = exportAvatarSVG(first);
    return { count, saved, snapshot, changed: square !== round, secondBody: second.getAttribute('color'), secondAccessory: second.shadowRoot.getElementById('personal-accessory').innerHTML, firstColor: first.style.getPropertyValue('--robot-accessory-color'), total: accessories.length, reconnected };
  });
  expect(result.total).toBe(50);
  expect(result.count).toBe(1);
  expect(result.saved).toMatchObject({ body: '#182725', accessory: 'headphones', matchEyes: true, spacing: 8, eyeSize: 120, headRoundness: 100 });
  expect(result.changed).toBe(true);
  expect(result.firstColor).toBe('#dbf59d');
  expect(result.secondBody).toBe('#334455');
  expect(result.secondAccessory).not.toBe('');
  expect(result.snapshot).toContain('width="128"');
  expect(result.snapshot).toContain('#dbf59d');
  expect(result.snapshot).not.toContain('NaN');
  expect(result.reconnected).toContain('personal-accessory');
});

test('npm customization rejects unsupported inputs before changing the element', async ({ page }) => {
  await page.goto('/examples/basic.html');
  const result = await page.evaluate(async () => {
    const { customizeAvatar, exportAvatarSVG } = await import('/agent-robot-avatar.js');
    const avatar = document.createElement('agent-robot-avatar');
    document.body.append(avatar);
    customizeAvatar(avatar, { body: '#182725' });
    const invalid = [{ accessory: 'constructor' }, { accessory: '__proto__' }, { eyes: '<script>' }, { eyeSize: Infinity }, { spacing: 13 }, { matchEyes: 'true' }, { expression: 'happy' }, JSON.parse('{"__proto__":{}}')];
    let rejected = 0;
    for (const config of invalid) { try { customizeAvatar(avatar, { body: '#ffffff', ...config }); } catch { rejected++; } }
    let invalidSize = false;
    try { exportAvatarSVG(avatar, 513); } catch { invalidSize = true; }
    let detached = false;
    try { customizeAvatar(document.createElement('agent-robot-avatar')); } catch { detached = true; }
    return { rejected, body: avatar.getAttribute('color'), invalidSize, detached };
  });
  expect(result).toEqual({ rejected: 8, body: '#182725', invalidSize: true, detached: true });
});

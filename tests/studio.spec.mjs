import { test, expect } from '@playwright/test';

async function bytes(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

test('studio preserves independent colors and accessories across reloads', async ({ page }) => {
  await page.goto('/demo/?lang=en');
  await expect(page.getByRole('heading', { name: 'Make it yours' })).toBeVisible();
  await page.getByLabel('Robot body color', { exact: true }).fill('#324455');
  await page.getByLabel('Robot eye color', { exact: true }).fill('#aaffdd');
  await page.getByLabel('Robot accessory color', { exact: true }).fill('#ff5577');
  await page.getByLabel('Robot accessory', { exact: true }).selectOption('glasses');
  await page.reload();
  await expect(page.getByLabel('Robot accessory', { exact: true })).toHaveValue('glasses');
  await expect(page.getByLabel('Robot accessory color', { exact: true })).toHaveValue('#ff5577');
  const colors = await page.evaluate(() => {
    const shadow = document.getElementById('face').shadowRoot;
    return [getComputedStyle(shadow.getElementById('leftBase')).fill, getComputedStyle(shadow.querySelector('#personal-accessory g')).stroke];
  });
  expect(colors).toEqual(['rgb(170, 255, 221)', 'rgb(255, 85, 119)']);
});

test('studio exports self-contained SVG, transparent PNG, and animated GIF', async ({ page }) => {
  await page.goto('/demo/?lang=en');
  for (const format of ['svg', 'png', 'gif']) {
    const downloading = page.waitForEvent('download');
    await page.locator(`#studio-${format}`).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe(`my-avatar.${format}`);
    const data = await bytes(download);
    if (format === 'svg') {
      expect(data.toString()).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(data.toString()).toContain('headShape');
    }
    if (format === 'png') {
      expect(data.subarray(1, 4).toString()).toBe('PNG');
      expect(data.readUInt32BE(16)).toBe(512);
      expect(data[25]).toBe(6); // RGBA
    }
    if (format === 'gif') {
      expect(data.subarray(0, 6).toString()).toBe('GIF89a');
      expect(data.readUInt16LE(6)).toBe(256);
      expect(data.includes(Buffer.from('NETSCAPE2.0'))).toBe(true);
      expect(data.length).toBeGreaterThan(100000);
    }
  }
});

test('studio fits mobile and keeps core controls accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/?lang=en');
  await expect(page.locator('#studio-svg')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Robot accessory', { exact: true }).selectOption('headphones');
  await page.getByRole('button', { name: 'Reset look', exact: true }).click();
  await expect(page.getByLabel('Robot accessory', { exact: true })).toHaveValue('none');
  await page.locator('.studio-expression summary').click();
  await page.locator('button[data-action="input"]').click();
  await expect.poll(() => page.evaluate(() => document.getElementById('face')._state)).toBe('input');
});


test('creator is visible immediately and showcases follow the chosen design', async ({ page }) => {
  await page.goto('/demo/?lang=en', { waitUntil: 'networkidle' });
  await expect(page.locator('.studio-hero')).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.getByLabel('Robot accessory', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Robot eye size', { exact: true })).toBeVisible();
  for (const viewport of [{width:1280,height:720},{width:390,height:844},{width:320,height:700}]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => scrollTo(0, 0));
    const layout = await page.evaluate(() => ({
      editor: document.querySelector('.studio-editor').getBoundingClientRect().bottom,
      preview: document.querySelector('.studio-preview').getBoundingClientRect().top,
      viewport: innerHeight,
    }));
    expect(layout.editor).toBeLessThanOrEqual(layout.viewport);
    expect(layout.preview).toBeGreaterThanOrEqual(0);
  }
  await page.getByLabel('Robot body color', { exact: true }).fill('#552244');
  await page.locator('#showcase').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('[data-avatar-showcase]').first().evaluate(image => decodeURIComponent(image.src).includes('#552244'))).toBe(true);
  await expect(page.locator('[data-avatar-showcase]')).toHaveCount(4);
});


test('accessories match eyes optionally and fit changing body contours', async ({ page }) => {
  await page.goto('/demo/?lang=en');
  await page.getByLabel('Robot eye color', { exact: true }).fill('#ff4466');
  await page.getByLabel('Robot accessory color', { exact: true }).fill('#33aabb');
  await page.getByLabel('Robot accessory', { exact: true }).selectOption('headphones');
  await page.getByLabel('Match accessory color to eyes').check();
  await expect(page.getByLabel('Robot accessory color', { exact: true })).toBeDisabled();
  await expect.poll(() => page.locator('#face').evaluate(f => f.style.getPropertyValue('--robot-accessory-color'))).toBe('#ff4466');
  const contour = value => page.evaluate(async value => {
    const face = document.getElementById('face');
    face.setHeadRoundness(value);
    await new Promise(resolve => requestAnimationFrame(resolve));
    return face.shadowRoot.getElementById('personal-accessory').innerHTML;
  }, value);
  const square = await contour(0);
  const round = await contour(100);
  expect(round).not.toBe(square);
  await page.reload();
  await expect(page.getByLabel('Match accessory color to eyes')).toBeChecked();
  await page.getByLabel('Match accessory color to eyes').uncheck();
  await expect(page.getByLabel('Robot accessory color', { exact: true })).toHaveValue('#33aabb');
  await expect.poll(() => page.locator('#face').evaluate(f => f.style.getPropertyValue('--robot-accessory-color'))).toBe('#33aabb');
  for (const name of ['Shades', 'Crown', 'Party hat', 'Halo', 'Beanie', 'Moustache', 'Flower']) {
    await page.getByLabel('Robot accessory', { exact: true }).selectOption({label:name});
    expect(await page.locator('#face').evaluate(f => f.shadowRoot.getElementById('personal-accessory').children.length)).toBeGreaterThan(0);
  }
});


test('dropdown provides 50 distinct rendered accessories plus none', async ({ page }) => {
  await page.goto('/demo/?lang=en');
  const select = page.getByLabel('Robot accessory', { exact: true });
  await expect(select).toBeVisible();
  const values = await select.locator('option').evaluateAll(options => options.map(option => option.value).filter(value => value !== 'none'));
  expect(values.length).toBeGreaterThanOrEqual(50);
  const renders = [];
  for (const value of values) {
    await select.selectOption(value);
    const markup = await page.locator('#face').evaluate(f => f.shadowRoot.getElementById('personal-accessory').innerHTML);
    expect(markup, value).not.toBe('');
    expect(markup, value).not.toContain('NaN');
    renders.push(markup);
  }
  expect(new Set(renders).size).toBe(values.length);
  await select.selectOption('none');
  expect(await page.locator('#face').evaluate(f => f.shadowRoot.getElementById('personal-accessory').innerHTML)).toBe('');
});

test('fluid body shuffle persists and classic roundness remains available', async ({ page }) => {
  await page.goto('/demo/?lang=en');
  const select = page.getByLabel('Robot body shape', { exact: true });
  const shuffle = page.getByRole('button', { name: 'Shuffle body shape' });
  await expect(select).toHaveValue('classic');
  await expect(shuffle).toBeDisabled();
  const original = await page.locator('#face').evaluate(face => face._baseHeadPathD);
  await page.getByLabel('Robot accessory', { exact: true }).selectOption('headphones');
  await select.selectOption('random');
  await expect(shuffle).toBeEnabled();
  const first = await page.locator('#face').evaluate(face => ({ d: face._baseHeadPathD, seed: face.getShapeSeed(), accessory: face.shadowRoot.getElementById('personal-accessory').innerHTML }));
  expect(first.d).not.toBe(original);
  await shuffle.click();
  const second = await page.locator('#face').evaluate(face => ({ d: face._baseHeadPathD, seed: face.getShapeSeed(), accessory: face.shadowRoot.getElementById('personal-accessory').innerHTML }));
  expect(second.d).not.toBe(first.d);
  expect(second.accessory).not.toBe(first.accessory);
  await page.reload();
  await expect(select).toHaveValue('random');
  expect(await page.locator('#face').evaluate(face => face._baseHeadPathD)).toBe(second.d);
  expect(await page.locator('#face').evaluate(face => face.getShapeSeed())).toBe(second.seed);
  await select.selectOption('classic');
  expect(await page.locator('#face').evaluate(face => face._baseHeadPathD)).toBe(original);
  await page.getByRole('button', { name: 'Reset look', exact: true }).click();
  await expect(select).toHaveValue('classic');
  await expect(shuffle).toBeDisabled();
  const download = page.waitForEvent('download');
  await page.locator('#studio-svg').click();
  const binary = await bytes(await download);
  expect(binary.toString()).not.toContain('NaN');
});

test('preview movement switches control the avatar without nested tabs', async ({ page }) => {
  await page.goto('/demo/?lang=en');
  const menu = page.locator('.studio-preview .studio-behavior');
  await menu.locator('summary').click();
  await expect(menu.locator('#demoSettingsPanel')).toBeVisible();
  await expect(page.locator('#demoPanelToolbar')).toBeHidden();
  await menu.getByText('Antenna', { exact: true }).click();
  await expect.poll(() => page.locator('#face').evaluate(el => getComputedStyle(el.shadowRoot.getElementById('antennaDot')).display)).toBe('none');
  await menu.getByText('Antenna', { exact: true }).click();
  await expect.poll(() => page.locator('#face').evaluate(el => getComputedStyle(el.shadowRoot.getElementById('antennaDot')).display)).not.toBe('none');
  await menu.getByText('Antenna blink', { exact: true }).click();
  expect(await page.locator('#face').evaluate(el => el._antennaFlashEnabled)).toBe(true);
  await menu.getByText('Pointer follow', { exact: true }).click();
  expect(await page.locator('#face').evaluate(el => el._pointerFollowEnabled)).toBe(false);
  await page.locator('#face').evaluate(el => {
    el._movementPlayCount = 0;
    const play = el.play;
    el.play = function(...args) { this._movementPlayCount++; return play.apply(this,args); };
  });
  await menu.getByText('Loop', { exact: true }).click();
  await expect.poll(() => page.locator('#face').evaluate(el => el._movementPlayCount)).toBeGreaterThan(1);
  await menu.getByText('Loop', { exact: true }).click();
  await menu.locator('summary').focus();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open');
  await page.getByRole('combobox', { name: 'Page language', exact: true }).selectOption('ja');
  await expect(page.locator('html')).toHaveAttribute('lang','ja');
  await expect(page).toHaveURL(/lang=ja/);
});

test('editor scroll keeps downloads fixed and movement remains accessible on mobile', async ({ page }) => {
  await page.setViewportSize({width:1100,height:650});
  await page.goto('/demo/?lang=en');
  await page.locator('.studio-expression summary').click();
  const scroll = page.getByRole('region',{name:'Avatar customization options'});
  const before = await page.locator('.studio-export').boundingBox();
  await scroll.hover();
  await page.mouse.wheel(0,180);
  await expect.poll(() => scroll.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  const after = await page.locator('.studio-export').boundingBox();
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(2);
  await page.setViewportSize({width:390,height:844});
  await page.locator('.studio-behavior summary').click();
  await expect(page.locator('#demoSettingsPanel')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('heading',{name:'Make it yours'}).click();
  await expect(page.locator('.studio-behavior')).not.toHaveAttribute('open');
});


test('In use contains every README example, working previews, search and category filters',async({page})=>{
 const {readFile}=await import('node:fs/promises');
 const manifest=JSON.parse(await readFile(new URL('../docs/use-cases/manifest.json',import.meta.url),'utf8'));
 await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
 await expect(page.locator('.studio-nav a[href="#developers"]')).toHaveCount(0);
 await expect(page.locator('.use-case-example')).toHaveCount(manifest.length);
 const ids=await page.locator('[data-use-case]').evaluateAll(cards=>cards.map(card=>card.dataset.useCase));
 expect(ids).toEqual(manifest.map(item=>item.id));
 const broken=await page.locator('.use-case-example img').evaluateAll(async images=>{
  await Promise.all(images.map(image=>{image.loading='eager';return image.decode().catch(()=>{});}));
  return images.filter(image=>!image.naturalWidth).map(image=>image.src);
 });
 expect(broken).toEqual([]);
 await page.getByLabel('Category',{exact:true}).selectOption('presence');
 await expect(page.locator('.use-case-example:visible')).toHaveCount(6);
 await expect(page.locator('.use-case-count')).toHaveText('6');
 await page.getByLabel('Category',{exact:true}).selectOption('all');
 await page.getByLabel('Find a use case',{exact:true}).fill('sprite');
 await expect(page.locator('.use-case-example:visible')).toHaveCount(1);
 await expect(page.locator('.use-case-example:visible')).toHaveAttribute('data-use-case','sprites');
 await page.getByLabel('Find a use case',{exact:true}).fill('no-matching-use-case');
 await expect(page.locator('.use-case-empty')).toBeVisible();
 await page.setViewportSize({width:320,height:700});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

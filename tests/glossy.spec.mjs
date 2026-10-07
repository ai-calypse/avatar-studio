import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('glossy preview follows design controls, exports PNG, and switches back',async({page,browserName})=>{
 test.skip(browserName!=='chromium','WebGL smoke coverage uses Chromium software rendering.');
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Glossy 3D',exact:true}).click();
 await expect(page.locator('.glossy-preview canvas')).toBeVisible();
 await expect(page.getByRole('button',{name:'Glossy 3D',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-setting=accessory]').selectOption('headphones');
 await expect(page.locator('.glossy-preview')).toHaveAttribute('data-accessory','headphones');
 await page.locator('[data-setting=bodyShape]').selectOption('random');
 await expect(page.locator('.glossy-preview')).toHaveAttribute('data-shape','random');
 const download=page.waitForEvent('download');
 await page.locator('#studio-png').click();
 const png=await download;
 expect(png.suggestedFilename()).toBe('my-avatar-3d.png');
 const pngBytes=await readFile(await png.path());
 expect([pngBytes.readUInt32BE(16),pngBytes.readUInt32BE(20)]).toEqual([512,512]);
 const gifDownload=page.waitForEvent('download');
 await page.locator('#studio-gif').click();
 const gif=await gifDownload;
 expect(gif.suggestedFilename()).toBe('my-avatar-3d.gif');
 const gifBytes=await readFile(await gif.path());
 expect(gifBytes.subarray(0,6).toString()).toBe('GIF89a');
 expect([gifBytes.readUInt16LE(6),gifBytes.readUInt16LE(8)]).toEqual([320,320]);
 await page.getByRole('button',{name:'Classic SVG',exact:true}).click();
 await expect(page.locator('.glossy-preview')).toBeHidden();
 await expect(page.locator('#home')).toBeVisible();
 expect(errors).toEqual([]);
});

test('a failed WebGL startup preserves the working SVG editor',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args);};});
 await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Glossy 3D',exact:true}).click();
 await expect(page.locator('#export-status')).toContainText('could not start');
 await expect(page.locator('#home')).toBeVisible();
 await expect(page.getByRole('button',{name:'Classic SVG',exact:true})).toHaveAttribute('aria-pressed','true');
});


test('all catalog accessories render visible geometry and reduced motion is stable',async({page,browserName})=>{
 test.skip(browserName!=='chromium','WebGL rendering uses Chromium software rendering.');
 test.setTimeout(60000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Glossy 3D',exact:true}).click();
 await expect(page.locator('.glossy-preview canvas')).toBeVisible();
 const ids=await page.locator('[data-setting=accessory] option').evaluateAll(options=>options.map(option=>option.value));
 for(const id of ids) {
  await page.locator('[data-setting=accessory]').selectOption(id);
  await expect(page.locator('.glossy-preview')).toHaveAttribute('data-accessory',id);
  const visiblePixels=await page.locator('.glossy-preview canvas').evaluate(canvas=>{
   const snapshot=document.createElement('canvas');snapshot.width=snapshot.height=64;
   const context=snapshot.getContext('2d');context.drawImage(canvas,0,0,64,64);
   const data=context.getImageData(0,0,64,64).data;
   return Array.from({length:4096},(_,i)=>data[i*4+3]).filter(alpha=>alpha>100).length;
  });
  expect(visiblePixels,id).toBeGreaterThan(100);
 }
 const initial=await page.locator('.glossy-preview canvas').evaluate(canvas=>canvas.toDataURL());
 await page.mouse.move(150,220);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 expect(await page.locator('.glossy-preview canvas').evaluate(canvas=>canvas.toDataURL())).toBe(initial);
});

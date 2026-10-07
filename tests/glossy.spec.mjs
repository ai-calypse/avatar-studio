import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('glossy preview follows design controls, exports PNG, and switches back',async({page,browserName})=>{
 test.setTimeout(60000);
 test.skip(browserName!=='chromium','WebGL smoke coverage uses Chromium software rendering.');
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Glossy 3D',exact:true}).click();
 await expect(page.locator('.glossy-preview canvas')).toBeVisible({timeout:30000});
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
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Glossy 3D',exact:true}).click();
 await expect(page.locator('.glossy-preview canvas')).toBeVisible({timeout:30000});
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

test('glossy expressions change rendered pixels and survive design edits and reduced motion',async({page,browserName})=>{
 test.skip(browserName!=='chromium','WebGL coverage uses Chromium software rendering.');
 test.setTimeout(60000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Glossy 3D',exact:true}).click();
 const canvas=page.locator('.glossy-preview canvas');
 await expect(canvas).toBeVisible({timeout:30000});
 await page.locator('.studio-expression summary').click();
 const capture=()=>canvas.evaluate(canvas=>canvas.toDataURL());
 const normal=await capture(),seen=new Set([normal]);
 for(const action of ['bored','success','failure','warning','inspect','error','surprise','sleep','love']) {
  await page.locator(`button[data-action=${action}]`).click();
  const image=await capture();expect(image,action).not.toBe(normal);expect(seen.has(image),action).toBe(false);seen.add(image);
 }
 const love=await capture();
 await page.locator('[data-setting=accessory]').selectOption('headphones');
 await expect(page.locator('.glossy-preview')).toHaveAttribute('data-accessory','headphones');
 await page.locator('[data-setting=accessory]').selectOption('none');
 await expect(page.locator('.glossy-preview')).toHaveAttribute('data-accessory','none');
 expect(await capture()).toBe(love);
 await page.locator('button[data-action=wake]').click();
 expect(await capture()).toBe(normal);
});

test('headphones stay connected to the body across classic and fluid silhouettes',async({page,browserName})=>{
 test.skip(browserName!=='chromium','WebGL coverage uses Chromium software rendering.');
 test.setTimeout(60000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Glossy 3D',exact:true}).click();
 await expect(page.locator('.glossy-preview canvas')).toBeVisible({timeout:30000});
 await page.locator('[data-setting=accessory]').selectOption('headphones');
 await expect(page.locator('.glossy-preview')).toHaveAttribute('data-accessory','headphones');
 for(const shape of ['classic','random']) {
  const options=await page.locator('[data-setting=bodyShape] option').evaluateAll(options=>options.map(o=>o.value));
  await page.locator('[data-setting=bodyShape]').selectOption(shape==='classic'?options[0]:shape);
  await expect(page.locator('.glossy-preview')).toHaveAttribute('data-shape',shape==='classic'?options[0]:shape);
  const components=await page.locator('.glossy-preview canvas').evaluate(canvas=>{
   const snapshot=document.createElement('canvas');snapshot.width=snapshot.height=256;
   const ctx=snapshot.getContext('2d');ctx.drawImage(canvas,0,0,256,256);
   const data=ctx.getImageData(0,0,256,256).data,visited=new Uint8Array(65536),sizes=[];
   for(let start=0;start<visited.length;start++) {
    if(visited[start]||data[start*4+3]<128)continue;
    const queue=[start];visited[start]=1;
    for(let j=0;j<queue.length;j++)for(const next of [queue[j]-256,queue[j]+256,...(queue[j]%256?[queue[j]-1]:[]),...(queue[j]%256<255?[queue[j]+1]:[])]) {
     if(next>=0&&next<visited.length&&!visited[next]&&data[next*4+3]>=128){visited[next]=1;queue.push(next);}
    }
    sizes.push(queue.length);
   }
   return sizes.sort((a,b)=>b-a);
  });
  expect(components[0]).toBeGreaterThan(1000);
  expect(components[1]||0,`${shape}: detached accessory pixels`).toBeLessThan(20);
 }
});

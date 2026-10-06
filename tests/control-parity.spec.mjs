import {test,expect} from '@playwright/test';

test('npm controls, live looping, cancellation, and every export format work', async ({page})=>{
  await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const {configureAvatar,exportAvatar}=await import('/agent-robot-avatar.js');
    const avatar=document.getElementById('face');
    configureAvatar(avatar,{appearance:{antenna:false,bodyShape:'random',shapeSeed:42,accessory:'none'},behavior:{antennaFlash:true,pointerFollow:false,loop:true,motion:'reduce',wakeOn:'manual',autoSleep:0},action:'waiting-wrap'});
    const deadline = performance.now()+3000;
    while (!avatar._waitingFx && performance.now()<deadline) await new Promise(requestAnimationFrame);
    const controls={antenna:getComputedStyle(avatar.shadowRoot.getElementById('antennaDot')).display,pointer:avatar._pointerFollowEnabled,blink:avatar._antennaFlashEnabled,continuous:avatar._waitingFx.continuous,variant:avatar._waitingFx.variant};
    configureAvatar(avatar,{behavior:{loop:false},action:'idle'});
    const exports=[];
    for(const format of ['svg','png','gif']) {
      const blob=await exportAvatar(avatar,{format,size:64,frames:3,delay:20});
      const data=new Uint8Array(await blob.arrayBuffer());
      exports.push({type:blob.type,bytes:blob.size,signature:Array.from(data.slice(0,8))});
    }
    const badge = await exportAvatar(avatar,{format:'svg',size:64,presentation:{frame:'circle',status:'online',padding:4,background:'#123456'}});
    const badgeSVG = await badge.text();
    let rejected=0;
    for(const input of [{behavior:{loop:'yes'}},{action:'<script>'},{appearance:{antenna:'no'}}])try{configureAvatar(avatar,input);}catch{rejected++;}
    return {controls,exports,rejected,badgeSVG};
  });
  expect(result.controls).toMatchObject({antenna:'none',pointer:false,blink:true,continuous:true});
  expect(result.exports.map(x=>x.type)).toEqual(['image/svg+xml','image/png','image/gif']);
  expect(result.exports[1].signature).toEqual([137,80,78,71,13,10,26,10]);
  expect(result.exports[2].signature.slice(0,6)).toEqual([71,73,70,56,57,97]);
  expect(result.rejected).toBe(3);
  expect(result.badgeSVG).toContain('avatar-frame');
  expect(result.badgeSVG).toContain('#22c55e');
  expect(result.badgeSVG).toContain('#123456');
});

test('header translator updates creator and showcase and remembers language without changing design',async({page})=>{
  await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
  await page.getByLabel('Robot accessory',{exact:true}).selectOption('headphones');
  await page.locator('.studio-language').selectOption('es');
  await expect(page.getByRole('heading',{name:'Hazlo tuyo'})).toBeVisible();
  await expect(page.locator('#showcase h2')).toHaveText('Una cara. Un lugar en todas partes.');
  await expect(page.locator('[data-setting=accessory]')).toHaveValue('headphones');
  await page.reload();
  await expect(page.getByRole('heading',{name:'Hazlo tuyo'})).toBeVisible();
  await page.locator('.studio-language').selectOption('ja');
  await expect(page.getByRole('heading',{name:'自分らしくしよう'})).toBeVisible();
  await page.locator('.studio-language').selectOption('en');
  await expect(page.getByRole('heading',{name:'Make it yours'})).toBeVisible();
});


test('appearance changes preserve pending loop repeats and reset cancels them',async({page})=>{
  await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{
    const {configureAvatar}=await import('/agent-robot-avatar.js');
    const avatar=document.getElementById('face');
    avatar._parityLoops=0;
    const play=avatar.play;
    avatar.play=function(...args){if(args[0]==='idle')this._parityLoops++;return play.apply(this,args);};
    configureAvatar(avatar,{behavior:{loop:true},action:'idle'});
  });
  await expect.poll(()=>page.locator('#face').evaluate(el=>el._parityLoops)).toBeGreaterThanOrEqual(1);
  await page.evaluate(async()=>{
    const {configureAvatar}=await import('/agent-robot-avatar.js');
    configureAvatar(document.getElementById('face'),{appearance:{eyes:'#aaffdd'}});
  });
  await expect.poll(()=>page.locator('#face').evaluate(el=>el._parityLoops)).toBeGreaterThan(1);
  await page.locator('#face').evaluate(el=>el.reset());
  const count=await page.locator('#face').evaluate(el=>el._parityLoops);
  await page.waitForTimeout(1100);
  expect(await page.locator('#face').evaluate(el=>el._parityLoops)).toBe(count);
});


test('partial configuration preserves a looping expression while its cycle is active',async({page})=>{
  await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{
    const {configureAvatar}=await import('/agent-robot-avatar.js');
    const avatar=document.getElementById('face');const play=avatar.play;
    avatar._paritySends=0;
    avatar.play=function(...args){if(args[0]==='send')this._paritySends++;return play.apply(this,args);};
    configureAvatar(avatar,{behavior:{loop:true},action:'send'});
  });
  await expect.poll(()=>page.locator('#face').evaluate(el=>el._paritySends)).toBe(1);
  await page.evaluate(async()=>{
    const {configureAvatar}=await import('/agent-robot-avatar.js');
    configureAvatar(document.getElementById('face'),{appearance:{body:'#123456'}});
  });
  await expect.poll(()=>page.locator('#face').evaluate(el=>el._paritySends),{timeout:8000}).toBeGreaterThan(1);
});

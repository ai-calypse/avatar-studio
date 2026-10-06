import {test,expect} from '@playwright/test';

test('documentation navigation, anchored guides, and all visual assets work',async({page})=>{
 await page.goto('/demo/?lang=en',{waitUntil:'networkidle'});
 await page.getByRole('link',{name:'Docs',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Start here',exact:true})).toBeVisible();
 await page.locator('#docs-sidebar').getByRole('link',{name:'Examples and use cases',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Avatars in real applications',exact:false})).toBeVisible();
 await expect(page.locator('article img')).toHaveCount(34);
 const broken=await page.locator('article img').evaluateAll(async images=>{
  await Promise.all(images.map(image=>{image.loading='eager';return image.decode().catch(()=>{});}));
  return images.filter(image=>!image.naturalWidth).map(image=>image.src);
 });
 expect(broken).toEqual([]);
 await page.locator('#docs-sidebar').getByRole('link',{name:'MCP setup and tools',exact:true}).click();
 await expect(page.locator('article')).toContainText('create_avatar_component');
 await expect(page.locator('.on-this-page')).toContainText('Install and connect');
});

test('local search finds tool names inside tables and supports Escape',async({page})=>{
 await page.goto('/docs/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Search docs',exact:false}).click();
 await page.getByRole('searchbox').fill('create_avatar_component');
 await expect(page.locator('#search-results')).toContainText('Tools and real use cases');
 await page.locator('#search-results').getByRole('link',{name:'Tools and real use cases',exact:false}).click();
 await expect(page).toHaveURL(/mcp\.html#tools-and-real-use-cases/);
 await page.getByRole('button',{name:'Search docs',exact:false}).click();
 await page.keyboard.press('Escape');
 await expect(page.locator('#docs-search')).not.toBeVisible();
});

test('documentation copies the actual installation command',async({page,context,browserName})=>{
 if(browserName==='chromium')await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.goto('/docs/',{waitUntil:'networkidle'});
 const block=page.locator('.code-block').first();
 const code=await block.locator('code').textContent();
 await block.getByRole('button',{name:'Copy',exact:true}).click();
 if(browserName==='chromium'){
  await expect(block.getByRole('button')).toHaveText('Copied');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(code);
 }else await expect(block.getByRole('button')).toHaveText(/Copied|Select code to copy/);
});

test('mobile documentation menu works without horizontal page overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/docs/',{waitUntil:'networkidle'});
 const menu=page.getByRole('button',{name:'Menu',exact:true});
 await menu.click();
 await expect(menu).toHaveAttribute('aria-expanded','true');
 await page.locator('#docs-sidebar').getByRole('link',{name:'npm integration',exact:true}).click();
 await expect(page.getByRole('heading',{name:'npm integration',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

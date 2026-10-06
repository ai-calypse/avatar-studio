import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';

// Pages serves the artifact below /avatar-studio/, so imports cannot escape its root.
test('Pages artifact contains every relative HTML and module dependency',()=>{
  execFileSync(process.execPath,['scripts/build-pages.mjs']);
  const root=path.resolve('.pages-site');
  assert.ok(existsSync(path.join(root,'.nojekyll')));
  const files=readdirSync(root,{recursive:true}).filter(file=>/\.(html|js)$/.test(file));
  for(const file of files){
    const source=readFileSync(path.join(root,file),'utf8');
    const references=[...source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"](\.[^'"]+)['"]/g)].map(match=>match[1]);
    if(file.endsWith('.html')) references.push(...[...source.matchAll(/(?:src|href)=["'](\.\/[^"']+\.(?:js|css))["']/g)].map(match=>match[1]));
    for(const reference of references){
      const target=path.resolve(root,path.dirname(file),reference);
      assert.ok(target.startsWith(root+path.sep),`${file}: ${reference} escapes Pages root`);
      assert.ok(existsSync(target),`${file}: missing ${reference}`);
    }
  }
});

// Static docs must work with JavaScript disabled and under the Pages project path.
test('all generated documentation links, images, and search destinations resolve',()=>{
 const root=path.resolve('.pages-site');
 const directory=path.join(root,'docs');
 const pages=readdirSync(directory).filter(file=>file.endsWith('.html'));
 assert.equal(pages.length,8);
 for(const file of pages){
  const html=readFileSync(path.join(directory,file),'utf8');
  for(const [,reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(/^(https?:|#)/.test(reference))continue;
   const [pathname,hash]=reference.split('#');
   let target=path.resolve(directory,pathname);
   if(pathname.endsWith('/'))target=path.join(target,'index.html');
   assert.ok(target.startsWith(root+path.sep),`${file}: outside site ${reference}`);
   assert.ok(existsSync(target),`${file}: missing ${reference}`);
   if(hash&&target.endsWith('.html'))assert.ok(readFileSync(target,'utf8').includes(`id="${hash}"`),`${file}: missing anchor ${reference}`);
  }
 }
});


test('Pages gallery uses project-relative assets and includes every canonical preview',()=>{
 const root=path.resolve('.pages-site');
 const module=readFileSync(path.join(root,'avatar-studio-use-cases.js'),'utf8');
 assert.ok(module.includes("new URL('./docs/use-cases/', import.meta.url)"));
 const manifest=JSON.parse(readFileSync(path.join(root,'docs/use-cases/manifest.json'),'utf8'));
 assert.equal(manifest.length,48);
 for(const item of manifest)assert.ok(existsSync(path.join(root,'docs/use-cases',item.preview)),item.preview);
});

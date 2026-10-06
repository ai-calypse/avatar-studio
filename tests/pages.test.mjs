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

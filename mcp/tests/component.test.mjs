import test from 'node:test';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createComponent } from '../src/component.mjs';
import { avatarActions } from '../../src/avatar-studio-controls.js';
import { renderAvatar } from '../src/render.mjs';

test('interactive component supports every public action and control with bounded inert output', () => {
  const defaults = createComponent({});
  assert.equal(defaults.settings.appearance.antenna,true);
  assert.equal(defaults.settings.behavior.pointerFollow,true);
  for(const action of avatarActions) {
    const result = createComponent({action,config:{antenna:false,bodyShape:'random',shapeSeed:42,accessory:'headphones',matchEyes:true},behavior:{antennaFlash:true,pointerFollow:false,loop:true,pressSqueeze:false,antennaDrag:false,motion:'reduce',wakeOn:'manual',autoSleep:5000}});
    assert.equal(result.settings.action,action);
    assert.equal(result.settings.appearance.antenna,false);
    assert.equal(result.settings.behavior.pointerFollow,false);
    assert.ok(result.javascript.includes('configureAvatar'));
    if (action === 'waiting-wrap') assert.equal(spawnSync(process.execPath,['--input-type=module','--check'],{input:result.javascript}).status,0);
    assert.doesNotMatch(result.javascript,/fetch\(|eval\(|require\(|https?:/);
    assert.ok(JSON.stringify(result).length < 8000);
  }
  for(const input of [{action:'<script>'},{behavior:{pointerFollow:'yes'}},{behavior:{url:'https://example.com'}},{behavior:{autoSleep:86400001}},{size:513},{config:{antenna:'no'}}]) assert.throws(()=>createComponent(input));
});
test('antenna visibility changes real image exports',()=>{
  const shown=renderAvatar({config:{antenna:true}}), hidden=renderAvatar({config:{antenna:false}});
  assert.notEqual(shown.sha256,hidden.sha256);
  assert.ok(!Buffer.from(hidden.data,'base64').toString().includes('cx="120" cy="12"'));
});

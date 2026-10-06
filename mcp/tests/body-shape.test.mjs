import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBodyPoints, randomBodyPath } from '../../src/avatar-studio-body-shape.js';
import { renderAvatar } from '../src/render.mjs';
import { generateIdentity, variantItems } from '../src/recipes.mjs';
import { CreateInput } from '../src/schema.mjs';
import { ACCESSORY_OPTIONS } from '../../src/avatar-studio-accessories.js';

test('random shapes are reproducible, smoothly sampled, bounded, and distinct across seeds', () => {
  const shapes = new Set();
  for (let seed = 0; seed < 200; seed++) {
    const points = randomBodyPoints(seed,75);
    assert.equal(points.length,160);
    assert.equal(randomBodyPath(seed,75),randomBodyPath(seed,75));
    for(let i=0;i<points.length;i++) {
      const p=points[i], q=points[(i+1)%points.length];
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      assert.ok(p.x > -8 && p.x < 248 && p.y > 5 && p.y < 235);
      assert.ok(Math.hypot(p.x-q.x,p.y-q.y) < 10);
    }
    shapes.add(randomBodyPath(seed,75));
  }
  assert.equal(shapes.size,200);
  assert.notEqual(randomBodyPath(42,0),randomBodyPath(42,100));
});

test('all accessories fit random SVG silhouettes and raster/GIF exports preserve them', () => {
  for(const accessory of Object.keys(ACCESSORY_OPTIONS)) {
    const rendered=renderAvatar({config:{bodyShape:'random',shapeSeed:42,accessory}});
    const svg=Buffer.from(rendered.data,'base64').toString();
    assert.ok(svg.includes(randomBodyPath(42,50)));
    assert.doesNotMatch(svg,/NaN|Infinity|<(?:script|image|foreignObject)\b/);
  }
  for(const format of ['png','gif']) {
    const input={format,size:128,config:{bodyShape:'random',shapeSeed:42,accessory:'headphones'}};
    const a=renderAvatar(input), b=renderAvatar(input);
    assert.equal(a.sha256,b.sha256);
    const bytes=Buffer.from(a.data,'base64');
    if(format==='gif') assert.equal(bytes.subarray(0,6).toString(),'GIF89a');
    else assert.equal(bytes.readUInt32BE(16),128);
  }
});

test('identity seeds produce repeatable fluid bodies while classic defaults remain unchanged', () => {
  const a=generateIdentity({seed:'user-1',overrides:{bodyShape:'random'}});
  const b=generateIdentity({seed:'user-2',overrides:{bodyShape:'random'}});
  assert.deepEqual(a,generateIdentity({seed:'user-1',overrides:{bodyShape:'random'}}));
  assert.notEqual(a.config.shapeSeed,b.config.shapeSeed);
  assert.equal(generateIdentity({seed:'user-1'}).config.bodyShape,'classic');
  const variants=variantItems({config:{bodyShape:'random'},seed:'team',vary:'look',count:12});
  assert.equal(new Set(variants.map(item=>item.config.shapeSeed)).size,12);
  for(const config of [{shapeSeed:-1},{shapeSeed:1.5},{shapeSeed:Infinity},{shapeSeed:4294967296},{bodyShape:'<svg/>'},{shapeSeed:'42'}]) {
    assert.equal(CreateInput.safeParse({config}).success,false);
    assert.throws(()=>renderAvatar({config}));
  }
});

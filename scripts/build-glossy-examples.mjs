/* global document, window, requestAnimationFrame, CanvasRenderingContext2D */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGlossy } from './build-glossy.mjs';

// Generate documentation assets with the same renderer and exports as the creator.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.join(root,'docs/examples/glossy');
const manifest=JSON.parse(await readFile(path.join(directory,'manifest.json'),'utf8'));
const port=Number(process.env.AVATAR_EXAMPLE_PORT)||4186;
await buildGlossy();
const server=spawn(process.execPath,[path.join(root,'scripts/serve.mjs'),'--port',String(port)],{cwd:root,stdio:['ignore','pipe','pipe']});
let browser;
try {
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`Example server exited: ${code}`)));});
 browser=await chromium.launch({args:['--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:640,height:640},deviceScaleFactor:1});
 await page.goto(`http://127.0.0.1:${port}/examples/basic.html`,{waitUntil:'networkidle'});
 await page.evaluate(async()=>{
  const {createGlossyPreview}=await import('/demo/generated/glossy.js');
  const {customizeAvatar}=await import('/agent-robot-avatar.js');
  const face=document.querySelector('agent-robot-avatar');
  const container=document.createElement('div');container.style.cssText='width:512px;height:512px;position:relative';document.body.appendChild(container);
  window.glossyExamples={face,container,customizeAvatar,createGlossyPreview};
 });
 for(const example of manifest.examples) {
  const assets=await page.evaluate(async({example,defaults})=>{
   const state=window.glossyExamples;
   state.config={...defaults,...example.appearance};
   state.customizeAvatar(state.face,state.config);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(!state.preview)state.preview=state.createGlossyPreview(state.container,state.face,()=>({...state.config,pointerFollow:false,antennaFlash:false,motion:'normal',loop:true}));
   else state.preview.update();
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   state.preview.play(example.action);
   const encode=async blob=>Array.from(new Uint8Array(await blob.arrayBuffer()));
   // Retain full-color frames for documentation GIFs with adaptive palettes.
   const frames=[],readPixels=CanvasRenderingContext2D.prototype.getImageData;
   CanvasRenderingContext2D.prototype.getImageData=function(...args){
    const pixels=readPixels.apply(this,args);
    if(this.canvas.width===320&&this.canvas.height===320)frames.push(this.canvas.toDataURL('image/png').split(',')[1]);
    return pixels;
   };
   try{return {gif:await encode(await state.preview.gif()),png:await encode(await state.preview.png()),frames};}
   finally{CanvasRenderingContext2D.prototype.getImageData=readPixels;}
  },{example,defaults:manifest.defaults});
  const frameDirectory=path.join(root,'dist/glossy-frames',example.id);
  await mkdir(frameDirectory,{recursive:true});
  for(const [index,frame] of assets.frames.entries())await writeFile(path.join(frameDirectory,`${String(index).padStart(2,'0')}.png`),Buffer.from(frame,'base64'));
  await writeFile(path.join(directory,example.id+'.gif'),Buffer.from(assets.gif));
  await writeFile(path.join(directory,example.id+'.png'),Buffer.from(assets.png));
  console.log(`Rendered ${example.name}`);
 }
 await page.evaluate(()=>window.glossyExamples.preview.dispose());
} finally {
 await browser?.close();server.kill();
}

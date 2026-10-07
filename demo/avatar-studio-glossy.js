import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { accessoryMarkup, HEADWEAR } from '../src/avatar-studio-accessories.js';

const loader=new SVGLoader();
function vinyl(color,opacity=1,cache) {
 const key=`${color}:${opacity}`;
 if(cache?.has(key))return cache.get(key);
 const material=new THREE.MeshPhysicalMaterial({color,opacity,transparent:opacity<1,roughness:.19,metalness:0,clearcoat:1,clearcoatRoughness:.07,envMapIntensity:1.25});
 cache?.set(key,material);return material;
}
function release(group) {
 group.traverse(object=>object.geometry?.dispose());
 group.clear();
}
// Loft the existing silhouette into a smooth closed volume, rather than a flat extrusion.
function bodyGeometry(face) {
 const outline=face._parseHeadPoints(face._headShape.getAttribute('d'));
 const count=outline.length,rings=36,vertices=[],indices=[];
 for(let ring=0;ring<=rings;ring++) {
  const theta=ring/rings*Math.PI,radius=Math.sin(theta);
  for(const point of outline)vertices.push((point.x-120)*.94*radius,(120-point.y)*.94*radius,64*Math.cos(theta));
 }
 for(let ring=0;ring<rings;ring++)for(let i=0;i<count;i++) {
  const a=ring*count+i,b=ring*count+(i+1)%count,c=a+count,d=b+count;
  indices.push(a,b,c,b,d,c);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setIndex(indices);
 const smooth=mergeVertices(geometry,.001);geometry.dispose();smooth.computeVertexNormals();
 return smooth;
}
function addAccessories(group,face,config,materials) {
 const color=config.matchEyes?config.eyes:config.accessoryColor;
 const markup=accessoryMarkup(face,config).replaceAll('var(--robot-accessory-color)',color);
 const paths=loader.parse(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`).paths;
 let layer=0;
 const rear=HEADWEAR.has(config.accessory)||/ears|horns|antlers|antennae/.test(config.accessory);
 for(const path of paths) {
  const style=path.userData.style;
  const z=(rear?24:72)+layer++*.8;
  if(style.fill&&style.fill!=='none')for(const shape of path.toShapes()) {
   const geometry=new THREE.ExtrudeGeometry(shape,{depth:8,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:2,bevelThickness:3,curveSegments:20});
   const material=vinyl(style.fill,Number(style.fillOpacity??1)*Number(style.opacity??1),materials);
   const mesh=new THREE.Mesh(geometry,material);mesh.scale.y=-1;mesh.position.set(-120,120,z);group.add(mesh);
  }
  if(style.stroke&&style.stroke!=='none')for(const subpath of path.subPaths) {
   const points=subpath.getPoints(36).map(point=>new THREE.Vector3(point.x-120,120-point.y,z+7));
   if(points.length<2)continue;
   const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
   const geometry=new THREE.TubeGeometry(curve,Math.min(160,points.length*3),Math.max(.6,Number(style.strokeWidth)/2),8,false);
   group.add(new THREE.Mesh(geometry,vinyl(style.stroke,Number(style.strokeOpacity??1)*Number(style.opacity??1),materials)));
  }
 }
}

export function createGlossyPreview(container,face,readConfig) {
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Glossy 3D avatar');
 container.appendChild(renderer.domElement);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(32,1,1,2000);camera.position.set(0,12,620);camera.lookAt(0,6,0);
 const environmentScene=new RoomEnvironment();
 const generator=new THREE.PMREMGenerator(renderer);
 const environment=generator.fromScene(environmentScene,.04);scene.environment=environment.texture;
 environmentScene.dispose();generator.dispose();
 scene.add(new THREE.HemisphereLight('#eaf6ff','#4f6a85',.8));
 for(const [color,intensity,x,y,z] of [['#ffffff',2,-180,220,260],['#b9e7ff',1,220,80,120],['#fff1d2',.8,-150,-120,80]]) {
  const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);
 }
 const toy=new THREE.Group();scene.add(toy);
 const materials=new Map();
 const paint=color=>vinyl(color,1,materials);
 let eyes=[],bulb,config,active=false,frame=0,disposed=false,exporting=false;
 let pointer={x:0,y:0};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const move=event=>{const box=container.getBoundingClientRect();pointer={x:(event.clientX-box.left)/box.width*2-1,y:(event.clientY-box.top)/box.height*2-1};};
 const leave=()=>{pointer={x:0,y:0};};
 container.addEventListener('pointermove',move);container.addEventListener('pointerleave',leave);
 function rebuild() {
  if(disposed)return;
  config=readConfig();bulb?.material.dispose();release(toy);bulb=undefined;
  toy.add(new THREE.Mesh(bodyGeometry(face),paint(config.body)));
  eyes=[-1,1].map(side=>{
   const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),paint(config.eyes));
   mesh.position.set(side*(34+config.spacing),-6,66);
   toy.add(mesh);return mesh;
  });
  if(config.antenna&&!HEADWEAR.has(config.accessory)) {
   const top=Math.max(...face._parseHeadPoints(face._headShape.getAttribute('d')).map(point=>(120-point.y)*.94));
   const stem=new THREE.Mesh(new THREE.CylinderGeometry(4,5,28,16),paint(config.body));stem.position.set(0,top+8,0);toy.add(stem);
   bulb=new THREE.Mesh(new THREE.SphereGeometry(15,24,20),vinyl(config.body,1,materials));bulb.material=bulb.material.clone();bulb.position.set(0,top+28,0);toy.add(bulb);
  }
  addAccessories(toy,face,config,materials);
  // Keep shader programs warm across design changes, with a bounded color cache.
  if(materials.size>64){const used=new Set();toy.traverse(object=>{if(object.material)used.add(object.material);});for(const [key,material] of materials){if(materials.size<=32)break;if(!used.has(material)){material.dispose();materials.delete(key);}}}
  container.dataset.accessory=config.accessory;container.dataset.shape=config.bodyShape;
  render(0);
 }
 function render(time,deterministic=false) {
  const motion=!reduced.matches&&config.motion!=='reduce';
  const seconds=deterministic?time/4000*Math.PI*2:time/1000;
  const following=config.pointerFollow&&!deterministic;
  toy.rotation.set(motion?Math.sin(seconds)*.035+(following?pointer.y*.12:0):0,motion?-.18+Math.sin(seconds)*.12+(following?pointer.x*.28:0):-.12,motion?Math.sin(seconds)*.025:0);
  toy.position.y=motion?Math.sin(seconds)*4:0;
  if(bulb){bulb.material.emissive.set(config.eyes);bulb.material.emissiveIntensity=motion&&config.antennaFlash?Math.max(0,Math.sin(seconds*4))*.45:0;}
  const autonomousBlink=deterministic?(time>1700&&time<1900?.1:1):(time%4000>1700&&time%4000<1900?.1:1);
  const blink=motion?Math.min(autonomousBlink,Math.max(.1,Number(face._leftBase.getAttribute('ry'))/29)):1;
  eyes.forEach((eye,index)=>{
   const size=config.eyeSize/100;
   const base=index?face._rightBase:face._leftBase;
   const rx=deterministic?27:Number(base.getAttribute('rx'))||27;
   eye.scale.set(rx*size,Math.max(2,29*size*blink),9);
  });
  renderer.render(scene,camera);
 }
 function tick(time) {
  if(disposed)return;
  if(active&&!document.hidden&&!exporting)render(time);
  frame=requestAnimationFrame(tick);
 }
 const resize=new ResizeObserver(()=>{
  const {width,height}=container.getBoundingClientRect();
  if(width&&height){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();render(0);}
 });resize.observe(container);
 rebuild();frame=requestAnimationFrame(tick);
 return {
  update:rebuild,
  setActive(value){active=value;container.hidden=!value;if(value)rebuild();},
  async png(){
   exporting=true;
   const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;
   try {
    renderer.setPixelRatio(1);renderer.setSize(512,512,false);camera.aspect=1;camera.updateProjectionMatrix();render(performance.now());
    return await new Promise((resolve,reject)=>renderer.domElement.toBlob(blob=>blob?resolve(blob):reject(Error('PNG unavailable')),'image/png'));
   }finally{renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();exporting=false;render(performance.now());}
  },
  async gif(){
   exporting=true;
   const output=document.createElement('canvas');output.width=output.height=320;
   const context=output.getContext('2d',{willReadFrequently:true}),frames=[];
   try {
    const {encodeGIF}=await import('../src/avatar-studio-gif.js');
    for(let i=0;i<40;i++) {
     render(i*100,true);context.fillStyle='#edf4fb';context.fillRect(0,0,320,320);
     const canvas=renderer.domElement;const scale=Math.min(320/canvas.width,320/canvas.height);
     const width=canvas.width*scale,height=canvas.height*scale;
     context.drawImage(canvas,(320-width)/2,(320-height)/2,width,height);
     frames.push(context.getImageData(0,0,320,320).data);
     if(i%5===0)await new Promise(resolve=>setTimeout(resolve,0));
    }
    return new Blob([encodeGIF(frames,320,320,100)],{type:'image/gif'});
   }finally{exporting=false;render(performance.now());}
  },
  dispose(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();container.removeEventListener('pointermove',move);container.removeEventListener('pointerleave',leave);bulb?.material.dispose();release(toy);for(const material of materials.values())material.dispose();materials.clear();environment.dispose();renderer.dispose();renderer.domElement.remove();}
 };
}

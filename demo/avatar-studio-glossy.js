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
// The loft uses a radial silhouette scaled by sin(theta), with z=64*cos(theta).
// Intersect the same contour to recover its front surface at any accessory point.
export function headSurface(outline,x,y) {
 const length=Math.hypot(x,y);if(length<.0001)return 64;
 const dx=x/length,dy=y/length;let boundary=Infinity;
 for(let i=0;i<outline.length;i++) {
  const a=outline[i],b=outline[(i+1)%outline.length],ex=b.x-a.x,ey=b.y-a.y;
  const cross=dx*ey-dy*ex;if(Math.abs(cross)<.000001)continue;
  const distance=(a.x*ey-a.y*ex)/cross,t=(a.x*dy-a.y*dx)/cross;
  if(distance>0&&t>=0&&t<=1)boundary=Math.min(boundary,distance);
 }
 return Number.isFinite(boundary)?64*Math.sqrt(Math.max(0,1-(length/boundary)**2)):0;
}
function curvedAccessory(geometry,surface,offset) {
 // Subdivide before bending: large hat/visor triangles otherwise cut through the head.
 const source=geometry.index?geometry.toNonIndexed():geometry;
 const position=source.getAttribute('position'),vertices=[];
 function triangle(a,b,c,depth=0) {
  const edges=[a.distanceTo(b),b.distanceTo(c),c.distanceTo(a)];
  const longest=Math.max(...edges);
  if(longest>10&&depth<9) {
   const edge=edges.indexOf(longest);
   if(edge===0){const m=a.clone().add(b).multiplyScalar(.5);triangle(a,m,c,depth+1);triangle(m,b,c,depth+1);}
   else if(edge===1){const m=b.clone().add(c).multiplyScalar(.5);triangle(a,b,m,depth+1);triangle(a,m,c,depth+1);}
   else{const m=c.clone().add(a).multiplyScalar(.5);triangle(a,b,m,depth+1);triangle(m,b,c,depth+1);}
   return;
  }
  for(const p of [a,b,c]){const x=p.x-120,y=120-p.y;vertices.push(x,y,surface(x,y)+offset+p.z);}
 }
 for(let i=0;i<position.count;i+=3)triangle(...[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(position,i+j)));
 if(source!==geometry)source.dispose();geometry.dispose();
 const curved=new THREE.BufferGeometry();curved.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 // Reflecting SVG's Y axis reverses winding.
 const data=curved.getAttribute('position');
 for(let i=0;i<data.count;i+=3){const b=new THREE.Vector3().fromBufferAttribute(data,i+1),c=new THREE.Vector3().fromBufferAttribute(data,i+2);data.setXYZ(i+1,c.x,c.y,c.z);data.setXYZ(i+2,b.x,b.y,b.z);}
 const smooth=mergeVertices(curved,.001);curved.dispose();smooth.computeVertexNormals();return smooth;
}
function addAccessories(group,face,config,materials,outline) {
 const color=config.matchEyes?config.eyes:config.accessoryColor;
 if(config.accessory==='headphones') {
  // A band around the rim, with ear cushions intersecting both sides of the body.
  const upper=outline.filter(p=>p.y>=-4).sort((a,b)=>a.x-b.x);
  const band=upper.map(p=>new THREE.Vector3(p.x*1.018,p.y+2,0));
  if(band.length>1)group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(band),128,4,12,false),vinyl(color,1,materials)));
  const hits=[];
  for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];if((a.y<=-4&&b.y>-4)||(b.y<=-4&&a.y>-4))hits.push(a.x+(-4-a.y)*(b.x-a.x)/(b.y-a.y));}
  for(const x of [Math.min(...hits),Math.max(...hits)]) {
   if(!Number.isFinite(x))continue;
   const pad=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),vinyl(color,1,materials));
   pad.position.set(x,-4,0);pad.scale.set(10,29,19);group.add(pad);
  }
  return;
 }
 const surface=(x,y)=>headSurface(outline,x,y);
 const markup=accessoryMarkup(face,config).replaceAll('var(--robot-accessory-color)',color);
 const paths=loader.parse(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`).paths;
 let layer=0;
 const eyewear=/glasses|goggles|visor|aviators|cat-eye|monocle|eye-patch/.test(config.accessory);
 for(const path of paths) {
  const style=path.userData.style,offset=(eyewear?16:2)+layer++*.8;
  if(style.fill&&style.fill!=='none')for(const shape of path.toShapes()) {
   const flat=new THREE.ExtrudeGeometry(shape,{depth:6,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:1.5,bevelThickness:2,curveSegments:20});
   const material=vinyl(style.fill,Number(style.fillOpacity??1)*Number(style.opacity??1),materials);
   group.add(new THREE.Mesh(curvedAccessory(flat,surface,offset),material));
  }
  if(style.stroke&&style.stroke!=='none')for(const subpath of path.subPaths) {
   const radius=Math.max(.6,Number(style.strokeWidth)/2);
   const points=subpath.getPoints(100).map(point=>{const x=point.x-120,y=120-point.y;return new THREE.Vector3(x,y,surface(x,y)+offset+radius);});
   if(points.length<2)continue;
   const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,false,'centripetal'),Math.min(300,points.length*3),radius,8,false);
   group.add(new THREE.Mesh(geometry,vinyl(style.stroke,Number(style.strokeOpacity??1)*Number(style.opacity??1),materials)));
  }
 }
}
function expressionEye(material) {
 const group=new THREE.Group();
 const oval=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),material);group.add(oval);
 const arcPoints=Array.from({length:25},(_,i)=>{const t=i/24*Math.PI;return new THREE.Vector3(-Math.cos(t)*24,Math.sin(t)*13-5,0);});
 const arc=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPoints),32,4,10,false),material);group.add(arc);
 const shape=new THREE.Shape();shape.moveTo(0,-23);shape.bezierCurveTo(-45,4,-25,35,0,14);shape.bezierCurveTo(25,35,45,4,0,-23);
 const heart=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:5,bevelEnabled:true,bevelSize:2,bevelThickness:2,bevelSegments:3,steps:1}),material);group.add(heart);
 const cross=new THREE.Group();for(const angle of [-Math.PI/4,Math.PI/4]){const bar=new THREE.Mesh(new THREE.CapsuleGeometry(4,36,4,12),material);bar.rotation.z=angle;cross.add(bar);}group.add(cross);
 return {group,oval,arc,heart,cross};
}

export function createGlossyPreview(container,face,readConfig) {
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Glossy 3D avatar');
 container.appendChild(renderer.domElement);
 const expressionLabel=document.createElement('span');expressionLabel.className='glossy-expression-label';expressionLabel.setAttribute('role','status');container.appendChild(expressionLabel);
 function updateExpressionLabel(){expressionLabel.textContent=document.querySelector(`button[data-action="${action}"]`)?.textContent||action;}
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
 let action='idle',actionStart=0;
 const randomActions=['success','failure','warning','surprise','love','inspect','bored'];
 let pointer={x:0,y:0};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const move=event=>{const box=container.getBoundingClientRect();pointer={x:(event.clientX-box.left)/box.width*2-1,y:(event.clientY-box.top)/box.height*2-1};};
 const leave=()=>{pointer={x:0,y:0};};
 container.addEventListener('pointermove',move);container.addEventListener('pointerleave',leave);
 function rebuild() {
  if(disposed)return;
  config=readConfig();updateExpressionLabel();bulb?.material.dispose();release(toy);bulb=undefined;
  const outline=face._parseHeadPoints(face._headShape.getAttribute('d')).map(p=>({x:(p.x-120)*.94,y:(120-p.y)*.94}));
  toy.add(new THREE.Mesh(bodyGeometry(face),paint(config.body)));
  eyes=[-1,1].map(side=>{
   const eye=expressionEye(paint(config.eyes));
   const x=side*(34+config.spacing);
   eye.group.position.set(x,-6,headSurface(outline,x,-6)+9);
   toy.add(eye.group);return eye;
  });
  if(config.antenna&&!HEADWEAR.has(config.accessory)) {
   const crown=[];
   for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];if((a.x<=0&&b.x>0)||(b.x<=0&&a.x>0))crown.push(a.y-a.x*(b.y-a.y)/(b.x-a.x));}
   const top=Math.max(...crown);
   const stem=new THREE.Mesh(new THREE.CylinderGeometry(4,5,28,16),paint(config.body));stem.position.set(0,top+8,0);toy.add(stem);
   bulb=new THREE.Mesh(new THREE.SphereGeometry(15,24,20),vinyl(config.body,1,materials));bulb.material=bulb.material.clone();bulb.position.set(0,top+28,0);toy.add(bulb);
  }
  addAccessories(toy,face,config,materials,outline);
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
  const elapsed=deterministic?time:Math.max(0,time-actionStart);
  const pulse=motion?Math.sin(elapsed/350):0;
  const blink=motion&&time%4000>1700&&time%4000<1900?.1:1;
  eyes.forEach((eye,index)=>{
   const size=config.eyeSize/100,side=index?1:-1;
   eye.group.scale.setScalar(size);eye.group.rotation.z=0;
   eye.oval.visible=true;eye.arc.visible=eye.heart.visible=eye.cross.visible=false;
   let width=27,height=29*blink;
   if(action==='sleep'){height=2;toy.rotation.z=motion?.08:0;}
   if(action==='bored')height=10;
   if(action==='failure'){height=16;eye.group.rotation.z=side*.25;}
   if(action==='warning'||action==='angry'){height=12;eye.group.rotation.z=-side*.3;}
   if(action==='surprise'){width=31;height=36*blink;}
   if(action==='inspect'){width=index?29:19;height=index?32:14;}
   if(action==='input'){height=12+(motion?Math.abs(pulse)*8:0);}
   if(action==='waiting'||action==='waiting-wrap'){width=19;height=19;toy.rotation.z=motion?pulse*.08:0;}
   if(action==='success'){eye.oval.visible=false;eye.arc.visible=true;}
   if(action==='love'){eye.oval.visible=false;eye.heart.visible=true;}
   if(action==='error'){eye.oval.visible=false;eye.cross.visible=true;}
   eye.oval.scale.set(width,Math.max(2,height),8);
  });
  if(motion&&(config.loop||elapsed<1800)) {
   if(action==='send')toy.rotation.x+=Math.sin(elapsed/180)*.18;
   if(action==='failure'||action==='error')toy.rotation.y+=Math.sin(elapsed/100)*.12;
   if(action==='success'||action==='love')toy.position.y+=Math.abs(pulse)*6;
  }
  renderer.render(scene,camera);
 }
 function tick(time) {
  if(disposed)return;
  // Static reduced-motion views redraw on edits, expressions, resize, or preference changes.
  if(active&&!document.hidden&&!exporting&&!reduced.matches&&config.motion!=='reduce')render(time);
  frame=requestAnimationFrame(tick);
 }
 const motionPreferenceChanged=()=>{if(active&&!exporting)render(performance.now());};
 reduced.addEventListener('change',motionPreferenceChanged);
 const resize=new ResizeObserver(()=>{
  const {width,height}=container.getBoundingClientRect();
  if(width&&height){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();render(0);}
 });resize.observe(container);
 rebuild();frame=requestAnimationFrame(tick);
 return {
  update:rebuild,
  play(value){action=value==='random'?randomActions[Math.floor(Math.random()*randomActions.length)]:value==='wake'?'idle':value;actionStart=performance.now();updateExpressionLabel();render(actionStart);},
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
  dispose(){disposed=true;reduced.removeEventListener('change',motionPreferenceChanged);cancelAnimationFrame(frame);resize.disconnect();container.removeEventListener('pointermove',move);container.removeEventListener('pointerleave',leave);bulb?.material.dispose();release(toy);for(const material of materials.values())material.dispose();materials.clear();environment.dispose();renderer.dispose();renderer.domElement.remove();expressionLabel.remove();}
 };
}

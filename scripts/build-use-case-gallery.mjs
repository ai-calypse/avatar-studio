// Documentation-only mockups composed from MCP-generated avatar assets.
// Run after `npm ci --prefix mcp --ignore-scripts`.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../mcp/package.json',import.meta.url));
const {Resvg}=require('@resvg/resvg-js');
const output=path.join(root,'docs/use-cases');
mkdirSync(output,{recursive:true});
const groups=[
 ['identity','Profiles and communities',[
  ['user-profile','User profile','profile','Your own recognizable account picture.','create_avatar','Alex Morgan','Designer & builder'],
  ['team-chat','Team chat','chat','Recognizable faces beside every message.','create_avatar_batch','Design team','Looks good. Ready to ship.'],
  ['comments','Comments and replies','chat','Give authors a consistent identity.','generate_identity','Project feedback','Thanks for the thoughtful review.'],
  ['forum','Community forum','list','Pseudonymous profiles without photo uploads.','generate_identity','Community members','Contributors'],
  ['directory','Team directory','list','Create a coordinated set of team avatars.','create_avatar_batch','People directory','Engineering team'],
  ['notifications','Notification sender','chat','Distinguish people, bots, and app events.','create_avatar','Inbox','Your weekly summary is ready.']]],
 ['assistants','Assistants and support',[
  ['copilot','Product copilot','assistant','Embed a companion beside useful suggestions.','create_avatar_component','Workspace copilot','What shall we build today?'],
  ['support','Support chat','chat','Use a friendly identity for support agents.','create_avatar_component','Support','How can I help you today?'],
  ['command','Command palette','assistant','Give your in-app assistant a face.','npm component','Quick actions','Find a project or ask a question.'],
  ['onboarding','Onboarding guide','assistant','Explain the next step with a character.','create_expression_pack','Welcome aboard','Create your first workspace.'],
  ['docs-guide','Documentation guide','assistant','Add a recognizable guide to documentation.','npm component','Documentation','Need an example? Start here.'],
  ['extension','Browser extension','assistant','Fit a tiny helper into an extension popup.','npm component','Page assistant','Summarize this page.']]],
 ['presence','Presence and workflow states',[
  ['neutral','No presence badge','status','Use the avatar without a state indicator.','create_avatar','Alex Morgan','Profile only','none'],
  ['online','Online presence','status','Show an available person or assistant.','create_avatar','Available','Ready to collaborate','online'],
  ['away','Away or idle','status','Show a temporary absence with a badge.','create_avatar','Away','Back in a little while','away'],
  ['busy','Busy or processing','status','Show an agent working on a request.','create_avatar','Busy','Preparing your results','busy'],
  ['offline','Offline presence','status','Keep unavailable users visible in a roster.','create_avatar','Offline','Last seen yesterday','offline'],
  ['outcomes','Success and error feedback','expressions','Map avatar expressions to app outcomes.','create_expression_pack','Task states','Your app owns the state mapping.']]],
 ['collaboration','Collaboration and work',[
  ['kanban','Task assignees','workflow','Identify owners on a project board.','create_avatar_batch','Sprint board','Assigned tasks'],
  ['editors','Document collaborators','list','Show people currently editing a document.','create_avatar_batch','Project brief','Collaborating now'],
  ['reviewers','Code review participants','list','Show authors and reviewers near changes.','generate_identity','Code review','Review requested'],
  ['calendar','Meeting attendees','list','Represent invitees in calendar events.','create_avatar_batch','Design sync','Tuesday - 10:00'],
  ['crm','Contact directory','profile','Give contact records a default identity.','generate_identity','Morgan Lee','Customer success'],
  ['agent-team','Multi-agent team','variants','Differentiate agents while preserving brand colors.','create_avatar_variants','Agent team','Planner / Builder / Reviewer']]],
 ['branding','Branding and product identity',[
  ['app-icon','App icon concept','brand','Start an icon design from a robot mascot.','create_avatar','Little Lab','App identity concept'],
  ['project-logo','Project logo','brand','Give side projects an expressive visual mark.','create_avatar','Orbit Notes','A little space for your ideas'],
  ['favicon','Favicon source','brand','Export SVG or PNG as a favicon source.','create_avatar','Project identity','128 / 64 / 32 pixel exports'],
  ['mobile','Mobile account screen','profile','Use exported assets in a native app.','create_avatar','Your account','Profile and preferences'],
  ['email','Email signature','email','Add a personal mark to your signature.','SVG / PNG export','Alex Morgan','Designer - Little Lab'],
  ['slides','Speaker and slide identity','profile','Use a consistent avatar in presentations.','SVG / PNG export','Meet the speaker','Building thoughtful products']]],
 ['content','Content and community identity',[
  ['portfolio','Portfolio identity','profile','Carry your avatar across a personal site.','SVG / PNG export','Alex makes things','Selected work / About / Contact'],
  ['stream','Streaming channel identity','brand','Use an avatar as a channel identity asset.','GIF / PNG export','Creative live','Offline channel art concept'],
  ['newsletter','Newsletter author','email','Show the author in newsletter headers.','PNG export','Notes from Alex','Issue 024 - Small useful ideas'],
  ['social','Social profile picture','profile','Upload a profile image where supported.','PNG export','@alexmakes','Designer, builder, curious human'],
  ['members','Membership cards','profile','Personalize fictional community member cards.','create_avatar_batch','Member 024','Founding community member'],
  ['launch','Launch and milestone graphics','brand','Add a mascot to launch announcements.','SVG / GIF export','We shipped it','Version 1.0 is here']]],
 ['learning','Games and learning',[
  ['character','Game character portrait','game','Give players a customizable portrait.','create_avatar','Player one','Level 12 - Explorer'],
  ['leaderboard','Leaderboard players','list','Use repeatable avatars beside player scores.','generate_identity','Weekly leaderboard','Top explorers'],
  ['tutor','Learning companion','assistant','Add a character beside lesson guidance.','create_avatar_component','Learning guide','One step at a time. You have this.'],
  ['quiz','Quiz feedback','expressions','Celebrate answers or show retry feedback.','create_expression_pack','Practice round','Choose expressions in your app.'],
  ['achievement','Achievement card','game','Personalize an achievement illustration.','create_avatar','First milestone','You completed five lessons.'],
  ['collectibles','Collectible character cards','variants','Generate visual character collections.','create_avatar_variants','Character collection','Six looks / One brand palette']]],
 ['developer','Developer and agent workflows',[
  ['identicons','Repeatable default identities','fixture','Generate a stable look from an opaque ID.','generate_identity','User 2048','Same ID -> Same saved config'],
  ['brand-kit','Brand-matched variants','variants','Keep colors fixed while varying accessories.','suggest_brand_palette + create_avatar_variants','Brand kit','Consistent colors, different roles'],
  ['expression-pack','Expression asset pack','expressions','Export six named states for app logic.','create_expression_pack','Expression pack','Idle / Happy / Sad / Angry / Sleep / Surprise'],
  ['sprites','Sprite sheet coordinates','sprites','Use frame coordinates in canvas or games.','create_sprite_sheet','Sprite sheet','512 x 256 / Eight named frames'],
  ['fixtures','Demo and test fixtures','list','Create named users for mock interfaces.','create_avatar_batch','Test fixtures','user-001 / user-002 / user-003'],
  ['interactive','Interactive browser component','assistant','Generate npm integration code for live controls.','create_avatar_component','Live component','Pointer follow / Loops / Gestures']]]
];
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text=(x,y,value,size=12,color='#334740',weight=400)=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}">${escape(value)}</text>`;
const rect=(x,y,w,h,color='#ffffff',radius=10)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${color}"/>`;
const asset=file=>`data:image/${file.endsWith('.png')?'png':'svg+xml'};base64,${readFileSync(path.join(root,file)).toString('base64')}`;
const image=(file,x,y,w,h=w)=>`<image href="${asset(file)}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const avatars=['docs/examples/fox.svg','docs/examples/music.svg','docs/examples/wizard.svg','docs/examples/botanical.svg','docs/examples/classic.svg','docs/examples/royal.svg'];
const avatar=(i,x,y,size)=>image(avatars[i%avatars.length],x,y,size);
function scene(entry,index){
 const [,,type,,,heading,copy,status]=entry;
 let content=rect(0,0,316,152,'#f2f5f2');
 if(type==='profile') content+=rect(10,10,296,132)+avatar(index,20,34,82)+text(114,52,heading,14,'#243f34',700)+text(114,75,copy,10)+rect(114,89,100,22,'#e8f0e4')+text(127,104,'View profile',10);
 if(type==='chat') content+=avatar(index,12,30,42)+text(66,36,heading,12,'#243f34',700)+rect(66,47,236,43,'#e6eee5')+text(77,72,copy,10)+rect(14,112,286,26,'#ffffff')+text(24,129,'Write a message...',10,'#7b8980');
 if(type==='list'||type==='workflow'){
  content+=text(14,22,heading,12,'#243f34',700);
  for(let i=0;i<3;i++){const y=32+i*37;content+=rect(10,y,296,33)+avatar(index+i,type==='workflow'?267:16,y+2,29)+text(type==='workflow'?20:56,y+15,type==='workflow'?['Plan the launch','Review the design','Build the prototype'][i]:['Alex Morgan','Jamie Chen','Sam Rivera'][i],11,'#30463c',600)+text(type==='workflow'?20:56,y+27,i===0?copy:['Contributor','Team member'][i-1],9,'#7b8980');}
 }
 if(type==='assistant')content+=avatar(index,12,33,65)+text(91,28,heading,12,'#243f34',700)+rect(89,40,213,49,'#e4eddf')+text(100,64,copy,10)+rect(92,104,194,25)+text(103,121,'Ask a question...',10,'#7b8980');
 if(type==='status')content+=image('docs/use-cases/assets/presence-'+status+'.svg',16,18,110)+text(143,62,heading,18,'#243f34',700)+text(143,84,copy,11)+text(143,108,'Badge: '+status,10,'#7b8980');
 if(type==='brand')content+=avatar(index,16,25,96)+text(130,47,heading,16,'#243f34',700)+text(130,69,copy,10)+avatar(index,132,86,30)+avatar(index,179,80,42)+avatar(index,239,72,57);
 if(type==='email')content+=avatar(index,14,13,35)+text(58,27,heading,12,'#243f34',700)+text(58,42,'hello@example.test',10,'#7b8980')+rect(14,60,280,4,'#dce5dd',2)+rect(14,72,242,4,'#dce5dd',2)+avatar(index,14,98,40)+text(64,113,copy,11)+text(64,131,'A small signature. A familiar face.',9,'#7b8980');
 if(type==='game')content+=rect(12,12,292,128,'#e6ecf3')+avatar(index,24,29,89)+text(133,46,heading,15,'#334261',700)+text(133,70,copy,10)+rect(134,91,143,10,'#d2dbe9',5)+rect(134,91,98,10,'#889dca',5)+text(133,122,'Progress: 68%',10);
 if(type==='expressions')for(let i=0;i<6;i++)content+=image('docs/use-cases/assets/expression-'+['idle','happy','sad','angry','sleep','surprise'][i]+'.svg',13+i*50,30,42)+text(14+i*50,103,['idle','happy','sad','angry','sleep','surprise'][i],9)+text(i===0?15:-500,132,i===0?'Six static states. App chooses the next state.':'',10,'#7b8980');
 if(type==='variants')for(let i=0;i<6;i++)content+=image('docs/use-cases/assets/variant-'+i+'.svg',14+i*50,35,43)+text(i===0?15:-500,126,i===0?copy:'',10,'#7b8980');
 if(type==='sprites')content+=image('docs/examples/gallery.png',14,10,260,130)+text(275,48,'x / y',10)+text(275,70,'128px',10)+text(275,92,'cells',10);
 if(type==='fixture')content+=image('docs/use-cases/assets/identity.svg',32,23,82)+image('docs/use-cases/assets/identity.svg',198,23,82)+text(129,68,'same',12,'#7b8980')+text(20,125,'Opaque user ID -> saved avatar config',11);
 return content;
}
const manifest=[];
for(const [group,title,cases] of groups){
 let board=rect(0,0,1080,558,'#f5f5ef',0)+text(24,38,title,25,'#193a2f',700)+text(24,60,'Illustrative app mockups using real Avatar Studio exports',12,'#718277');
 for(const [i,entry] of cases.entries()){
  const [id,label,type,description,tool]=entry;
  const panel=rect(0,0,336,218)+text(14,26,label,15,'#243f34',700)+`<g transform="translate(10 40)">${scene(entry,i)}</g>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="336" height="218" role="img" aria-label="${escape(label)} mockup">${panel}</svg>`;
  writeFileSync(path.join(output,id+'.svg'),svg);
  const x=24+(i%3)*348,y=80+Math.floor(i/3)*234;
  board+=`<g transform="translate(${x} ${y})">${panel}</g>`;
  manifest.push({id,label,group,type,description,tool,preview:id+'.svg'});
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="558" role="img" aria-label="${escape(title)}">${board}</svg>`;
 writeFileSync(path.join(output,group+'.svg'),svg);
 writeFileSync(path.join(output,group+'.png'),new Resvg(svg,{font:{loadSystemFonts:true,defaultFontFamily:'Arial'}}).render().asPng());
}
writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const readmeFile=path.join(root,'README.md');
let readme=readFileSync(readmeFile,'utf8');
const sections=['## Avatars in real applications','', '**48 illustrated use cases**, from account profiles to agent workflows. These are documentation mockups made with real avatar exports, not bundled integrations. Your application supplies messaging, presence, notifications, accounts, game logic, and state transitions. Platform support for animated profile images varies; use PNG when GIF is not supported.',''];
for(const [id,title,cases] of groups){
 sections.push(`### ${title}`,'',`![${title}: six avatar use cases](docs/use-cases/${id}.png)`,'','| Example | How to use it | Tool or export |','| --- | --- | --- |');
 for(const [key,label,,description,tool] of cases)sections.push(`| [${label}](docs/use-cases/${key}.svg) | ${description} | \`${tool}\` |`);
 sections.push('');
}
sections.push('### Choose an integration','', '| Need | Use |', '| --- | --- |', '| A profile picture, logo, signature, slide, or native app asset | Website SVG/PNG/GIF downloads, npm `exportAvatar`, or MCP `create_avatar`. |', '| Animated browser avatars with actions, cursor following, gestures, and looping | npm `configureAvatar` or MCP `create_avatar_component` for integration code. |', '| Named users or a team set | `create_avatar_batch`. |', '| Repeatable default avatars | `generate_identity`; pass an opaque ID and persist its returned config. It is not authentication or an anonymity guarantee. |', '| A consistent brand palette and variations | `suggest_brand_palette` then `create_avatar_variants`. |', '| Six image poses for application states | `create_expression_pack`; your app controls when to display each pose. |', '| A canvas/game atlas with frame coordinates | `create_sprite_sheet`; the app implements rendering and animation. |', '| Discover controls or validate agent-generated settings | `get_capabilities`, `list_accessories`, and `validate_avatar`. |','', 'See the [MCP-generated live component configuration](docs/use-cases/assets/interactive-component.json) for looping, pointer-following, and antenna flash settings. Source: [48 use-case definitions](docs/use-cases/manifest.json), [MCP export metadata](docs/use-cases/assets/manifest.json), and [the gallery builder](scripts/build-use-case-gallery.mjs). After installing MCP dependencies, run `node scripts/build-use-case-gallery.mjs` to rebuild the mockups. PNG previews are committed so GitHub can display them directly.','');
const start=readme.indexOf('## Avatars in real applications');
if(start>=0)readme=readme.slice(0,start)+readme.slice(readme.indexOf('## Run the website',start));
readme=readme.replace('## Run the website',sections.join('\n')+'\n## Run the website');
writeFileSync(readmeFile,readme);
console.log('Built 48 use-case SVGs and 8 PNG overview boards.');

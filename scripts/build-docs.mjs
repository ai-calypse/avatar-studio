import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Marked} from 'marked';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo='https://github.com/ai-calypse/avatar-studio/blob/main/';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const slug=value=>value.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
const section=(source,title)=>{
 const marker=`\n## ${title}\n`;
 const start=source.indexOf(marker);
 if(start<0)throw Error(`Missing documentation section: ${title}`);
 const end=source.indexOf('\n## ',start+marker.length);
 return source.slice(start,end<0?undefined:end);
};
export async function buildDocs(output=path.join(root,'docs'),{pages=false}={}){
 await mkdir(output,{recursive:true});
 const [readme,mcp,security]=await Promise.all(['README.md','mcp/README.md','mcp/SECURITY.md'].map(file=>readFile(path.join(root,file),'utf8')));
 const definitions=[
  {id:'index',editSource:'scripts/build-docs.mjs',title:'Start here',group:'Getting started',description:'Choose the right way to create and use your avatar.',source:'README.md',markdown:`## One avatar, three ways to use it\n\nCreate a personalized robot for your profile, team, product, or assistant. Use the browser creator for downloads, npm for interactive components, or the local MCP server for agent-generated assets.\n\n| I want to… | Start with |\n| --- | --- |\n| Customize and download an avatar | [Creator guide](creator.html) |\n| Embed a live avatar in an application | [npm integration](npm.html) |\n| Let a coding agent generate avatars | [MCP setup and tools](mcp.html) |\n| Browse designs and real application ideas | [Examples and use cases](examples.html) |\n\n## Quick start\n\nOpen [the creator](${pages?'../':'../demo/'}) to design and export an avatar without an account. For local development:\n\n\`\`\`sh\ngit clone https://github.com/ai-calypse/avatar-studio.git\ncd avatar-studio\nnpm ci\nnpm run dev\n\`\`\`\n\n## What is included\n\n- 50 accessories, independent colors, eye controls, and classic or seeded fluid shapes.\n- SVG, PNG, and GIF exports; frames, padding, and presence badges through export APIs.\n- Live expressions, cursor following, gestures, antenna blinking, and looping in the browser component.\n- 11 local MCP tools for identities, batches, brand variants, expression packs, and sprite sheets.\n\n## Versions and languages\n\nThe advanced control API requires npm **0.2.0+** or a local checkout. The currently published npm release is **0.1.0**; see the [npm guide](npm.html) before choosing an installation. MCP is **0.4.0**.\n\nThe creator supports nine interface languages. Documentation is maintained in English. Use the header language menu to open a full-page translation through Google Translate; code and identifiers remain in English. Brand names, identifiers, and code remain literal.\n\n## Open source\n\nBuilt on [Agent Robot Avatar by CX ArtLab](https://github.com/CX-ArtLab/agent-robot-avatar). Avatar Studio is MIT licensed. [Contributing and deployment](contributing.html) explains development, attribution, translations, and GitHub Pages.\n`},
  {id:'creator',title:'Use the creator',group:'Getting started',description:'Appearance, movement, downloads, and language selection.',source:'README.md',markdown:section(readme,'Run the website')+section(readme,'Glossy 3D preview')},
  {id:'npm',title:'npm integration',group:'Build with avatars',description:'Install the component, configure behavior, and export images.',source:'README.md',markdown:'> The published npm release is currently 0.1.0. The complete control helpers below require 0.2.0+ or a local checkout.\n\n'+section(readme,'npm package for applications')+section(readme,'Complete control API (npm 0.2.0+)')},
  {id:'mcp',title:'MCP setup and tools',group:'Build with avatars',description:'Connect your agent and use all 11 local tools.',source:'mcp/README.md',markdown:mcp.replace(/^# .*\n/,'')},
  {id:'reference',title:'Controls and formats',group:'Build with avatars',description:'Configuration ranges, supported formats, and image versus live behavior.',source:'README.md',markdown:readme.slice(readme.indexOf('### Configuration controls'),readme.indexOf('### Security model'))+section(readme,'Complete control API (npm 0.2.0+)')},
  {id:'examples',title:'Examples and use cases',group:'Explore',description:'8 glossy 3D examples, 24 SVG GIF designs, and 48 illustrated application ideas.',source:'README.md',markdown:section(readme,'Glossy 3D examples')+section(readme,'Avatar examples')+section(readme,'Avatars in real applications')},
  {id:'security',title:'Security boundaries',group:'Project',description:'Local transport, input limits, isolation, and deployment responsibilities.',source:'mcp/SECURITY.md',markdown:security.replace(/^# .*\n/,'')},
  {id:'contributing',title:'Contributing and deployment',group:'Project',description:'Checks, translation catalogs, Pages publishing, and attribution.',source:'README.md',markdown:section(readme,'Development checks')+section(readme,'Contributing and security')+section(readme,'Attribution and license')}
 ];
 const search=[];
 for(const page of definitions){
  const toc=[],counts=new Map();
  const markdown=new Marked({gfm:true,renderer:{
   heading({tokens,depth,text}){
    const base=slug(text)||'section';const count=counts.get(base)||0;counts.set(base,count+1);const id=base+(count?`-${count}`:'');
    const label=text.replace(/[`*_]/g,'');toc.push({id,label,depth});
    return `<h${Math.max(2,depth)} id="${id}">${this.parser.parseInline(tokens)}<a class="heading-anchor" href="#${id}" aria-label="Link to ${escape(label)}">#</a></h${Math.max(2,depth)}>`;
   },
   html({text}){return /^<br\s*\/?\s*>$/i.test(text.trim())?'<br>':escape(text);},
   codespan({text}){return `<code translate="no" class="notranslate">${escape(text)}</code>`;},
   code({text,lang}){return `<div class="code-block"><div class="code-label">${escape(lang||'Code')}<button type="button" class="copy-code">Copy</button></div><pre translate="no" class="notranslate"><code>${escape(text)}</code></pre></div>`;},
   image({href,text}){return `<img src="${escape(resolveLink(href,page.source))}" alt="${escape(text)}" loading="lazy" decoding="async">`;},
   link({href,tokens}){const target=resolveLink(href,page.source);return `<a href="${escape(target)}"${target.startsWith('https://')?' rel="noopener noreferrer"':''}>${this.parser.parseInline(tokens)}</a>`;}
  }});
  const body=markdown.parse(page.markdown).replaceAll('<table>','<div class="table-wrap"><table>').replaceAll('</table>','</table></div>');
  const nav=definitions.map((item,i)=>`${i===0||item.group!==definitions[i-1].group?`<p class="nav-group">${escape(item.group)}</p>`:''}<a href="${item.id==='index'?'./':item.id+'.html'}"${page.id===item.id?' aria-current="page"':''}>${escape(item.title)}</a>`).join('');
  const index=definitions.indexOf(page);
  const adjacent=offset=>{const item=definitions[index+offset];return item?`<a href="${item.id==='index'?'./':item.id+'.html'}"><span>${offset<0?'Previous':'Next'}</span>${escape(item.title)} ${offset<0?'':'→'}</a>`:'';};
  const canonical=`https://ai-calypse.github.io/avatar-studio/docs/${page.id==='index'?'':page.id+'.html'}`;
  const locales={en:'English',es:'Español',fr:'Français',de:'Deutsch',pt:'Português',ja:'日本語',ko:'한국어','zh-CN':'简体中文','zh-TW':'繁體中文',ar:'العربية',hi:'हिन्दी',uk:'Українська'};
  const translateMenu=`<details class="docs-translation"><summary>Language</summary><div class="translation-panel"><label for="docs-language">Documentation language</label><select id="docs-language" translate="no" class="notranslate">${Object.entries(locales).map(([code,label])=>`<option value="${code}">${label}</option>`).join('')}</select><a class="docs-translate-link" href="${canonical}" target="_blank" rel="noopener noreferrer">Read original English ↗</a><a class="docs-more-languages" href="https://translate.google.com/translate?sl=en&amp;tl=es&amp;u=${encodeURIComponent(canonical)}" target="_blank" rel="noopener noreferrer">More languages ↗</a><small>Full-page translations open in Google Translate. Use Google’s language menu for more languages. Code and identifiers stay in English. Text inside example images stays as drawn.</small></div></details>`;
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)} — Avatar Studio Docs</title><meta name="description" content="${escape(page.description)}"><link rel="stylesheet" href="./docs.css"><script type="module" src="./docs.js"></script></head><body><a class="skip-link" href="#content">Skip to content</a><header class="docs-header"><a class="brand" href="${pages?'../':'../demo/'}"><span class="brand-mark">a·</span> avatar studio <span class="docs-label">/ docs</span></a><nav aria-label="Documentation header"><a href="${pages?'../':'../demo/'}">Open creator ↗</a><a href="https://github.com/ai-calypse/avatar-studio">GitHub ↗</a>${translateMenu}<button class="search-open" type="button">Search docs <kbd>⌘ K</kbd></button><button class="menu-toggle" type="button" aria-controls="docs-sidebar" aria-expanded="false">Menu</button></nav></header><div class="docs-layout"><aside id="docs-sidebar"><nav aria-label="Documentation pages">${nav}</nav><div class="sidebar-note">Open source. Browser first.<br>Full-page translation available from the language menu.</div></aside><main id="content" tabindex="-1"><div class="breadcrumb">DOCUMENTATION <span>/ ${escape(page.group)}</span></div><h1>${escape(page.title)}</h1><p class="page-description">${escape(page.description)}</p><article>${body}</article><div class="page-footer"><a href="${repo+(page.editSource||page.source)}">Edit source on GitHub ↗</a><span>Generated from the project guides.</span></div><nav class="pagination" aria-label="Adjacent pages">${adjacent(-1)}${adjacent(1)}</nav></main><aside class="on-this-page"><p>On this page</p><nav aria-label="On this page">${toc.map(item=>`<a class="depth-${item.depth}" href="#${item.id}">${escape(item.label)}</a>`).join('')}</nav></aside></div><dialog id="docs-search" aria-labelledby="search-title"><div class="search-heading"><h2 id="search-title">Search documentation</h2><button type="button" class="search-close" aria-label="Close search">×</button></div><label for="docs-query">Search guides, tools, and examples</label><input id="docs-query" type="search" placeholder="Try: sprite sheet, GIF, MCP…" autocomplete="off"><p id="search-status" role="status"></p><ul id="search-results"></ul></dialog></body></html>`;
  await writeFile(path.join(output,page.id+'.html'),html);
  search.push({title:page.title,url:page.id==='index'?'./':page.id+'.html',excerpt:page.description});
  let headingIndex=0,currentEntry;
  for(const token of markdown.lexer(page.markdown)){
   if(token.type==='heading'){
    const item=toc[headingIndex++];
    currentEntry={title:item.label,url:(page.id==='index'?'index.html':page.id+'.html')+'#'+item.id,excerpt:page.title,content:''};
    search.push(currentEntry);
   }else if(currentEntry)currentEntry.content+=token.raw+'\n';
  }
 }
 await writeFile(path.join(output,'search-index.json'),JSON.stringify(search));
 console.log(`Built ${definitions.length} documentation pages.`);
}
function resolveLink(href,source){
 if(!href)return '#';
 if(/^https?:\/\//.test(href)||href.startsWith('#'))return href;
 if(/^[a-z]+:/i.test(href)||href.startsWith('//'))return '#';
 // Page-local links introduced by the docs landing page.
 if(/^(?:\.\/|\.\.\/|[a-z-]+\.html)/.test(href)&&source==='README.md'&&!href.endsWith('.md'))return href;
 const [file,anchor]=href.split('#');const suffix=anchor?'#'+anchor:'';
 const relative=path.posix.normalize(path.posix.join(path.posix.dirname(source),file));
 if(relative.startsWith('docs/')&&!relative.endsWith('.md'))return './'+relative.slice(5)+suffix;
 const pages={'README.md':'index.html','mcp/README.md':'mcp.html','mcp/SECURITY.md':'security.html'};
 if(pages[relative])return pages[relative]+suffix;
 return repo+relative+suffix;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await buildDocs();

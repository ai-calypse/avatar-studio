const dialog=document.getElementById('docs-search');
const query=document.getElementById('docs-query');
const results=document.getElementById('search-results');
const status=document.getElementById('search-status');
let index;
async function search(){
 try{
  if(!index){const response=await fetch('./search-index.json');if(!response.ok)throw Error('Search unavailable');index=await response.json();}
  const words=query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches=index.filter(item=>words.length?words.every(word=>(item.title+' '+item.excerpt+' '+(item.content||'')).toLowerCase().includes(word)):!item.url.includes('#')).sort((a,b)=>Number(words.every(word=>b.title.toLowerCase().includes(word)))-Number(words.every(word=>a.title.toLowerCase().includes(word)))).slice(0,16);
  results.replaceChildren(...matches.map(item=>{
   const li=document.createElement('li'),link=document.createElement('a'),detail=document.createElement('small');
   link.href=item.url;link.textContent=item.title;detail.textContent=item.excerpt;link.appendChild(detail);li.appendChild(link);return li;
  }));
  status.textContent=matches.length?`${matches.length} results. Use Tab to choose a page.`:'No matches. Try a tool name or format.';
 }catch{status.textContent='Search is unavailable. Use the page navigation instead.';}
}
function openSearch(){if(!dialog.open)dialog.showModal();query.focus();void search();}
document.querySelector('.search-open').addEventListener('click',openSearch);
document.querySelector('.search-close').addEventListener('click',()=>dialog.close());
query.addEventListener('input',search);
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}});
const menu=document.querySelector('.menu-toggle');
menu.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');}});
for(const button of document.querySelectorAll('.copy-code'))button.addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(button.closest('.code-block').querySelector('code').textContent);button.textContent='Copied';}
 catch{button.textContent='Select code to copy';}
 setTimeout(()=>{button.textContent='Copy';},2000);
});

// Full-page translation is opt-in. No third-party scripts or requests load here.
const language=document.getElementById('docs-language');
const translatedPage=document.querySelector('.docs-translate-link');
const moreLanguages=document.querySelector('.docs-more-languages');
const translationMenu=document.querySelector('.docs-translation');
const parameters=new URL(location.href).searchParams;
const locale=parameters.get('lang')||parameters.get('_x_tr_tl');
if([...language.options].some(option=>option.value===locale))language.value=locale;
function updateTranslation(){
 const file=location.pathname.split('/').pop();
 const page=/^(index|creator|npm|mcp|reference|examples|security|contributing)\.html$/.test(file)?file:'';
 const source=new URL(page,'https://ai-calypse.github.io/avatar-studio/docs/');source.hash=location.hash;
 const target=new URL('https://translate.google.com/translate');
 target.searchParams.set('sl','en');target.searchParams.set('tl',language.value);target.searchParams.set('u',source.href);
 translatedPage.href=language.value==='en'?source.href:target.href;
 translatedPage.textContent=language.value==='en'?'Read original English ↗':'Translate page ↗';
 const chooser=new URL(target);
 if(language.value==='en')chooser.searchParams.set('tl','es');
 moreLanguages.href=chooser.href;
 const current=new URL(location.href);current.searchParams.set('lang',language.value);history.replaceState(null,'',current);
 for(const link of document.querySelectorAll('a[href]')){
  if(link===translatedPage||link===moreLanguages)continue;
  const destination=new URL(link.href);
  if(destination.origin!==location.origin||!destination.pathname.startsWith(location.pathname.replace(/[^/]*$/,''))||destination.hash&&destination.pathname===location.pathname)continue;
  if(destination.pathname.endsWith('/')||destination.pathname.endsWith('.html')){destination.searchParams.set('lang',language.value);link.href=destination.href;}
 }
}
language.addEventListener('change',updateTranslation);
window.addEventListener('hashchange',updateTranslation);
document.addEventListener('pointerdown',event=>{if(!translationMenu.contains(event.target))translationMenu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape')translationMenu.open=false;});
updateTranslation();

import { translations } from './avatar-studio-i18n.js';
import { useCaseLocales } from './avatar-studio-use-cases-i18n.js';

const groups = ['Profiles and communities', 'Assistants and support', 'Presence and workflow states', 'Collaboration and work', 'Branding and product identity', 'Content and community identity', 'Games and learning', 'Developer and agent workflows'];
const groupIds = ['identity', 'assistants', 'presence', 'collaboration', 'branding', 'content', 'learning', 'developer'];
const copy = ['Explore all 48 use cases', 'Illustrated examples from the README. These are mockups, not bundled integrations.', 'Find a use case', 'Search profiles, games, agents…', 'Category', 'All categories', 'examples', 'No examples match. Try another search.', 'Open all examples in Docs'];
const assets = new URL('../docs/use-cases/', import.meta.url);

for (const [locale, catalog] of Object.entries(useCaseLocales)) {
 for (const [sources,values] of [[copy,catalog.copy],[groups,catalog.groups]]) {
  if (sources.length !== values.length) throw Error(`Incomplete use-case locale: ${locale}`);
  sources.forEach((source,i)=>{translations[locale][source]=values[i];});
 }
}

export async function mountUseCases(showcase) {
 const section = document.createElement('section');
 section.className = 'use-case-gallery';
 section.innerHTML = '<h3>Explore all 48 use cases</h3><p>Illustrated examples from the README. These are mockups, not bundled integrations.</p><a class="use-case-docs">Open all examples in Docs</a>';
 section.querySelector('a').href = new URL('../examples.html#avatars-in-real-applications', assets).href;
 showcase.appendChild(section);
 try {
  const response = await fetch(new URL('manifest.json', assets));
  if (!response.ok) throw Error('Use cases unavailable');
  const cases = await response.json();
  for (const [locale, catalog] of Object.entries(useCaseLocales)) {
   const dictionary = translations[locale];
   for (const [sources, values] of [[cases.map(item=>item.label),catalog.labels]]) {
    if (sources.length !== values.length) throw Error(`Incomplete use-case locale: ${locale}`);
    sources.forEach((source,i)=>{dictionary[source]=values[i];});
   }
  }
  const filters=document.createElement('div');
  filters.className='use-case-filters';
  filters.innerHTML='<label>Find a use case<input type="search" placeholder="Search profiles, games, agents…"></label><label>Category<select aria-label="Category"><option value="all">All categories</option></select></label><p role="status"><code class="use-case-count"></code> <span>examples</span></p>';
  const picker=filters.querySelector('select');
  groups.forEach((label,i)=>picker.add(new Option(label,groupIds[i])));
  const grid=document.createElement('div');grid.className='use-case-grid';
  const cards=cases.map(item=>{
   if(!/^[a-z0-9-]+\.svg$/.test(item.preview)||!groupIds.includes(item.group))throw Error('Invalid use-case preview');
   const card=document.createElement('article'),link=document.createElement('a'),image=document.createElement('img'),label=document.createElement('h4'),tool=document.createElement('code');
   card.className='use-case-example';card.dataset.useCase=item.id;
   link.href=new URL(item.preview,assets).href;
   image.src=link.href;image.alt='';image.loading='lazy';image.decoding='async';image.width=336;image.height=218;
   label.textContent=item.label;tool.textContent=item.tool;
   link.append(image,label);card.append(link,tool);grid.appendChild(card);return {card,item};
  });
  const empty=document.createElement('p');empty.className='use-case-empty';empty.textContent='No examples match. Try another search.';empty.hidden=true;
  section.append(filters,grid,empty);
  const search=filters.querySelector('input');
  function filter(){
   const query=search.value.toLocaleLowerCase().trim();let visible=0;
   for(const {card,item} of cards){
    const text=`${card.textContent} ${item.label} ${item.description}`.toLocaleLowerCase();
    card.hidden=(picker.value!=='all'&&picker.value!==item.group)||!text.includes(query);
    if(!card.hidden)visible++;
   }
   filters.querySelector('.use-case-count').textContent=String(visible);empty.hidden=visible!==0;
  }
  search.addEventListener('input',filter);picker.addEventListener('change',filter);filter();
 } catch {
  // The documentation link remains usable if the optional preview gallery cannot load.
 }
}

const queryInput = document.querySelector('#docs-query');
const resultsList = document.querySelector('#search-results');
const searchPanel = document.querySelector('#search-panel');
const searchCount = document.querySelector('#search-count');
let searchIndexPromise;
let searchSequence = 0;
const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function closeSearch() { searchPanel.hidden = true; queryInput.setAttribute('aria-expanded', 'false'); }
async function runSearch() {
  const sequence = ++searchSequence;
  const query = normalize(queryInput.value.trim());
  resultsList.replaceChildren();
  if (!query) { closeSearch(); return; }
  searchPanel.hidden = false;
  queryInput.setAttribute('aria-expanded', 'true');
  searchCount.textContent = 'Searching documentation…';
  try {
    const base = document.querySelector('meta[name="site-base"]')?.content || '';
    searchIndexPromise ??= fetch(`${base}/docs-search.json`).then(response => { if (!response.ok) throw new Error('Search index unavailable'); return response.json(); }).catch(error => { searchIndexPromise = undefined; throw error; });
    const index = await searchIndexPromise;
    if (sequence !== searchSequence) return;
    const words = query.split(/\s+/).filter(Boolean);
    const matches = index.map(item => {
      const title = normalize(item.title), page = normalize(item.page), text = normalize(item.text);
      if (!words.every(word => `${title} ${page} ${text}`.includes(word))) return null;
      return {item, score: words.reduce((sum,word) => sum + (title.includes(word) ? 8 : 0) + (page.includes(word) ? 4 : 0),0)};
    }).filter(Boolean).sort((a,b) => b.score-a.score).slice(0,12);
    searchCount.textContent = matches.length ? `${matches.length} results · use arrow keys to browse` : 'No results. Try “decal”, “packed map”, or “vertex lighting”.';
    for (const {item} of matches) {
      const li = document.createElement('li'), link = document.createElement('a');
      link.href = item.url;
      const title = document.createElement('strong'), page = document.createElement('small'), snippet = document.createElement('span');
      title.textContent = item.title; page.textContent = item.page;
      const pos = Math.max(0, normalize(item.text).indexOf(words[0]) - 45);
      snippet.textContent = (pos ? '…' : '') + item.text.slice(pos, pos+145) + (item.text.length>pos+145 ? '…' : '');
      link.append(title,page,snippet);li.append(link);resultsList.append(li);
    }
  } catch { if (sequence === searchSequence) searchCount.textContent = 'Search could not load. Use the navigation to browse, or try again.'; }
}
queryInput.addEventListener('input',runSearch);
queryInput.addEventListener('focus',() => { if(queryInput.value.trim()) runSearch(); });
document.addEventListener('keydown',event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='k') {event.preventDefault();queryInput.focus();queryInput.select();}
  if (event.key==='Escape') {closeSearch();closeSidebar();queryInput.blur();}
  if (!searchPanel.hidden && ['ArrowDown','ArrowUp'].includes(event.key) && (document.activeElement===queryInput || searchPanel.contains(document.activeElement))) {
    const links=Array.from(resultsList.querySelectorAll('a'));
    if (!links.length) return;
    event.preventDefault(); const index=links.indexOf(document.activeElement);
    if(event.key==='ArrowDown') links[(index+1)%links.length].focus();
    else if(index<=0) queryInput.focus(); else links[index-1].focus();
  }
});
document.addEventListener('click',event => { if (!event.target.closest('.docs-search')) closeSearch(); });
const sidebar = document.querySelector('#docs-sidebar');
const navToggle = document.querySelector('.nav-toggle');
function closeSidebar() {sidebar.classList.remove('is-open');navToggle.setAttribute('aria-expanded','false');}
navToggle.addEventListener('click',() => {const open=sidebar.classList.toggle('is-open');navToggle.setAttribute('aria-expanded',String(open));});
document.addEventListener('click',event => {if(!event.target.closest('#docs-sidebar') && !event.target.closest('.nav-toggle')) closeSidebar();});
document.querySelectorAll('.copy-code').forEach(button => button.addEventListener('click',async () => {
  const code = button.parentElement.querySelector('code').textContent;
  try {await navigator.clipboard.writeText(code);button.textContent='Copied';}
  catch {button.textContent='Select to copy';const range=document.createRange();range.selectNodeContents(button.parentElement.querySelector('code'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);}
  setTimeout(() => {button.textContent='Copy';},2000);
}));
if('IntersectionObserver' in window) {
 const sections = document.querySelectorAll('.doc-content h2[id]');
 const observer = new IntersectionObserver(entries => {for(const entry of entries) if(entry.isIntersecting) {document.querySelectorAll('.docs-toc>a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}, {rootMargin:'-15% 0px -65% 0px'});
 sections.forEach(section=>observer.observe(section));
}

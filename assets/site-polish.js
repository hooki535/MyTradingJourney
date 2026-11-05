/* Site navigation and presentation only. No account, history or trading writes. */
(() => {
 'use strict';
 const depth=document.body.dataset.publicPage==='home'?'':'../',asset=name=>depth+'assets/site-images/'+name+'.webp';
 const destinations=[
 ['Home','The story, the process and the bigger picture','index.html','Start here'],
 ['Overview','Return to your personal workspace','pages/journey.html#home','Workspace'],
 ['Backtesting Lab','Replay historical candles and study a setup','pages/backtesting.html#sessions','Practice'],
 ['Strategies','Keep your rules and checklists together','pages/backtesting.html#strategies','Practice'],
 ['Practice challenges','Explore your simulated study challenges','pages/backtesting.html#challenges','Practice'],
 ['Backtest analytics','Review your simulated trade evidence','pages/backtesting.html#analytics/all','Practice'],
 ['Trade Journal','Save decisions, screenshots and reflections','pages/journey.html#journal','Reflect'],
 ['Learning Library','Find a book and put one idea into action','pages/library.html','Learn'],
 ['Mindset & Vision','Give a meaningful goal a practical next step','pages/journey.html#mindset','Grow'],
 ['Builder’s Desk','Test an idea and keep the evidence','pages/journey.html#builder','Build'],
 ['Document Vault','Organize your private references and files','pages/journey.html#document','Collect'],
 ['Weekly Reviews','Choose what to keep, change and practice next','pages/journey.html#review','Reflect'],
 ['Field notes','Original notes for your trading and learning','pages/field-notes.html','Explore']
 ];
 function init(){
  const toolbar=document.querySelector('.bt-page-top,.journey-top,.learn-top,.reader-header-actions,.access-header,.ref-header');
  if(toolbar&&!document.getElementById('site-finder')){
   const button=document.createElement('button');button.id='site-finder';button.type='button';button.className='site-finder-button';button.innerHTML='<span aria-hidden="true">⌕</span> <span>Find a section</span><kbd>Ctrl K</kbd>';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-label','Find a section');button.title='Find a section · Ctrl/⌘ K';toolbar.append(button);
   const dialog=document.createElement('dialog');dialog.id='site-finder-dialog';dialog.setAttribute('aria-labelledby','site-finder-title');dialog.innerHTML='<header><div><small>MYTRADINGJOURNEY</small><h2 id="site-finder-title">Where would you like to go?</h2></div><button type="button" aria-label="Close section finder">×</button></header><label for="site-finder-search" class="site-finder-label">Search sections</label><input id="site-finder-search" type="search" placeholder="Try journal, books or replay…" autocomplete="off"><p id="site-finder-count" role="status" aria-live="polite"></p><nav id="site-finder-results" aria-label="Matching sections"></nav><footer>Jump between the tools in your workspace.</footer>';document.body.append(dialog);
   const input=dialog.querySelector('input'),results=dialog.querySelector('nav');let opener=button;
   function render(){const query=input.value.trim().toLowerCase(),rows=destinations.filter(row=>row.join(' ').toLowerCase().includes(query));results.replaceChildren();for(const [title,description,url,group] of rows){const link=document.createElement('a');link.href=depth+url;const label=document.createElement('strong'),copy=document.createElement('span'),tag=document.createElement('small');label.textContent=title;copy.textContent=description;tag.textContent=group+' ↗';link.append(label,copy,tag);link.addEventListener('click',()=>dialog.close());results.append(link);}dialog.querySelector('#site-finder-count').textContent=rows.length?rows.length+(rows.length===1?' section':' sections'):'No matching sections. Try a different word.';}
   function open(){if(document.querySelector('dialog[open]'))return;opener=document.activeElement;input.value='';render();dialog.showModal();input.focus();}
   button.addEventListener('click',open);dialog.querySelector('header button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
   input.addEventListener('input',render);dialog.addEventListener('keydown',e=>{e.stopPropagation();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dialog.close();return;}const links=[...results.querySelectorAll('a')];if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const i=links.indexOf(document.activeElement),next=e.key==='ArrowDown'?i+1:i-1;if(next<0)input.focus();else links[Math.min(links.length-1,next)]?.focus();}else if(e.key==='Enter'&&document.activeElement===input&&links.length){e.preventDefault();links[0].click();}});
   document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!e.altKey){if(dialog.open){e.preventDefault();dialog.close();}else if(!document.querySelector('dialog[open]')){e.preventDefault();open();}}});
  }
  if(document.body.dataset.page==='backtesting'){
   const sync=document.querySelector('.bt-sync-bar');if(sync){const banner=document.createElement('section');banner.className='site-lab-banner';banner.setAttribute('aria-label','Your research workflow');sync.after(banner);
    const views={sessions:['Build a question. Keep the evidence.','Prepare a session, replay without future candles, and review your decisions.','eurusd-study'],strategies:['Make the setup repeatable.','Keep entry conditions, invalidation and your review checklist together.','reading-materials'],challenges:['Practice within a clear boundary.','Use simulated challenges to study your process and consistency.','quiet-desk'],analytics:['Let the evidence lead.','Compare your closed simulated trades and look for questions worth testing.','eurusd-context']};
    function update(){const key=location.hash.slice(1).split('/')[0]||'sessions';banner.hidden=key==='session';if(banner.hidden)return;const [title,copy,image]=views[key]||views.sessions;banner.innerHTML='<img src="'+asset(image)+'" alt="Supplied '+(image.startsWith('eurusd')?'EURUSD chart study; illustrative, separate from your session data':'study inspiration')+'" width="520" height="220" loading="lazy"><div><small>THE RESEARCH DESK</small><p>'+title+'</p><span>'+copy+'</span><nav aria-label="Backtesting sections">'+[['sessions','Sessions'],['strategies','Strategies'],['challenges','Challenges'],['analytics/all','Analytics']].map(([path,label])=>'<a href="#'+path+'" '+(path.split('/')[0]===key?'aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav></div>';}
    update();window.addEventListener('hashchange',update);
   }
  }
  for(const img of document.querySelectorAll('img[loading="lazy"]'))img.decoding='async';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

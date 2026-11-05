/* Chart workflow tools. Prices, execution, replay and account storage remain in their existing engines. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BacktestWorkstation=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const frames=['1m','5m','15m','30m','1H','2H','4H','1D','1W','1M'];
 const preferenceKey='onepercent:backtest-workstation:v1';
 function preferences(raw={}){return {frames:Array.isArray(raw?.frames)?[...new Set(raw.frames.filter(x=>frames.includes(x)))].slice(0,10):['1m','5m','15m','1H','4H','1D']};}
 function pendingType(side,entry,last){if(!['long','short'].includes(side)||![entry,last].every(x=>Number.isFinite(x)&&x>0))throw Error('Choose a valid side and price.');if(entry===last)throw Error('Choose a price above or below the current close, or use a market order.');return side==='long'?(entry<last?'limit':'stop'):(entry>last?'limit':'stop');}
 function search(rows,query){const words=String(query||'').toLowerCase().trim().split(/\s+/).filter(Boolean);return rows.filter(row=>words.every(w=>(row.label+' '+row.group+' '+(row.keywords||'')).toLowerCase().includes(w)));}
 function reviewed(review){return !!review&&['thesis','execution','lesson','notes','followed'].some(k=>typeof review[k]==='string'&&review[k].trim());}
 function progress(s){const start=s.initialCursor||0,max=Math.max(0,s.candles.length-1-start),value=Math.max(0,Math.min(max,s.cursor-start));return {value,max,percent:max?Math.round(value/max*100):100};}
 function mount(s,ctx){
  const $=selector=>document.querySelector(selector),I=window.BacktestIcons,F=window.BacktestFrames,E=ctx.E;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const signal=new AbortController(),options={signal:signal.signal},terminal=$('#bt-terminal'),chart=$('#bt-chart');
  let disposed=false,prefs=preferences(),lastContextPoint=null,paletteCleanup=null;
  try{prefs=preferences(JSON.parse(window.JourneyWorkspaceStorage.getItem(preferenceKey)||'{}'));}catch(_){}
  function save(){window.JourneyWorkspaceStorage.setItem(preferenceKey,JSON.stringify(prefs));ctx.persist();}
  const price=n=>Number(n.toPrecision(8)).toString();
  function frame(value){const select=$('#bt-timeframe'),option=[...select.options].find(o=>o.value===value);if(!option||option.disabled)return;select.value=value;select.dispatchEvent(new Event('change'));refresh();}
  function click(selector){$(selector)?.click();}
  function prepare(side,entry){
   ctx.pause();ctx.panel('order');const form=$('#bt-order-form'),fields=form.elements,last=s.candles[s.cursor].c;
   fields.side.value=side;fields.side.dispatchEvent(new Event('change',{bubbles:true}));
   fields.type.value=entry==null?'market':pendingType(side,entry,last);fields.type.dispatchEvent(new Event('change',{bubbles:true}));
   if(entry!=null)fields.entry.value=price(entry);
   const at=entry??last,stop=Number(fields.stop.value),target=Number(fields.target.value);
   if(!([stop,target].every(n=>Number.isFinite(n)&&n>0)&&(side==='long'?stop<at&&at<target:target<at&&at<stop))){fields.stop.value='';fields.target.value='';}
   fields.entry.dispatchEvent(new Event('input',{bubbles:true}));fields.stop.focus();
   ctx.toast((side==='long'?'Buy':'Sell')+' '+fields.type.value+' ticket prepared. Set your stop, target and size, then place the order.');
  }
  const top=document.createElement('div');top.className='bt-workstation-bar';top.innerHTML='<div class="bt-timeframe-favorites" role="group" aria-label="Favorite chart timeframes"></div><button id="bt-timeframe-pin" type="button" aria-label="Customize favorite timeframes" title="Customize favorite timeframes">'+I.svg('star')+'</button><span class="bt-workstation-divider"></span><button type="button" id="bt-command-open" title="Search chart commands · Ctrl / Cmd + K">'+I.svg('search')+'<span>Quick actions</span><kbd>Ctrl K</kbd></button><span class="bt-workstation-spacer"></span><button type="button" id="bt-fit-chart" title="Fit revealed history">'+I.svg('fullscreen')+'<span>Fit</span></button><button type="button" id="bt-latest-chart" title="Return to the replay candle">'+I.svg('go')+'<span>Replay candle</span></button>';
  $('.bt-chart-toolbar').after(top);
  const studyBar=document.createElement('div');studyBar.className='bt-workstation-studies';studyBar.setAttribute('aria-label','Active chart indicators');top.after(studyBar);
  const strip=document.createElement('div');strip.className='bt-workstation-replay';strip.innerHTML='<div class="bt-replay-clock"><span class="bt-replay-dot"></span><b id="bt-workstation-clock"></b><small>UTC · historical replay</small></div><div class="bt-replay-progress"><progress id="bt-workstation-progress" aria-label="Replay progress"></progress><span id="bt-workstation-percent"></span></div><button type="button" id="bt-quick-day" title="Process every candle until the next UTC day">Next day '+I.svg('step')+'</button><button type="button" id="bt-quick-session" title="Skip to the next London, New York or Tokyo opening">Next session '+I.svg('go')+'</button>';
  $('.bt-chart-time').before(strip);
  const review=document.createElement('section');review.className='bt-workstation-review';review.setAttribute('aria-label','Trade review queue');terminal.after(review);
  function jump(name){click('#bt-go');$('#bt-dialog [data-replay-jump="'+name+'"]')?.click();}
  $('#bt-quick-day').onclick=()=>jump('day');$('#bt-quick-session').onclick=()=>jump('session');
  $('#bt-fit-chart').onclick=()=>ctx.chart.fit();$('#bt-latest-chart').onclick=()=>ctx.chart.latest();
  $('#bt-timeframe-pin').onclick=()=>{ctx.pause();ctx.modal('Favorite timeframes','<p class="bt-pro-help">Pinned intervals stay one click away. Unavailable intervals require finer source data.</p><div class="bt-frame-picker">'+frames.map(f=>'<label><input type="checkbox" value="'+f+'" '+(prefs.frames.includes(f)?'checked':'')+'><span>'+f+'</span></label>').join('')+'</div><div class="bt-actions"><button type="button" class="bt-button" id="bt-frame-defaults">Reset favorites</button><button type="button" class="bt-button primary" id="bt-frame-save">Save favorites</button></div>');$('#bt-frame-defaults').onclick=()=>{for(const input of document.querySelectorAll('.bt-frame-picker input'))input.checked=preferences().frames.includes(input.value);};$('#bt-frame-save').onclick=()=>{prefs=preferences({frames:[...document.querySelectorAll('.bt-frame-picker input:checked')].map(x=>x.value)});save();$('#bt-dialog').close();refresh();};};
  function commands(){
   const rows=[
    {id:'order-buy',label:'Prepare buy market order',group:'Trading',icon:'long',run:()=>prepare('long')},
    {id:'order-sell',label:'Prepare sell market order',group:'Trading',icon:'short',run:()=>prepare('short')},
    ...[['journal','Session journal','#bt-open-journal'],['indicators','Browse indicators','#bt-indicators'],['goto','Go to session, date or price','#bt-go'],['settings','Chart settings','#bt-settings'],['objects','Drawing object tree','#bt-objects'],['stats','Session performance','.bt-session-heading [data-stats]'],['rules','Strategy checklist','#bt-rules'],['focus','Toggle chart focus','#bt-replay-focus'],['compare','Toggle two charts','#bt-compare-toggle'],['image','Export chart image','#bt-camera'],['save','Save workspace','#bt-save-session']].map(([id,label,selector])=>({id,label,group:'Workspace',icon:{image:'camera',objects:'layers',goto:'go',compare:'layout'}[id]||id,run:()=>click(selector)})),
    {id:'fit',label:'Fit revealed chart history',group:'Chart',icon:'fullscreen',run:()=>ctx.chart.fit()},
    {id:'latest',label:'Return to replay candle',group:'Chart',icon:'go',run:()=>ctx.chart.latest()},
    {id:'next-day',label:'Skip to next UTC day',group:'Replay',icon:'step',run:()=>jump('day')},
    {id:'next-session',label:'Skip to next market session',group:'Replay',icon:'go',run:()=>jump('session')},
    ...frames.map(f=>({id:'frame-'+f,label:f+' chart timeframe',group:'Timeframes',icon:'go',disabled:!F.available(s,f),hint:!F.available(s,f)?'Requires finer history':'',run:()=>frame(f)})),
    ...window.BacktestDrawingSuite.groups.flatMap(g=>g[3]).filter(([id])=>!id.startsWith('emoji')&&!id.startsWith('sticker')&&!id.startsWith('symbol')).map(([id,label])=>({id:'tool-'+id,label,group:'Drawing tools',icon:id,keywords:id,disabled:!window.BacktestDrawingSuite.available(id,s.candles.slice(0,s.cursor+1)),hint:'Requires volume data',run:()=>{const button=document.querySelector('[data-draw-tool="'+id+'"]');button?.click();}})),
    ...window.BacktestStudies.definitions.map(d=>{const why=window.BacktestStudies.unavailable(d.id,s.candles.slice(0,s.cursor+1));return {id:'study-'+d.id,label:d.label,group:'Indicators',icon:'indicators',keywords:d.id,disabled:!!why&&!(s.indicators||[]).includes(d.id),hint:why,active:(s.indicators||[]).includes(d.id),run:()=>ctx.toggleStudy(d.id)};})
   ];
   return rows;
  }
  function palette(){
   paletteCleanup?.();ctx.pause();window.BacktestTools.closeMenus();ctx.modal('Chart quick actions','<div class="bt-command-search">'+I.svg('search')+'<input id="bt-command-search" type="search" autocomplete="off" placeholder="Search tools, indicators, timeframes, orders…" aria-label="Search chart commands" aria-controls="bt-command-results"></div><div class="bt-command-tabs" role="group" aria-label="Filter chart commands">'+['All','Drawing tools','Indicators','Timeframes','Trading','Replay','Workspace'].map((group,i)=>'<button type="button" data-command-group="'+group+'" aria-pressed="'+(!i)+'">'+group+'</button>').join('')+'</div><p id="bt-command-count" class="bt-pro-help" role="status"></p><div id="bt-command-results" role="listbox" aria-label="Chart commands"></div><p class="bt-command-tip"><kbd>↑</kbd><kbd>↓</kbd> Browse <kbd>Enter</kbd> Choose <kbd>Esc</kbd> Close</p>');
   const dialog=$('#bt-dialog'),paletteSignal=new AbortController();dialog.classList.add('bt-command-dialog');function cleanup(){paletteSignal.abort();dialog.removeEventListener('close',closed);if(paletteCleanup===cleanup){paletteCleanup=null;dialog.classList.remove('bt-command-dialog');}}function closed(){if(!dialog.open)cleanup();}paletteCleanup=cleanup;dialog.addEventListener('close',closed);
   const input=$('#bt-command-search'),list=$('#bt-command-results'),rows=commands();let group='All',selected=0,visible=[];
   function select(index){selected=Math.max(0,Math.min(visible.length-1,index));for(const [i,b] of [...list.children].entries())b.setAttribute('aria-selected',String(i===selected));const b=list.children[selected];if(b){input.setAttribute('aria-activedescendant',b.id);b.scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');}
   function render(){visible=search(rows.filter(r=>group==='All'||r.group===group),input.value).slice(0,80);list.innerHTML=visible.map((r,i)=>'<button type="button" role="option" id="bt-command-row-'+i+'" data-command-index="'+i+'" aria-selected="false" aria-disabled="'+!!r.disabled+'">'+I.svg(r.icon)+'<span><b>'+esc(r.label)+'</b><small>'+esc(r.disabled?r.hint:r.group)+'</small></span>'+(r.active?'<em>On</em>':'')+'</button>').join('');$('#bt-command-count').textContent=visible.length?visible.length+' commands'+(visible.length===80?' · narrow your search':''):'No commands found. Try a tool name or timeframe.';select(0);}
   function run(index){const row=visible[index];if(!row||row.disabled)return;if(disposed)return;cleanup();dialog.close();row.run();refresh();}
   input.oninput=render;list.onclick=e=>{const b=e.target.closest('[data-command-index]');if(b)run(Number(b.dataset.commandIndex));};
   for(const b of dialog.querySelectorAll('[data-command-group]'))b.onclick=()=>{group=b.dataset.commandGroup;for(const item of dialog.querySelectorAll('[data-command-group]'))item.setAttribute('aria-pressed',String(item===b));render();input.focus();};
   dialog.addEventListener('keydown',e=>{if(!dialog.classList.contains('bt-command-dialog'))return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cleanup();dialog.close();return;}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();select((selected+(e.key==='ArrowDown'?1:-1)+visible.length)%Math.max(1,visible.length));}else if(e.key==='Enter'&&(e.target===input||e.target.closest('[data-command-index]'))){e.preventDefault();run(e.target===input?selected:Number(e.target.closest('[data-command-index]').dataset.commandIndex));}}, {signal:paletteSignal.signal});
   render();input.focus();
  }
  $('#bt-command-open').onclick=palette;
  const menu=document.createElement('div');menu.id='bt-chart-context';menu.className='bt-chart-context';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Chart actions');menu.hidden=true;terminal.append(menu);
  function closeMenu(restore=false){if(menu.hidden)return;menu.hidden=true;if(restore)chart.focus({preventScroll:true});}
  chart.tabIndex=0;
  function context(event){
   event.preventDefault();ctx.pause();window.BacktestTools.closeMenus();ctx.chart.tool('cursor');window.BacktestTools.activeTool('cursor');lastContextPoint=ctx.chart.atPointer(event);
   const at=lastContextPoint?.p,rows=[];
   if(at){rows.push({label:'Add horizontal level at '+price(at),icon:'horizontal',run:()=>ctx.chart.addLevel(at)});for(const side of ['long','short']){try{const type=pendingType(side,at,s.candles[s.cursor].c);rows.push({label:'Prepare '+(side==='long'?'buy':'sell')+' '+type+' at '+price(at),icon:side,run:()=>prepare(side,at)});}catch(_){}}}
   rows.push({label:'Return to replay candle',icon:'go',run:()=>ctx.chart.latest()},{label:'Fit revealed history',icon:'fullscreen',run:()=>ctx.chart.fit()},{label:'Indicators',icon:'indicators',run:()=>click('#bt-indicators')},{label:'Chart settings',icon:'settings',run:()=>click('#bt-settings')},{label:'Search all chart commands',icon:'search',run:palette});
   menu.innerHTML=rows.map((r,i)=>'<button type="button" role="menuitem" data-context-row="'+i+'">'+I.svg(r.icon)+'<span>'+esc(r.label)+'</span></button>').join('');menu.hidden=false;
   const rect=chart.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(innerWidth-menu.offsetWidth-8,event.clientX||rect.left+30))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-menu.offsetHeight-8,event.clientY||rect.top+50))+'px';
   menu.onclick=e=>{const b=e.target.closest('[data-context-row]');if(b){closeMenu();rows[Number(b.dataset.contextRow)].run();}};menu.querySelector('button').focus();
  }
  chart.addEventListener('contextmenu',context,options);
  document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))closeMenu();},options);
  window.addEventListener('resize',()=>closeMenu(),options);
  document.addEventListener('keydown',e=>{
   if(disposed)return;
   if(!menu.hidden){if(['Escape','Tab'].includes(e.key)){closeMenu(e.key==='Escape');if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();}return;}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();const items=[...menu.querySelectorAll('button')],i=items.indexOf(document.activeElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();return;}if(e.code==='Space'||e.code==='ArrowRight'){e.stopImmediatePropagation();}}
   if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='k'&&!$('#bt-dialog').open){e.preventDefault();e.stopImmediatePropagation();palette();}
  },{capture:true,signal:signal.signal});
  function refresh(){
   if(disposed||!top.isConnected)return;
   const selected=F.selected(s),favorites=top.querySelector('.bt-timeframe-favorites'),favoriteHTML=prefs.frames.map(f=>'<button type="button" data-pinned-frame="'+f+'" '+(F.available(s,f)?'':'disabled')+' aria-pressed="'+(selected===f)+'" title="'+f+(F.available(s,f)?' chart':' · requires finer source data')+'">'+f+'</button>').join('');
   if(favorites.innerHTML!==favoriteHTML)favorites.innerHTML=favoriteHTML;favorites.onclick=e=>{const b=e.target.closest('[data-pinned-frame]');if(b&&!b.disabled)frame(b.dataset.pinnedFrame);};
   studyBar.innerHTML=(s.indicators||[]).map(id=>{const d=window.BacktestStudies.get(id);return d?'<span>'+esc(d.label)+'<button type="button" data-remove-study="'+id+'" aria-label="Remove '+esc(d.label)+'" title="Remove indicator">'+I.svg('close')+'</button></span>':'';}).join('');studyBar.hidden=!(s.indicators||[]).length;
   studyBar.onclick=e=>{const b=e.target.closest('[data-remove-study]');if(b){ctx.pause();ctx.toggleStudy(b.dataset.removeStudy);}};
   const now=window.BacktestReplay.clock(s),p=progress(s);$('#bt-workstation-clock').textContent=new Date(now*1000).toISOString().slice(0,16).replace('T',' ');const meter=$('#bt-workstation-progress');meter.max=p.max||1;meter.value=p.value;meter.setAttribute('aria-valuetext',p.value+' of '+p.max+' source candles processed');$('#bt-workstation-percent').textContent=p.percent+'%';
   const ended=E.finished(s);$('#bt-quick-day').disabled=ended;$('#bt-quick-session').disabled=ended;
   const pending=s.trades.map((t,index)=>({t,index})).filter(({t})=>!reviewed(s.reviews?.[E.tradeKey(t)]));
   review.innerHTML='<div><small>REVIEW & REFINE</small><b>'+(!s.trades.length?'Your next lesson starts with a trade':pending.length?pending.length+' '+(pending.length===1?'exit needs':'exits need')+' a review':'Every exit reviewed')+'</b><span>'+(!s.trades.length?'Capture your plan in the session journal.':'Record execution, emotion and the lesson to carry forward.')+'</span></div><div class="bt-review-queue-actions">'+pending.slice(-3).reverse().map(({t,index})=>'<button type="button" data-workstation-review="'+index+'">'+esc(t.symbol||s.symbol)+' · '+esc(t.side)+'<span class="'+(t.pnl>=0?'bt-up':'bt-down')+'">'+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(t.pnl)+'</span>'+I.svg('journal')+'</button>').join('')+'<button type="button" data-workstation-journal>'+I.svg('journal')+'Open journal</button></div>';
   review.onclick=e=>{const b=e.target.closest('[data-workstation-review]');if(b){ctx.pause();ctx.review(Number(b.dataset.workstationReview));}else if(e.target.closest('[data-workstation-journal]'))click('#bt-open-journal');};
  }
  refresh();
  return {refresh,palette,destroy(){disposed=true;paletteCleanup?.();signal.abort();closeMenu();for(const n of [top,studyBar,strip,review,menu])n.remove();}};
 }
 return {frames,preferences,pendingType,search,reviewed,progress,mount};
});

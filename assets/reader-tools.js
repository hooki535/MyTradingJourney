/* Page-bound ink and reading controls. Uses the existing owner-scoped save queue. */
export function createReadingTools({R,getState,update,getPage,getPDF,go,status,collectSelection,getSelection,addHighlight,openEditor,activateTab,download}) {
 const $=id=>document.getElementById(id),svg=$('reader-ink'),dock=$('reader-draw-dock'),frame=$('reader-page-frame'),main=document.querySelector('.reader-main');
 const clone=x=>JSON.parse(JSON.stringify(x));
 let active=false,tool='pen',group=null,pending=null,pointer=null,history=[],future=[],lastPage=1;
 const drawings=()=>getState().annotations.filter(a=>a.type==='drawing'&&a.page===getPage()&&!a.deletedAt);
 const canDraw=()=>!$('reader-draw').disabled;
 function paint(){
  const box=frame.getBoundingClientRect(),scale=Math.min(box.width,box.height);
  const strokes=drawings().flatMap(a=>a.strokes.map(s=>({s,id:a.id})));
  if(pending)strokes.push({s:pending,id:''});
  svg.replaceChildren(...strokes.map(({s,id})=>{
   const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
   // A repeated endpoint also renders a single stylus tap as a round dot.
   const points=s.points.length===1?[s.points[0],[s.points[0][0]+.00001,s.points[0][1]]]:s.points;
   line.setAttribute('points',points.map(p=>p.map(n=>n*1000).join(',')).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke',getState().theme==='dark'&&s.color==='#243247'?'#e2e6eb':s.color);line.setAttribute('stroke-width',s.width*scale);line.setAttribute('vector-effect','non-scaling-stroke');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');line.setAttribute('opacity',s.tool==='marker'?'.32':'1');if(id)line.dataset.drawing=id;return line;
  }));
  $('reader-ink-undo').disabled=!history.length;$('reader-ink-redo').disabled=!future.length;
 }
 function snapshot(){return clone(drawings());}
 function remember(before){history.push(before);if(history.length>40)history.shift();future=[];}
 function replaceDrawings(value){return update(v=>{const records=new Map(v.annotations.map(a=>[a.id,a]));const ids=new Set(v.annotations.filter(a=>a.type==='drawing'&&a.page===getPage()&&!a.deletedAt).map(a=>a.id));v.annotations=v.annotations.filter(a=>!ids.has(a.id));for(const saved of value){const a={...saved,text:records.get(saved.id)?.text??saved.text};const i=v.annotations.findIndex(n=>n.id===a.id);if(i<0)v.annotations.push(a);else v.annotations[i]={...a,text:v.annotations[i].text,updatedAt:new Date().toISOString()};}});}
 function finishStroke(){
  if(!pending)return;const stroke=pending;pending=null;const before=snapshot();
  const id=group||crypto.randomUUID();const success=update(v=>{let a=v.annotations.find(a=>a.id===id&&!a.deletedAt);if(!a){a={id,type:'drawing',page:getPage(),color:'blue',quote:'',text:'',rects:[],strokes:[],createdAt:new Date().toISOString()};v.annotations.push(a);}a.strokes.push(stroke);a.updatedAt=new Date().toISOString();});
  if(success){group=id;remember(before);}paint();
 }
 async function begin(id){if(!canDraw()){status('Sign in to save drawings to your notebook.');return;}const target=id?getState().annotations.find(a=>a.id===id&&!a.deletedAt):null;if(target&&target.page!==getPage())await go(target.page);finishStroke();lastPage=getPage();group=id||null;if(matchMedia('(max-width:900px)').matches&&!$('reader-panel').hidden)$('reader-panel-toggle').click();active=true;document.body.classList.add('reader-drawing');dock.hidden=false;svg.classList.add('is-drawing');$('reader-area').hidden=true;$('reader-area-toggle').setAttribute('aria-pressed','false');$('reader-selection-tools').hidden=true;window.getSelection()?.removeAllRanges();$('reader-draw').setAttribute('aria-pressed','true');paint();status('Drawing mode · each completed stroke saves to your account.');}
 function end(){finishStroke();active=false;pointer=null;group=null;dock.hidden=true;svg.classList.remove('is-drawing');document.body.classList.remove('reader-drawing');$('reader-draw').setAttribute('aria-pressed','false');status('Drawing kept in your notebook.');}
 function position(e){const b=svg.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),Math.max(0,Math.min(1,(e.clientY-b.top)/b.height))].map(n=>Math.round(n*100000)/100000);}
 function erase(point){const b=frame.getBoundingClientRect(),before=snapshot();let changed=false;
  const after=before.map(a=>({...a,strokes:a.strokes.filter(s=>{const hit=R.hitStroke(s,point,b.width,b.height);changed=changed||hit;return !hit;})})).filter(a=>a.strokes.length);
  if(changed&&replaceDrawings(after)){remember(before);paint();}
 }
 svg.onpointerdown=e=>{if(!active){const id=e.target.dataset.drawing;if(id)begin(id);return;}if(pointer!==null||e.button!==0)return;e.preventDefault();pointer=e.pointerId;svg.setPointerCapture(pointer);if(tool==='eraser'){erase(position(e));return;}const size=Number($('reader-ink-size').value);pending={tool,color:$('reader-ink-color').value,width:tool==='marker'?.012+size*.002:size*.001,points:[position(e)]};paint();};
 svg.onpointermove=e=>{if(!active||e.pointerId!==pointer)return;if(tool==='eraser'){erase(position(e));return;}if(!pending)return;for(const event of e.getCoalescedEvents?.()||[e]){const p=position(event),last=pending.points.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])>.0005&&pending.points.length<5000)pending.points.push(p);}paint();};
 function release(e){if(e.pointerId!==pointer)return;finishStroke();if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);pointer=null;}
 svg.onpointerup=release;svg.onpointercancel=release;svg.onlostpointercapture=release;
 $('reader-draw').onclick=()=>active?end():begin();$('reader-ink-close').onclick=end;
 $('reader-ink-save').onclick=()=>{finishStroke();group=null;$('reader-ink-hint').textContent='Drawing kept. Your next stroke starts a new drawing.';};
 dock.querySelectorAll('[data-ink-tool]').forEach(button=>button.onclick=()=>{finishStroke();tool=button.dataset.inkTool;dock.querySelectorAll('[data-ink-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));svg.dataset.tool=tool;$('reader-ink-size-label').textContent=$('reader-ink-size').value;});
 $('reader-ink-size').oninput=()=>{$('reader-ink-size-label').textContent=$('reader-ink-size').value;};
 function undo(){finishStroke();const value=history.at(-1);if(!value)return;const current=snapshot();if(replaceDrawings(value)){history.pop();future.push(current);group=null;paint();}}
 function redo(){const value=future.at(-1);if(!value)return;const current=snapshot();if(replaceDrawings(value)){future.pop();history.push(current);group=null;paint();}}
 $('reader-ink-undo').onclick=undo;$('reader-ink-redo').onclick=redo;
 $('reader-ink-prev').onclick=()=>go(getPage()-1);$('reader-ink-next').onclick=()=>go(getPage()+1);
 $('reader-bottom-prev').onclick=()=>go(getPage()-1);$('reader-bottom-next').onclick=()=>go(getPage()+1);
 $('reader-progress').onchange=e=>go(e.target.value);
 function focus(value){document.body.classList.toggle('reader-focus',value);$('reader-focus').setAttribute('aria-pressed',String(value));$('reader-focus').textContent=value?'Exit focus':'Focus';window.dispatchEvent(new Event('resize'));}
 $('reader-focus').onclick=()=>focus(!document.body.classList.contains('reader-focus'));
 $('reader-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await main.requestFullscreen();}catch(_){status('Fullscreen is unavailable in this browser. Use Focus for a wider reading surface.');}};
 $('reader-shortcuts').onclick=()=>$('reader-help-dialog').showModal();$('reader-help-close').onclick=()=>$('reader-help-dialog').close();
 const popup=$('reader-selection-tools');
 function selectionPopup(){collectSelection();const sel=window.getSelection(),selection=getSelection();if(active||!selection||!sel?.rangeCount||sel.isCollapsed){popup.hidden=true;return;}const rect=sel.getRangeAt(0).getBoundingClientRect();popup.hidden=false;popup.style.left=Math.max(10,Math.min(innerWidth-popup.offsetWidth-10,rect.left+rect.width/2-popup.offsetWidth/2))+'px';popup.style.top=Math.max(8,Math.min(innerHeight-popup.offsetHeight-8,rect.top-popup.offsetHeight-10))+'px';}
 frame.addEventListener('pointerup',()=>setTimeout(selectionPopup,20));document.addEventListener('selectionchange',()=>{if(window.getSelection()?.isCollapsed)popup.hidden=true;});
 popup.onpointerdown=e=>e.preventDefault();popup.querySelectorAll('[data-mark]').forEach(b=>b.onclick=()=>{addHighlight(getSelection(),b.dataset.mark);popup.hidden=true;});
 $('reader-selection-note').onclick=()=>{openEditor('comment');popup.hidden=true;};$('reader-selection-copy').onclick=async()=>{try{await navigator.clipboard.writeText(getSelection()?.quote||'');status('Passage copied.');}catch(_){status('Use Ctrl+C or your browser’s Copy action to copy the selected passage.');}popup.hidden=true;};
 $('reader-export').onclick=()=>{finishStroke();const format=$('reader-export-format').value,title=$('reader-title').textContent;if(format==='json')download('MyTradingJourney-reading-notes.json',JSON.stringify({kind:'mytradingjourney-reader',version:1,title,...getState()},null,2),'application/json');else download('MyTradingJourney-reading-notes.'+(format==='markdown'?'md':'txt'),R.exportText(getState(),title,format),'text/plain;charset=utf-8');status('Notebook export prepared · '+(format==='json'?'JSON with drawings':format==='markdown'?'Markdown':'Plain text')+'.');};
 document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select,dialog')||e.altKey)return;const key=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
  if(mod){if(key==='f'){e.preventDefault();activateTab('find');$('reader-search').focus();}if(key==='b'){e.preventDefault();$('reader-bookmark').click();}if(key==='z'&&active){e.preventDefault();e.shiftKey?redo():undo();}return;}
  if(e.key==='Escape'){if(active)end();else focus(false);popup.hidden=true;return;}
  if(key==='d'){e.preventDefault();active?end():begin();}if(key==='f')focus(!document.body.classList.contains('reader-focus'));if(key==='s')$('reader-panel-toggle').click();if(key==='n')activateTab('notes');
  if(window.getSelection()?.isCollapsed&&['l','h','pagedown','pageup',' ','home','end'].includes(key)){e.preventDefault();go(key==='home'?1:key==='end'?getPDF()?.numPages:key==='h'||key==='pageup'||key===' '&&e.shiftKey?getPage()-1:getPage()+1);}
 });
 return {begin,end,isDrawing:()=>active,beforePage:()=>{finishStroke();group=null;pointer=null;popup.hidden=true;},render(){if(lastPage!==getPage()){lastPage=getPage();history=[];future=[];group=null;}paint();const pdf=getPDF();if(!pdf)return;const page=getPage(),progress=$('reader-progress');progress.disabled=false;progress.max=pdf.numPages;progress.value=page;$('reader-progress-text').textContent=Math.round(page/pdf.numPages*100)+'% · '+page+' / '+pdf.numPages;for(const id of ['reader-bottom-prev','reader-ink-prev'])$(id).disabled=page<=1;for(const id of ['reader-bottom-next','reader-ink-next'])$(id).disabled=page>=pdf.numPages;}};
}

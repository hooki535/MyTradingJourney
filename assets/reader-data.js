/* Private reader records are keyed by PDF bytes, independently of book metadata. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.JourneyReader=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const colors=['yellow','green','blue','pink'];
 const inkColors=['#243247','#4263eb','#e05260','#238969','#e3b333','#f28c45'];
 const styles=['highlight','underline','squiggly'];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const blank=()=>({version:1,page:1,theme:'light',zoom:'fit',bookmarks:[],annotations:[]});
 function rects(input){
  if(!Array.isArray(input)||input.length>500)throw Error('Select a shorter passage.');
  return input.map(r=>{if(!['x','y','w','h'].every(k=>Number.isFinite(r[k])))throw Error('Invalid highlight position.');const x=Math.max(0,Math.min(1,r.x)),y=Math.max(0,Math.min(1,r.y));return {x,y,w:Math.max(0,Math.min(1-x,r.w)),h:Math.max(0,Math.min(1-y,r.h))};}).filter(r=>r.w>0&&r.h>0);
 }
 function strokes(input){
  if(!Array.isArray(input)||input.length>300)throw Error('This drawing is full. Save it and start another.');
  return input.map(s=>{
   if(!s||!['pen','marker'].includes(s.tool)||!inkColors.includes(s.color)||!Number.isFinite(s.width)||s.width<.001||s.width>.05||!Array.isArray(s.points)||s.points.length<1||s.points.length>5000)throw Error('Invalid drawing.');
   return {tool:s.tool,color:s.color,width:s.width,points:s.points.map(p=>{if(!Array.isArray(p)||p.length!==2||!p.every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw Error('Invalid drawing position.');return p;})};
  });
 }
 function hitStroke(stroke,point,width,height,tolerance=9){
  const p=[point[0]*width,point[1]*height],points=stroke.points.map(q=>[q[0]*width,q[1]*height]);
  const limit=tolerance+stroke.width*Math.min(width,height)/2;
  for(let i=0;i<points.length;i++){const a=points[i],b=points[i+1]||a,dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;if(Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)<=limit)return true;}return false;
 }
 function exportText(state,title,format='markdown'){
  const md=format==='markdown',out=[md?'# '+title:title,''];
  for(const a of state.annotations.filter(a=>!a.deletedAt).sort((a,b)=>a.page-b.page)){
   out.push((md?'## ':'')+'Page '+a.page+' · '+(a.type==='drawing'?'Drawing ('+a.strokes.length+' strokes)':a.style||a.type));
   if(a.quote)out.push((md?'> ':'')+a.quote.replace(/\n/g,md?'\n> ':'\n'));
   if(a.text)out.push(a.text);if(a.type==='drawing')out.push('Ink coordinates are included in the JSON export.');out.push('');
  }
  out.push((md?'## ':'')+'Bookmarks',state.bookmarks.map(p=>'Page '+p).join(', ')||'None');return out.join('\n');
 }
 function validate(value){
  const v={...blank(),...value};
  if(v.version!==1||!Number.isInteger(v.page)||v.page<1||!['light','dark','sepia'].includes(v.theme)||!['fit','page','.75','1','1.25','1.5','2'].includes(v.zoom))throw Error('Invalid reader settings.');
  if(!Array.isArray(v.bookmarks)||v.bookmarks.length>1000||!v.bookmarks.every(p=>Number.isInteger(p)&&p>0))throw Error('Invalid bookmarks.');
  if(!Array.isArray(v.annotations)||v.annotations.length>2000)throw Error('Too many annotations. Export your notes before adding more.');
  v.bookmarks=[...new Set(v.bookmarks)].sort((a,b)=>a-b);
  const ids=new Set();v.annotations=v.annotations.map(a=>{
   if(!a||typeof a.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(a.id)||ids.has(a.id)||!Number.isInteger(a.page)||a.page<1||!['highlight','comment','note','drawing'].includes(a.type)||!colors.includes(a.color)||typeof a.quote!=='string'||a.quote.length>4000||typeof a.text!=='string'||a.text.length>12000)throw Error('Invalid annotation.');ids.add(a.id);
   if(a.style&&!styles.includes(a.style))throw Error('Invalid annotation style.');
   return {...a,rects:rects(a.rects||[]),...(a.type==='drawing'?{strokes:strokes(a.strokes)}:{})};
  });
  if(JSON.stringify(v).length>1500000)throw Error('Reader notes are too large. Export a backup first.');return clone(v);
 }
 function createSync(api,id,onStatus=()=>{},initial=blank()){
  let row=null,state=blank(),dirty=false,busy=false,version=0,timer=null,stopped=false;
  async function load(){row=await api.get(id);state=validate(row?.payload||initial);dirty=false;stopped=false;return clone(state);}
  async function flush(){clearTimeout(timer);if(busy||!dirty||stopped)return;busy=true;onStatus('saving');
   try{while(dirty){const generation=version,snapshot=validate(state);row=await api.save(id,'document',snapshot,row?.revision??null);dirty=version!==generation;}onStatus('saved');}
   catch(error){dirty=true;stopped=true;onStatus('error',error);}
   finally{busy=false;}
  }
  function change(value){state=validate(value);dirty=true;version++;onStatus('pending');clearTimeout(timer);if(!stopped)timer=setTimeout(flush,600);return clone(state);}
  return {load,change,flush,retry:()=>{stopped=false;return flush();},snapshot:()=>clone(state),isDirty:()=>dirty||busy};
 }
 return {blank,validate,rects,colors,inkColors,styles,strokes,hitStroke,exportText,createSync};
});

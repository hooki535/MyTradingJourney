const test=require('node:test'),assert=require('node:assert/strict'),R=require('../assets/reader-data.js');
const highlight={id:'note-1',page:2,type:'highlight',color:'yellow',quote:'A selected passage',text:'',rects:[{x:.1,y:.2,w:.3,h:.04}]};
test('highlight geometry is normalized and remains proportional at every zoom',()=>{
 const rects=R.rects([{x:-.2,y:.9,w:.5,h:.3},{x:1,y:0,w:.4,h:.2}]);assert.equal(rects.length,1);assert.equal(rects[0].x,0);assert.ok(Math.abs(rects[0].h-.1)<1e-8);
 for(const width of [320,800,1600])assert.equal(R.validate({...R.blank(),annotations:[highlight]}).annotations[0].rects[0].x*width,width*.1);
 assert.throws(()=>R.rects([{x:NaN,y:0,w:1,h:1}]),/position/);
});
test('reader state preserves comments, recoverable deleted notes and unique sorted bookmarks',()=>{
 const v=R.validate({...R.blank(),page:2,theme:'dark',bookmarks:[3,1,3],annotations:[{...highlight,text:'My note',deletedAt:'2026-10-27'}]});assert.deepEqual(v.bookmarks,[1,3]);assert.equal(v.annotations[0].text,'My note');assert.equal(v.annotations[0].deletedAt,'2026-10-27');
 assert.throws(()=>R.validate({...v,annotations:[highlight,highlight]}),/annotation/);assert.throws(()=>R.validate({...v,annotations:[{...highlight,id:'" onmouseover="bad'}]}),/annotation/);
});
test('a page change during an in-flight annotation save is not lost',async()=>{
 let release;const calls=[],api={get:async()=>null,save:async(id,kind,payload,revision)=>{calls.push({id,kind,payload,revision});if(calls.length===1)await new Promise(r=>release=r);return {id,kind,payload,revision:(revision??0)+1};}};
 const sync=R.createSync(api,'settings:reader:hash');await sync.load();sync.change({...R.blank(),annotations:[highlight]});const saving=sync.flush();sync.change({...sync.snapshot(),page:8});release();await saving;assert.equal(calls.length,2);assert.equal(calls[1].payload.page,8);assert.equal(calls[1].payload.annotations.length,1);assert.equal(calls[1].revision,1);assert.equal(sync.isDirty(),false);
});
test('conflicts preserve the draft and stop automatic retries',async()=>{
 let attempts=0;const statuses=[],sync=R.createSync({get:async()=>({revision:4,payload:R.blank()}),save:async()=>{attempts++;throw Error('Changed on another device');}},'settings:reader:hash',(s)=>statuses.push(s));
 await sync.load();sync.change({...sync.snapshot(),annotations:[highlight]});await sync.flush();assert.equal(attempts,1);assert.equal(sync.isDirty(),true);assert.equal(sync.snapshot().annotations.length,1);assert.equal(statuses.at(-1),'error');sync.change({...sync.snapshot(),page:3});await sync.flush();assert.equal(attempts,1);
});
test('notes on separate PDF fingerprints never share a reader record',async()=>{
 const db=new Map(),api={get:async id=>db.get(id),save:async(id,kind,payload,revision)=>{const row={id,kind,payload,revision:(revision??0)+1};db.set(id,row);return row;}};
 const a=R.createSync(api,'settings:reader:file-a'),b=R.createSync(api,'settings:reader:file-b');await a.load();await b.load();a.change({...a.snapshot(),annotations:[highlight]});await a.flush();assert.equal(b.snapshot().annotations.length,0);assert.equal(db.get('settings:reader:file-a').kind,'document');
});

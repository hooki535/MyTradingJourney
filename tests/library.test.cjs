const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../assets/library-data.js');
function storage() { const map = new Map(); return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map}; }
test('notes persist across reload and preserve existing backtesting records',()=>{
  const s=storage(); s.setItem('onepercent:backtesting:v1','existing sessions');
  L.save(s,'atomic-habits',{...L.blank(),status:'reading',notes:'My reflection',action:'Journal after studying'},L.blank());
  assert.equal(L.read(s).records['atomic-habits'].notes,'My reflection');
  assert.equal(s.getItem('onepercent:backtesting:v1'),'existing sessions');
});
test('separate book edits merge; stale edits of the same book are rejected',()=>{
  const s=storage();
  L.save(s,'mindset',{...L.blank(),notes:'First tab'},L.blank());
  L.save(s,'atomic-habits',{...L.blank(),notes:'Second tab'},L.blank());
  assert.throws(()=>L.save(s,'mindset',{...L.blank(),notes:'Stale edit'},L.blank()),/another tab/);
  assert.equal(L.read(s).records.mindset.notes,'First tab');
  assert.equal(L.read(s).records['atomic-habits'].notes,'Second tab');
});
test('backup round trip merges matching records and keeps unrelated book notes',()=>{
  const a=storage(),b=storage();
  L.save(a,'mindset',{...L.blank(),status:'completed',reviewDate:'2026-10-30'},L.blank());
  L.save(b,'atomic-habits',{...L.blank(),chapter:'Chapter 2'},L.blank());
  L.restore(b,JSON.parse(a.getItem(L.key)));
  assert.equal(L.read(b).records.mindset.status,'completed');
  assert.equal(L.read(b).records['atomic-habits'].chapter,'Chapter 2');
});
test('invalid imports, corrupted storage, and quota errors never silently reset records',()=>{
  const s=storage(); L.save(s,'mindset',L.blank(),L.blank()); const before=s.getItem(L.key);
  for (const invalid of [{sessions:[]},{kind:'mytradingjourney-library',version:1,records:{mindset:{status:'winning'}}},{kind:'mytradingjourney-library',version:1,records:{mindset:{reviewDate:'2026-02-30'}}}]) assert.throws(()=>L.restore(s,invalid));
  assert.equal(s.getItem(L.key),before);
  s.setItem(L.key,'broken data'); assert.throws(()=>L.save(s,'mindset',L.blank(),L.blank())); assert.equal(s.getItem(L.key),'broken data');
  const blocked={getItem:()=>null,setItem:()=>{throw Error('Quota exceeded');}};
  assert.throws(()=>L.save(blocked,'mindset',L.blank(),L.blank()),/Quota/);
});
test('catalog contains the complete requested path with stable unique identifiers',()=>{
  assert.equal(L.books.length,22); assert.equal(new Set(L.books.map(b=>b.id)).size,22);
  assert.deepEqual(L.groups.map((_,g)=>L.books.filter(b=>b.group===g).length),[6,4,4,3,5]);
});

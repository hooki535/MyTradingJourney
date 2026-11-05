const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../assets/backtest-engine.js'),F=require('../assets/backtest-frames.js');
const frames=['1M','1W','1D','4H','2H','1H','30m','15m','5m','1m'];
const start=Date.parse('2026-03-15T10:30:00Z')/1000;
const candle=t=>({t,o:1.1,h:1.2,l:1,c:1.15});
function session(){const bars=Array.from({length:5000},(_,i)=>candle(start+i*60));return E.createSession({symbol:'EURUSD',interval:'1m',startBalance:10000,multiplier:1,cursor:1440},bars);}
test('minute replay supports all ten requested views with earlier closed hourly/daily context',()=>{
 const s=session(),before=E.snapshot(s);
 F.setContext(s,Array.from({length:1440},(_,i)=>candle(start-(1440-i)*60)));
 for(const step of [3600,86400]){const cut=Math.floor(start/step)*step;F.setCoarseContext(s,step,Array.from({length:2400},(_,i)=>candle(cut-(2400-i)*step)));}
 for(const frame of frames){assert.ok(F.available(s,frame),frame);const p=F.project(s,frame);assert.ok(p.bars.length>0,frame);assert.ok(p.bars.every(b=>b.t<=s.candles[s.cursor].t));assert.ok(Number.isFinite(p.toDisplay(s.cursor)));assert.ok(Number.isFinite(p.toBase(0)));}
 assert.ok(F.project(s,'1M').bars.length>60);assert.ok(F.project(s,'4H').bars.length>100);
 assert.deepEqual(E.snapshot(s),before);
});
test('coarse context cannot leak a still-forming source candle and remains outside backups',()=>{
 const s=session(),cut=Math.floor(start/3600)*3600;
 assert.throws(()=>F.setCoarseContext(s,3600,[candle(cut)]),/closed/);
 assert.throws(()=>F.setCoarseContext(s,60,[candle(cut-60)]),/Invalid/);
 F.setCoarseContext(s,3600,[candle(cut-3600)]);
 const restored=E.restore(E.snapshot(s));assert.ok(!JSON.stringify(E.snapshot(s)).includes('coarseContexts'));assert.ok(F.project(s,'1H').bars.length>F.project(restored,'1H').bars.length);
 const other=session();assert.equal(F.project(other,'1H').bars.length,F.project(restored,'1H').bars.length);
});

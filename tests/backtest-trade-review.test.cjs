const test=require('node:test'),assert=require('node:assert/strict'),B=require('../assets/backtest-workspace.js'),R=require('../assets/backtest-trade-review.js'),F=require('../assets/backtest-frames.js');
const bars=()=>Array.from({length:180},(_,i)=>({t:1700000100+i*60,o:100,h:101,l:99,c:100})),options={symbol:'EURUSD',interval:'1m',startBalance:10000,multiplier:1,cursor:29};
const drawing=(id,p=100)=>({id,type:'horizontal',points:[{i:25,p},{i:26,p}],color:'#abcdef',width:2});
function session(multi=false){const s=multi?B.createPortfolio(options,[{...options,candles:bars()},{...options,symbol:'GBPUSD',candles:bars()}]):B.createSession(options,bars());s.viewTimeframe='15m';s.annotations=[drawing('before')];B.placeOrder(s,{side:'long',quantity:10,stop:90,target:110});B.step(s);return s;}
function exit(s,partial=false){s.annotations.push(drawing('after',101));partial?B.requestPartialClose(s,5):B.requestClose(s);B.step(s);return s.trades.at(-1);}
test('order submission and exit freeze independent drawing states without mutable references',()=>{
 const s=session(),t=exit(s),row=R.record(s,t);assert.equal(row.before.annotations.length,1);assert.equal(row.after.annotations.length,2);assert.ok(row.before.cursor<row.after.cursor);assert.equal(row.before.plan.entry,null);assert.equal(row.before.plan.stop,90);
 s.annotations[0].color='#ff0000';assert.equal(row.before.annotations[0].color,'#abcdef');assert.equal(row.after.annotations[0].color,'#abcdef');
});
test('before and after charts contain no candles or execution markers beyond their boundary',()=>{
 const s=session(),t=exit(s);for(const phase of ['before','after']){const v=R.view(s,t,phase);assert.equal(v.candles.length,v.cursor+1);assert.ok(v.candles.at(-1).t<=(phase==='before'?t.entryTime-1:t.exitTime));const projection=F.project(v);assert.ok(projection.bars.at(-1).t<=v.candles.at(-1).t);assert.equal(v.trades.length,phase==='after'?1:0);}
 assert.equal(R.view(s,t,'before').pending.entry,null);
});
test('review drawings save independently from captured states, replay actions, and results',()=>{
 const s=session(),t=exit(s),before=R.view(s,t,'before'),after=R.view(s,t,'after'),actions=structuredClone(s.actions),metrics=B.metrics(s),live=structuredClone(s.annotations),cursor=s.cursor;
 before.annotations.push(drawing('review-only',99));after.drawings.push(102);R.save(s,t,{before,after});assert.equal(R.record(s,t).before.annotations.length,1);assert.equal(R.view(s,t,'before').annotations.length,2);assert.deepEqual(s.actions,actions);assert.deepEqual(B.metrics(s),metrics);assert.deepEqual(s.annotations,live);assert.equal(s.cursor,cursor);
 const copy=B.restore(JSON.parse(JSON.stringify(B.snapshot(s))));assert.deepEqual(R.record(copy,copy.trades[0]),R.record(s,t));assert.equal(R.view(copy,copy.trades[0],'before',true).annotations.length,1);
});
test('portfolio snapshots remain with their market and retain the selected timeframe',()=>{
 const s=session(true),t=exit(s);assert.equal(R.record(s,t).before.viewTimeframe,'15m');assert.equal(R.record(s,t).after.viewTimeframe,'15m');const copy=B.restore(B.snapshot(s));assert.deepEqual(R.record(copy,copy.trades[0]),R.record(s,t));assert.equal(Object.keys(copy.markets[1].tradeCharts).length,0);
});
test('each partial exit preserves its own after state and shared original before state',()=>{
 const s=session(),first=exit(s,true);s.annotations.push(drawing('last',102));B.requestClose(s);B.step(s);const last=s.trades.at(-1);assert.notEqual(R.key(first),R.key(last));assert.equal(R.record(s,first).after.annotations.length,2);assert.equal(R.record(s,last).after.annotations.length,3);assert.deepEqual(R.record(s,first).before,R.record(s,last).before);const copy=B.restore(B.snapshot(s));assert.equal(R.record(copy,copy.trades[0]).after.annotations.length,2);
});
test('legacy histories reconstruct price prefixes without inventing captured drawings',()=>{
 const s=session(),t=exit(s),raw=JSON.parse(JSON.stringify(B.snapshot(s)));delete raw.tradeCharts;for(const a of raw.actions)if(a.order)delete a.order.chartBefore;const copy=B.restore(raw),trade=copy.trades[0];assert.equal(Object.keys(R.record(copy,trade)).length,0);assert.equal(R.view(copy,trade,'before').captured,false);assert.equal(R.view(copy,trade,'after').captured,false);assert.equal(copy.trades.length,1);
});
test('restoration rejects future snapshot boundaries and sanitizes annotation payloads',()=>{
 const s=session(),t=exit(s),raw=B.snapshot(s),k=R.key(t);raw.tradeCharts[k].before.cursor=s.cursor;raw.tradeCharts[k].after.annotations.push({id:'x',type:'bad',points:[{i:0,p:1}],payload:'bad'});raw.tradeCharts.unrelated={before:raw.tradeCharts[k].after};const copy=B.restore(raw),row=R.record(copy,copy.trades[0]);assert.equal(row.before,undefined);assert.equal(row.after.annotations.length,2);assert.equal(copy.tradeCharts.unrelated,undefined);
});

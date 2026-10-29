const test=require('node:test'),assert=require('node:assert/strict'),B=require('../assets/backtest-workspace.js'),UI=require('../assets/backtest-position-ui.js');
const candles=()=>Array.from({length:80},(_,i)=>({t:1700000000+i*60,o:100,h:101,l:99,c:100}));
const options={symbol:'EURUSD',interval:'1m',startBalance:10000,multiplier:1,fee:.001,slippage:0,cursor:29};
function session(side='long'){const s=B.createSession(options,candles());B.placeOrder(s,{type:'market',side,quantity:10000,stop:side==='long'?90:110,target:side==='long'?110:90});B.step(s);return s;}
test('close sizing converts percent, lots and base units with exact full closes',()=>{
 for(const [v,u] of [[50,'percent'],[.05,'lots'],[5000,'units']])assert.deepEqual(UI.selection(10000,v,u),{quantity:5000,remaining:5000,percent:50,full:false});
 assert.equal(UI.selection(10000,100,'percent').full,true);assert.equal(UI.selection(30000,.3,'lots').remaining,0);
 for(const [v,u] of [[0,'percent'],[-1,'units'],[101,'percent'],[.11,'lots'],[Infinity,'units'],[NaN,'units'],[50,'bad']])assert.throws(()=>UI.selection(10000,v,u));
});
test('partial display is isolated to one entry and reports queued quantity',()=>{
 const s=session();B.requestPartialClose(s,2500);assert.match(UI.queued(s.position,s.symbol),/0.025 lots partial/);B.step(s);
 const p=s.position,net=s.trades[0].pnl;assert.equal(UI.realized(s,p),net);
 s.trades.push({...s.trades[0],entryTime:p.entryTime-60,pnl:999},{...s.trades[0],symbol:'GBPUSD',pnl:999});assert.equal(UI.realized(s,p),net);
});
test('amending SL/TP is prospective and preserves original risk after a partial',()=>{
 const s=session(),risk=s.position.riskCash;B.requestPartialClose(s,2500);B.step(s);const allocated=s.position.riskCash;
 B.amendOrder(s,{stop:95,target:108});assert.equal(s.position.riskCash,allocated);assert.equal(s.position.initialRiskCash,risk);
 const copy=B.restore(B.snapshot(s));assert.equal(copy.position.stop,95);assert.equal(copy.position.target,108);assert.equal(copy.position.quantity,7500);
 copy.candles[copy.cursor+1]={...copy.candles[copy.cursor+1],o:94,h:95,l:93,c:94};B.step(copy);assert.equal(copy.position,null);assert.equal(copy.trades.at(-1).reason,'Stop gap');assert.equal(B.completedTrades(copy)[0].riskCash,risk);
});
test('long and short stops may pass entry when still on protective side of revealed price',()=>{
 for(const side of ['long','short']){const s=session(side);s.candles[s.cursor].c=side==='long'?105:95;const risk=s.position.riskCash;B.amendOrder(s,{stop:side==='long'?101:99,target:side==='long'?110:90});assert.equal(s.position.riskCash,risk);}
});
test('invalid or queued amendments do not mutate order levels or history',()=>{
 const s=session(),before=JSON.stringify(s.actions);for(const changes of [{stop:101,target:110},{stop:90,target:99},{stop:NaN,target:110},{stop:-1,target:110}])assert.throws(()=>B.amendOrder(s,changes));assert.equal(s.position.stop,90);assert.equal(JSON.stringify(s.actions),before);
 B.requestPartialClose(s,2500);assert.throws(()=>B.amendOrder(s,{stop:95,target:110}),/already queued/);
});
test('pending edit retains order identity, size and type and survives restoration',()=>{
 const s=B.createSession(options,candles());B.placeOrder(s,{type:'limit',side:'long',quantity:10000,entry:98,stop:90,target:110});const id=s.pending.id;
 B.amendOrder(s,{entry:97,stop:92,target:108});assert.equal(s.pending.id,id);assert.equal(s.pending.type,'limit');assert.equal(s.pending.quantity,10000);
 const copy=B.restore(B.snapshot(s));assert.equal(copy.pending.entry,97);assert.equal(copy.pending.stop,92);assert.equal(copy.pending.quantity,10000);
 assert.throws(()=>B.amendOrder(s,{entry:91,stop:92,target:108}),/bracket/);
});
test('portfolio amendments and partials stay with their market and survive shared-clock restore',()=>{
 const s=B.createPortfolio(options,[{...options,candles:candles()},{...options,symbol:'GBPUSD',candles:candles()}]);B.placeOrder(s,{type:'market',side:'short',quantity:10000,stop:110,target:90});B.step(s);B.amendOrder(s,{stop:106,target:92});B.requestPartialClose(s,5000);B.step(s);
 const copy=B.restore(B.snapshot(s));assert.equal(copy.position.stop,106);assert.equal(copy.position.quantity,5000);assert.equal(copy.markets[1].position,null);assert.equal(copy.actions.filter(x=>x.kind==='amend').length,1);
});
test('exhausted history and flat sessions reject edits without inventing executions',()=>{
 const s=B.createSession(options,candles());assert.throws(()=>B.amendOrder(s,{stop:90,target:110}),/no position/);
 const t=session();while(B.step(t)){}assert.throws(()=>B.amendOrder(t,{stop:95,target:108}),/No next/);assert.equal(t.trades.length,0);
});

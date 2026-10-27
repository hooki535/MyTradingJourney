const test=require('node:test'),assert=require('node:assert/strict'),B=require('../assets/backtest-workspace.js'),Lab=require('../assets/backtest-lab.js');
const bars=()=>Array.from({length:80},(_,i)=>({t:1700000000+i*3600,o:100,h:101,l:99,c:100}));
function session(side='long',fx=false){const s=B.createSession({symbol:fx?'USDJPY':'TEST',interval:'1H',startBalance:10000,multiplier:1,fee:.2,slippage:.1,cursor:29,fxMode:fx?'inverse':'fixed'},bars());B.placeOrder(s,{side,type:'market',quantity:10,stop:side==='long'?90:110,target:side==='long'?110:90});B.step(s);return s;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('partial close fills only on the next open and preserves the remaining bracket',()=>{
 const s=session(),balance=s.balance;B.requestPartialClose(s,4);assert.equal(s.position.quantity,10);assert.equal(s.trades.length,0);B.step(s);
 assert.equal(s.position.quantity,6);assert.equal(s.position.stop,90);assert.equal(s.position.target,110);assert.equal(s.trades[0].quantity,4);assert.equal(s.trades[0].reason,'Partial close');near(s.balance-balance,s.trades[0].gross-.8);
 assert.equal(B.metrics(s).trades,0);assert.equal(Lab.analytics([s]).trades.length,0);near(Lab.analytics([s]).net,s.trades[0].pnl);
});
test('repeated partials reconcile fees, original R and one completed trade',()=>{
 const s=session(),initialRisk=s.position.riskCash;B.requestPartialClose(s,4);B.step(s);B.requestPartialClose(s,3);B.step(s);B.requestClose(s);B.step(s);
 assert.equal(s.position,null);assert.equal(s.trades.length,3);near(s.trades.reduce((n,t)=>n+t.fees,0),4);near(s.balance-s.startBalance,s.trades.reduce((n,t)=>n+t.pnl,0));
 const m=B.metrics(s);assert.equal(m.trades,1);assert.equal(m.executions,3);near(B.completedTrades(s)[0].r,m.realized/initialRisk);near(s.trades.reduce((n,t)=>n+t.r,0),m.realized/initialRisk);
 assert.equal(Lab.analytics([s]).trades.length,1);assert.equal(Lab.analytics([s]).executions.length,3);assert.equal(Lab.analytics([s]).maxLosses,1);
});
test('partial action logs restore exactly and legacy full closes retain their review key',()=>{
 const s=session('short');B.requestPartialClose(s,2.5);B.step(s);const restored=B.restore(B.snapshot(s));assert.equal(restored.position.quantity,7.5);near(restored.balance,s.balance);assert.deepEqual(restored.trades.map(t=>[t.pnl,t.quantity]),s.trades.map(t=>[t.pnl,t.quantity]));
 B.requestClose(s);B.step(s);const final=B.restore(B.snapshot(s));near(final.balance,s.balance);assert.equal(B.metrics(final).trades,1);
 const old=session();B.requestClose(old);B.step(old);assert.equal(B.tradeKey(old.trades[0]),['',old.trades[0].entryTime,old.trades[0].exitTime,'long'].join(':'));
});
test('short and inverse-FX partial proceeds reconcile at their respective exit prices',()=>{
 for(const side of ['long','short']){const s=session(side,true);B.requestPartialClose(s,4);B.step(s);B.requestClose(s);B.step(s);near(s.balance-s.startBalance,s.trades.reduce((n,t)=>n+t.pnl,0));for(const t of s.trades)near(t.gross,(side==='long'?1:-1)*(t.exit-t.entry)*t.quantity/t.exit);}
});
test('stop gaps take priority and the remaining quantity can stop on the partial-exit candle',()=>{
 const s=session();s.candles[s.cursor+1]={...s.candles[s.cursor+1],o:85,h:86,l:84,c:85};B.requestPartialClose(s,4);B.step(s);assert.equal(s.position,null);assert.equal(s.trades[0].quantity,10);assert.equal(s.trades[0].reason,'Stop gap');
 const t=session();t.candles[t.cursor+1]={...t.candles[t.cursor+1],o:100,h:101,l:89,c:95};B.requestPartialClose(t,4);B.step(t);assert.equal(t.position,null);assert.equal(t.trades.length,2);assert.equal(new Set(t.trades.map(B.tradeKey)).size,2);assert.equal(B.metrics(t).trades,1);
});
test('invalid partial sizes, double requests and exhausted history are rejected',()=>{
 const s=session();for(const qty of [0,-1,10,11,NaN,Infinity])assert.throws(()=>B.requestPartialClose(s,qty));B.requestPartialClose(s,2);assert.throws(()=>B.requestPartialClose(s,2),/already queued/);assert.throws(()=>B.requestClose(s),/already queued/);
 const t=session();while(B.step(t)){}assert.throws(()=>B.requestPartialClose(t,2),/No next/);
});
test('portfolio partials affect only the selected market and round trip',()=>{
 const options={name:'Pairs',startBalance:10000,multiplier:1,fee:.2,slippage:.1};const s=B.createPortfolio(options,[{symbol:'AAA',interval:'1H',candles:bars()},{symbol:'BBB',interval:'1H',candles:bars()}]);B.placeOrder(s,{side:'long',type:'market',quantity:10,stop:90,target:110});B.step(s);B.requestPartialClose(s,4);B.step(s);assert.equal(s.position.quantity,6);assert.equal(s.markets[1].position,null);const copy=B.restore(B.snapshot(s));assert.equal(copy.position.quantity,6);near(copy.balance,s.balance);B.requestClose(copy);B.step(copy);assert.equal(B.metrics(copy).trades,1);
});

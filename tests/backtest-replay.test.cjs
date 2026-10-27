const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../assets/backtest-replay.js'),E=require('../assets/backtest-workspace.js'),F=require('../assets/backtest-frames.js');
const time=s=>Date.parse(s)/1000;
function candles(count=240,start=time('2026-08-11T00:00:00Z'),interval=60){return Array.from({length:count},(_,i)=>({t:start+i*interval,o:1.1,h:1.1002,l:1.0998,c:1.1}));}
function session(data=candles(),options={}){return E.createSession({name:'Replay fixture',symbol:'EURUSD',interval:'1m',startBalance:10000,multiplier:1,fee:0,slippage:0,cursor:29,...options},data);}
const order={side:'long',type:'market',quantity:10000,stop:1.09,target:1.12};
function finish(run,size=200){let result;do{result=run.tick(size);}while(!result.done);return result;}
test('a chart-linked replay step processes each source candle and preserves deterministic orders',()=>{
 const s=session();E.placeOrder(s,order);const target=R.nextBoundary(R.clock(s),'15m',F),run=R.createRun(s,E,{mode:'time',target});const result=finish(run,3);assert.equal(result.reason,'time');assert.equal(s.cursor,30);assert.ok(s.position);assert.equal(s.position.entryTime,s.candles[30].t);assert.equal(result.steps,1);
 const next=finish(R.createRun(s,E,{mode:'time',target:R.nextBoundary(R.clock(s),'15m',F)}),4);assert.equal(next.steps,15);assert.deepEqual(E.metrics(E.restore(E.snapshot(s))),E.metrics(s));assert.equal(F.project(s,'4H').bars.at(-1).c,s.candles[s.cursor].c);
});
test('skipping to a future date exactly matches manual engine stepping including fills, costs and partial exits',()=>{
 const s=session(candles(),{fee:.00001,slippage:.00002});E.placeOrder(s,order);E.step(s);E.requestPartialClose(s,4000);const saved=E.snapshot(s),manual=E.restore(saved),automatic=E.restore(saved),target=s.candles[90].t;
 while(R.clock(manual)<target)E.step(manual);const result=finish(R.createRun(automatic,E,{mode:'time',target,pauseOnExit:false}),7);assert.equal(result.reason,'time');assert.equal(automatic.position.quantity,6000);assert.equal(automatic.trades.length,1);assert.deepEqual(E.snapshot(automatic).actions,E.snapshot(manual).actions);assert.deepEqual(E.metrics(automatic),E.metrics(manual));
});
test('pause on exit stops at the first exiting bar before the requested later time',()=>{
 const bars=candles();bars[35]={...bars[35],l:1.08};const s=session(bars);E.placeOrder(s,order);const result=finish(R.createRun(s,E,{target:bars[90].t}));assert.equal(result.reason,'trade');assert.equal(s.cursor,35);assert.equal(s.trades[0].reason,'Stop');assert.equal(E.restore(E.snapshot(s)).cursor,35);
});
test('price jumps reveal only sequential candles and respect search limits and gaps',()=>{
 const bars=candles();bars[60]={...bars[60],h:1.14};const s=session(bars);let r=finish(R.createRun(s,E,{mode:'price',price:1.13,deadline:bars[50].t,pauseOnExit:false}));assert.equal(r.reason,'limit');assert.equal(s.cursor,50);r=finish(R.createRun(s,E,{mode:'price',price:1.13,deadline:bars[70].t}));assert.equal(r.reason,'price');assert.equal(s.cursor,60);
 const gapped=session(candles(100,time('2026-08-11T00:00Z'),3600),{interval:'1H'});const before=gapped.cursor;r=finish(R.createRun(gapped,E,{mode:'price',price:2,deadline:R.clock(gapped)+1800}));assert.equal(r.reason,'limit');assert.equal(gapped.cursor,before);assert.equal(r.steps,0);
});
test('multi-pair skipping follows the shared clock even if the active instrument has no bar at a step',()=>{
 const data=candles(240),second=candles(80,data[0].t,180);const s=E.createPortfolio({name:'Multi',startBalance:10000},[{symbol:'EURUSD',interval:'1m',multiplier:1,source:'test',candles:data},{symbol:'USDJPY',interval:'3m',multiplier:1,source:'test',candles:second}]);E.selectMarket(s,'USDJPY');const cursor=s.cursor,start=s.clock;const result=finish(R.createRun(s,E,{mode:'time',target:start+600,pauseOnExit:false}),2);assert.equal(result.reason,'time');assert.equal(s.clock,start+600);assert.equal(s.cursor,cursor+3);assert.equal(E.restore(E.snapshot(s)).clock,s.clock);
});
test('challenge limits interrupt a skip and preserve the failed account state',()=>{
 const bars=candles();bars[35]={...bars[35],l:.99,c:1.0};const s=session(bars,{challenge:{name:'Practice',targetPct:10,dailyLossPct:3,maxLossPct:6,minDays:1,trailing:false}});E.placeOrder(s,{...order,quantity:100000,stop:.9,target:1.5});const result=finish(R.createRun(s,E,{target:bars[90].t,pauseOnExit:false}));assert.equal(result.reason,'challenge');assert.equal(s.cursor,35);assert.equal(E.challengeState(E.restore(E.snapshot(s))).status,'failed');
});
test('cancelling a chunked skip retains processed bars and remains restorable',()=>{
 const s=session(candles(2000));const run=R.createRun(s,E,{target:s.candles[1700].t,pauseOnExit:false});assert.equal(run.tick(13).done,false);const cursor=s.cursor,result=run.cancel();assert.equal(result.reason,'cancelled');run.tick(20);assert.equal(s.cursor,cursor);assert.equal(E.restore(E.snapshot(s)).cursor,cursor);
});
test('position-close jump ignores partial exits and waits until the active position is flat',()=>{
 const s=session();E.placeOrder(s,order);E.step(s);E.requestPartialClose(s,3000);const run=R.createRun(s,E,{mode:'exit',pauseOnExit:false});assert.equal(run.tick(1).done,false);assert.equal(s.position.quantity,7000);E.requestClose(s);const result=run.tick(1);assert.equal(result.reason,'exit');assert.equal(s.position,null);
});
test('invalid replay requests cannot mutate the session',()=>{
 const s=session(),cursor=s.cursor;for(const options of [{target:R.clock(s)},{target:R.end(s)+60},{mode:'price',price:NaN},{mode:'exit'},{mode:'price',price:2,deadline:R.clock(s)-1},{mode:'unknown'}])assert.throws(()=>R.createRun(s,E,options));assert.equal(s.cursor,cursor);
});
test('London and New York opens handle DST separately, skip weekends and require a future opening',()=>{
 assert.equal(R.nextOpen(time('2026-07-06T06:00Z'),'london'),time('2026-07-06T07:00Z'));assert.equal(R.nextOpen(time('2026-12-07T06:00Z'),'london'),time('2026-12-07T08:00Z'));
 assert.equal(R.nextOpen(time('2026-03-16T11:00Z'),'newyork'),time('2026-03-16T12:00Z'));assert.equal(R.nextOpen(time('2026-03-16T06:00Z'),'london'),time('2026-03-16T08:00Z'));
 assert.equal(R.nextOpen(time('2026-07-10T12:00Z'),'london'),time('2026-07-13T07:00Z'));assert.equal(R.nextOpen(time('2026-07-06T07:00Z'),'london'),time('2026-07-07T07:00Z'));
 assert.equal(R.nextOpen(time('2026-07-06T23:00Z'),'asia'),time('2026-07-07T00:00Z'));
});
test('monthly timestep follows the next calendar month rather than a fixed 31-day estimate',()=>{assert.equal(R.nextBoundary(time('2026-02-14T12:00Z'),'1M',F),time('2026-03-01T00:00Z'));assert.equal(R.nextBoundary(1,'source',F),null);});
test('relative risk presets adapt to JPY, other forex pairs and price-unit instruments',()=>{
 const preset={name:'London',riskPct:1,distance:20,reward:3};assert.deepEqual(R.orderLevels('USDJPY',150,'long',preset),{stop:149.8,target:150.6,riskPct:1});const short=R.orderLevels('EURUSD',1.1,'short',preset);assert.ok(Math.abs(short.stop-1.102)<1e-10);assert.ok(Math.abs(short.target-1.094)<1e-10);assert.equal(R.orderLevels('BTCUSD',50000,'long',preset).stop,49980);assert.throws(()=>R.orderLevels('EURUSD',.0001,'long',preset),/invalid/);assert.throws(()=>R.preset({...preset,riskPct:Infinity}));
 const cleaned=R.preferences({presets:[preset,{name:'invalid',riskPct:-1}],syncFrame:false});assert.equal(cleaned.presets.length,1);assert.equal(cleaned.syncFrame,false);
});

const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../assets/backtest-breakdowns.js'),E=require('../assets/backtest-engine.js'),Lab=require('../assets/backtest-lab.js');
const trade=(entry,seconds,pnl,r,symbol='EURUSD')=>({entryTime:Date.parse(entry)/1000,exitTime:Date.parse(entry)/1000+seconds,pnl,r,symbol});
test('hour, month and symbol distributions retain UTC boundaries and reconcile completed P&L',()=>{
 const rows=[trade('2024-01-31T23:30:00Z',3600,25,2),trade('2024-02-02T08:00:00Z',300,-10,-1,'GBPJPY'),trade('2024-02-02T08:00:00Z',1200,5,1)];
 const d=B.distributions(rows);assert.equal(d.hours[23].count,1);assert.equal(d.hours[8].count,2);assert.deepEqual(d.months.map(r=>[r.name,r.count,r.pnl]),[['2024-02',3,20]]);
 for(const group of Object.values(d)){assert.equal(group.reduce((n,r)=>n+r.count,0),3);assert.equal(group.reduce((n,r)=>n+r.pnl,0),20);}
 assert.equal(d.symbols.find(r=>r.name==='GBPJPY').pnl,-10);
});
test('duration and R bucket boundaries are exact and unmeasured risk stays separate',()=>{
 const rows=[0,899,900,3599,3600,14399,14400,86399,86400,604799,604800].map((seconds,i)=>trade('2024-01-01T00:00:00Z',seconds,1,[-3,-2,-1,0,1,2,3,null,NaN,undefined,0][i]));
 const d=B.distributions(rows);assert.deepEqual(d.durations.map(r=>r.count),[2,2,2,2,2,1]);assert.deepEqual(d.multiples.map(r=>r.count),[1,1,1,2,1,1,1,3]);
});
test('partial exits combine into one completed position for distribution counts',()=>{
 const bars=Array.from({length:80},(_,i)=>({t:1700000000+i*3600,o:100,h:101,l:99,c:100}));const s=E.createSession({symbol:'EURUSD',startBalance:10000,multiplier:1,fee:0,slippage:0,cursor:29},bars);
 E.placeOrder(s,{side:'long',type:'market',quantity:100,stop:90,target:120});E.step(s);E.requestPartialClose(s,25);E.step(s);
 assert.equal(B.distributions(Lab.analytics([s]).trades).symbols.length,0);
 E.requestClose(s);E.step(s);const a=Lab.analytics([s]),d=B.distributions(a.trades);assert.equal(a.executions.length,2);assert.equal(d.symbols[0].count,1);assert.equal(d.symbols[0].pnl,a.net);
});
test('monthly calendar handles leap years, Monday offsets, flat and empty trading days',()=>{
 const days=[{date:'2024-02-01',pnl:50,trades:[{},{}]},{date:'2024-02-02',pnl:-10,trades:[{}]},{date:'2024-02-03',pnl:0,trades:[{}]}],c=B.calendar(days,2024,1);
 assert.equal(c.cells.length,29);assert.equal(c.offset,3);assert.equal(c.net,40);assert.equal(c.wins,1);assert.equal(c.losses,1);assert.equal(c.tradingDays,3);assert.equal(c.cells[0].count,2);assert.equal(c.cells[3].active,false);
 assert.throws(()=>B.calendar(days,2024,12),/valid/);assert.deepEqual(B.distributions([]).months,[]);
});

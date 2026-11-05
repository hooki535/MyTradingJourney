const {test}=require('node:test'),assert=require('node:assert/strict'),D=require('../assets/backtest-session-dates.js');
test('a date without a time creates a complete UTC day range',()=>{
 assert.deepEqual(D.range({start:'2026-04-01',end:'2026-04-01'}),{start:'2026-04-01T00:00:00',end:'2026-04-01T23:59:59'});
 assert.equal(Date.parse(D.combine('2026-04-01','')+'Z'),Date.UTC(2026,3,1));
});
test('optional precise times and open-ended sessions keep their intended boundaries',()=>{
 assert.deepEqual(D.range({start:'2026-04-01',startTime:'08:30',end:'2026-04-02',endTime:'16:00'}),{start:'2026-04-01T08:30:00',end:'2026-04-02T16:00:59'});
 assert.deepEqual(D.range({start:'2026-04-01'}),{start:'2026-04-01T00:00:00',end:''});assert.deepEqual(D.range(),{start:'',end:''});
});
test('impossible days, malformed times and reversed windows are rejected before history loading',()=>{
 for(const day of ['2026-02-29','2026-04-31','04/01/2026','2026-13-01','2026-04-01T08:00'])assert.throws(()=>D.combine(day,''));
 for(const time of ['24:00','08:60','8:00','text'])assert.throws(()=>D.combine('2026-04-01',time));
 assert.equal(D.combine('2024-02-29',''),'2024-02-29T00:00:00');
 assert.throws(()=>D.range({start:'2026-04-02',end:'2026-04-01'}));
 assert.throws(()=>D.range({start:'2026-04-01',startTime:'15:00',end:'2026-04-01',endTime:'14:00'}));
});

const {test}=require('node:test'),assert=require('node:assert/strict');
const W=require('../assets/backtest-workstation.js');
test('pending ticket type follows side and current revealed close',()=>{
 assert.equal(W.pendingType('long',1.09,1.1),'limit');assert.equal(W.pendingType('long',1.11,1.1),'stop');
 assert.equal(W.pendingType('short',1.11,1.1),'limit');assert.equal(W.pendingType('short',1.09,1.1),'stop');
 for(const args of [['long',1.1,1.1],['buy',1,2],['long',NaN,2],['short',-1,2]])assert.throws(()=>W.pendingType(...args));
});
test('favorite timeframes survive untrusted preferences without unknown or duplicate intervals',()=>{
 assert.deepEqual(W.preferences({frames:['1m','1m','<script>','1M','1W','1s']}),{frames:['1m','1M','1W']});
 assert.deepEqual(W.preferences(null),W.preferences());assert.deepEqual(W.preferences({frames:[]}),{frames:[]});
 assert.deepEqual(W.frames,['1m','5m','15m','30m','1H','2H','4H','1D','1W','1M']);
});
test('command search matches all words across labels and groups',()=>{
 const rows=[{label:'Fib Retracement',group:'Drawing tools',keywords:'fib'},{label:'1m chart timeframe',group:'Timeframes'},{label:'Buy market order',group:'Trading'}];
 assert.deepEqual(W.search(rows,'drawing FIB'),[rows[0]]);assert.deepEqual(W.search(rows,'1m'),[rows[1]]);assert.deepEqual(W.search(rows,'unavailable'),[]);
});
test('review queue distinguishes untouched emotion defaults from written reviews',()=>{
 assert.equal(W.reviewed({emotion:'neutral'}),false);assert.equal(W.reviewed({notes:'  '}),false);assert.equal(W.reviewed({lesson:'Wait for confirmation'}),true);assert.equal(W.reviewed({followed:'yes'}),true);
});
test('replay progress reads only indexes and lengths, never unrevealed candle prices',()=>{
 const candles=Array.from({length:100},()=>new Proxy({}, {get(){throw Error('Candle prices must not be read');}}));
 assert.deepEqual(W.progress({candles,initialCursor:29,cursor:64}),{value:35,max:70,percent:50});
 assert.deepEqual(W.progress({candles,initialCursor:29,cursor:99}),{value:70,max:70,percent:100});
});

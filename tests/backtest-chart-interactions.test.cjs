const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Frames=require('../assets/backtest-frames.js');
function harness(){
 let range=null,clobber=false;const series=[];
 const ts={getVisibleLogicalRange:()=>range&&({...range}),setVisibleLogicalRange:r=>{range={...r};},coordinateToLogical:x=>x,logicalToCoordinate:x=>x};
 const chart={timeScale:()=>ts,addSeries(){const s={setData(data){this.data=data;if(clobber)range={from:-999,to:999};},applyOptions(){},createPriceLine(){return {};},removePriceLine(){},coordinateToPrice:y=>y,priceToCoordinate:p=>p};series.push(s);return s;},subscribeCrosshairMove(){},subscribeClick(){},remove(){}};
 function node(){return {style:{},classList:{add(){}},setAttribute(){},appendChild(){},replaceChildren(){},querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0})};}
 const host={clientWidth:1000,clientHeight:500,ownerDocument:{createElementNS:node},appendChild(n){this.svg=n;}};
 const context={window:{BacktestFrames:Frames,BacktestDrawingSuite:{geometry:()=>[],spec:()=>({points:2}),validate:()=>true,available:()=>true},LightweightCharts:{createChart:()=>chart,CandlestickSeries:{},LineSeries:{},CrosshairMode:{Normal:0},LineStyle:{Dashed:1}}},document:{body:{}},getComputedStyle:()=>({getPropertyValue:()=> '#111111'}),requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../assets/backtest-chart.js'),'utf8'),context);
 const view=new context.window.BacktestChart(host,()=>{},()=>{});
 return {view,host,series,range:()=>({...range}),setRange:r=>{range={...r};},clobber:()=>{clobber=true;}};
}
function session(){return {id:'test',symbol:'EURUSD',interval:'1H',candles:Array.from({length:100},(_,i)=>({t:1704067200+i*3600,o:100,h:101,l:99,c:100})),cursor:39,drawings:[],annotations:[],trades:[]};}
test('replay preserves a manually panned range even if setData adjusts the scale',()=>{
 const h=harness(),s=session();h.view.render(s,false,30);h.setRange({from:2,to:22});h.clobber();
 s.cursor++;h.view.render(s,false,30);assert.deepEqual(h.range(),{from:2,to:22});
 h.view.render(s,true,30);assert.deepEqual(h.range(),{from:2,to:22});
});
test('following replay retains manual zoom width and right margin, including partial display candles',()=>{
 const h=harness(),s=session();h.view.render(s,false,30);h.setRange({from:28,to:45});
 s.cursor++;h.view.render(s,false,30);assert.deepEqual(h.range(),{from:29,to:46});
 s.viewTimeframe='4H';s.cursor=40;h.view.render(s,false,30);h.setRange({from:4,to:16});
 s.cursor++;h.view.render(s,false,30);assert.deepEqual(h.range(),{from:4,to:16});
 s.cursor=44;h.view.render(s,false,30);assert.deepEqual(h.range(),{from:5,to:17});
});
test('loading earlier context keeps the same historical candles in a panned viewport',()=>{
 const h=harness(),s=session();h.view.render(s,false,30);h.setRange({from:2,to:22});
 Frames.setContext(s,Array.from({length:10},(_,i)=>({...s.candles[0],t:s.candles[0].t-(10-i)*3600})));
 h.view.render(s,false,30);assert.deepEqual(h.range(),{from:12,to:32});
 s.cursor++;h.view.render(s,false,30);assert.deepEqual(h.range(),{from:12,to:32});
});
test('changing timeframe, market or requested bar count intentionally resets the viewport',()=>{
 const h=harness(),s=session();h.view.render(s,false,30);h.setRange({from:2,to:22});
 s.viewTimeframe='4H';h.view.render(s,false,30);assert.deepEqual(h.range(),{from:-20,to:17});
 h.setRange({from:1,to:4});s.symbol='GBPUSD';h.view.render(s,false,30);assert.deepEqual(h.range(),{from:-20,to:17});
 h.view.render(s,false,40);assert.deepEqual(h.range(),{from:-30,to:17});
});
function draw(h,x,y){h.view.tool('trend');h.host.svg.onclick({clientX:x,clientY:y,detail:1});h.host.svg.onclick({clientX:x+1,clientY:y,detail:1});}
test('magnet snaps to aggregated displayed OHLC and never includes unrevealed source highs',()=>{
 const h=harness(),s=session();s.viewTimeframe='4H';s.cursor=1;s.candles[1].h=120;s.candles[2].h=400;
 h.view.render(s,false,30);h.view.magnet();draw(h,0,119);
 assert.equal(s.annotations[0].points[0].p,120);assert.equal(s.annotations[0].points[0].i,0);
 assert.equal(s.annotations[0].points[1].p,120);assert.equal(s.annotations[0].points[1].i,0);
 s.cursor=2;h.view.render(s,false,30);draw(h,0,399);assert.equal(s.annotations[1].points[0].p,400);
});
test('magnet can anchor to an earlier context candle rather than clamping to the saved dataset',()=>{
 const h=harness(),s=session();Frames.setContext(s,[{t:s.candles[0].t-3600,o:110,h:120,l:105,c:115}]);
 h.view.render(s,false,30);h.view.magnet();draw(h,0,119);
 assert.equal(s.annotations[0].points[0].p,120);assert.equal(s.annotations[0].points[0].i,-1);
});

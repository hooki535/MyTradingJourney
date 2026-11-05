const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Suite=require('../assets/backtest-drawing-suite.js'),M=require('../assets/backtest-settings-model.js'),Frames=require('../assets/backtest-frames.js'),E=require('../assets/backtest-engine.js');
function harness(){
 class Node{constructor(){this.children=[];this.attrs={};this.style={};this.classList={add(){}};}setAttribute(k,v){this.attrs[k]=v;}appendChild(n){this.children.push(n);}replaceChildren(){this.children=[];}getBoundingClientRect(){return {left:0,top:0};}setPointerCapture(){}releasePointerCapture(){}querySelectorAll(){return [];}all(){return this.children.flatMap(n=>[n,...n.all()]);}}
 const host={clientWidth:1000,clientHeight:500,ownerDocument:{createElementNS:()=>new Node()},appendChild(n){this.svg=n;}};
 const series={applyOptions(){},setData(){},coordinateToPrice:y=>y,priceToCoordinate:p=>p,createPriceLine(){return {};},removePriceLine(){}};
 const scale={setVisibleLogicalRange(){},coordinateToLogical:x=>x,logicalToCoordinate:x=>x};
 const chart={addSeries:()=>series,timeScale:()=>scale,subscribeCrosshairMove(){},subscribeClick(){},remove(){}};
 const context={window:{BacktestDrawingSuite:Suite,BacktestSettingsModel:M,BacktestFrames:Frames,LightweightCharts:{createChart:()=>chart,CandlestickSeries:{},LineSeries:{},CrosshairMode:{Normal:0},LineStyle:{Dashed:1}}},document:{body:{}},getComputedStyle:()=>({getPropertyValue:()=> '#111111'}),requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../assets/backtest-chart.js'),'utf8'),context);
 const view=new context.window.BacktestChart(host,()=>{},()=>{}),s={id:'position',symbol:'EURUSD',interval:'1H',balance:10000,multiplier:1,candles:Array.from({length:60},(_,i)=>({t:1704067200+i*3600,o:200,h:201,l:199,c:200})),cursor:39,drawings:[],annotations:[],trades:[]};view.render(s,false,30);
 const click=(x,y)=>host.svg.onclick({clientX:x,clientY:y,detail:1});
 const drag=(handle,x,y)=>{const n=host.svg.all().find(n=>n.attrs['data-handle']===handle);assert.ok(n,'handle '+handle);n.onpointerdown({preventDefault(){},stopPropagation(){},pointerId:1});host.svg.onpointermove({clientX:x,clientY:y});host.svg.onpointerup({clientX:x,clientY:y,pointerId:1});};
 return {view,s,host,click,drag};
}
test('one click creates correctly oriented long and short boxes with independent handles',()=>{
 for(const type of ['long','short']){const h=harness();h.view.tool(type);h.click(20,200);const a=h.s.annotations[0];assert.ok(a);assert.equal(h.s.annotations.length,1);assert.ok(type==='long'?a.points[1].p<200&&a.target>200:a.target<200&&a.points[1].p>200);assert.equal(a.points[1].i,35);assert.equal(h.host.svg.all().filter(n=>n.attrs['data-position-zone']).length,2);assert.deepEqual(h.host.svg.all().filter(n=>n.attrs['data-handle']!==undefined).map(n=>n.attrs['data-handle']),[0,'stop','target','right']);}
});
test('stop, target and width drags change only their own level and undo restores the geometry',()=>{
 const h=harness();h.view.tool('long');h.click(20,200);const a=h.s.annotations[0],initial=JSON.stringify(a);h.drag('stop',20,190);assert.equal(a.points[1].p,190);assert.equal(a.points[1].i,35);assert.equal(a.target,206);
 h.drag('target',20,215);assert.equal(a.target,215);assert.equal(a.points[1].p,190);
 h.drag('right',70,210);assert.equal(a.points[1].i,70);assert.equal(a.points[1].p,190);assert.equal(a.points[0].p,200);assert.equal(a.target,215);
 h.view.undo();h.view.undo();h.view.undo();assert.equal(JSON.stringify(h.s.annotations[0]),initial);h.view.redo();assert.equal(h.s.annotations[0].points[1].p,190);
});
test('position preview shows zones without saving; invalid level drags cannot invert risk',()=>{
 const h=harness();h.view.tool('long');h.host.svg.onpointermove({clientX:20,clientY:200});assert.equal(h.s.annotations.length,0);assert.equal(h.host.svg.all().filter(n=>n.attrs['data-position-zone']).length,2);
 h.click(20,200);const old=h.s.annotations[0].points[1].p;h.drag('stop',20,220);assert.equal(h.s.annotations[0].points[1].p,old);
});
test('drawing quantity, cash risk and reward use saved sizing inputs and round quantity down',()=>{
 const a={type:'long',points:[{i:0,p:100},{i:20,p:98}],target:106,settings:{accountSize:10000,riskPct:1,lotSize:10,pointValue:2,qtyPrecision:2}},r=Suite.positionStats(a);assert.equal(r.ratio,3);assert.equal(r.quantity,2.5);assert.equal(r.riskCash,100);assert.equal(r.rewardCash,300);
 a.settings.accountSize=9999;assert.ok(Suite.positionStats(a).riskCash<=99.99);assert.throws(()=>M.clean('long',{qtyPrecision:2.5}),/whole number/);
 const bars=Array.from({length:60},(_,i)=>({t:1704067200+i*60,o:100,h:102,l:99,c:101})),s=E.createSession({symbol:'EURUSD',interval:'1m',startBalance:10000,multiplier:1},bars);s.annotations=[{...a,id:'saved-position',settings:{...M.defaults('long'),...a.settings,qtyPrecision:2}}];const restored=E.restore(E.snapshot(s)).annotations[0];assert.equal(restored.settings.lotSize,10);assert.equal(restored.target,106);assert.equal(Suite.positionStats(restored).quantity,2.49);
});
test('position style controls change rendered zones and hide statistics without changing geometry',()=>{
 const h=harness();h.view.tool('long');h.click(20,200);const a=h.s.annotations[0],before=JSON.stringify(a.points),settings={...M.fromAnnotation(a),profit:{on:true,color:'#123456',opacity:.65},showStats:false};h.view.updateSelected({settings});
 const zone=h.host.svg.all().find(n=>n.attrs['data-position-zone']==='profit');assert.equal(zone.attrs.fill,'#123456');assert.equal(zone.attrs['fill-opacity'],.65);assert.ok(!h.host.svg.all().some(n=>String(n.textContent).includes('Risk/Reward')));assert.equal(JSON.stringify(a.points),before);
 h.view.updateSelected({locked:true});assert.equal(h.host.svg.all().filter(n=>n.attrs['data-handle']!==undefined).length,0);
});
test('pattern settings hide labels and ratios while retaining their plotted paths',()=>{
 const ctx={map:p=>({x:p.i*8,y:p.p*10}),bars:[],width:900,height:500},a={type:'abcd',points:[{i:1,p:100},{i:2,p:102},{i:3,p:101},{i:4,p:103}],settings:{showLabels:false,showRatios:false}},shapes=Suite.geometry(a,ctx);assert.ok(shapes.some(s=>s.tag==='polyline'));assert.ok(!shapes.some(s=>s.tag==='text'));
});

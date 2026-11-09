/* TradingView Lightweight Charts with MyTradingJourney's saved drawing tools. */
(() => {
 'use strict';
 let chartSequence=0;
 window.BacktestChart=function(host,onCrosshair,onLevel,callbacks={}){
  const L=window.LightweightCharts,Lab=window.BacktestLab,clipId='bt-drawing-plot-'+(++chartSequence);
  if(!L)throw Error('TradingView chart library could not be loaded. Reload the page.');
  const color=n=>getComputedStyle(document.body).getPropertyValue('--bt-'+n).trim();
  // GoCharting-style smooth navigation: drag with momentum, wheel zoom, axis drag to stretch.
  const SMOOTH=on=>({handleScroll:on?{mouseWheel:true,pressedMouseMove:true,horzTouchDrag:true,vertTouchDrag:true}:false,handleScale:on?{mouseWheel:true,pinch:true,axisPressedMouseMove:{time:true,price:true},axisDoubleClickReset:{time:true,price:true}}:false});
  const chart=L.createChart(host,{autoSize:true,layout:{background:{type:'solid',color:color('card')},textColor:color('muted'),attributionLogo:true,fontSize:11},grid:{vertLines:{color:color('line')},horzLines:{color:color('line')}},timeScale:{timeVisible:true,secondsVisible:false,rightOffset:8,barSpacing:7,minBarSpacing:0.4,lockVisibleTimeRangeOnResize:true,borderColor:color('line')},rightPriceScale:{borderColor:color('line'),scaleMargins:{top:0.08,bottom:0.08}},crosshair:{mode:L.CrosshairMode.Normal,vertLine:{style:L.LineStyle.Dashed,width:1,labelBackgroundColor:'#111318'},horzLine:{style:L.LineStyle.Dashed,width:1,labelBackgroundColor:'#111318'}},kineticScroll:{mouse:true,touch:true},...SMOOTH(true)});
  function applyTheme(){chart.applyOptions({layout:{background:{type:'solid',color:color('card')},textColor:color('muted')},grid:{vertLines:{color:color('line')},horzLines:{color:color('line')}},rightPriceScale:{borderColor:color('line')}});candles.applyOptions(['line','area'].includes(renderKind)?{color:color('up'),lineColor:color('up')}:{upColor:renderKind==='hollow'?'transparent':color('up'),downColor:color('down'),wickUpColor:color('up'),wickDownColor:color('down')});repaint();}
  window.addEventListener?.('themechange',applyTheme);
  function priceSeries(kind){const types={candles:L.CandlestickSeries,hollow:L.CandlestickSeries,bars:L.BarSeries,line:L.LineSeries,area:L.AreaSeries};return chart.addSeries(types[kind]||L.CandlestickSeries,['line','area'].includes(kind)?{color:color('up'),lineColor:color('up'),lineWidth:2,topColor:'#32cf9135',bottomColor:'#32cf9102'}:{upColor:kind==='hollow'?'transparent':color('up'),downColor:color('down'),borderVisible:kind==='hollow',borderUpColor:color('up'),borderDownColor:color('down'),wickUpColor:color('up'),wickDownColor:color('down')});}
  let renderKind='candles',candles=priceSeries(renderKind);
  const ma=chart.addSeries(L.LineSeries,{color:'#a390ff',lineWidth:2,priceLineVisible:false,lastValueVisible:false});
  const extra=new Map();let markers=L.createSeriesMarkers?L.createSeriesMarkers(candles,[]):null;
  let projectionLength=0,projectionFirstTime=null,sessionId=null,visible=0,lines=[],current=null,tool='cursor',first=null,selected=null,drag=null,frame=null,hover=null,magnet=false,hidden=false,suppressClick=false,lastMA=false;
  const Suite=window.BacktestDrawingSuite;
  let pending=[],freehand=null,lastHit=null,lastTap=null;
  let projection=null,keepMode=false,eraser=false;
  const viewListeners={range:new Set(),crosshair:new Set()};
  let calendarKey='',calendarSegments=[];
  const histories=new Map(),redos=new Map();
  const snapshot=()=>JSON.stringify({annotations:current?.annotations||[],drawings:current?.drawings||[]});
  function remember(value=snapshot()){if(!current)return;const key=current.id+':'+current.symbol;redos.set(key,[]);const h=histories.get(key)||[];if(h.at(-1)!==value)h.push(value);if(h.length>30)h.shift();histories.set(key,h);}
  function changed(){callbacks.onChange?.();repaint();}
  function valid(a){if(!a.points.every(p=>p.p>0&&Number.isFinite(p.p)&&Number.isFinite(p.i)))return false;return a.type==='long'?a.points[1].p<a.points[0].p&&a.target>a.points[0].p:a.type==='short'?a.target<a.points[0].p&&a.points[1].p>a.points[0].p:true;}
  let gestureOptions=null,viewportFrame=null,viewportTicks=0,destroyed=false;
  function ownGesture(){if(gestureOptions)return;const options=chart.options?.()||{};gestureOptions=JSON.parse(JSON.stringify({handleScroll:options.handleScroll??true,handleScale:options.handleScale??true}));chart.applyOptions?.({handleScroll:false,handleScale:false});}
  function releaseGesture(){if(!gestureOptions)return;chart.applyOptions?.(gestureOptions);gestureOptions=null;}
  function trackViewport(){if(destroyed)return;viewportTicks=3;if(viewportFrame!=null)return;function tick(){viewportFrame=null;if(destroyed)return;repaint();if(--viewportTicks>0)viewportFrame=requestAnimationFrame(tick);}viewportFrame=requestAnimationFrame(tick);}
  for(const type of ['pointerup','pointercancel','blur'])window.addEventListener?.(type,releaseGesture);
  const viewportEvents=['pointermove','pointerup','wheel','touchmove','touchend','dblclick'];for(const type of viewportEvents)host.addEventListener?.(type,trackViewport,{passive:true,capture:true});
  const doc=host.ownerDocument,ns='http://www.w3.org/2000/svg',svg=doc?doc.createElementNS(ns,'svg'):null;
  if(svg){svg.classList.add('bt-drawing-layer');svg.setAttribute('aria-label','Chart drawing layer');host.appendChild(svg);}
  const observer=svg&&typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>{if(frame)cancelAnimationFrame(frame);frame=requestAnimationFrame(repaint);}):null;observer?.observe(host);
  const ts=chart.timeScale(),mapped=b=>({time:b.t,open:b.o,high:b.h,low:b.l,close:b.c});
  const average=(s,i)=>{let sum=0;for(let j=i-19;j<=i;j++)sum+=s.candles[j].c;return {time:s.candles[i].t,value:sum/20};};
  function element(type,attrs,parent=svg){const node=doc.createElementNS(ns,type);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);parent.appendChild(node);return node;}
  function point(p){return {x:ts.logicalToCoordinate(projection?projection.toDisplay(p.i):p.i),y:candles.priceToCoordinate(p.p)};}
  function text(x,y,label,fill,parent){const node=element('text',{x,y,fill,'font-size':10,'font-family':'system-ui','pointer-events':'none'},parent);node.textContent=label;}
  function drawAnnotation(a,isLive=false){
   if(Array.isArray(a.visibility)&&!a.visibility.includes(window.BacktestFrames?.selected(current)||current.interval))return;
   const p=point(a.points[0]),q=point(a.points[1]);if([p.x,p.y,q.x,q.y].some(v=>v==null||!Number.isFinite(v)))return;
   const group=element('g',{'data-annotation':isLive?'':a.id,'class':isLive?(a.preview?'bt-live-position bt-draw-preview':'bt-live-position'):(selected===a.id?'bt-annotation bt-selected':a.locked?'bt-annotation bt-locked':'bt-annotation'),'clip-path':'url(#'+clipId+')'}),stroke=a.color||color('accent'),line=(x1,y1,x2,y2,c=stroke,dash=(a.dash==='dashed'?'7 4':a.dash==='dotted'?'2 4':''))=>(isLive||element('line',{x1,y1,x2,y2,stroke:'transparent','stroke-width':12,'class':'bt-hit-line','pointer-events':'stroke'},group),element('line',{x1,y1,x2,y2,stroke:c,'stroke-width':selected===a.id?Math.max(2.5,a.width||2):a.width||2,'stroke-dasharray':dash,'pointer-events':isLive?'none':'stroke'},group));
   const primitives=Suite.geometry(a,{map:point,bars:current.candles.slice(0,current.cursor+1),width:host.clientWidth-65,height:chart.panes?.()[0]?.getHeight?.()||host.clientHeight-30});
   if(primitives!==null){group.setAttribute('color',stroke);for(const shape of primitives){const node=element(shape.tag,{fill:shape.tag==='text'?stroke:'none',stroke:shape.tag==='text'?'none':stroke,'stroke-width':a.width||2,'stroke-dasharray':a.dash==='dashed'?'7 4':a.dash==='dotted'?'2 4':'','font-family':'system-ui','font-size':11,'pointer-events':isLive?'none':'visiblePainted',...shape.attrs},group);if(shape.text!==undefined)node.textContent=shape.text;}}
   else if(['trend','ray','extended','arrow','info','channel'].includes(a.type)){
    let x1=p.x,y1=p.y,x2=q.x,y2=q.y;const slope=Math.abs(q.x-p.x)>1?(q.y-p.y)/(q.x-p.x):0;
    if(a.type==='ray'&&Math.abs(q.x-p.x)>1){x2=q.x>=p.x?host.clientWidth-65:0;y2=p.y+slope*(x2-p.x);}
    if(a.type==='extended'&&Math.abs(q.x-p.x)>1){x1=0;y1=p.y-slope*p.x;x2=host.clientWidth-65;y2=p.y+slope*(x2-p.x);}
    if(Math.abs(q.x-p.x)>1){if(a.settings?.extendLeft){x1=0;y1=p.y-slope*p.x;}if(a.settings?.extendRight){x2=host.clientWidth-65;y2=p.y+slope*(x2-p.x);}}
    line(x1,y1,x2,y2);

    if(a.type==='channel'){const offset=a.offset??Math.max(Math.abs(a.points[1].p-a.points[0].p)*.5,a.points[0].p*.001),dy=candles.priceToCoordinate(a.points[0].p+offset)-p.y;line(p.x,p.y+dy,q.x,q.y+dy);line(p.x,p.y+dy/2,q.x,q.y+dy/2,stroke,'4 4');element('polygon',{points:[p.x+','+p.y,q.x+','+q.y,q.x+','+(q.y+dy),p.x+','+(p.y+dy)].join(' '),fill:stroke+'12','pointer-events':'all'},group);}

    if(a.type==='arrow'){const angle=Math.atan2(q.y-p.y,q.x-p.x),r=10;line(q.x,q.y,q.x-r*Math.cos(angle-.5),q.y-r*Math.sin(angle-.5));line(q.x,q.y,q.x-r*Math.cos(angle+.5),q.y-r*Math.sin(angle+.5));}
   }
   else if(a.type==='horizontalray')line(p.x,p.y,host.clientWidth-65,p.y);
   else if(a.type==='crossline'){line(0,p.y,host.clientWidth-65,p.y);line(p.x,0,p.x,host.clientHeight-30);}
   else if(a.type==='triangle')element('polygon',{points:p.x+','+q.y+' '+((p.x+q.x)/2)+','+p.y+' '+q.x+','+q.y,fill:stroke+'18',stroke,'stroke-width':a.width||2,'stroke-dasharray':a.dash==='dashed'?'7 4':a.dash==='dotted'?'2 4':'','pointer-events':'all'},group);
   else if(a.type==='horizontal')line(0,p.y,host.clientWidth-65,p.y);
   else if(a.type==='vertical')line(p.x,0,p.x,chart.panes?.()[0]?.getHeight?.()||host.clientHeight-30);
   else if(a.type==='ellipse')element('ellipse',{cx:(p.x+q.x)/2,cy:(p.y+q.y)/2,rx:Math.max(1,Math.abs(p.x-q.x)/2),ry:Math.max(1,Math.abs(p.y-q.y)/2),fill:stroke+'18',stroke,'stroke-width':a.width||2,'stroke-dasharray':a.dash==='dashed'?'7 4':a.dash==='dotted'?'2 4':'','pointer-events':'all'},group);
   else if(a.type==='text'){text(p.x,p.y,a.text||'Note',stroke,group);line(p.x,p.y+5,q.x,q.y);}
   else if(['measure','pricerange','daterange'].includes(a.type)){
    const settings=a.settings||{},parts=[],delta=a.points[1].p-a.points[0].p,pip=window.BacktestReplay?.pip?.(current.symbol);
    element('rect',{x:Math.min(p.x,q.x),y:Math.min(p.y,q.y),width:Math.max(1,Math.abs(p.x-q.x)),height:Math.max(1,Math.abs(p.y-q.y)),fill:stroke+'18',stroke,'stroke-dasharray':'4 3','pointer-events':'all'},group);
    if(a.type!=='daterange'){if(settings.showPips!==false)parts.push(pip?Number((delta/pip).toFixed(2))+' pips':Number(delta.toPrecision(5))+' price units');if(settings.showPercent!==false)parts.push((delta/a.points[0].p*100).toFixed(2)+'%');}
    if(a.type!=='pricerange'){if(settings.showBars!==false)parts.push(Math.round(Math.abs(a.points[1].i-a.points[0].i))+' source bars');if(settings.showTime){const from=current.candles[Math.round(a.points[0].i)]?.t,to=current.candles[Math.round(a.points[1].i)]?.t;if(from!==undefined&&to!==undefined)parts.push(Math.abs(to-from)/3600+'h');}}
    if(parts.length)text(Math.min(p.x,q.x)+5,Math.min(p.y,q.y)-8,parts.join(' · '),stroke,group);
   }
   else if(a.type==='rectangle')element('rect',{x:a.settings?.extendLeft?0:Math.min(p.x,q.x),y:Math.min(p.y,q.y),width:Math.max(1,(a.settings?.extendRight?host.clientWidth-65:Math.max(p.x,q.x))-(a.settings?.extendLeft?0:Math.min(p.x,q.x))),height:Math.max(1,Math.abs(q.y-p.y)),fill:stroke+'18',stroke,'stroke-width':a.width||2,'stroke-dasharray':a.dash==='dashed'?'7 4':a.dash==='dotted'?'2 4':'','pointer-events':'all'},group);
   else if(a.type==='fib'){
    const props=a.settings||{},rows=(props.levels|| (a.levels||[0,.236,.382,.5,.618,.786,1]).map(v=>({v,c:stroke,on:true}))).filter(r=>r.on),style=props.levelsLine||{width:a.width||2,dash:a.dash||'solid'},left=a.extendLeft?0:Math.min(p.x,q.x),right=a.extendRight?host.clientWidth-65:Math.max(p.x,q.x),at=r=>q.y+(p.y-q.y)*(props.reverse?1-r.v:r.v);
    if(props.background?.on){const sorted=[...rows].sort((a,b)=>a.v-b.v);for(let i=1;i<sorted.length;i++){const y1=at(sorted[i-1]),y2=at(sorted[i]);element('rect',{x:left,y:Math.min(y1,y2),width:right-left,height:Math.max(.5,Math.abs(y2-y1)),fill:sorted[i].c,'fill-opacity':props.background.opacity,'pointer-events':isLive?'none':'all'},group);}}
    if(props.trend?.on)element('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:props.trend.color,'stroke-width':props.trend.width,'stroke-dasharray':props.trend.dash==='solid'?'':props.trend.dash==='dotted'?'2 4':'7 4','pointer-events':isLive?'none':'stroke'},group);
    for(const row of rows){const y=at(row),price=a.points[1].p+(a.points[0].p-a.points[1].p)*(props.reverse?1-row.v:row.v);element('line',{x1:left,y1:y,x2:right,y2:y,stroke:row.c,'stroke-width':style.width,'stroke-dasharray':style.dash==='solid'?'':style.dash==='dotted'?'2 4':'7 4','pointer-events':isLive?'none':'stroke','data-fib-level':row.v},group);const showPrice=props.showPrices??a.showPrices!==false,showLevel=props.showLevels!==false,label=[showLevel?String(row.v):'',showPrice?price.toFixed(5):''].filter(Boolean).join(' · ');if(label){const side=props.labelSide||'left',x=side==='right'?right-4:side==='center'?(left+right)/2:left+4,node=element('text',{x,y:y-4,fill:row.c,'font-size':10,'font-family':'system-ui','text-anchor':side==='right'?'end':side==='center'?'middle':'start','pointer-events':'none'},group);node.textContent=label;}}
   }
   else if(a.type==='long'||a.type==='short'){
    const areas=a.settings||{},profit=areas.profit,loss=areas.loss,profitColor=profit?.color||'#089981',lossColor=loss?.color||'#f23645',stats=Suite.positionStats(a),ty=candles.priceToCoordinate(stats.target),left=Math.min(p.x,q.x),width=Math.max(1,Math.abs(q.x-p.x));if(ty==null)return;
    element('rect',{x:left,y:Math.min(p.y,ty),width,height:Math.max(1,Math.abs(p.y-ty)),fill:profit?.on===false?'none':profitColor,'fill-opacity':profit?.opacity??.2,stroke:'none','data-position-zone':'profit','pointer-events':isLive?'none':'all'},group);
    element('rect',{x:left,y:Math.min(p.y,q.y),width,height:Math.max(1,Math.abs(p.y-q.y)),fill:loss?.on===false?'none':lossColor,'fill-opacity':loss?.opacity??.2,stroke:'none','data-position-zone':'loss','pointer-events':isLive?'none':'all'},group);
    if(areas.line?.on!==false)for(const y of [p.y,q.y,ty])line(left,y,left+width,y,areas.line?.color||'#787b86');
    if(areas.showPrices!==false)for(const [y,value] of [[p.y,stats.entry],[q.y,stats.stop],[ty,stats.target]])text(left+width+5,y-3,Number(value.toPrecision(7)),areas.line?.color||'#b2b5be',group);
    if(areas.showStats!==false&&(selected===a.id||areas.alwaysStats===true)){
     const account=areas.accountSize??10000,quantity=stats.quantity,decimals=current.candles[current.cursor].c<20?5:current.candles[current.cursor].c<1000?3:2,tick=10**-decimals,format=n=>n.toFixed(decimals),amount=n=>Number(n.toFixed(2)).toString();
     function badge(y,rows,fill){const font=areas.textFont||{},size=font.size||12,padding=5,height=rows.length*(size+2)+6,cx=Math.max(15,Math.min(host.clientWidth-80,left+width/2)),content=rows.map(String),estimated=Math.min(host.clientWidth-80,Math.max(...content.map(v=>v.length))*size*.55+padding*2),bx=Math.max(1,Math.min(host.clientWidth-66-estimated,cx-estimated/2)),by=Math.max(2,Math.min(host.clientHeight-height-28,y));const label=element('g',{'data-position-stats':rows.length>1?'entry':'level','pointer-events':isLive?'none':'all','cursor':isLive?'default':'move'},group);element('rect',{x:bx,y:by,width:estimated,height,rx:3,fill,stroke:selected===a.id?'#d1d4dc':'none','stroke-width':1},label);content.forEach((value,index)=>{const node=element('text',{x:bx+estimated/2,y:by+size+3+index*(size+2),fill:font.color||'#fff','font-size':size,'font-family':'Arial,sans-serif','font-weight':500,'text-anchor':'middle'},label);node.textContent=value;});}
     const targetText=areas.compact?'Target: '+format(stats.reward):'Target: '+format(stats.reward)+' ('+(stats.reward/stats.entry*100).toFixed(2)+'%) '+Math.round(stats.reward/tick)+', Amount: '+amount(account+stats.rewardCash),stopText=areas.compact?'Stop: '+format(stats.risk):'Stop: '+format(stats.risk)+' ('+(stats.risk/stats.entry*100).toFixed(2)+'%) '+Math.round(stats.risk/tick)+', Amount: '+amount(account-stats.riskCash),mark=current.candles[current.cursor].c,delta=(mark-stats.entry)*(a.type==='short'?-1:1),pnl=delta*quantity*(areas.lotSize??1)*(areas.pointValue??1);
     badge(ty+(ty<p.y?-30:5),[targetText],profitColor);badge(q.y+(q.y>p.y?5:-30),[stopText],lossColor);badge(p.y-((p.y<q.y)?-7:38),areas.compact?['Risk/Reward Ratio: '+stats.ratio.toFixed(2)]:['Open P&L: '+format(delta)+', Qty: '+amount(quantity),'Risk/Reward Ratio: '+Number(stats.ratio.toFixed(2))],pnl<0?lossColor:profitColor);
    }
   }
   const settings=a.settings||{};
   if(settings.showPrice&&['trend','ray','extended','horizontal','horizontalray','crossline'].includes(a.type))text(host.clientWidth-130,p.y-5,Number(a.points[0].p.toPrecision(7)),stroke,group);
   if(['trend','ray','extended','arrow','info'].includes(a.type)&&(settings.showStats||a.type==='info')){
    const parts=[],delta=a.points[1].p-a.points[0].p;
    if(settings.showPrice!==false)parts.push(Number(delta.toPrecision(5))+' ('+(delta/a.points[0].p*100).toFixed(2)+'%)');
    if(settings.showBars!==false)parts.push(Math.round(Math.abs(a.points[1].i-a.points[0].i))+' source bars');
    if(settings.showAngle)parts.push((Math.atan2(p.y-q.y,q.x-p.x)*180/Math.PI).toFixed(1)+'°');
    if(settings.showTime){const i=Math.round(a.points[0].i),j=Math.round(a.points[1].i),from=current.candles[i]?.t,to=current.candles[j]?.t;if(from!==undefined&&to!==undefined)parts.push(Math.abs(to-from)/3600+'h');}
    text((p.x+q.x)/2,(p.y+q.y)/2-12,parts.join(' · '),stroke,group);
   }

   if(a.type!=='fib'){
    if(settings.background)for(const shape of group.querySelectorAll('rect,ellipse,polygon')){shape.setAttribute('fill',settings.background.on?settings.background.color:'none');shape.setAttribute('fill-opacity',settings.background.opacity);}
    if(settings.line?.on===false)for(const shape of group.querySelectorAll(window.BacktestDrawingSuite.spec(a.type)?.group==='notes'?'rect,ellipse,polygon':'[stroke]'))shape.setAttribute('stroke','none');
    const font=settings.font||settings.textFont||settings.labelFont;if(font)for(const label of group.querySelectorAll('text')){label.setAttribute('fill',font.color);label.setAttribute('font-size',font.size);label.setAttribute('font-weight',font.bold?700:400);label.setAttribute('font-style',font.italic?'italic':'normal');}
    if(settings.text&&window.BacktestDrawingSuite.spec(a.type)?.group!=='notes'){const label=element('text',{x:(p.x+q.x)/2,y:(p.y+q.y)/2-8,fill:font?.color||stroke,'text-anchor':'middle','font-family':'system-ui','font-size':font?.size||12,'font-weight':font?.bold?700:400,'font-style':font?.italic?'italic':'normal','pointer-events':'none'},group);label.textContent=settings.text;}
   }
   if(!isLive){
    function select(e){if(tool!=='cursor')return;e.stopPropagation();selected=a.id;callbacks.onSelect?.(a);repaint();}
    group.onclick=select;
    group.onpointerdown=e=>{if(e.button>0||tool!=='cursor')return;if(eraser){if(a.locked)return;e.preventDefault();e.stopPropagation?.();remember();current.annotations=current.annotations.filter(row=>row.id!==a.id);selected=null;callbacks.onSelect?.(null);changed();return;}const start=readPoint(e);if(!start)return;select(e);lastHit={id:a.id,x:e.clientX,y:e.clientY,at:Date.now()};if(a.locked)return;drag={a,start,old:JSON.parse(JSON.stringify(a)),before:snapshot(),changed:false};ownGesture();svg.style.pointerEvents='all';svg.classList?.add?.('bt-dragging');svg.setPointerCapture(e.pointerId);e.preventDefault();};
    if(selected===a.id&&!a.locked){
      const anchors=a.points.map((v,i)=>({point:v,index:i}));
      if(a.type==='long'||a.type==='short'){anchors.length=0;anchors.push({point:a.points[0],index:0},{point:{i:a.points[0].i,p:a.points[1].p},index:'stop'},{point:{i:a.points[0].i,p:Suite.positionStats(a).target},index:'target'},{point:{i:a.points[1].i,p:a.points[0].p},index:'right'});}
      if(a.type==='channel')anchors.push({point:{i:a.points[0].i,p:a.points[0].p+(a.offset??Math.max(Math.abs(a.points[1].p-a.points[0].p)*.5,a.points[0].p*.001))},index:'offset'});
      anchors.forEach(({point:v,index:i})=>{const pos=a.anchor?{x:a.anchor.x*(host.clientWidth-65),y:a.anchor.y*(chart.panes?.()[0]?.getHeight?.()||host.clientHeight-30)}:point(v);if(pos.x==null||pos.y==null)return;const cursorFor=i==='stop'||i==='target'||i==='offset'?'ns-resize':i==='right'?'ew-resize':'pointer';element('circle',{cx:pos.x,cy:pos.y,r:11,fill:'transparent',stroke:'none','class':'bt-handle-hit','pointer-events':'none'},group);const handle=element('circle',{cx:pos.x,cy:pos.y,r:5.5,fill:'#ffffff',stroke:'#2962ff','stroke-width':1.5,'data-handle':i,'class':'bt-handle','style':'cursor:'+cursorFor,'pointer-events':'all'},group);handle.onpointerdown=e=>{if(e.button>0)return;e.preventDefault();e.stopPropagation();drag={a,i,old:JSON.parse(JSON.stringify(a)),before:snapshot(),changed:false};ownGesture();svg.style.pointerEvents='all';svg.classList?.add?.('bt-dragging');svg.setPointerCapture(e.pointerId);};});
    }
   }
  }
  function drawCalendar(){
   const active=current.indicators||[],breaks=active.includes('DAYBREAK'),weekdays=active.includes('WEEKDAYS');if(!breaks&&!weekdays)return;
   const frame=window.BacktestFrames?.selected(current)||current.interval,seconds=window.BacktestFrames?.seconds(frame)||window.BacktestFrames?.base(current);if(seconds>=86400)return;
   const bars=projection?.bars||current.candles.slice(0,current.cursor+1),zone=window.BacktestDesk?.zone?.()||'UTC',key=[current.id,current.symbol,frame,zone,bars.length,bars[0]?.t,bars.at(-1)?.t].join(':');
   if(key!==calendarKey){calendarKey=key;calendarSegments=window.BacktestStudies.daySegments(bars,zone);}
   const width=host.clientWidth-65,height=chart.panes?.()[0]?.getHeight?.()||host.clientHeight-30,group=element('g',{'class':'bt-day-calendar','clip-path':'url(#'+clipId+')','pointer-events':'none','aria-label':'Trading days in '+zone});
   for(const day of calendarSegments){const from=ts.logicalToCoordinate(day.from),to=ts.logicalToCoordinate(day.to);if(from==null||to==null||to<0||from>width)continue;
    if(breaks&&day.boundary&&from>=0&&from<=width)element('line',{x1:from,y1:0,x2:from,y2:height,stroke:'#868993','stroke-opacity':.45,'stroke-width':1,'stroke-dasharray':'3 5','data-day-break':day.date},group);
    const left=Math.max(0,from),right=Math.min(width,to),span=right-left;if(weekdays&&span>=34){const label=element('text',{x:(left+right)/2,y:height-12,fill:'#b2b5be',stroke:'#15171c','stroke-width':3,'paint-order':'stroke','text-anchor':'middle','font-size':10,'font-weight':500,'font-family':'system-ui','letter-spacing':.5,'data-weekday':day.weekday,'data-date':day.date,'aria-label':day.weekday+' '+day.date},group);label.textContent=(span>=86?day.weekday:day.weekday.slice(0,3)).toUpperCase();}
   }
  }
  function positionDraft(type,p){const precision=current.candles[current.cursor].c<20?5:current.candles[current.cursor].c<1000?3:2,tick=10**-precision;p={...p,p:Number(p.p.toFixed(precision))};const y=candles.priceToCoordinate(p.p),distance=Math.max(tick,Math.round(Math.abs(candles.coordinateToPrice((y??host.clientHeight/2)+Math.min(60,host.clientHeight*.16))-p.p)/tick)*tick),x=ts.logicalToCoordinate(projection.toDisplay(p.i)),end=ts.coordinateToLogical((x??0)+100),span=Number.isFinite(end)?Math.max(2,end-projection.toDisplay(p.i)):15;const a=Suite.positionDraft(type,p,{bars:projection.bars,toDisplay:projection.toDisplay,toBase:projection.toBase,distance,span});a.points[1].p=Number(a.points[1].p.toFixed(precision));a.target=Number(a.target.toFixed(precision));a.settings=window.BacktestSettingsModel?.defaults(type)||{};a.settings.accountSize=current.balance||current.startBalance||10000;a.settings.pointValue=current.fxMode==='inverse'?1/p.p:current.multiplier||1;return a;}
  function repaint(){
   if(!svg||!current)return;svg.replaceChildren();svg.setAttribute('viewBox','0 0 '+host.clientWidth+' '+host.clientHeight);svg.style.pointerEvents=tool==='cursor'&&!drag?'none':'all';svg.classList?.toggle?.('bt-drawing-mode',tool!=='cursor');const defs=element('defs',{}),clip=element('clipPath',{id:clipId},defs);element('rect',{x:0,y:0,width:Math.max(0,host.clientWidth-65),height:chart.panes?.()[0]?.getHeight?.()||host.clientHeight-30},clip);
   if(display.watermark){const mark=element('text',{x:(host.clientWidth-65)/2,y:host.clientHeight/2,'text-anchor':'middle',fill:color('muted'),'fill-opacity':.14,'font-size':Math.min(36,host.clientWidth/12),'font-family':'system-ui','pointer-events':'none'});mark.textContent=current.symbol+' · '+(current.viewTimeframe||current.interval);}
   drawCalendar();
   if(!hidden)for(const a of current.annotations||[])if(!a.hidden)drawAnnotation(a);
   const p=current.position||current.pending;if(p){const entry=p.entry||current.candles[current.cursor].c,i=Math.max(0,current.candles.findIndex(b=>b.t>=(p.entryTime||p.submittedAt)));const lv=drag?.live?{...{stop:p.stop,target:p.target},[drag.which]:drag.value}:{stop:p.stop,target:p.target};drawAnnotation({type:p.side==='long'?'long':'short',points:[{i,p:entry},{i:Math.max(current.cursor+8,i+8),p:lv.stop}],target:lv.target,settings:{showStats:false}},true);if(callbacks.onPositionLevels&&!p.closeRequested){const x1=ts.logicalToCoordinate(projection?projection.toDisplay(i):i),x2=host.clientWidth-65,g=element('g',{'class':'bt-live-levels'});for(const which of ['stop','target']){const y=candles.priceToCoordinate(lv[which]),paneH=chart.panes?.()[0]?.getHeight?.()||host.clientHeight-30;if(y==null||!Number.isFinite(y)||y<0||y>paneH)continue;const left=Math.max(0,Number.isFinite(x1)?x1:0);const hit=element('line',{x1:left,y1:y,x2,y2:y,stroke:'transparent','stroke-width':12,'pointer-events':'stroke','class':'bt-level-hit','data-live-level':which,style:'cursor:ns-resize'},g);const tag=element('g',{'pointer-events':'all',style:'cursor:ns-resize','data-live-level':which},g);element('rect',{x:x2-74,y:y-9,width:70,height:18,rx:3,fill:which==='stop'?'#f23645':'#089981'},tag);const label=element('text',{x:x2-39,y:y+4,fill:'#ffffff','font-size':10,'font-family':'system-ui','text-anchor':'middle','pointer-events':'none'},tag);label.textContent=(which==='stop'?'SL ':'TP ')+Number(lv[which].toPrecision(6));for(const node of [hit,tag])node.onpointerdown=e=>{if(e.button>0||tool!=='cursor')return;e.preventDefault();e.stopPropagation();drag={live:true,which,value:lv[which],start:lv[which]};ownGesture();svg.style.pointerEvents='all';svg.classList?.add?.('bt-dragging');svg.setPointerCapture?.(e.pointerId);};}}}
   if(pending.length){const pts=[...pending,...(hover?[hover]:[])],def=Suite.spec(tool);if(def&&pts.length>=2&&(!def.points||pts.length>=Math.max(2,def.points)))drawAnnotation({type:tool,preview:true,points:pts,color:color('accent'),target:['long','short'].includes(tool)?pts[0].p+(tool==='long'?1:-1)*2*Math.abs(pts[0].p-pts[1].p):undefined},true);else for(let i=1;i<pts.length;i++){const a=point(pts[i-1]),b=point(pts[i]);element('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:color('accent'),'stroke-dasharray':'4 4','pointer-events':'none'});}for(const v of pending){const p=point(v);element('circle',{cx:p.x,cy:p.y,r:5,fill:'#ffffff',stroke:'#2962ff','stroke-width':1.5,'pointer-events':'none'});}}
   if(hover&&['long','short'].includes(tool)&&!pending.length)drawAnnotation(positionDraft(tool,hover),true);
   placeEditBar();if(first){const pos=point(first);if(pos.x!=null&&pos.y!=null)element('circle',{cx:pos.x,cy:pos.y,r:5.5,fill:'#ffffff',stroke:'#2962ff','stroke-width':1.5,'pointer-events':'none'});}if(hover&&pending.length){const hp=point(hover);if(hp.x!=null&&hp.y!=null)element('circle',{cx:hp.x,cy:hp.y,r:5.5,fill:'#ffffff',stroke:'#2962ff','stroke-width':1.5,'pointer-events':'none'});}
  }
  function placeEditBar(){
   const bar=doc?.querySelector?.('.bt-drawing-edit');if(!bar||bar.hidden||!selected||!svg?.querySelector)return;
   const g=svg.querySelector('[data-annotation="'+selected+'"]');if(!g?.getBoundingClientRect||!bar.offsetParent)return;
   const box=g.getBoundingClientRect(),base=bar.offsetParent.getBoundingClientRect();if(!box.width&&!box.height)return;
   const w=bar.offsetWidth||260,h=bar.offsetHeight||34,maxX=base.width-w-6;
   let x=box.left-base.left+box.width/2-w/2,y=box.top-base.top-h-12;if(y<34)y=box.bottom-base.top+12;
   bar.classList.add('bt-floating-edit');bar.style.left=Math.max(6,Math.min(maxX,x))+'px';bar.style.top=Math.max(34,Math.min(base.height-h-6,y))+'px';bar.style.right='auto';
  }
  function readPoint(event){if(!current)return null;const rect=svg.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top,mainHeight=chart.panes?.()[0]?.getHeight?.()||host.clientHeight-30;if(x<0||x>host.clientWidth-65||y<25||y>mainHeight-5)return null;const logical=ts.coordinateToLogical(x),i=projection?projection.toBase(logical):logical,p=candles.coordinateToPrice(y);if(!Number.isFinite(i)||!Number.isFinite(p)||p<=0)return null;let result={i:Math.max(0,Math.min(current.cursor+100*Math.max(1,(window.BacktestFrames?.seconds(window.BacktestFrames.selected(current))||60)/(window.BacktestFrames?.base(current)||60)),i)),p};if(magnet){const bars=projection?.bars||current.candles.slice(0,current.cursor+1),index=Math.max(0,Math.min(bars.length-1,Math.round(logical))),bar=bars[index];if(bar)result={i:projection?projection.toBase(index):index,p:[bar.o,bar.h,bar.l,bar.c].reduce((best,v)=>Math.abs(v-p)<Math.abs(best-p)?v:best,bar.o)};}return result;}
  if(svg){
   svg.onpointermove=e=>{
    const p=readPoint(e);if(!p)return;
    if(freehand){const last=pending.at(-1);if(pending.length<400&&(!last||Math.hypot(point(last).x-point(p).x,point(last).y-point(p).y)>3)){pending.push(p);repaint();}return;}
    if(drag?.live){drag.value=p.p;drag.changed=true;repaint();return;}
    if(!drag){if(pending.length||['long','short'].includes(tool)){hover=p;repaint();}return;}
    const candidate=JSON.parse(JSON.stringify(drag.old));
    if(drag.i==='offset')candidate.offset=p.p-candidate.points[0].p;
    else if(drag.i==='target')candidate.target=p.p;
    else if(drag.i==='stop')candidate.points[1].p=p.p;
    else if(drag.i==='right')candidate.points[1].i=p.i;
    else if(Number.isInteger(drag.i))candidate.points[drag.i]=p;
    else{const di=p.i-drag.start.i,dp=p.p-drag.start.p;candidate.points=candidate.points.map(v=>({i:v.i+di,p:v.p+dp}));if(candidate.target)candidate.target+=dp;}
    if(candidate.anchor){const now=point(p),start=drag.start?point(drag.start):point(drag.old.points[drag.i]||drag.old.points[0]),w=host.clientWidth-65,h=chart.panes?.()[0]?.getHeight?.()||host.clientHeight-30;candidate.anchor={x:Math.max(0,Math.min(1,drag.old.anchor.x+(now.x-start.x)/w)),y:Math.max(0,Math.min(1,drag.old.anchor.y+(now.y-start.y)/h))};}
    if(!valid(candidate))return;if(!drag.changed)remember(drag.before);drag.changed=true;Object.assign(drag.a,candidate);repaint();svg.style.pointerEvents='all';
   };
   function commitDrawing(){
    const def=Suite.spec(tool);if(!def||!current||!pending.length)return;
    const position=['long','short'].includes(tool)?positionDraft(tool,pending[0]):null;
    const points=position?position.points:pending.map(p=>({...p}));if(points.length===1)points.push({...points[0],i:points[0].i+(tool==='text'?8:0)});
    if(!Suite.validate({type:tool,points}))return;
    if((current.annotations||[]).length>=200){callbacks.onError?.('This session has reached 200 drawings. Remove a drawing first.');return;}
    if(!Suite.available(tool,current.candles.slice(0,current.cursor+1))){callbacks.onError?.('This tool requires real volume data in the selected history.');return;}
    if(['long','short'].includes(tool)){const distance=Math.abs(points[0].p-points[1].p);if(!distance)return;points[1].p=points[0].p+(tool==='long'?-1:1)*distance;}
    const a={id:'draw-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),type:tool,points,color:color('accent'),width:tool==='highlighter'?4:1};
    if(position)a.target=position.target;
    if(window.BacktestSettingsModel){a.settings=window.BacktestSettingsModel.defaults(tool);if(position){a.settings.accountSize=current.balance||current.startBalance||10000;a.settings.pointValue=current.fxMode==='inverse'?1/points[0].p:current.multiplier||1;}Object.assign(a,window.BacktestSettingsModel.canonical(a.settings));}
    if(def.group==='notes')a.text='Note';if(tool==='fib'&&window.BacktestSettingsModel){a.settings=window.BacktestSettingsModel.defaults('fib');Object.assign(a,window.BacktestSettingsModel.canonical(a.settings));}
    if(['anchoredtext','anchorednote'].includes(tool)){const pos=point(points[0]);a.anchor={x:Math.max(0,Math.min(1,pos.x/(host.clientWidth-65))),y:Math.max(0,Math.min(1,pos.y/(chart.panes?.()[0]?.getHeight?.()||host.clientHeight-30)))};}
    if(!valid(a)){callbacks.onError?.('Choose valid positive prices for this drawing.');pending=[];first=hover=null;repaint();return;}
    remember();current.annotations??=[];current.annotations.push(a);selected=a.id;pending=[];first=hover=null;tool=keepMode&&def.group!=='notes'&&!['long','short'].includes(a.type)?a.type:'cursor';callbacks.onChange?.();callbacks.onDrawing?.(a);callbacks.onSelect?.(a);repaint();
   }
   svg.onpointerdown=e=>{if(e.button>0||tool==='cursor')return;ownGesture();e.stopPropagation?.();if(!['brush','highlighter'].includes(tool))return;const p=readPoint(e);if(!p)return;pending=[p];first=p;freehand=e.pointerId;svg.setPointerCapture(e.pointerId);e.preventDefault();};
   svg.onpointerup=e=>{releaseGesture();if(freehand!==null){freehand=null;try{svg.releasePointerCapture(e.pointerId);}catch(_){}if(pending.length>1)commitDrawing();else{pending=[];first=null;repaint();}suppressClick=true;return;}if(drag?.live){const d=drag;drag=null;svg.classList?.remove?.('bt-dragging');try{svg.releasePointerCapture(e.pointerId);}catch(_){}suppressClick=true;if(d.changed&&d.value!==d.start){const pos=current.position||current.pending,levels={stop:pos.stop,target:pos.target,[d.which]:Number(d.value.toFixed(current.candles[current.cursor].c<20?5:current.candles[current.cursor].c<1000?3:2))};if(pos.type&&pos.type!=='market'&&!current.position)levels.entry=pos.entry;callbacks.onPositionLevels(levels);}repaint();return;}if(!drag)return;const ended=drag,edited=drag.changed;drag=null;svg.classList?.remove?.('bt-dragging');suppressClick=edited;try{svg.releasePointerCapture(e.pointerId);}catch(_){}if(edited)callbacks.onChange?.();repaint();if(!edited&&ended.i===undefined){const now=Date.now(),twice=lastTap&&lastTap.id===ended.a.id&&now-lastTap.at<400&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<5;lastTap={id:ended.a.id,at:now,x:e.clientX,y:e.clientY};if(twice){lastTap=null;callbacks.onSettings?.(ended.a);}}else lastTap=null;};
   svg.onpointercancel=()=>{releaseGesture();svg.classList?.remove?.('bt-dragging');freehand=null;drag=null;pending=[];first=hover=null;repaint();};
   svg.onclick=e=>{if(suppressClick){suppressClick=false;return;}if(drag||freehand!==null)return;if(tool==='cursor'){if(e.target===svg&&!(lastHit&&Date.now()-lastHit.at<500&&Math.hypot(e.clientX-lastHit.x,e.clientY-lastHit.y)<5)){selected=null;callbacks.onSelect?.(null);repaint();}return;}const p=readPoint(e),def=Suite.spec(tool);if(!p||!def||['brush','highlighter'].includes(tool))return;
    if(e.detail>1&&!def.points)return;pending.push(p);first=pending[0];hover=null;
    if(def.points&&pending.length>=def.points)commitDrawing();else repaint();
   };
   svg.ondblclick=e=>{if(tool==='cursor'){const hit=lastHit&&Date.now()-lastHit.at<500&&Math.hypot(e.clientX-lastHit.x,e.clientY-lastHit.y)<5&&current?.annotations?.find(a=>a.id===lastHit.id);if(hit){e.preventDefault();selected=hit.id;callbacks.onSelect?.(hit);callbacks.onSettings?.(hit);}return;}if(!Suite.spec(tool)?.points&&pending.length>=2){e.preventDefault();commitDrawing();}};
   ts.subscribeVisibleTimeRangeChange?.(range=>{for(const fn of viewListeners.range)fn(range);});
   ts.subscribeVisibleLogicalRangeChange?.(()=>{if(frame)cancelAnimationFrame(frame);frame=requestAnimationFrame(repaint);});
  }
  chart.subscribeCrosshairMove(p=>{if(p.sourceEvent)for(const fn of viewListeners.crosshair)fn(p.time?{time:p.time}:null);const b=p.seriesData.get(candles);onCrosshair((b&&projection?.bars.find(row=>row.t===b.time))||current?.candles[current.cursor]);});
  chart.subscribeClick(p=>{if(!p.point||tool!=='cursor')return;const value=candles.coordinateToPrice(p.point.y);if(Number.isFinite(value)&&value>0)onLevel(value);});
  let display={watermark:false,crosshairColor:'',wickColor:'match',timezone:'utc',dateFormat:'dmy',hours24:true,secondsVisible:false,legendTitle:true,legendOhlc:true,legendStudies:true,grid:true,log:false,auto:true,priceLine:true,crosshairStyle:'dashed',upColor:'',downColor:'',bgColor:''};
  function applyDisplay(updateScale=true){
   const grid=display.grid?color('line'):'transparent',styles={solid:0,dotted:1,dashed:2};
   chart.applyOptions?.({layout:{background:{type:'solid',color:display.bgColor||color('card')}},grid:{vertLines:{color:grid},horzLines:{color:grid}},crosshair:{vertLine:{style:styles[display.crosshairStyle]},horzLine:{style:styles[display.crosshairStyle]}},kineticScroll:{mouse:true,touch:true},localization:{timeFormatter:t=>new Intl.DateTimeFormat(display.dateFormat==='mdy'?'en-US':'en-GB',{...(display.timezone==='utc'?{timeZone:'UTC'}:{}),year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',...(display.secondsVisible?{second:'2-digit'}:{}),hour12:!display.hours24}).format(new Date(Number(t)*1000))},timeScale:{lockVisibleTimeRangeOnResize:true,minBarSpacing:.4,secondsVisible:display.secondsVisible,tickMarkFormatter:(t,type)=>{const date=typeof t==='number'?new Date(t*1000):new Date(Date.UTC(t.year,t.month-1,t.day));return new Intl.DateTimeFormat(display.dateFormat==='mdy'?'en-US':'en-GB',{...(display.timezone==='utc'?{timeZone:'UTC'}:{}),...(type===0?{year:'numeric'}:type===1?{month:'short'}:type===2?{month:'short',day:'numeric'}:{hour:'2-digit',minute:'2-digit',...(display.secondsVisible?{second:'2-digit'}:{}),hour12:!display.hours24})}).format(date);}}});
   if(updateScale)chart.priceScale?.('right').applyOptions({mode:display.log?1:0,autoScale:display.auto});
   const up=display.upColor||color('up'),down=display.downColor||color('down');
   candles.applyOptions({priceLineVisible:display.priceLine,...(['line','area'].includes(renderKind)?{color:up,lineColor:up}:{upColor:renderKind==='hollow'?'transparent':up,downColor:down,wickUpColor:display.wickColor==='neutral'?color('muted'):up,wickDownColor:display.wickColor==='neutral'?color('muted'):down,borderUpColor:up,borderDownColor:down})});
  }
  function updateStudies(s){
   if(!Lab)return;const bars=s.candles.slice(0,s.cursor+1),rows=[];let oscillator=0;
   for(const key of s.indicators||[]){if(['SMA20','DAYBREAK','WEEKDAYS'].includes(key))continue;const definition=window.BacktestStudies.get(key);if(!definition||window.BacktestStudies.unavailable(key,bars))continue;const pane=definition.pane?++oscillator:0;
    let channels=window.BacktestStudies.calculate(bars,key);
    if(!channels.length){const period=Number(key.match(/\d+/)?.[0]||20);channels=key==='BB20'?[{key:'BB Upper',data:Lab.study(bars,'BB',20),color:'#4ba1fa'},{key:'BB Basis',data:Lab.study(bars,'SMA',20),color:'#6b8bb0'},{key:'BB Lower',data:Lab.study(bars,'BBLOW',20),color:'#4ba1fa'}]:[{key,data:Lab.study(bars,key.startsWith('EMA')?'EMA':key.startsWith('RSI')?'RSI':'ATR',period),color:'#b18cff'}];}
    channels.forEach(c=>rows.push({...c,key:key+':'+c.key,pane}));
   }
   const wanted=new Set(rows.map(r=>r.key));for(const [key,series] of extra)if(!wanted.has(key)){chart.removeSeries(series);extra.delete(key);}
   for(const row of rows){if(!extra.has(row.key))extra.set(row.key,chart.addSeries(L.LineSeries,{color:row.color||'#59c5c8',lineWidth:1,priceLineVisible:false,lastValueVisible:true,title:row.key},row.pane));const series=extra.get(row.key);series.moveToPane?.(row.pane);series.setData(row.data);}
  }
  return {
   render(s,showMA,barsVisible){
    const range=ts.getVisibleLogicalRange?.();
    const kind=['candles','hollow','bars','line','area'].includes(s.chartType)?s.chartType:'candles';if(kind!==renderKind){markers?.detach?.();chart.removeSeries(candles);lines=[];candles=priceSeries(kind);markers=L.createSeriesMarkers?L.createSeriesMarkers(candles,[]):null;renderKind=kind;}
    current=s;lastMA=showMA;projection=window.BacktestFrames?.project(s)||{bars:s.candles.slice(0,s.cursor+1),toDisplay:i=>i,toBase:i=>i,bucket:t=>t};
    const bars=projection.bars,shown={...s,candles:bars,cursor:bars.length-1},identity=s.id+':'+s.symbol+':'+(s.viewTimeframe||s.interval)+':'+renderKind;
    const precision=s.candles[s.cursor].c<20?5:s.candles[s.cursor].c<1000?3:2;candles.applyOptions({priceFormat:{type:'price',precision,minMove:10**-precision}});
    if(Array.isArray(s.reviewLevels)&&s.reviewLevels.length)candles.applyOptions({autoscaleInfoProvider:original=>{const info=original();if(!info)return info;const levels=s.reviewLevels.filter(n=>Number.isFinite(n)&&n>0);if(levels.length){info.priceRange.minValue=Math.min(info.priceRange.minValue,...levels);info.priceRange.maxValue=Math.max(info.priceRange.maxValue,...levels);}return info;}});
    candles.setData(bars.map(b=>['line','area'].includes(renderKind)?{time:b.t,value:b.c}:mapped(b)));ma.setData(bars.slice(19).map((_,i)=>average(shown,i+19)));
    ma.applyOptions({visible:showMA||(s.indicators||[]).includes('SMA20')});updateStudies(shown);
    for(const line of lines)candles.removePriceLine(line);lines=[];
    const level=(value,title,c)=>lines.push(candles.createPriceLine({price:value,color:c,lineWidth:1,lineStyle:L.LineStyle.Dashed,axisLabelVisible:true,title}));
    for(const value of (hidden?[]:s.drawings))level(value,'Level',color('accent'));
    const p=s.position||s.pending;if(p){if(p.entry)level(p.entry,s.position?'Entry':'Queued',color('muted'));level(p.stop,'SL',color('down'));level(p.target,'TP',color('up'));}
    if(sessionId!==identity||visible!==barsVisible||!range)ts.setVisibleLogicalRange({from:bars.length-barsVisible,to:bars.length+7});
    else{
     // Follow new bars only when the latest candle was already in view. Keep
     // the user's zoom width and anchor older views when context is prepended.
     const prefix=bars.findIndex(b=>b.t===projectionFirstTime),shift=range.to>=projectionLength-1?bars.length-projectionLength:Math.max(0,prefix);
     ts.setVisibleLogicalRange({from:range.from+shift,to:range.to+shift});
    }
    projectionLength=bars.length;projectionFirstTime=bars[0]?.t;
    if(markers){const rows=s.trades.filter(t=>!t.symbol||t.symbol===s.symbol).flatMap(t=>[{time:projection.bucket(t.entryTime),position:t.side==='long'?'belowBar':'aboveBar',color:'#4385ff',shape:t.side==='long'?'arrowUp':'arrowDown',text:t.side==='long'?'Buy':'Sell'},{time:projection.bucket(t.exitTime),position:'aboveBar',color:t.pnl>=0?'#45d5a2':'#ff7484',shape:'circle',text:t.pnl>=0?'Win':'Loss'}]);if(s.position)rows.push({time:projection.bucket(s.position.entryTime),position:'belowBar',color:'#4385ff',shape:'arrowUp',text:s.position.side==='long'?'Buy':'Sell'});markers.setMarkers(rows.sort((a,b)=>a.time-b.time));}
    sessionId=identity;visible=barsVisible;onCrosshair(bars.at(-1));applyDisplay(false);repaint();
   },
   tool(value){eraser=false;if(value!=='cursor'&&!Suite.available(value,current?.candles.slice(0,current.cursor+1)||[])){callbacks.onError?.('This tool requires real volume data in the selected history.');return false;}releaseGesture();svg?.classList?.remove?.('bt-dragging');drag=null;tool=value;pending=[];freehand=null;first=null;hover=null;selected=null;suppressClick=false;callbacks.onSelect?.(null);repaint();return true;},
   keep(value){keepMode=!!value;return keepMode;},
   repaint(){repaint();},
   currentTool(){return tool;},
   allLocked(){return !!current?.annotations?.length&&current.annotations.every(a=>a.locked);},
   lockAll(){if(!current?.annotations?.length)return false;const locked=!current.annotations.every(a=>a.locked);remember();current.annotations.forEach(a=>a.locked=locked);changed();callbacks.onSelect?.(this.selected());return locked;},
   magnet(){magnet=!magnet;return magnet;},
   hide(){hidden=!hidden;if(current)this.render(current,lastMA,visible);return hidden;},
   updateSelected(changes){
    const a=current?.annotations?.find(a=>a.id===selected);if(!a)return false;const M=window.BacktestSettingsModel,candidate=JSON.parse(JSON.stringify(a));
    if(changes.settings!==undefined){candidate.settings=M.clean(a.type,changes.settings);Object.assign(candidate,M.canonical(candidate.settings));}
    if(changes.levels!==undefined){candidate.levels=window.BacktestEngine.cleanFibLevels(changes.levels);if(candidate.settings?.levels){const colors=new Map(candidate.settings.levels.map(r=>[r.v,r.c]));candidate.settings.levels=candidate.levels.map(v=>({v,c:colors.get(v)||candidate.color,on:true}));}}
    for(const k of ['extendLeft','extendRight','showPrices'])if(typeof changes[k]==='boolean'){candidate[k]=changes[k];if(candidate.settings)candidate.settings[k]=changes[k];}
    if(/^#[0-9a-f]{6}$/i.test(changes.color)){candidate.color=changes.color;for(const key of ['line','levelsLine'])if(candidate.settings?.[key])candidate.settings[key].color=changes.color;if(candidate.settings?.color)candidate.settings.color=changes.color;if(candidate.settings?.levels)candidate.settings.levels.forEach(r=>r.c=changes.color);}
    if([1,2,3,4].includes(changes.width)){candidate.width=changes.width;for(const key of ['line','levelsLine'])if(candidate.settings?.[key])candidate.settings[key].width=changes.width;}
    if(['solid','dashed','dotted'].includes(changes.dash)){candidate.dash=changes.dash;for(const key of ['line','levelsLine'])if(candidate.settings?.[key])candidate.settings[key].dash=changes.dash;}
    for(const key of ['hidden','locked'])if(typeof changes[key]==='boolean')candidate[key]=changes[key];
    if(typeof changes.text==='string'){candidate.text=changes.text.slice(0,200);if(candidate.settings)candidate.settings.text=candidate.text;}
    if(changes.points!==undefined)candidate.points=changes.points.map(p=>({i:Number(p.i),p:Number(p.p)}));
    for(const key of ['target','offset'])if(changes[key]!==undefined){if(!Number.isFinite(changes[key]))throw Error('Enter a valid '+key+'.');candidate[key]=changes[key];}
    if(changes.anchor!==undefined){if(![changes.anchor.x,changes.anchor.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw Error('Anchor positions must be between 0 and 100%.');candidate.anchor={...changes.anchor};}
    if(changes.visibility!==undefined){const value=M.visibility(changes.visibility);if(value===null)delete candidate.visibility;else candidate.visibility=value;}
    const geometryValid=Suite?.validate?Suite.validate(candidate):window.BacktestEngine.cleanAnnotations([candidate]).length===1;
    if(!geometryValid||!valid(candidate))throw Error('Use valid drawing coordinates and position levels.');
    remember();if(!Object.hasOwn(candidate,'visibility'))delete a.visibility;Object.assign(a,candidate);changed();callbacks.onSelect?.(a);return true;
   },
   selected(){return current?.annotations?.find(a=>a.id===selected)||null;},
   clear(){if(!current)return;remember();current.annotations=[];current.drawings=[];selected=null;callbacks.onSelect?.(null);changed();},
   deleteSelected(){if(!selected||!current)return false;remember();current.annotations=current.annotations.filter(a=>a.id!==selected);selected=null;callbacks.onSelect?.(null);changed();return true;},
   undo(){if(!current)return;const h=histories.get(current.id+':'+current.symbol);if(h?.length){const key=current.id+':'+current.symbol,redo=redos.get(key)||[];redo.push(snapshot());redos.set(key,redo);const previous=JSON.parse(h.pop());current.annotations=previous.annotations;current.drawings=previous.drawings;selected=null;callbacks.onSelect?.(null);changed();}},
   redo(){if(!current)return;const key=current.id+':'+current.symbol,r=redos.get(key);if(!r?.length)return;const h=histories.get(key)||[];h.push(snapshot());histories.set(key,h);const next=JSON.parse(r.pop());current.annotations=next.annotations;current.drawings=next.drawings;selected=null;callbacks.onSelect?.(null);changed();},
   selectDrawing(id){const a=current?.annotations?.find(a=>a.id===id);if(!a)return false;selected=id;callbacks.onSelect?.(a);repaint();return true;},
   removeLevel(index){if(!current||!Number.isInteger(index)||index<0||index>=current.drawings.length)return false;remember();current.drawings.splice(index,1);changed();return true;},
   zoom(){const range=ts.getVisibleLogicalRange();if(range){const center=(range.from+range.to)/2,half=(range.to-range.from)/4;ts.setVisibleLogicalRange({from:center-half,to:center+half});}},
   erasing(){return eraser;},
   eraseMode(value){eraser=!!value;releaseGesture();drag=null;tool='cursor';pending=[];repaint();return eraser;},
   createSibling(element,extra={}){return new window.BacktestChart(element,extra.onReadout||onCrosshair,onLevel,{...callbacks,...extra});},
   listen(kind,fn){viewListeners[kind]?.add(fn);return ()=>viewListeners[kind]?.delete(fn);},
   viewport(){return ts.getVisibleRange?.()||null;},
   setViewport(range){if(range)try{ts.setVisibleRange?.(range);}catch(_){}},
   crosshairAt(time){const b=projection?.bars.find(b=>b.t===(projection?.bucket?projection.bucket(time):time));if(b)chart.setCrosshairPosition?.(b.c,b.t,candles);else chart.clearCrosshairPosition?.();},
   goToDate(value){const t=Date.parse(value+'T00:00:00Z')/1000,bars=projection?.bars||[];if(!Number.isFinite(t)||!bars.length||t>bars.at(-1).t||t<bars[0].t-86400)return false;const index=bars.findIndex(b=>b.t>=t);if(index<0)return false;ts.setVisibleLogicalRange({from:index-60,to:index+60});return true;},
   rangeSeconds(seconds){const bars=projection?.bars||[];if(!bars.length)return;if(!seconds){ts.fitContent?.();return;}const cutoff=bars.at(-1).t-seconds,index=bars.findIndex(b=>b.t>=cutoff);ts.setVisibleLogicalRange({from:Math.max(0,index),to:bars.length+4});},
   zoomBy(factor){const range=ts.getVisibleLogicalRange?.();if(!range||!Number.isFinite(factor)||factor<=0)return;const width=(range.to-range.from)*factor;ts.setVisibleLogicalRange({from:range.to-width,to:range.to});},
   configure(value){if(value===undefined)return {...display};for(const key of ['grid','log','auto','priceLine','watermark','hours24','secondsVisible','legendTitle','legendOhlc','legendStudies'])if(typeof value[key]==='boolean')display[key]=value[key];for(const key of ['upColor','downColor','bgColor','crosshairColor'])if(value[key]===''||/^#[0-9a-f]{6}$/i.test(value[key]||''))display[key]=value[key];for(const [key,values] of Object.entries({timezone:['utc','local'],dateFormat:['dmy','mdy'],wickColor:['match','neutral']}))if(values.includes(value[key]))display[key]=value[key];if(['solid','dotted','dashed'].includes(value.crosshairStyle))display.crosshairStyle=value.crosshairStyle;applyDisplay();repaint();return {...display};},
   pan(fraction){const range=ts.getVisibleLogicalRange?.();if(!range||!Number.isFinite(fraction))return;const delta=(range.to-range.from)*Math.max(-1,Math.min(1,fraction));ts.setVisibleLogicalRange({from:range.from+delta,to:range.to+delta});},
   reset(){releaseGesture();drag=null;tool='cursor';pending=[];freehand=null;display.auto=true;applyDisplay();const n=projection?.bars.length||0;ts.setVisibleLogicalRange({from:n-160,to:n+8});repaint();},
   fit(){ts.fitContent();},
   latest(){ts.scrollToRealTime();},
   atPointer(event){const point=readPoint(event);if(point){const close=current.candles[current.cursor].c,precision=close<20?5:close<1000?3:2;point.p=Number(point.p.toFixed(precision));}return point;},
   addLevel(value){if(!current||!Number.isFinite(value)||value<=0)return false;if(current.drawings.length>=30){callbacks.onError?.('Maximum 30 levels.');return false;}remember();current.drawings.push(value);changed();return true;},
   async image(){const canvas=chart.takeScreenshot();if(svg){const data=new XMLSerializer().serializeToString(svg),url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml'})),img=new Image();try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);}finally{URL.revokeObjectURL(url);}}return canvas.toDataURL('image/png');},
   destroy(){destroyed=true;releaseGesture();for(const type of ['pointerup','pointercancel','blur'])window.removeEventListener?.(type,releaseGesture);if(viewportFrame!=null)cancelAnimationFrame(viewportFrame);for(const type of viewportEvents)host.removeEventListener?.(type,trackViewport,{capture:true});window.removeEventListener?.('themechange',applyTheme);observer?.disconnect();if(frame)cancelAnimationFrame(frame);markers?.detach();chart.remove();}
  };
 };
})();


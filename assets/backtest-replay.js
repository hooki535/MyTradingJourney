/* Forward-only replay orchestration. Every revealed bar goes through the existing engine. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BacktestReplay=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const clock=s=>s.kind==='portfolio'?s.clock:s.candles[s.cursor].t;
 const end=s=>s.kind==='portfolio'?s.endTime:s.candles.at(-1).t;
 const markets=s=>s.markets||[s];
 function nextClock(s){return Math.min(...markets(s).filter(m=>m.cursor<m.candles.length-1&&m.candles[m.cursor+1].t<=end(s)).map(m=>m.candles[m.cursor+1].t));}
 function localParts(t,zone){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(t*1000)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
 function zonedTime(year,month,day,hour,zone){const desired=Date.UTC(year,month-1,day,hour)/1000;let candidate=desired;for(let i=0;i<4;i++){const p=localParts(candidate,zone),shown=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)/1000;candidate+=desired-shown;}return candidate;}
 const opens={london:{label:'London open',zone:'Europe/London',hour:8},newyork:{label:'New York open',zone:'America/New_York',hour:8},asia:{label:'Tokyo open',zone:'Asia/Tokyo',hour:9}};
 function nextOpen(t,name){const o=opens[name];if(!o)throw Error('Choose a supported session.');const p=localParts(t,o.zone);for(let offset=0;offset<9;offset++){const d=new Date(Date.UTC(p.year,p.month-1,p.day+offset));if([0,6].includes(d.getUTCDay()))continue;const value=zonedTime(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),o.hour,o.zone);if(value>t)return value;}throw Error('No session open found.');}
 function nextBoundary(t,frame,Frames){if(frame==='source')return null;const seconds=Frames.seconds(frame);if(!seconds)throw Error('Choose a replay timestep.');if(frame==='1M'){const d=new Date(t*1000);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)/1000;}return Frames.bucket(t,frame)+seconds;}
 function preferences(raw={}){raw=raw&&typeof raw==='object'?raw:{};return {syncFrame:raw.syncFrame!==false,step:typeof raw.step==='string'&&raw.step.length<12?raw.step:'source',pauseOnExit:raw.pauseOnExit!==false,compare:raw.compare===true,compareFrame:typeof raw.compareFrame==='string'&&raw.compareFrame.length<12?raw.compareFrame:'4H',presets:Array.isArray(raw.presets)?raw.presets.slice(0,10).flatMap(p=>{try{return [preset(p)];}catch(_){return [];}}):[]};}
 function pip(symbol){return /^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY){2}$/.test(symbol)?symbol.endsWith('JPY')?.01:.0001:1;}
 function preset(raw){const name=String(raw.name||'').trim().slice(0,40),riskPct=Number(raw.riskPct),distance=Number(raw.distance),reward=Number(raw.reward);if(!name||![riskPct,distance,reward].every(Number.isFinite)||riskPct<=0||riskPct>100||distance<=0||distance>1e8||reward<=0||reward>100)throw Error('Enter a name, risk of 0–100%, positive stop distance and reward multiple (up to 100R).');return {name,riskPct,distance,reward};}
 function orderLevels(symbol,entry,side,raw){const p=preset(raw),distance=p.distance*pip(symbol),sign=side==='long'?1:side==='short'?-1:0;if(!Number.isFinite(entry)||entry<=0||!sign)throw Error('Choose a valid price and side.');const stop=entry-sign*distance,target=entry+sign*distance*p.reward;if(stop<=0||target<=0)throw Error('This preset produces an invalid stop or target for this instrument.');return {stop,target,riskPct:p.riskPct};}
 function createRun(s,E,options={}){
  const mode=options.mode||'time',start=clock(s),target=Number(options.target),level=Number(options.price),deadline=options.deadline==null?end(s):Number(options.deadline),active=()=>E.activeMarket(s),initialTrades=s.trades.length;
  if(!['time','source','price','exit'].includes(mode))throw Error('Choose a replay action.');
  if(mode==='time'&&(!Number.isInteger(target)||target<=start||target>end(s)))throw Error('Choose a later time within the loaded session history.');
  if(mode==='price'&&(!Number.isFinite(level)||level<=0))throw Error('Enter a positive price level.');
  if(!Number.isFinite(deadline)||deadline<=start)throw Error('Choose a positive maximum replay duration.');
  if(mode==='exit'&&!active().position&&!active().pending)throw Error('There is no position or pending order on this instrument.');
  let done=false,reason='',steps=0;
  function stop(value){done=true;reason=value;}
  function tick(limit=200){
   if(!Number.isInteger(limit)||limit<1||limit>1000)throw Error('Invalid replay batch size.');
   for(let i=0;i<limit&&!done;i++){
    const challenge=E.challengeState(s);if(challenge&&challenge.status!=='active'){stop('challenge');break;}if(E.finished(s)){stop('end');break;}
    if(nextClock(s)>deadline){stop('limit');break;}
    const before=active().cursor;if(!E.step(s)){stop('end');break;}steps++;
    const m=active(),bar=m.candles[m.cursor],after=E.challengeState(s);
    if(after&&after.status!=='active')stop('challenge');
    else if(mode==='exit'&&!m.position&&!m.pending&&s.trades.length>initialTrades)stop('exit');
    else if(options.pauseOnExit!==false&&s.trades.length>initialTrades)stop('trade');
    else if(mode==='source')stop('source');
    else if(mode==='price'&&m.cursor!==before&&bar.l<=level&&bar.h>=level)stop('price');
    else if(mode==='time'&&clock(s)>=target)stop('time');
    if(!done&&clock(s)>=deadline)stop('limit');
   }
   return {done,reason,steps,clock:clock(s),newTrades:s.trades.length-initialTrades};
  }
  return {tick,cancel(){stop('cancelled');return {done,reason,steps,clock:clock(s),newTrades:s.trades.length-initialTrades};}};
 }
 return {clock,end,nextClock,nextOpen,nextBoundary,opens,zonedTime,preferences,preset,pip,orderLevels,createRun};
});

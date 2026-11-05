/* Original analytics for completed simulated positions; no market or account requests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BacktestBreakdowns=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 function group(trades,labels,choose){
  const rows=labels.map(name=>({name,count:0,pnl:0,wins:0,losses:0}));
  for(const trade of trades){const index=choose(trade);if(!Number.isInteger(index)||!rows[index])continue;const row=rows[index];row.count++;row.pnl+=trade.pnl;row.wins+=trade.pnl>0?1:0;row.losses+=trade.pnl<0?1:0;}
  return rows;
 }
 function distributions(trades){
  const valid=trades.filter(t=>Number.isFinite(t.pnl)&&Number.isFinite(t.entryTime)&&Number.isFinite(t.exitTime)&&Number.isFinite(new Date(t.entryTime*1000).getTime())&&Number.isFinite(new Date(t.exitTime*1000).getTime()));
  const months=[...new Set(valid.map(t=>new Date(t.exitTime*1000).toISOString().slice(0,7)))].sort(),symbols=[...new Set(valid.map(t=>String(t.symbol||'Unknown')))].sort();
  return {
   months:group(valid,months,t=>months.indexOf(new Date(t.exitTime*1000).toISOString().slice(0,7))),
   symbols:group(valid,symbols,t=>symbols.indexOf(String(t.symbol||'Unknown'))),
   hours:group(valid,Array.from({length:24},(_,i)=>String(i).padStart(2,'0')+':00'),t=>new Date(t.entryTime*1000).getUTCHours()),
   durations:group(valid,['Under 15m','15m–1h','1h–4h','4h–1d','1d–1w','1w+'],t=>{const d=Math.max(0,t.exitTime-t.entryTime);return d<900?0:d<3600?1:d<14400?2:d<86400?3:d<604800?4:5;}),
   multiples:group(valid,['Below −2R','−2R to −1R','−1R to 0R','0R to 1R','1R to 2R','2R to 3R','3R+','Unmeasured'],t=>!Number.isFinite(t.r)?7:t.r< -2?0:t.r< -1?1:t.r<0?2:t.r<1?3:t.r<2?4:t.r<3?5:6)
  };
 }
 function calendar(days,year,month){
  if(!Number.isInteger(year)||year<1900||year>9998||!Number.isInteger(month)||month<0||month>11)throw Error('Choose a valid calendar month.');
  const prefix=year+'-'+String(month+1).padStart(2,'0'),lookup=new Map(days.map(d=>[d.date,d]));
  const cells=Array.from({length:new Date(Date.UTC(year,month+1,0)).getUTCDate()},(_,i)=>{const date=prefix+'-'+String(i+1).padStart(2,'0'),d=lookup.get(date);return {date,day:i+1,pnl:d?.pnl??0,count:d?.trades?.length??0,active:!!d};});
  const active=cells.filter(d=>d.active);return {offset:(new Date(Date.UTC(year,month,1)).getUTCDay()+6)%7,cells,net:active.reduce((n,d)=>n+d.pnl,0),wins:active.filter(d=>d.pnl>0).length,losses:active.filter(d=>d.pnl<0).length,tradingDays:active.length};
 }
 return {distributions,calendar};
});

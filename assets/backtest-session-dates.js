/* Convert date-only session controls into explicit UTC replay boundaries. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BacktestSessionDates=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 function combine(day,time,end=false){
  if(!day)return '';
  if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T00:00:00Z'))||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day)throw Error('Choose a valid '+(end?'end':'start')+' date.');
  const clock=time||(end?'23:59':'00:00');
  if(typeof clock!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock))throw Error('Choose a valid '+(end?'end':'start')+' time in UTC.');
  return day+'T'+clock+(end?':59':':00');
 }
 function range({start='',end='',startTime='',endTime=''}={}){
  const first=combine(start,startTime),last=combine(end,endTime,true);
  if(first&&last&&Date.parse(first+'Z')>=Date.parse(last+'Z'))throw Error('End date and time must be after the start date and time.');
  return {start:first,end:last};
 }
 return {combine,range};
});

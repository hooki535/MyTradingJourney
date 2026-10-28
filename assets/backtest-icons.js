/* Original chart-workspace icons, drawn on a common 24px grid. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./backtest-drawing-suite.js'):root.BacktestDrawingSuite);if(typeof module==='object'&&module.exports)module.exports=api;else root.BacktestIcons=api;})(typeof window==='object'?window:globalThis,function(Suite){
 'use strict';
 const paths={...Suite.paths,
 cursor:'M12 2v6m0 8v6M2 12h6m8 0h6M12 11v2',trend:'M4 20 20 4',ray:'M4 20 22 2',extended:'M2 22 22 2',arrow:'M4 20 20 4m-7 0h7v7',horizontal:'M2 12h20',vertical:'M12 2v20',horizontalray:'M4 12h18',crossline:'M12 2v20M2 12h20',rectangle:'M4 5h16v14H4z',ellipse:'M12 5a9 7 0 1 0 0 14 9 7 0 1 0 0-14',triangle:'M12 3 22 21H2z',fib:'M4 4h17M4 9h12M4 14h17M4 20h12M4 20 20 4',long:'M5 3h14v18H5zM5 15h14M12 6v6m-3-3 3-3 3 3',short:'M5 3h14v18H5zM5 9h14M12 12v6m-3-3 3 3 3-3',text:'M4 4h16M12 4v16m-4 0h8',measure:'m3 17 14-14 4 4L7 21zm4-4 3 3m1-7 3 3',pricerange:'M12 3v18m-4-14 4-4 4 4m-8 10 4 4 4-4M5 3h14M5 21h14',daterange:'M3 12h18m-14-4-4 4 4 4m10-8 4 4-4 4M3 5v14M21 5v14',channel:'M3 16 16 3M8 21 21 8M5 18 18 5',info:'M4 20 20 4M15 18h6m-3-3v6',
 undo:'M8 5 3 10l5 5M3 10h10a7 7 0 0 1 7 7',redo:'M16 5 21 10l-5 5M21 10H11a7 7 0 0 0-7 7',delete:'M4 6h16M9 6V3h6v3M6 6v15h12V6m-8 4v7m4-7v7',magnet:'M5 3v10a7 7 0 0 0 14 0V3h-5v10a2 2 0 0 1-4 0V3zM5 8h5m4 0h5',hide:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m7 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0',lock:'M5 10h14v11H5zm3 0V6a4 4 0 0 1 8 0v4M12 14v3',keep:'m3 17 12-12 4 4L7 21H3zm12-12 2-2 4 4-2 2M14 19h8m-4-4v8',search:'M21 21l-6-6M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14',zoom:'M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14M15 15l6 6M7 10h6M10 7v6',star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',chevron:'m9 5 7 7-7 7',layers:'m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5',
 play:'m8 4 12 8-12 8z',pause:'M8 4v16M16 4v16',step:'m4 5 10 7-10 7zM19 5v14',go:'M3 18a8 8 0 0 1 14-8l3 3m0-8v8h-8',fullscreen:'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5',camera:'M3 7h4l2-3h6l2 3h4v13H3zM12 10a3 3 0 1 0 0 6 3 3 0 1 0 0-6',save:'M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7',settings:'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1M12 7a5 5 0 1 0 0 10 5 5 0 1 0 0-10',layout:'M3 4h18v16H3zM12 4v16',focus:'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6M9 9h6v6H9z',float:'M3 8h13v13H3zM8 3h13v13h-5M13 11l8-8m-6 0h6v6',dock:'M3 3h18v18H3zM3 16h18M8 10l4 3 4-3m-4-5v8',close:'m5 5 14 14M19 5 5 19',help:'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3h0',grip:'M8 5h0m0 7h0m0 7h0m8-14h0m0 7h0m0 7h0',order:'M12 3v18M3 12h18',journal:'M4 3h16v18H4zM8 7h8M8 11h8M8 15h5',markets:'M4 17V9m5 11V4m5 12V7m5 13V2M2 13h4m1-5h4m1 3h4m1-5h4',stats:'M3 21h18M6 17v-6m6 6V3m6 14v-9',rules:'M9 5h12M9 12h12M9 19h12M2 5l2 2 3-4M2 12l2 2 3-4M2 19l2 2 3-4',brief:'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h5',indicators:'M4 20c6 0 1-16 7-16h3M3 10h9m3 4 6 6m0-6-6 6',retry:'M4 10a8 8 0 1 1 0 5M4 3v7h7',tool:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'};
 // Redrawn against TradingView's public chart/help screenshots. Geometry is original.
 Object.assign(paths,{
  cursor:'M12 2v6m0 8v6M2 12h6m8 0h6',fib:'M3 4h18M3 9h18M3 14h18M3 20h18',
  long:'M5 4h17M5 13h15M5 20h17',short:'M5 4h17M5 11h15M5 20h17',
  forecast:'M5 6v15M3 11h4v7H3zM12 3v16M10 7h4v7h-4zM20 3v9m-3-3 3 3 3-3',
  barspattern:'M4 6v16M2 12h4v6H2zM11 2v18M9 7h4v6H9zM18 5v17M16 10h4v7h-4z',
  ghostfeed:'M4 13v9M2 16h4v4H2zM10 9v12M8 12h4v5H8zM16 3v14M14 7h4v5h-4zM3 19 21 7',
  projection:'M5 4v16h16M5 4a16 16 0 0 1 16 16',avwap:'M4 8v13M2 12h4v5H2zM11 3v16M9 7h4v7H9zM18 5v12M16 7h4v4h-4zM2 19 22 6',
  volumeprofile:'M5 3v18M5 7h7v3H5m0 2h11v3H5M21 5v16',
  pricerange:'M4 3h16M4 21h16M12 19V5m-3 3 3-3 3 3',
  daterange:'M3 4v16M21 4v16M5 12h14m-3-3 3 3-3 3',
  measure:'M4 4h16v16H4zM6 13h12m-3-3 3 3-3 3M11 18V6m-3 3 3-3 3 3',
  ruler:'m3 17 14-14 4 4L7 21zm4-3 2 2m1-5 2 2m1-5 2 2m1-5 2 2',
  brush:'M2 21c5 0 9 0 10-5 1-4-4-6-6-2-1 3-1 5-4 7M12 15l9-10',
  text:'M5 4h14M12 4v17M9 21h6M5 4v4m14-4v4',
  xabcd:'M3 20 6 4 11 14 17 5 21 17M6 4l11 1M11 14 21 17',
  channel:'M3 16 16 3M8 21 21 8M5 18 18 5',
  rectangle:'M4 5h16v14H4z',ellipse:'M12 4a9 8 0 1 0 0 16 9 8 0 1 0 0-16',
  magnet:'M5 4h4v10a3 3 0 0 0 6 0V4h4v10a7 7 0 0 1-14 0zM5 8h4m6 0h4',
  keep:'m3 14 11-11 4 4L7 18H3zm9-9 4 4M14 17h8v6h-8zm2 0v-2a2 2 0 0 1 4 0v2',
  unlock:'M5 11h14v10H5zm4 0V6a4 4 0 0 1 7-2M12 15v2',
  hide:'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  hidden:'M3 3 21 21M9 6a12 12 0 0 1 13 6s-1 2-4 4M6 7a17 17 0 0 0-4 5s4 6 10 6c1 0 2 0 3-1M10 10a3 3 0 0 0 4 4',
  delete:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
  search:'M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14m5 12 6 6',
  settings:'m10 2-.5 3-2.4 1.4-2.8-1.1-2 3.4 2.4 2v2.8l-2.4 2 2 3.4 2.8-1.1 2.4 1.4.5 3h4l.5-3 2.4-1.4 2.8 1.1 2-3.4-2.4-2v-2.8l2.4-2-2-3.4-2.8 1.1L14.5 5 14 2zM12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8',
  smile:'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20M8 9h0m8 0h0M8 14c1.5 4 6.5 4 8 0'
 });
 const ends={trend:[[4,20],[20,4]],arrow:[[4,20]],ray:[[4,20]],extended:[[6,18],[18,6]],info:[[4,20],[20,4]],horizontalray:[[4,12]],channel:[[3,16],[16,3],[8,21],[21,8]],fib:[[3,20],[21,9]],long:[[4,4],[4,13],[20,13],[4,20]],short:[[4,4],[4,11],[20,11],[4,20]],xabcd:[[3,20],[6,4],[11,14],[17,5],[21,17]],projection:[[5,4],[5,20],[21,20]],pricerange:[[20,3],[4,21]],daterange:[[3,20],[21,4]],measure:[[4,20],[20,4]],ghostfeed:[[3,19],[21,7]],volumeprofile:[[5,21],[21,4]]};
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function svg(id){const glyph=Suite.spec(id)?.glyph;if(glyph)return '<svg class="bt-icon" viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="19" text-anchor="middle" fill="currentColor" stroke="none" font-size="20">'+escape(glyph)+'</text></svg>';const zones=['long','short'].includes(id)?'<path class="bt-icon-projection-guide" d="'+(id==='long'?'M5 12 20 5':'M5 12 20 19')+'"/>':'';return '<svg class="bt-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">'+zones+'<path d="'+(paths[id]||paths.tool)+'"/>'+(ends[id]||[]).map(([x,y])=>'<circle class="bt-icon-anchor" cx="'+x+'" cy="'+y+'" r="1.65"/>').join('')+'</svg>';}
 function label(id,text){return svg(id)+'<span>'+escape(text)+'</span>';}
 return {svg,label,paths};
});

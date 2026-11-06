/* Scoped presentation improvements. All execution and saving stay in existing modules. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s);let observer=null;
 function clear(){observer?.disconnect();observer=null;}
 function init(){
  const top=$('.bt-page-top');if(!top)return;
  const button=document.createElement('button');button.type='button';button.id='bt-sidebar-toggle';button.className='bt-button small';button.setAttribute('aria-label','Collapse workspace navigation');button.setAttribute('aria-expanded','true');button.setAttribute('aria-controls','bt-workspace-sidebar');button.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  $('.bt-sidebar').id='bt-workspace-sidebar';top.prepend(button);
  for(const link of document.querySelectorAll('.journey-sidebar nav a')){const label=link.textContent.trim();if(label){link.setAttribute('aria-label',label);link.title=label;}}
  document.addEventListener('keydown',e=>{const terminal=$('#bt-terminal'),ticket=$('#bt-ticket');if(!terminal||terminal.classList.contains('ticket-hidden')||$('#bt-dialog')?.open||!matchMedia('(max-width:760px)').matches)return;if(e.key==='Escape'){e.preventDefault();$('#bt-hide-order').click();return;}if(e.key!=='Tab')return;const fields=[...ticket.querySelectorAll('button,input,select,textarea,summary,[tabindex="0"]')].filter(n=>!n.disabled&&!n.closest('[hidden]')&&n.getClientRects().length);if(!fields.length)return;const first=fields[0],last=fields.at(-1);if(!ticket.contains(document.activeElement)||e.shiftKey&&document.activeElement===first||!e.shiftKey&&document.activeElement===last){e.preventDefault();(e.shiftKey?last:first).focus();}});
  button.onclick=()=>{const collapsed=document.body.classList.toggle('bt-nav-collapsed');button.setAttribute('aria-expanded',String(!collapsed));button.setAttribute('aria-label',collapsed?'Expand workspace navigation':'Collapse workspace navigation');window.dispatchEvent(new Event('resize'));};
 }
 function replay(){
  clear();const terminal=$('#bt-terminal'),bar=$('.bt-pro-replay'),heading=$('.bt-session-heading');if(!terminal||!bar||!heading)return;
  // Keep the existing draggable playback controls over the plot, as in the reference.
  bar.classList.add('is-floating');bar.style.left='55px';bar.style.top='48px';
  const extras=document.createElement('details');extras.className='bt-desk-extras';extras.innerHTML='<summary>Research & chart tools</summary>';terminal.before(extras);
  const brief=$('#bt-research-summary');if(brief)extras.append(brief);
  const headingActions=heading.querySelector(':scope > .bt-actions');for(const node of headingActions?.querySelectorAll('[data-research],#bt-rules')||[])extras.append(node);
  const stats=$('#bt-live-stats');if(stats)heading.querySelector('.bt-session-name').after(stats);
  const extraActions=document.createElement('div');extraActions.className='bt-actions bt-desk-extra-actions';extras.append(extraActions);for(const selector of ['#bt-open-journal','#bt-replay-focus','#bt-compare-toggle','.bt-chart-tool-extras']){const node=$(selector);if(node)extraActions.append(node);}
  for(const selector of ['#bt-settings','#bt-fullscreen','#bt-objects','#bt-camera']){const node=$(selector);if(node){node.classList.add('bt-reference-icon');node.title=node.getAttribute('aria-label')||node.textContent.trim();}}
  
  $('#bt-toggle-order').innerHTML=window.BacktestIcons.label('order','Place order');
  const floating=$('#bt-replay-float');if(floating)floating.title='Dock replay below the chart or float it over the chart';
  const presets=$('.bt-pro-presets');if(presets)presets.open=false;
  $('#bt-toggle-order')?.setAttribute('aria-controls','bt-ticket');
  for(const [selector,label] of [['#bt-rules','Strategy checklist'],['.bt-session-heading [data-research]','Research brief']]){const b=$(selector);if(b){b.setAttribute('aria-label',label);b.title=label;}}
  function state(){const open=!terminal.classList.contains('ticket-hidden');$('#bt-toggle-order')?.setAttribute('aria-expanded',String(open));$('#bt-ticket')?.setAttribute('aria-hidden',String(!open));}
  observer=new MutationObserver(state);observer.observe(terminal,{attributes:true,attributeFilter:['class']});state();
  const close=$('#bt-hide-order');if(close){const original=close.onclick;close.onclick=()=>{original?.();$('#bt-toggle-order')?.focus();};}
 }
 window.BacktestPresentation={replay,clear};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

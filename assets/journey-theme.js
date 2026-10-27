/* Appearance is saved to the signed-in account, never to browser record storage. */
(() => {
 let current='light',row=null,saving=false,changed=false;
 function apply(theme){current=theme==='dark'?'dark':'light';document.documentElement.dataset.theme=current;document.querySelectorAll('[data-theme-toggle]').forEach(b=>{b.innerHTML=(window.JourneyIcons?.svg(current==='dark'?'sun':'moon')||'')+'<span>'+(current==='dark'?'Light theme':'Dark theme')+'</span>';b.setAttribute('aria-label','Switch to '+(current==='dark'?'light':'dark')+' theme');});window.dispatchEvent(new CustomEvent('themechange',{detail:{theme:current}}));window.dispatchEvent(new Event('resize'));}
 window.Theme={current:()=>current,set:apply,toggle:()=>apply(current==='dark'?'light':'dark'),isExplicit:()=>true};
 document.addEventListener('click',async e=>{if(!e.target.closest('[data-theme-toggle]')||saving)return;changed=true;apply(current==='dark'?'light':'dark');saving=true;try{const u=await JourneyAPI.ready;if(u)row=await JourneyAPI.save('settings:appearance','document',{theme:current},row?.revision??null);}catch(err){const target=document.querySelector('[data-theme-feedback]');if(target)target.textContent='Theme changed for this tab. Account save failed: '+err.message;}finally{saving=false;}});
 JourneyAPI.ready.then(async u=>{if(!u)return;const {data,error}=await JourneyAPI.client.from('journey_records').select('*').eq('user_id',u.id).eq('id','settings:appearance').maybeSingle();if(error)throw error;row=data;if(!changed)apply(data?.payload?.theme||'light');}).catch(()=>{});
 document.addEventListener('DOMContentLoaded',()=>apply(current),{once:true});
})();

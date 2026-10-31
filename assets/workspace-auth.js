/* MyTradingJourney account entry. Uses the same Supabase client as the workspace. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.MTJWorkspaceAuth=api;api.mount(document,window);}})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const pages=['journey','library','reader','backtesting'];
 function returnRoute(search,stored,now=Date.now()){
  const params=new URLSearchParams(search),explicit=params.get('next'),section=params.get('section');
  if(pages.includes(explicit))return {page:explicit,hash:/^#[A-Za-z0-9/_-]*$/.test(section||'')?section:(explicit==='journey'?'#home':'')};
  try{const r=JSON.parse(stored||'null');if(r&&pages.includes(r.page)&&Number.isFinite(r.at)&&now-r.at>=0&&now-r.at<30*60*1000)return {page:r.page,hash:/^#[A-Za-z0-9/_-]*$/.test(r.hash||'')?r.hash:''};}catch(_){}
  return {page:'journey',hash:'#home'};
 }
 function callbackURL(href,route,reset=false){const url=new URL(reset?'reset-password.html':'login.html',href);url.search='';url.hash='';url.searchParams.set('next',route.page);if(route.hash)url.searchParams.set('section',route.hash);if(new URL(href).searchParams.get('connect')==='new')url.searchParams.set('connect','new');return url.href;}
 function validate(mode,email,password,confirm){const errors={};if(mode!=='reset'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))errors.email='Enter a valid email address.';if(mode!=='forgot'&&!password)errors.password='Enter your password.';else if((mode==='signup'||mode==='reset')&&password.length<8)errors.password='Use at least 8 characters for your new password.';if((mode==='signup'||mode==='reset')&&password!==confirm)errors.confirm='The passwords do not match.';return errors;}
 function message(error){const m=String(error?.message||'');if(error?.status===429||/rate|too many/i.test(m))return 'Too many attempts. Please wait a little before trying again.';if(/confirm|not confirmed/i.test(m))return 'Confirm your email first using the link in your inbox.';if(error?.status===0||/network|fetch|connection/i.test(m))return 'We couldn’t connect. Check your connection and try again.';if(/invalid.*(credential|login)|credential|invalid_grant/i.test(m))return 'We couldn’t sign you in. Check your email and password, or use Google if that is how you joined.';if(/weak|password.*(short|least|contain)/i.test(m))return 'Choose a stronger password with at least 8 characters.';if(/signup.*disabled|signups.*allowed/i.test(m))return 'Account creation is unavailable right now. Please try again later.';if(/expired|token|session/i.test(m))return 'This link has expired or is invalid. Request a new reset email.';return 'That request couldn’t be completed. Please try again.';}
 async function request(auth,mode,values,redirect){
  if(mode==='login')return auth.signInWithPassword({email:values.email.trim(),password:values.password});
  if(mode==='signup')return auth.signUp({email:values.email.trim(),password:values.password,options:{emailRedirectTo:redirect}});
  if(mode==='forgot')return auth.resetPasswordForEmail(values.email.trim(),{redirectTo:redirect});
  if(mode==='reset')return auth.updateUser({password:values.password});
  throw Error('Unknown account action');
 }
 function mount(doc,win){const $=id=>doc.getElementById(id),form=$('auth-form');if(!form)return;
  const params=new URLSearchParams(win.location.search),hash=new URLSearchParams(win.location.hash.slice(1));
  const connecting=params.get('connect')==='new';
  const recoveryIntent=doc.body.dataset.authMode==='reset'||hash.get('type')==='recovery';
  let mode=recoveryIntent?'reset':params.get('mode')==='signup'?'signup':'login',busy=false,connected=false,recoveryAllowed=false,auth,client,verifiedUser;
  let stored=null;try{stored=win.sessionStorage.getItem('op-return');}catch(_){}
  const route=returnRoute(win.location.search,stored),destination=route.page+'.html'+route.hash;
  const callbackError=hash.get('error')||params.get('error');
  const authCallback=params.has('code')||hash.has('access_token');
  const copy={login:['YOUR PERSONAL WORKSPACE','Welcome back.','Keep becoming.','A place for your practice, your learning, and the life you’re building.','Sign in to my workspace','New to MyTradingJourney?','Create an account ↗'],signup:['YOUR NEXT CHAPTER','Start your journey.','Make it your own.','Create a personal workspace for your chart studies, reading, ideas, and reflections.','Create my account','Already have an account?','Sign in instead ↗'],forgot:['A FRESH START','Let’s get you','back on track.','Enter your account email and we’ll send you a password reset link.','Send reset link','Remember your password?','Back to sign in ↗'],reset:['A FRESH START','Your next chapter.','A new password.','Choose a new password to continue with your personal workspace.','Save new password','Need another reset link?','Request a new link ↗']};
  function feedback(text,error=false){const el=$('access-feedback');el.textContent=text;el.hidden=!text;el.dataset.error=String(error);el.setAttribute('role',error?'alert':'status');}
  function fieldErrors(errors){for(const name of ['email','password','confirm']){$('access-'+name+'-error').textContent=errors[name]||'';$('access-'+name).setAttribute('aria-invalid',String(Boolean(errors[name])));}}
  function enable(){for(const id of ['access-submit','access-google'])$(id).disabled=busy||!connected||(id==='access-submit'&&mode==='reset'&&!recoveryAllowed);form.setAttribute('aria-busy',String(busy));$('access-submit-label').textContent=busy?(mode==='forgot'?'Sending…':mode==='reset'?'Saving…':mode==='signup'?'Creating…':'Signing in…'):copy[mode][4];}
  function setMode(next,focus=false){if(busy)return;mode=next;const c=copy[mode];$('access-eyebrow').textContent=c[0];$('access-title').replaceChildren(doc.createTextNode(c[1]),doc.createElement('br'));const em=doc.createElement('em');em.textContent=c[2];$('access-title').append(em);$('access-description').textContent=connecting?'Connect your account to the dedicated MyTradingJourney database. Existing records will be transferred separately.':c[3];if(connecting){$('access-eyebrow').textContent='CONNECT YOUR NEW WORKSPACE';$('access-account-note').textContent='This is a connection check. Your existing workspace and its saved records stay available during setup.';}$('access-social').hidden=!['login','signup'].includes(mode);$('access-email-field').hidden=mode==='reset';$('access-password-field').hidden=mode==='forgot';$('access-confirm-field').hidden=!['signup','reset'].includes(mode);$('access-forgot').hidden=mode!=='login';$('access-password').autocomplete=mode==='login'?'current-password':'new-password';$('access-password').value='';$('access-confirm').value='';$('access-password').type='password';$('access-toggle-password').setAttribute('aria-label','Show password');$('access-toggle-password').setAttribute('aria-pressed','false');$('access-switch-label').textContent=c[5];$('access-switch').textContent=c[6];fieldErrors({});feedback('');enable();if(mode==='reset'&&connected&&!recoveryAllowed)feedback('This reset link is invalid or expired. Request a new link below.',true);if(focus)$(mode==='reset'?'access-password':'access-email').focus();}
  async function enter(){if(connecting){const checked=await auth.getUser();if(checked.error||!checked.data?.user)throw Error('connection');verifiedUser=checked.data.user;const result=await client.from('journey_records').select('id',{count:'exact',head:true}).eq('user_id',verifiedUser.id);if(result.error)throw result.error;$('access-title').textContent='Your account is connected.';$('access-description').textContent='Signed in as '+verifiedUser.email+'. Your dedicated MyTradingJourney account is ready.';$('access-social').hidden=true;form.hidden=true;$('access-switch').hidden=true;$('access-switch-label').hidden=true;$('access-story-signup').hidden=true;$('access-account-note').textContent='Your existing records have not moved yet. This connection check keeps the current workspace available while the transfer is prepared.';feedback('Google/email account verified. New workspace database connection confirmed.');return;}try{win.sessionStorage.removeItem('op-return');}catch(_){}win.location.replace(destination);}
  $('access-toggle-password').addEventListener('click',()=>{const visible=$('access-password').type==='password';$('access-password').type=visible?'text':'password';$('access-toggle-password').setAttribute('aria-label',visible?'Hide password':'Show password');$('access-toggle-password').setAttribute('aria-pressed',String(visible));});
  $('access-forgot').addEventListener('click',()=>setMode('forgot',true));
  $('access-switch').addEventListener('click',()=>setMode(mode==='login'?'signup':mode==='reset'?'forgot':'login',true));
  $('access-story-signup').addEventListener('click',()=>setMode('signup',true));
  for(const name of ['email','password','confirm'])$('access-'+name).addEventListener('input',()=>{$('access-'+name+'-error').textContent='';$('access-'+name).setAttribute('aria-invalid','false');});
  form.addEventListener('submit',async event=>{event.preventDefault();if(busy||!connected)return;const values={email:$('access-email').value,password:$('access-password').value,confirm:$('access-confirm').value},errors=validate(mode,values.email,values.password,values.confirm);fieldErrors(errors);feedback('');if(Object.keys(errors).length){$('access-'+Object.keys(errors)[0]).focus();return;}if(mode==='reset'&&!recoveryAllowed){feedback('Request a valid password reset link before continuing.',true);return;}
   busy=true;enable();try{const result=await request(auth,mode,values,callbackURL(win.location.href,route,mode==='forgot'));if(result.error)throw result.error;
    if(mode==='forgot'){feedback('If that address has an account, a reset link is on its way. Check your inbox and spam folder.');}
    else if(mode==='signup'&&!result.data?.session){$('access-password').value='';$('access-confirm').value='';feedback('Check your inbox for an account confirmation email. Follow its link, then sign in here. If you already have an account, try signing in.');}
    else if(mode==='reset'){feedback('Password updated. Opening your workspace…');$('access-password').value='';$('access-confirm').value='';await enter();}
    else if(result.data?.session){feedback('You’re signed in. Opening your workspace…');await enter();}
    else feedback('We couldn’t confirm your session. Please try signing in again.',true);
   }catch(error){feedback(message(error),true);}finally{busy=false;enable();}
  });
  $('access-google').addEventListener('click',async()=>{if(busy||!connected)return;feedback('');busy=true;enable();try{try{if(!connecting)win.sessionStorage.setItem('op-return',JSON.stringify({...route,at:Date.now()}));}catch(_){}const result=await auth.signInWithOAuth({provider:'google',options:{redirectTo:callbackURL(win.location.href,route),queryParams:{prompt:'select_account'}}});if(result.error)throw result.error;}catch(_){feedback('Google sign-in isn’t available right now. You can use your email and password instead.',true);}finally{busy=false;enable();}});
  setMode(mode);
  async function initialize(){try{const api=connecting?{client:win.supabase.createClient('https://lazdabmppsznsoaoufkj.supabase.co','sb_publishable_Hn7WCckY95D8CwW-KSMcJg_Ortp-1EQ',{auth:{storageKey:'mtj.workspace.auth.v1'}})}:win.JourneyAPI;if(!api?.client?.auth)throw Error('connection');client=api.client;auth=client.auth;
   auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'&&session?.user){recoveryAllowed=true;setMode('reset');}});
   let user;if(connecting){const result=await auth.getUser();if(result.error&&result.error.name!=='AuthSessionMissingError')throw result.error;user=result.data?.user||null;}else user=await api.ready;connected=true;
   if(recoveryIntent){recoveryAllowed=Boolean(user)&&!callbackError;setMode('reset');}
   else if(user&&(authCallback||connecting)&&!callbackError){await enter();return;}
   if(callbackError)feedback('That sign-in link is invalid or expired. Try signing in again or request a new reset link.',true);
   enable();
  }catch(_){connected=false;enable();feedback('The account connection is unavailable. Reload this page to try again.',true);}}
  return initialize();
 }
 return {returnRoute,callbackURL,validate,message,request,mount};
});

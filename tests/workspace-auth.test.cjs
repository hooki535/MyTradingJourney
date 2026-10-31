const test=require('node:test'),assert=require('node:assert/strict'),A=require('../assets/workspace-auth.js');
test('workspace returns accept only known local pages and safe hashes',()=>{
 const now=10000000;
 assert.deepEqual(A.returnRoute('?next=journey',JSON.stringify({page:'library',hash:'',at:now}),now),{page:'journey',hash:'#home'});
 assert.deepEqual(A.returnRoute('',JSON.stringify({page:'backtesting',hash:'#session/example',at:now}),now),{page:'backtesting',hash:'#session/example'});
 for(const stored of ['bad',JSON.stringify({page:'https://example.com',hash:'',at:now}),JSON.stringify({page:'library',hash:'',at:now-1800001}),JSON.stringify({page:'library',at:now+1})])assert.deepEqual(A.returnRoute('?next=https://example.com',stored,now),{page:'journey',hash:'#home'});
 assert.equal(A.returnRoute('?next=journey&section=%23%22%3E',null,now).hash,'#home');
 assert.deepEqual(A.returnRoute('',JSON.stringify({page:'journey',hash:'#mindset',at:now}),now),{page:'journey',hash:'#mindset'});
});
test('OAuth, confirmation and recovery callbacks remain on the current MyTradingJourney deployment',()=>{
 const route={page:'journey',hash:'#mindset'};
 assert.equal(A.callbackURL('https://hooki535.github.io/MyTradingJourney/pages/login.html?mode=signup#token',route),'https://hooki535.github.io/MyTradingJourney/pages/login.html?next=journey&section=%23mindset');
 assert.equal(A.callbackURL('https://hooki535.github.io/MyTradingJourney/pages/login.html',route,true),'https://hooki535.github.io/MyTradingJourney/pages/reset-password.html?next=journey&section=%23mindset');
});
test('existing shorter passwords can sign in; new passwords require confirmation and eight characters',()=>{
 assert.deepEqual(A.validate('login','member@example.com','short',''),{});
 assert.ok(A.validate('signup','member@example.com','short','short').password);
 assert.ok(A.validate('reset','','long-password','different').confirm);
 assert.deepEqual(A.validate('forgot','member@example.com','',''),{});
 assert.ok(A.validate('login','wrong','secret','').email);
});
test('account modes call the intended auth operation without storing credentials',async()=>{
 const calls=[],auth=Object.fromEntries(['signInWithPassword','signUp','resetPasswordForEmail','updateUser'].map(name=>[name,async(...args)=>{calls.push([name,...args]);return {data:{},error:null};}]));
 const values={email:' member@example.com ',password:'sample-password'};
 for(const mode of ['login','signup','forgot','reset'])await A.request(auth,mode,values,'https://example.com/MyTradingJourney/pages/login.html');
 assert.deepEqual(calls[0],['signInWithPassword',{email:'member@example.com',password:'sample-password'}]);
 assert.equal(calls[1][1].options.emailRedirectTo,'https://example.com/MyTradingJourney/pages/login.html');
 assert.deepEqual(calls[2],['resetPasswordForEmail','member@example.com',{redirectTo:'https://example.com/MyTradingJourney/pages/login.html'}]);
 assert.deepEqual(calls[3],['updateUser',{password:'sample-password'}]);
});
test('network, rate-limit and invalid-session errors remain actionable without exposing raw backend text',()=>{assert.match(A.message({status:429}),/wait/i);assert.match(A.message({message:'Failed to fetch'}),/connection/);assert.match(A.message({message:'Invalid login credentials'}),/email and password/);assert.match(A.message({message:'expired token'}),/new reset email/);});

function loginPage({user=null,search='?next=journey',hash=''}={}){
 const nodes=new Map(),redirects=[];
 function element(){return {dataset:{},value:'',type:'password',hidden:false,disabled:false,attributes:{},events:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.events[k]=fn;},replaceChildren(){},append(){},focus(){}};}
 const doc={body:{dataset:{authMode:'login'}},getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,createTextNode:text=>({textContent:text})};
 const auth={onAuthStateChange(){},async signInWithPassword(){return {data:{session:{user:{id:'verified-user'}}},error:null};}};
 const win={location:{search,hash,href:'https://hooki535.github.io/MyTradingJourney/pages/login.html'+search+hash,replace:url=>redirects.push(url)},sessionStorage:{getItem:()=>null,removeItem(){},setItem(){}},JourneyAPI:{client:{auth},ready:Promise.resolve(user)}};
 return {doc,win,nodes,redirects,auth};
}
test('a remembered session no longer bypasses the sign-in form on a normal Access visit',async()=>{
 const p=loginPage({user:{id:'remembered-user'}});await A.mount(p.doc,p.win);
 assert.deepEqual(p.redirects,[]);assert.equal(p.nodes.get('access-submit').disabled,false);assert.equal(p.nodes.get('access-social').hidden,false);
 p.nodes.get('access-email').value='sample@example.com';p.nodes.get('access-password').value='sample-password';
 await p.nodes.get('auth-form').events.submit({preventDefault(){}});
 assert.deepEqual(p.redirects,['journey.html#home']);
});
test('only a verified OAuth or email-confirmation callback can complete automatic entry',async()=>{
 const accepted=loginPage({user:{id:'verified-user'},hash:'#access_token=fixture-only'});await A.mount(accepted.doc,accepted.win);assert.deepEqual(accepted.redirects,['journey.html#home']);
 const rejected=loginPage({hash:'#access_token=fixture-only'});await A.mount(rejected.doc,rejected.win);assert.deepEqual(rejected.redirects,[]);
 const failed=loginPage({user:{id:'remembered-user'},search:'?code=fixture-only&error=invalid'});await A.mount(failed.doc,failed.win);assert.deepEqual(failed.redirects,[]);
});
test('destination callbacks keep connection mode for Google, confirmation and recovery',()=>{
 const href='https://hooki535.github.io/MyTradingJourney/pages/login.html?connect=new';
 for(const reset of [false,true]){
  const url=new URL(A.callbackURL(href,{page:'journey',hash:'#home'},reset));
  assert.equal(url.searchParams.get('connect'),'new');
  assert.equal(url.pathname,'/MyTradingJourney/pages/'+(reset?'reset-password':'login')+'.html');
 }
});
function connectionPage({databaseError=null,user={id:'destination-user',email:'member@example.com'}}={}){
 const p=loginPage({search:'?connect=new',user:{id:'source-user'}}),calls=[];
 const auth={...p.auth,async getUser(){calls.push('verified-user');return {data:{user},error:null};}};
 const client={auth,from(table){calls.push(['table',table]);return {select(...args){calls.push(['select',...args]);return this;},async eq(key,value){calls.push(['owner',key,value]);return {count:0,error:databaseError};}};}};
 p.win.supabase={createClient(url,key,options){calls.push(['client',url,options]);assert.ok(key.startsWith('sb_publishable_'));return client;}};
 return {...p,calls,auth};
}
test('new connection uses isolated destination auth and verifies owner access without entering the source workspace',async()=>{
 const p=connectionPage();await A.mount(p.doc,p.win);
 assert.deepEqual(p.redirects,[]);
 assert.ok(p.calls.some(c=>Array.isArray(c)&&c[0]==='client'&&c[1]==='https://lazdabmppsznsoaoufkj.supabase.co'&&c[2].auth.storageKey==='mtj.workspace.auth.v1'));
 assert.ok(p.calls.some(c=>Array.isArray(c)&&c[0]==='owner'&&c[1]==='user_id'&&c[2]==='destination-user'));
 assert.equal(p.nodes.get('auth-form').hidden,true);
 assert.match(p.nodes.get('access-title').textContent,/connected/);
});
test('database failure never reports a completed connection',async()=>{
 const p=connectionPage({databaseError:{message:'permission denied'}});await A.mount(p.doc,p.win);
 assert.notEqual(p.nodes.get('auth-form').hidden,true);
 assert.match(p.nodes.get('access-feedback').textContent,/unavailable/);
 assert.deepEqual(p.redirects,[]);
});

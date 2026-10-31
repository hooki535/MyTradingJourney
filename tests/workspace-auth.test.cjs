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

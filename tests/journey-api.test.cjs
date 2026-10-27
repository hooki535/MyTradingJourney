const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup({user={id:'owner-a'},result={data:{id:'book:one',revision:2},error:null}}={}){
 const calls=[];const query={select(){calls.push(['select']);return this;},eq(k,v){calls.push(['eq',k,v]);return this;},order(){return this;},insert(v){calls.push(['insert',v]);return this;},update(v){calls.push(['update',v]);return this;},delete(){return this;},maybeSingle(){return Promise.resolve(result);},then(resolve,reject){return Promise.resolve(result).then(resolve,reject);}};
 const bucket={upload:async(...args)=>{calls.push(['upload',...args]);return {error:null};},createSignedUrl:async()=>({data:{signedUrl:'https://example.test/private'},error:null}),remove:async()=>({error:null})};
 const client={auth:{getUser:async()=>({data:{user}}),onAuthStateChange(){}},from(name){calls.push(['from',name]);return query;},storage:{from(){return bucket;}}};
 const context={window:{supabase:{createClient:()=>client}},crypto:require('node:crypto').webcrypto,sessionStorage:{setItem(){}},location:{reload(){},hash:''}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../assets/journey-api.js','utf8'),context);
 return {api:context.window.JourneyAPI,store:context.window.JourneyWorkspaceStorage,calls};
}
test('records require sign-in and never silently fall back to local storage',async()=>{
 const {api,calls}=setup({user:null});await assert.rejects(api.list('book'),/Sign in/);assert.equal(calls.length,0);
});
test('update filters by owner and revision and increments its revision',async()=>{
 const {api,calls}=setup();await api.save('book:one','book',{notes:'New notes'},1);
 assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]==='owner-a'));
 assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='revision'&&c[2]===1));
 assert.equal(calls.find(c=>c[0]==='update')[1].revision,2);
});
test('stale database edits and duplicate inserts produce a visible conflict',async()=>{
 const stale=setup({result:{data:null,error:null}});await assert.rejects(stale.api.save('book:one','book',{},1),/another device/);
 const duplicate=setup({result:{data:null,error:{code:'23505'}}});await assert.rejects(duplicate.api.save('book:one','book',{}),/another device/);
});
test('private assets reject foreign owner paths and unsupported uploads',async()=>{
 const {api,calls}=setup();await assert.rejects(api.asset('owner-b/file.pdf'),/account/);
 await assert.rejects(api.upload({type:'image/svg+xml',size:10}),/PDF, JPG/);
 await assert.rejects(api.upload({type:'application/pdf',size:51*1024*1024}),/50 MB/);
 assert.equal(calls.filter(c=>c[0]==='upload').length,0);
});
test('uploads use an immutable owner folder and preferences stay in memory',async()=>{
 const {api,store,calls}=setup();const path=await api.upload({type:'application/pdf',size:100});assert.match(path,/^owner-a\/[a-f0-9-]+\.pdf$/);
 assert.equal(calls.find(c=>c[0]==='upload')[3].upsert,false);
 let changed=0;store.onChange=()=>changed++;store.setItem('onepercent:backtest-desk:v1','{}');assert.equal(changed,1);assert.equal(store.getItem('onepercent:backtest-desk:v1'),'{}');
});

test('reader record lookups filter by owner and exact record id',async()=>{
 const {api,calls}=setup();await api.get('settings:reader:abc');assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]==='owner-a'));assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='id'&&c[2]==='settings:reader:abc'));
 const signedOut=setup({user:null});await assert.rejects(signedOut.api.get('settings:reader:abc'),/Sign in/);
});

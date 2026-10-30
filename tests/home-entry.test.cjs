const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function route(hash='',search=''){let destination=null;vm.runInNewContext(script,{URLSearchParams,location:{hash,search,replace(value){destination=value;}}});return destination;}
test('public home and section bookmarks stay on the landing page',()=>{for(const hash of ['', '#main','#practice','#books','#vision','#story','#life'])assert.equal(route(hash),null);});
test('existing replay and personal workspace bookmarks preserve their full route',()=>{
 for(const hash of ['#sessions','#session/test-session','#strategies','#challenges','#analytics/all'])assert.equal(route(hash,'?source=bookmark'),'pages/backtesting.html?source=bookmark'+hash);
 for(const hash of ['#home','#journal','#mindset','#builder','#document','#review'])assert.equal(route(hash),'pages/journey.html'+hash);
});
test('existing authentication return parameters bypass the public landing page',()=>{
 assert.equal(route('','?code=test-code'),'pages/journey.html?code=test-code#home');
 assert.equal(route('#access_token=test-token&refresh_token=test-refresh'),'pages/journey.html#access_token=test-token&refresh_token=test-refresh');
 assert.equal(route('#error=test-error'),'pages/journey.html#error=test-error');
});

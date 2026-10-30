const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const L=require('../assets/library-data.js');
async function run(files,records){
 let handler,lists=0,uploads=0,saves=0,message='';
 const input={files,addEventListener(name,fn){if(name==='change')handler=fn;}};
 const api={ready:Promise.resolve({id:'owner'}),list:async()=>{lists++;return records;},upload:async()=>{uploads++;throw Error('Unexpected upload');},save:async()=>{saves++;throw Error('Unexpected save');}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../assets/library-import.js'),'utf8'),{JourneyAPI:api,JourneyLibrary:L,JourneyLibraryUI:{message:s=>message=s,reload:async()=>{}},document:{getElementById:()=>input},window:{addEventListener(){}},confirm:()=>true,crypto:webcrypto,File,Uint8Array,Map,Set});
 await handler();return {lists,uploads,saves,message,input};
}
test('batch matching keeps existing PDFs and reading notes for catalog aliases',async()=>{
 const ids=['rich-dad-poor-dad','market-wizards','technical-analysis','disciplined-trader'];
 const records=ids.map(id=>({id:'book:'+id,revision:2,payload:{pdfPath:'owner/existing.pdf',notes:'Keep my reflection'}}));
 const before=JSON.stringify(records);
 const names=['Rich-Dad-Poor-Dad-2.pdf','THE MARKET WIZARDD.pdf','JOHN J.pdf','disciplined-trader.pdf'];
 const result=await run(names.map((name,i)=>new File([String(i)],name,{type:'application/pdf'})),records);
 assert.equal(result.lists,1);assert.equal(result.uploads,0);assert.equal(result.saves,0);assert.match(result.message,/4 existing or duplicate/);assert.equal(JSON.stringify(records),before);assert.equal(result.input.disabled,false);
});
test('hash matching prevents renamed duplicates and empty PDFs are rejected before upload',async()=>{
 const contents='existing PDF bytes',hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',Buffer.from(contents))).toString('hex');
 const records=[{id:'book:personal',payload:{pdfPath:'owner/file.pdf',pdfSha256:hash}}];
 const result=await run([new File([contents],'another-name.pdf',{type:'application/pdf'}),new File([],'empty.pdf',{type:'application/pdf'})],records);
 assert.equal(result.uploads,0);assert.equal(result.saves,0);assert.match(result.message,/1 existing or duplicate/);assert.match(result.message,/empty.pdf: Empty PDF/);
});

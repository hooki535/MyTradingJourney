const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base=require('../assets/library-data.js');
test('catalog aliases keep the original private reader and save notes to its original revision',async()=>{
 const L={...base,books:base.books.map(b=>({...b}))},nodes=new Map(),fields=Object.fromEntries(L.fields.map(name=>[name,{value:''}]));
 function node(id){if(!nodes.has(id))nodes.set(id,{value:id==='book-category'||id==='book-status'?'all':'',files:[],innerHTML:'',textContent:'',handlers:{},elements:{namedItem:name=>fields[name]},addEventListener(name,fn){this.handlers[name]=fn;},append(){},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);}
 const original={id:'book:custom-legacy',revision:3,payload:{...L.blank(),title:'Rich-Dad-Poor-Dad-2',pdfName:'Rich-Dad-Poor-Dad-2.pdf',pdfPath:'owner/existing.pdf',pdfPages:241,notes:'My existing reflection'}};
 let saved;
 const A={ready:Promise.resolve({id:'owner'}),list:async()=>[original],save:async(id,kind,payload,revision)=>{saved={id,kind,payload,revision};return {id,kind,payload,revision:revision+1};}};
 const window={JourneyLibrary:L,addEventListener(){},confirm:()=>true};
 vm.runInNewContext(fs.readFileSync(require.resolve('../assets/library.js'),'utf8'),{window,JourneyAPI:A,document:{getElementById:node,createElement:()=>({}),querySelectorAll:()=>[]},console,Map,Set});
 await new Promise(setImmediate);await window.JourneyLibraryUI.reload();await window.JourneyLibraryUI.reload();
 assert.equal(L.books.length,24);assert.match(node('book-grid').innerHTML,/reader.html\?book=custom-legacy/);assert.doesNotMatch(node('book-grid').innerHTML,/<h3>Rich-Dad-Poor-Dad-2<\/h3>/);
 node('book-grid').handlers.click({target:{closest:()=>({dataset:{book:'rich-dad-poor-dad'}})}});
 await new Promise(setImmediate);
 assert.equal(fields.notes.value,'My existing reflection');fields.notes.value='An updated reflection';
 await node('book-form').handlers.submit({preventDefault(){},submitter:{disabled:false}});
 assert.equal(saved.id,'book:custom-legacy');assert.equal(saved.revision,3);assert.equal(saved.payload.pdfPath,'owner/existing.pdf');assert.equal(saved.payload.notes,'An updated reflection');
});

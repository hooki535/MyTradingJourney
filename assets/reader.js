const A=window.JourneyAPI,$=id=>document.getElementById(id);
let pdf,row,page=1,renderTask=null,sequence=0,saveTimer,pending=false,saving=false;
const status=t=>$('reader-status').textContent=t;
async function bookmark(){
 if(!row||saving)return; saving=true;const savedPage=page;
 try{row=await A.save(row.id,row.kind,{...row.payload,readerPage:savedPage},row.revision);pending=page!==savedPage;status('Page '+savedPage+' saved to your account.');}
 catch(err){pending=true;status('Could not save reading position: '+err.message);}
 finally{saving=false;if(pending&&page!==savedPage)saveTimer=setTimeout(bookmark,500);}
}
async function render(){
 if(!pdf)return;const token=++sequence;if(renderTask){renderTask.cancel();try{await renderTask.promise;}catch(_){}}
 const n=page,p=await pdf.getPage(n);if(token!==sequence)return;
 const natural=p.getViewport({scale:1});const chosen=$('reader-zoom').value;
 const scale=chosen==='fit'?Math.min(2,Math.max(.2,($('reader-stage').clientWidth-48)/natural.width)):Number(chosen);
 const viewport=p.getViewport({scale});const canvas=$('pdf-canvas');canvas.hidden=false;canvas.width=Math.min(5000,Math.floor(viewport.width));canvas.height=Math.min(7000,Math.floor(viewport.height));
 renderTask=p.render({canvasContext:canvas.getContext('2d'),viewport});
 try{await renderTask.promise;if(token!==sequence)return;$('reader-page').value=n;$('reader-prev').disabled=n<=1;$('reader-next').disabled=n>=pdf.numPages;status('Page '+n+' of '+pdf.numPages);pending=true;clearTimeout(saveTimer);saveTimer=setTimeout(bookmark,700);}catch(err){if(err.name!=='RenderingCancelledException')status('Could not render this PDF page. Use Open original PDF.');}
}
function go(n){const value=Math.trunc(Number(n));if(!pdf||!Number.isFinite(value)||value<1||value>pdf.numPages){$('reader-page').value=page;return;}page=value;render();}
$('reader-prev').onclick=()=>go(page-1);$('reader-next').onclick=()=>go(page+1);$('reader-page').onchange=e=>go(e.target.value);$('reader-zoom').onchange=()=>render();
window.addEventListener('beforeunload',e=>{if(pending||saving){e.preventDefault();e.returnValue='';}});
try{
 const user=await A.ready;if(!user){A.login('library');throw Error('Sign in to open your books.');}
 const params=new URLSearchParams(location.search),book=params.get('book'),doc=params.get('doc');
 const id=book?'book:'+book:doc;row=(await A.list(book?'book':'document')).find(r=>r.id===id);
 if(!row)throw Error('This book or document is not in your account.');
 const path=book?row.payload.pdfPath:(row.payload.files?.[Number(params.get('file')||0)]?.type==='application/pdf'?row.payload.files[Number(params.get('file')||0)]:row.payload.files?.find(f=>f.type==='application/pdf'))?.path;
 if(!path)throw Error('Upload your own PDF from the book’s notes or the Document Vault first.');
 $('reader-title').textContent=row.payload.title||JourneyLibrary.books.find(b=>b.id===book)?.title||'My document';
 const url=await A.asset(path);$('reader-download').href=url;$('reader-download').hidden=false;status('Opening your PDF…');
 const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/build/pdf.min.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs';
 const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error('PDF download failed. Reload to refresh its private link.');
 pdf=await pdfjs.getDocument({data:new Uint8Array(await response.arrayBuffer()),isEvalSupported:false,enableXfa:false}).promise;
 page=Math.max(1,Math.min(pdf.numPages,Number(row.payload.readerPage)||1));$('reader-total').textContent='/ '+pdf.numPages;$('reader-page').max=pdf.numPages;$('reader-page').disabled=false;await render();
}catch(err){status(err.message||'Could not open this PDF. You can use Open original PDF if its link is available.');}

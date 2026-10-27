/* Downloads only the catalog's verified public-domain PDFs, through the user's session. */
(() => {
 const A=JourneyAPI,L=JourneyLibrary,button=document.getElementById('add-free-books');
 button.onclick=async()=>{
  const user=await A.ready;if(!user){A.login('library');return;}button.disabled=true;let saved=0,kept=0;const errors=[];
  try{for(const [id,source] of Object.entries(L.freeSources).filter(([,s])=>s.pdf)){
   let path;try{const book=L.books.find(b=>b.id===id),row=await A.get('book:'+id);if(row?.payload.pdfPath){kept++;continue;}JourneyLibraryUI.message('Adding '+book.title+'…');const response=await fetch(source.url);if(!response.ok)throw Error('Download failed');const blob=await response.blob();path=await A.upload(new File([blob],id+'.pdf',{type:'application/pdf'}));await A.save('book:'+id,'book',{...L.blank(),...row?.payload,title:book.title,author:book.author,pdfPath:path,pdfName:book.title+'.pdf',pdfSource:source.source},row?.revision??null);saved++;}
   catch(err){if(path)A.dropFile(path).catch(()=>{});errors.push(id+': '+err.message);}
  }
  await JourneyLibraryUI.reload();JourneyLibraryUI.message('Added '+saved+' free PDFs. '+kept+' existing PDFs kept.'+(errors.length?' '+errors.join('; '):' Ready to read.'),!!errors.length);
  }finally{button.disabled=false;}
 };
})();

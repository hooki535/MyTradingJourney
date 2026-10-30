/* Render user notes as text, and write only after an explicit save. */
(() => {
  'use strict';
  const L = window.JourneyLibrary;
  const catalog=L.books.slice(),aliases=new Map();
  const titleKey=value=>String(value).toLowerCase().replace(/[^a-z0-9]/g,'').replace(/\d+$/,'');
  const recordKey=id=>aliases.get(id)||id;
  const $ = id => document.getElementById(id);
  const labels = {planned:'To read',reading:'Reading',paused:'Paused',completed:'Finished'};
  let state = L.empty(), selected = null, original = null, draft = '', ready = false, rows = new Map(), user = null;
  async function reload(){const data=await JourneyAPI.list('book'); rows=new Map(data.map(r=>[r.id.slice(5),r]));state=L.empty();aliases.clear();L.books.splice(0,L.books.length,...catalog);for(const [id,row] of rows){if(row.payload.libraryArchived===true)continue;state.records[id]=row.payload;if(!catalog.some(b=>b.id===id)&&row.payload.title){const match=catalog.find(b=>titleKey(b.title)===titleKey(row.payload.title));if(match&&!rows.has(match.id)&&row.payload.pdfPath){aliases.set(match.id,id);continue;}L.books.push({id,title:row.payload.title,author:row.payload.author||'Personal book',group:0,order:L.books.length+1,prompt:'Read, capture a useful idea, and choose one practical action.'});}}}
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function message(text, error = false) { $('library-message').textContent = text; $('library-message').className = error ? 'message error' : 'message'; }
  function value(id) { return {...L.blank(),...state.records[recordKey(id)]}; }
  function render() {
    const counts = L.books.reduce((a,b) => { a[value(b.id).status]++; return a; }, {planned:0,reading:0,paused:0,completed:0});
    $('reading-stats').innerHTML = [[String(L.books.length),'Books in your path'],[counts.reading,'Currently reading'],[counts.completed,'Books finished'],[L.books.filter(b => value(b.id).action.trim()).length,'Actions recorded']].map(([n,t]) => '<article><span>'+t+'</span><strong>'+n+'</strong></article>').join('');
    const current = L.books.find(b => value(b.id).status === 'reading') || L.books.find(b => value(b.id).status !== 'completed');
    const focus = $('reading-focus');
    if (current) {
      const v = value(current.id);
      focus.innerHTML = '<div><p class="eyebrow">'+(v.status === 'reading' ? 'CONTINUE YOUR READING' : 'YOUR NEXT LEARNING STEP')+'</p><h2>'+esc(current.title)+'</h2><p>'+esc(v.action || current.prompt)+'</p><button class="learn-button primary" data-book="'+current.id+'">'+(v.status === 'reading' ? 'Open reading notes' : 'Plan this book')+' →</button></div><div class="focus-note"><span>LEARN → APPLY → REFLECT</span><b>One book.<br>One useful action.</b><p>Give yourself time to practice what you learn.</p></div>';
    } else focus.innerHTML = '<div><p class="eyebrow">KEEP APPLYING</p><h2>Your reading path is complete.</h2><p>Revisit your notes and review which actions changed your process.</p></div>';
    const search = $('book-search').value.trim().toLowerCase(), category = $('book-category').value, status = $('book-status').value;
    const matches = L.books.filter(b => (!search || (b.title+' '+b.author).toLowerCase().includes(search)) && (category === 'all' || String(b.group) === category) && (status === 'all' || value(b.id).status === status));
    $('result-count').textContent = matches.length+' of '+L.books.length+' books';
    $('library-path-summary').textContent=L.books.length+' books · '+L.groups.length+' areas of growth';
    $('book-grid').innerHTML = matches.map(b => {
      const v = value(b.id);
      return '<article class="book-card"><div class="book-cover-wrap tone-'+b.group+'"><img class="book-cover" data-cover="'+b.id+'" src="../assets/book-covers/'+(b.cover || 'personal.svg')+'" alt="Book cover for '+esc(b.title)+'" loading="lazy"></div><div class="book-info"><div class="book-meta"><span>'+esc(L.groups[b.group])+'</span><span class="reading-status '+v.status+'">'+labels[v.status]+'</span></div><h3>'+esc(b.title)+'</h3><p class="author">'+esc(b.author)+'</p><p class="book-action">'+esc(v.action || b.prompt)+'</p><div class="book-card-bottom"><span>'+esc(v.pdfPages?v.pdfPages+' PDF pages'+(v.pdfExcerpt?' · excerpt':' uploaded'):v.chapter || 'Start at your own pace')+'</span><button class="learn-button" data-book="'+b.id+'" aria-label="Open notes for '+esc(b.title)+'">'+(state.records[recordKey(b.id)] ? 'View notes' : 'Start learning')+' ↗</button>'+(L.freeSources[b.id]?'<a class="source-link" href="'+L.freeSources[b.id].url+'" target="_blank" rel="noopener">'+L.freeSources[b.id].title+' ↗</a>':'')+((v.pdfPath||L.freeSources[b.id]?.pdf)?'<a class="learn-button primary" href="reader.html?book='+encodeURIComponent(recordKey(b.id))+'">Read PDF</a>':'<button class="learn-button" data-book="'+b.id+'">Upload PDF</button>')+'</div></div></article>';
    }).join('') || '<p class="empty-books">No books match these filters. Try another title, category, or status.</p>'; renderCovers();
  }
  async function renderCovers(){for(const img of document.querySelectorAll('[data-cover]')){const path=value(img.dataset.cover).coverPath;if(path){try{const url=await JourneyAPI.asset(path);if(img.isConnected)img.src=url;}catch(_){}}}}
  function formValue() { return Object.fromEntries(L.fields.map(k => [k,$('book-form').elements.namedItem(k).value])); }
  function dirty() { return JSON.stringify(formValue()) !== draft || !!$('pdf-file')?.files.length || !!$('cover-file')?.files.length; }
  function close() { if (!dirty() || window.confirm('Discard your unsaved reading notes?')) $('book-dialog').close(); }
  async function open(id) {
    const b = L.books.find(b => b.id === id); if (!b) return;
    if (!ready) { message('Sign in to save reading notes and upload your books.',true); JourneyAPI.login('library'); return; }
    try { await reload(); } catch (_) { message('Reading records could not be loaded. Existing data has been kept.',true); return; }
    selected = recordKey(id); original = {...value(id)}; $('pdf-file').value='';$('cover-file').value='';$('file-status').textContent=original.pdfPath?'PDF uploaded'+(original.pdfPages?' · '+original.pdfPages+' pages':'')+' · open it using Read PDF.':'Upload a PDF you own or have permission to use (up to 50 MB).';
    $('book-title').textContent = b.title; $('book-author').textContent = b.author; $('book-prompt').textContent = b.prompt;
    for (const field of L.fields) $('book-form').elements.namedItem(field).value = original[field];
    draft = JSON.stringify(formValue()); $('book-error').textContent = ''; $('book-dialog').showModal();
  }
  for (const b of L.groups) { const option = document.createElement('option'); option.value = String(L.groups.indexOf(b)); option.textContent = b; $('book-category').append(option); }
  for (const id of ['book-search','book-category','book-status']) $(id).addEventListener(id === 'book-search' ? 'input' : 'change', render);
  for (const id of ['reading-focus','book-grid']) $(id).addEventListener('click', e => { const button = e.target.closest('[data-book]'); if (button) open(button.dataset.book); });
  $('close-book').addEventListener('click',close); $('cancel-book').addEventListener('click',close);
  $('book-dialog').addEventListener('cancel',e => { e.preventDefault(); close(); });
  $('book-form').addEventListener('submit',async e => {
    e.preventDefault(); const button=e.submitter; if(button)button.disabled=true;
    const uploaded=[];
    try {
      const payload={...value(selected),...L.record(formValue())};
      for(const [input,field] of [['pdf-file','pdfPath'],['cover-file','coverPath']]){const file=$(input).files[0];if(file){const path=await JourneyAPI.upload(file);uploaded.push(path);payload[field]=path;}}
      const row=await JourneyAPI.save('book:'+selected,'book',payload,rows.get(selected)?.revision??null);
      rows.set(selected,row);state.records[selected]=payload;
      $('book-dialog').close(); render(); message('Reading notes and files saved to your account.');
      for(const field of ['pdfPath','coverPath'])if(original[field]&&original[field]!==payload[field])JourneyAPI.dropFile(original[field]).catch(()=>{});
    } catch(err){for(const path of uploaded)JourneyAPI.dropFile(path).catch(()=>{});$('book-error').textContent=err.message||'Could not save. Your draft is still here.';}
    finally{if(button)button.disabled=false;}
  });
  function download(body){const url=URL.createObjectURL(new Blob([JSON.stringify(body,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='MyTradingJourney-Reading-Backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('export-library').addEventListener('click',async()=>{try{await reload();download({kind:'mytradingjourney-cloud-books',version:1,records:[...rows.values()].map(r=>({id:r.id,payload:r.payload}))});message('Notes exported. Private PDF and cover files remain in your account.');}catch(err){message(err.message,true);}});
  async function importOld(data){const incoming=L.validate(data);await reload();if(!confirm('Import '+Object.keys(incoming.records).length+' book records into your account? Matching reading notes will be replaced.'))return;for(const [id,record] of Object.entries(incoming.records)){await JourneyAPI.save('book:'+id,'book',{...value(id),...record},rows.get(id)?.revision??null);}await reload();render();message('Reading notes imported to your account.');}
  $('import-library').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>4000000)throw Error('Choose a backup below 4 MB.');const data=JSON.parse(await file.text());if(data.kind==='mytradingjourney-library')await importOld(data);else{if(data.kind!=='mytradingjourney-cloud-books'||data.version!==1||!Array.isArray(data.records))throw Error('Choose a reading backup.');for(const r of data.records){if(!/^book:(?:[a-z0-9-]+)$/.test(r.id))throw Error('Invalid book identifier.');L.record(r.payload);}await reload();if(confirm('Restore these reading records to your account? Matching records will be replaced.')){for(const r of data.records){await JourneyAPI.save(r.id,'book',r.payload,rows.get(r.id.slice(5))?.revision??null);}await reload();render();message('Reading notes restored.');}}}catch(err){message('Import stopped: '+err.message+' Successfully imported records are kept; retry remaining records as needed.',true);}finally{e.target.value='';}});
  $('import-browser').onclick=async()=>{try{const raw=localStorage.getItem(L.key);if(!raw)throw Error('No older reading notes were found in this browser.');await importOld(JSON.parse(raw));}catch(err){message(err.message,true);}};
  $('add-book').onclick=()=>{if(!ready){JourneyAPI.login('library');return;}$('new-book-dialog').showModal();};
  $('new-book-form').onsubmit=async e=>{e.preventDefault();const f=e.target;try{const id='custom-'+crypto.randomUUID();await JourneyAPI.save('book:'+id,'book',{...L.blank(),title:f.elements.title.value.trim(),author:f.elements.author.value.trim()});await reload();render();$('new-book-dialog').close();f.reset();open(id);}catch(err){$('new-book-error').textContent=err.message;}};
  window.addEventListener('beforeunload',e => { if ($('book-dialog').open && dirty()) { e.preventDefault(); e.returnValue = ''; } });
  window.JourneyLibraryUI={reload:async()=>{await reload();render();},message};
  JourneyAPI.ready.then(async u=>{user=u;if(!u){message('Browse the reading path. Sign in to save notes, add books, or read your private PDFs.');return;}await reload();ready=true;render();message('Connected · reading records save directly to your account.');}).catch(err=>message('Account unavailable: '+err.message,true));
  render();
})();

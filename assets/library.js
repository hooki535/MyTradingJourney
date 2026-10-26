/* Render user notes as text, and write only after an explicit save. */
(() => {
  'use strict';
  const L = window.JourneyLibrary;
  const $ = id => document.getElementById(id);
  const labels = {planned:'To read',reading:'Reading',paused:'Paused',completed:'Finished'};
  let state = L.empty(), selected = null, original = null, draft = '', storage = null, ready = false;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function message(text, error = false) { $('library-message').textContent = text; $('library-message').className = error ? 'message error' : 'message'; }
  function value(id) { return state.records[id] || L.blank(); }
  function render() {
    const counts = L.books.reduce((a,b) => { a[value(b.id).status]++; return a; }, {planned:0,reading:0,paused:0,completed:0});
    $('reading-stats').innerHTML = [['21','Books in your path'],[counts.reading,'Currently reading'],[counts.completed,'Books finished'],[L.books.filter(b => value(b.id).action.trim()).length,'Actions recorded']].map(([n,t]) => '<article><span>'+t+'</span><strong>'+n+'</strong></article>').join('');
    const current = L.books.find(b => value(b.id).status === 'reading') || L.books.find(b => value(b.id).status !== 'completed');
    const focus = $('reading-focus');
    if (current) {
      const v = value(current.id);
      focus.innerHTML = '<div><p class="eyebrow">'+(v.status === 'reading' ? 'CONTINUE YOUR READING' : 'YOUR NEXT LEARNING STEP')+'</p><h2>'+esc(current.title)+'</h2><p>'+esc(v.action || current.prompt)+'</p><button class="learn-button primary" data-book="'+current.id+'">'+(v.status === 'reading' ? 'Open reading notes' : 'Plan this book')+' →</button></div><div class="focus-note"><span>LEARN → APPLY → REFLECT</span><b>One book.<br>One useful action.</b><p>Give yourself time to practice what you learn.</p></div>';
    } else focus.innerHTML = '<div><p class="eyebrow">KEEP APPLYING</p><h2>Your reading path is complete.</h2><p>Revisit your notes and review which actions changed your process.</p></div>';
    const search = $('book-search').value.trim().toLowerCase(), category = $('book-category').value, status = $('book-status').value;
    const matches = L.books.filter(b => (!search || (b.title+' '+b.author).toLowerCase().includes(search)) && (category === 'all' || String(b.group) === category) && (status === 'all' || value(b.id).status === status));
    $('result-count').textContent = matches.length+' of 21 books';
    $('book-grid').innerHTML = matches.map(b => {
      const v = value(b.id);
      return '<article class="book-card"><div class="book-art tone-'+b.group+'" aria-hidden="true"><span>THE READING PATH / '+String(b.order).padStart(2,'0')+'</span><b>'+esc(b.title)+'</b><small>'+esc(b.author)+'</small></div><div class="book-info"><div class="book-meta"><span>'+esc(L.groups[b.group])+'</span><span class="reading-status '+v.status+'">'+labels[v.status]+'</span></div><h3>'+esc(b.title)+'</h3><p class="author">'+esc(b.author)+'</p><p class="book-action">'+esc(v.action || b.prompt)+'</p><div class="book-card-bottom"><span>'+esc(v.chapter || 'Start at your own pace')+'</span><button class="learn-button" data-book="'+b.id+'" aria-label="Open notes for '+esc(b.title)+'">'+(state.records[b.id] ? 'View notes' : 'Start learning')+' ↗</button></div></div></article>';
    }).join('') || '<p class="empty-books">No books match these filters. Try another title, category, or status.</p>';
  }
  function formValue() { return Object.fromEntries(L.fields.map(k => [k,$('book-form').elements.namedItem(k).value])); }
  function dirty() { return JSON.stringify(formValue()) !== draft; }
  function close() { if (!dirty() || window.confirm('Discard your unsaved reading notes?')) $('book-dialog').close(); }
  function open(id) {
    const b = L.books.find(b => b.id === id); if (!b) return;
    if (!ready) { message('Reading storage is unavailable. Export any recoverable data before changing browser storage settings.',true); return; }
    try { state = L.read(storage); } catch (_) { message('Reading records could not be loaded. Existing data has been kept.',true); return; }
    selected = id; original = {...value(id)};
    $('book-title').textContent = b.title; $('book-author').textContent = b.author; $('book-prompt').textContent = b.prompt;
    for (const field of L.fields) $('book-form').elements.namedItem(field).value = original[field];
    draft = JSON.stringify(formValue()); $('book-error').textContent = ''; $('book-dialog').showModal();
  }
  for (const b of L.groups) { const option = document.createElement('option'); option.value = String(L.groups.indexOf(b)); option.textContent = b; $('book-category').append(option); }
  for (const id of ['book-search','book-category','book-status']) $(id).addEventListener(id === 'book-search' ? 'input' : 'change', render);
  for (const id of ['reading-focus','book-grid']) $(id).addEventListener('click', e => { const button = e.target.closest('[data-book]'); if (button) open(button.dataset.book); });
  $('close-book').addEventListener('click',close); $('cancel-book').addEventListener('click',close);
  $('book-dialog').addEventListener('cancel',e => { e.preventDefault(); close(); });
  $('book-form').addEventListener('submit',e => {
    e.preventDefault();
    try { state = L.save(storage,selected,formValue(),original); $('book-dialog').close(); render(); message('Reading notes saved on this device.'); }
    catch (err) { $('book-error').textContent = err.message || 'Could not save. Keep this page open and copy your notes.'; }
  });
  $('export-library').addEventListener('click', () => {
    try {
      const raw = storage.getItem(L.key);
      const contents = ready ? JSON.stringify(L.read(storage),null,2) : raw;
      if (contents === null) throw Error('No saved reading records are available.');
      const blob = new Blob([contents],{type:'application/json'}), url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = ready ? 'MyTradingJourney-Reading-Backup.json' : 'MyTradingJourney-Reading-Recovery.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url),1000); message('Reading backup exported. Keep it with your workspace backup.');
    } catch (err) { message('Could not export reading records: '+err.message,true); }
  });
  $('import-library').addEventListener('change',async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (!ready) throw Error('Existing reading data could not be loaded. Export a recovery copy before repairing browser storage.');
      if (file.size > 4000000) throw Error('The reading backup exceeds 4 MB.');
      const incoming = L.validate(JSON.parse(await file.text())), count = Object.keys(incoming.records).length;
      if (count && window.confirm('Import '+count+' book record(s)? Matching books will be replaced; other book notes are kept.')) { state = L.restore(storage,incoming); render(); message('Reading backup imported.'); }
      else if (!count) message('This backup contains no reading notes.');
    } catch (err) { message('Import failed: '+err.message+' Your saved records were kept.',true); }
    finally { e.target.value = ''; }
  });
  window.addEventListener('storage',e => {
    if (e.key !== L.key && e.key !== null) return;
    try { state = L.read(storage); render(); message('Reading records changed in another tab.'); } catch (_) { ready = false; message('Reading records changed and could not be loaded. Existing data has been kept.',true); }
  });
  window.addEventListener('beforeunload',e => { if ($('book-dialog').open && dirty()) { e.preventDefault(); e.returnValue = ''; } });
  try { storage = window.localStorage; state = L.read(storage); ready = true; }
  catch (_) { message('Reading storage could not be loaded. Existing data has been kept; export a recovery copy if available.',true); }
  render();
})();

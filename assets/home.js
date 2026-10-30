/* Public editorial content only; account records remain in the existing workspace. */
(() => {
  'use strict';
  const books = [
    {id:'atomic-habits',title:'Atomic Habits',author:'James Clear',category:'mindset',label:'MINDSET & HABITS',color:'sand',summary:'Build systems that make useful actions easier to repeat, even when motivation fades.',learn:['Shape your environment to support the habits you want.','Use small, repeatable actions to build consistency.','Track your process without expecting instant results.'],action:'Attach a five-minute chart review to an existing daily habit.'},
    {id:'trading-in-the-zone',title:'Trading in the Zone',author:'Mark Douglas',category:'trading',label:'TRADING PSYCHOLOGY',color:'sage',summary:'Explore how beliefs, uncertainty, and expectations influence the way you execute a trading plan.',learn:['Think in probabilities rather than demanding certainty.','Separate the quality of a decision from one trade’s outcome.','Recognize how fear and overconfidence affect execution.'],action:'Review one trade for rule adherence before looking at its result.'},
    {id:'psychology-of-money',title:'The Psychology of Money',author:'Morgan Housel',category:'wealth',label:'MONEY & BEHAVIOUR',color:'clay',summary:'Understand why your behaviour with money can matter as much as what you know about it.',learn:['Define what enough means for your own life.','Allow room for uncertainty in financial plans.','Understand the role of patience, luck, and personal experience.'],action:'Write down your definition of enough and one saving habit you can sustain.'},
    {id:'market-wizards',title:'Market Wizards',author:'Jack Schwager',category:'trading',label:'MARKET PERSPECTIVES',color:'sage',summary:'Compare interviews with traders whose different methods reveal recurring lessons about risk and discipline.',learn:['Distinguish a method from the principles behind it.','Understand why a strategy must fit the person using it.','Question success stories using your own evidence.'],action:'Choose one principle from an interview and examine it in replay.'},
    {id:'almanack',title:'The Almanack of Naval Ravikant',author:'Eric Jorgenson',category:'wealth',label:'WEALTH & JUDGMENT',color:'sand',summary:'Explore collected ideas about specific knowledge, ownership, judgment, and defining a fulfilling life.',learn:['Think about skills that combine your interests and experience.','Explore how products and ownership can scale useful work.','Examine your definition of success beyond status.'],action:'Identify a problem you could solve with one of your coding skills.'},
    {id:'lean-startup',title:'The Lean Startup',author:'Eric Ries',category:'wealth',label:'ENTREPRENEURSHIP',color:'clay',summary:'Turn a business idea into a small test, learn from what happens, and adapt before investing more.',learn:['Identify the assumptions behind an idea.','Design a small experiment that produces useful evidence.','Use feedback to decide whether to adapt or continue.'],action:'Write one product hypothesis and the smallest test that could challenge it.'}
  ];
  const grid=document.getElementById('featured-books'),dialog=document.getElementById('book-preview');
  // All values below are fixed, first-party editorial strings, never user content.
  function render(filter='all') {
    const visible=books.filter(b=>filter==='all'||b.category===filter);
    grid.innerHTML=visible.map(b=>`<article class="book-card"><div class="book-art ${b.color}"><span class="book-category">${b.label}</span><img src="assets/book-covers/${b.id}.webp" alt="${b.title} book cover" width="180" height="260" loading="lazy"></div><div class="book-copy"><small>${b.author}</small><h3>${b.title}</h3><p>${b.summary}</p><button type="button" class="text-link" data-book="${b.id}" aria-label="What you’ll learn from ${b.title}">What you’ll learn <span>↗</span></button></div></article>`).join('');
    document.getElementById('book-count').textContent=`${visible.length} featured books`;
  }
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render(button.dataset.filter);
  }));
  let opener;
  grid.addEventListener('click',event=>{
    const button=event.target.closest('[data-book]');if(!button)return;
    const b=books.find(book=>book.id===button.dataset.book);if(!b)return;opener=button;
    document.getElementById('preview-content').innerHTML=`<div class="preview-book ${b.color}"><img src="assets/book-covers/${b.id}.webp" alt="${b.title} cover" width="150" height="220"></div><div class="preview-text"><p class="eyebrow">${b.label}</p><h2 id="preview-title">${b.title}</h2><p class="preview-author">${b.author}</p><p>${b.summary}</p><h3>What you’ll learn</h3><ul>${b.learn.map(point=>`<li>${point}</li>`).join('')}</ul><div class="apply"><strong>PUT IT INTO PRACTICE</strong><p>${b.action}</p></div><a class="button dark" href="pages/library.html">Explore in your library ↗</a><small>Original editorial overview, not a substitute for the book.</small></div>`;
    dialog.showModal();
  });
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>opener?.focus());
  const visions={freedom:['More choice in how you live.','Define what enough means to you. Map essential expenses, build a saving habit, and choose one action that increases your options.'],craft:['Earn confidence through practice.','Choose a setup to study, keep a record of your decisions, and use a weekly review to identify one skill that needs deliberate work.'],ownership:['Create value you can stand behind.','Start with a real problem. Build a small solution, ask for feedback, and keep evidence of what customers actually find useful.']};
  document.querySelectorAll('[data-vision]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-vision]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const [title,description]=visions[button.dataset.vision];const target=document.getElementById('vision-detail');target.replaceChildren();const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=description;target.append(h,p);
  }));
  const menu=document.querySelector('.menu-toggle'),nav=document.getElementById('main-nav');
  function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
  nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
  document.getElementById('year').textContent=new Date().getFullYear();render();
})();

/* Personal reading records. Independent of backtesting snapshots and account sync. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JourneyLibrary = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const groups = ['Mindset and habits', 'Trading psychology and discipline', 'Market knowledge and legends', 'Risk and uncertainty', 'Entrepreneurship and wealth building'];
  const rows = [
    ['atomic-habits','Atomic Habits','James Clear',0,'Attach a short preparation and journaling routine to an existing daily habit.'],
    ['rich-dad-poor-dad','Rich Dad Poor Dad','Robert Kiyosaki',0,'Map your personal cash flow and question the assumptions behind your money decisions.'],
    ['psychology-of-money','The Psychology of Money','Morgan Housel',0,'Write your definition of enough and separate essential money from speculative capital.'],
    ['mindset','Mindset','Carol Dweck',0,'Rewrite one setback as a skill you can practice and track.'],
    ['think-and-grow-rich','Think and Grow Rich','Napoleon Hill',0,'Translate one ambition into a specific weekly action and examine the evidence for the advice.'],
    ['trading-in-the-zone','Trading in the Zone','Mark Douglas',1,'Create a checklist that separates following your setup from winning a single trade.'],
    ['disciplined-trader','The Disciplined Trader','Mark Douglas',1,'Record one repeated discipline mistake and an if–then rule to interrupt it.'],
    ['trading-for-a-living','Trading for a Living','Alexander Elder',1,'Review one simulated trade through psychology, method, and risk management.'],
    ['thinking-fast-and-slow','Thinking, Fast and Slow','Daniel Kahneman',1,'Find a journal entry where confidence exceeded the available evidence.'],
    ['reminiscences','Reminiscences of a Stock Operator','Edwin Lefèvre',2,'Compare a trading lesson with your own records before adopting it.'],
    ['market-wizards','Market Wizards','Jack Schwager',2,'Compare two traders’ approaches and identify which principles fit your process.'],
    ['technical-analysis','Technical Analysis of the Financial Markets','John Murphy',2,'Write a precise chart-pattern hypothesis and examine it in replay.'],
    ['intelligent-investor','The Intelligent Investor','Benjamin Graham',2,'Explain how investing decisions differ from your short-term trading experiments.'],
    ['fooled-by-randomness','Fooled by Randomness','Nassim Taleb',3,'Describe how luck could explain a recent run of wins or losses.'],
    ['black-swan','The Black Swan','Nassim Taleb',3,'List an unexpected event that could invalidate a comfortable trading assumption.'],
    ['antifragile','Antifragile','Nassim Taleb',3,'Identify a small experiment with limited downside and a useful learning outcome.'],
    ['almanack','The Almanack of Naval Ravikant','Eric Jorgenson',4,'Choose one useful skill to build and define a small project to practice it.'],
    ['zero-to-one','Zero to One','Peter Thiel',4,'Describe a specific problem your product could solve in a distinct way.'],
    ['lean-startup','The Lean Startup','Eric Ries',4,'Test one small product assumption with an observable outcome.'],
    ['shoe-dog','Shoe Dog','Phil Knight',4,'Write down a business uncertainty and one action that could reduce it.'],
    ['millionaire-fastlane','The Millionaire Fastlane','MJ DeMarco',4,'Evaluate a business idea by the customer problem and evidence of demand.'],
    ['ten-times-rule','The 10X Rule','Grant Cardone',0,'Choose a concrete goal, test your assumptions, and plan sustainable actions.'],
    ['ego-is-the-enemy','Ego Is the Enemy','Ryan Holiday',0,'Review one decision where protecting your ego distracted you from learning.'],
    ['richest-man-in-babylon','The Richest Man in Babylon','George S. Clason',4,'Write a practical saving rule and review how it fits your income and essential expenses.']
  ];
  const coverArtwork = {"atomic-habits":{"file":"atomic-habits.jpg?v=20261030supplied","width":735,"height":1111},"rich-dad-poor-dad":{"file":"rich-dad-poor-dad.jpg?v=20261030supplied","width":663,"height":1000},"mindset":{"file":"mindset.jpg?v=20261030supplied","width":319,"height":500},"think-and-grow-rich":{"file":"think-and-grow-rich.jpg?v=20261030supplied","width":736,"height":1030},"trading-in-the-zone":{"file":"trading-in-the-zone.jpg?v=20261030supplied","width":735,"height":1142},"disciplined-trader":{"file":"disciplined-trader.jpg?v=20261030supplied","width":397,"height":600},"trading-for-a-living":{"file":"trading-for-a-living.jpg?v=20261030supplied","width":736,"height":1170},"thinking-fast-and-slow":{"file":"thinking-fast-and-slow.jpg?v=20261030supplied","width":735,"height":1101},"reminiscences":{"file":"reminiscences.jpg?v=20261030supplied","width":736,"height":1104},"market-wizards":{"file":"market-wizards.jpg?v=20261030supplied","width":600,"height":898},"technical-analysis":{"file":"technical-analysis.jpg?v=20261030supplied","width":375,"height":491},"intelligent-investor":{"file":"intelligent-investor.jpg?v=20261030supplied","width":736,"height":1130},"fooled-by-randomness":{"file":"fooled-by-randomness.jpg?v=20261030supplied","width":329,"height":500},"black-swan":{"file":"black-swan.jpg?v=20261030supplied","width":736,"height":1120},"antifragile":{"file":"antifragile.jpg?v=20261030supplied","width":736,"height":1131},"almanack":{"file":"almanack.jpg?v=20261030supplied","width":736,"height":1147},"zero-to-one":{"file":"zero-to-one.jpg?v=20261030supplied","width":736,"height":1104},"lean-startup":{"file":"lean-startup.jpg?v=20261030supplied","width":392,"height":600},"shoe-dog":{"file":"shoe-dog.jpg?v=20261030supplied","width":735,"height":1110},"millionaire-fastlane":{"file":"millionaire-fastlane.jpg?v=20261030supplied","width":333,"height":500},"ten-times-rule":{"file":"ten-times-rule.jpg?v=20261030supplied","width":736,"height":1089},"ego-is-the-enemy":{"file":"ego-is-the-enemy.jpg?v=20261030supplied","width":736,"height":1127},"richest-man-in-babylon":{"file":"richest-man-in-babylon.jpg?v=20261030supplied","width":645,"height":1000},"psychology-of-money":{"file":"psychology-of-money.svg?v=20261030covers2","width":360,"height":540}};
  const books = rows.map(([id,title,author,group,prompt],i) => ({id,title,author,group,prompt,order:i+1,cover:coverArtwork[id].file,coverWidth:coverArtwork[id].width,coverHeight:coverArtwork[id].height}));
  const key = 'mytradingjourney:library:v1';
  const fields = ['status','chapter','notes','takeaways','question','action','reviewDate','related'];
  const statuses = ['planned','reading','paused','completed'];
  function blank() { return {status:'planned',chapter:'',notes:'',takeaways:'',question:'',action:'',reviewDate:'',related:''}; }
  function record(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid book record.');
    const out = blank();
    for (const field of fields) {
      if (input[field] === undefined) continue;
      if (typeof input[field] !== 'string' || input[field].length > 20000) throw Error('Invalid or oversized reading field.');
      out[field] = input[field];
    }
    if (!statuses.includes(out.status)) throw Error('Unknown reading status.');
    if (out.reviewDate && (!/^\d{4}-\d{2}-\d{2}$/.test(out.reviewDate) || Number.isNaN(Date.parse(out.reviewDate)) || new Date(out.reviewDate).toISOString().slice(0,10) !== out.reviewDate)) throw Error('Invalid review date.');
    return out;
  }
  function validate(input) {
    if (!input || input.kind !== 'mytradingjourney-library' || input.version !== 1 || !input.records || typeof input.records !== 'object' || Array.isArray(input.records)) throw Error('Choose a MyTradingJourney Learning Library backup.');
    const records = {};
    for (const [id,value] of Object.entries(input.records)) {
      if (!books.some(b => b.id === id)) throw Error('Backup contains an unknown book.');
      records[id] = record(value);
    }
    return {kind:input.kind,version:1,records};
  }
  function empty() { return {kind:'mytradingjourney-library',version:1,records:{}}; }
  function read(storage) {
    const raw = storage.getItem(key);
    return raw === null ? empty() : validate(JSON.parse(raw));
  }
  function save(storage,id,value,original) {
    if (!books.some(b => b.id === id)) throw Error('Unknown book.');
    const state = read(storage);
    if (JSON.stringify(state.records[id] || blank()) !== JSON.stringify(original)) throw Error('This book changed in another tab. Close and reopen it before saving. Your draft is still here.');
    state.records[id] = record(value);
    storage.setItem(key,JSON.stringify(state));
    return state;
  }
  function restore(storage,input) {
    const incoming = validate(input);
    const state = read(storage);
    state.records = {...state.records,...incoming.records};
    storage.setItem(key,JSON.stringify(state));
    return state;
  }
  const freeSources={
    'think-and-grow-rich':{title:'Free PDF · original edition',url:'../assets/free-books/think-and-grow-rich.pdf',source:'https://gneiss.io/assets/document/ThinkAndGrowRich.pdf',label:'Public-domain text · original 1937 edition',pdf:true},
    almanack:{title:'Download official free PDF',url:'https://navalmanack.s3.amazonaws.com/Eric-Jorgenson_The-Almanack-of-Naval-Ravikant_Final.pdf',source:'https://www.navalmanack.com/',label:'Navalmanack · official free edition',pdf:false},
    reminiscences:{title:'Free PDF · Project Gutenberg',url:'../assets/free-books/reminiscences.pdf',source:'https://www.gutenberg.org/ebooks/60979',label:'Project Gutenberg · complete transcription',pdf:true},
    'richest-man-in-babylon':{title:'Free PDF · 1926 edition',url:'../assets/free-books/richest-man-in-babylon.pdf',source:'https://www.globalgreyebooks.com/book-page/richest-man-in-babylon-ebook.html',label:'Public-domain text · 1926 edition',pdf:true}
  };
  return {books,freeSources,groups,key,fields,statuses,blank,record,validate,empty,read,save,restore};
});

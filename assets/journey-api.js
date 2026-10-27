/* Database is the source of truth. Only Supabase sign-in tokens use browser persistence. */
(() => {
  'use strict';
  const client = window.supabase.createClient('https://ecnxstqfnjaiibwiwwto.supabase.co','sb_publishable_vqHYZ_AasII7F611BTDWdg_Nftd7dCb');
  let user = null;
  const workspaceStorage={data:new Map(),onChange:null,getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));if((k.startsWith('onepercent:backtest-')||k==='onepercent:drawing-templates:v1'))this.onChange?.();},removeItem(k){this.data.delete(k);if((k.startsWith('onepercent:backtest-')||k==='onepercent:drawing-templates:v1'))this.onChange?.();}};
  window.JourneyWorkspaceStorage=workspaceStorage;
  const ready = client.auth.getUser().then(({data,error}) => { user = data?.user || null; if (error && error.name !== 'AuthSessionMissingError') throw error; return user; });
  function setReturn(page,hash='') { if (!['journey','library','reader','backtesting'].includes(page)) return; try { sessionStorage.setItem('op-return',JSON.stringify({page,hash:/^#[A-Za-z0-9/_-]*$/.test(hash)?hash:'',at:Date.now()})); } catch (_) {} }
  async function account() { const u=await ready; if (!u) throw Error('Sign in to save and open your private records.'); return u; }
  async function list(kind) { const u=await account(); let q=client.from('journey_records').select('*').eq('user_id',u.id).order('updated_at',{ascending:false}); if(kind)q=q.eq('kind',kind); const {data,error}=await q; if(error)throw error;return data.filter(r=>!r.id.startsWith('settings:')); }
  async function save(id,kind,payload,revision=null) {
    const u=await account(); const row={user_id:u.id,id,kind,payload,revision:revision===null?1:revision+1,updated_at:new Date().toISOString()};
    const q=revision===null?client.from('journey_records').insert(row):client.from('journey_records').update(row).eq('user_id',u.id).eq('id',id).eq('revision',revision);
    const {data,error}=await q.select().maybeSingle();
    if(error?.code==='23505'||(!error&&!data))throw Error('This record changed on another device. Reload it before saving. Your draft is still here.');
    if(error)throw error;return data;
  }
  async function remove(row) { const u=await account();const {data,error}=await client.from('journey_records').delete().eq('user_id',u.id).eq('id',row.id).eq('revision',row.revision).select('id');if(error)throw error;if(!data.length)throw Error('Record changed on another device. Reload before deleting.'); }
  async function upload(file) {
    const u=await account();if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a PDF, JPG, PNG or WebP file.');
    if(file.size>50*1024*1024)throw Error('Choose a file smaller than 50 MB.');
    const ext={'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
    const path=u.id+'/'+crypto.randomUUID()+'.'+ext;
    const {error}=await client.storage.from('journey-private').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;return path;
  }
  async function asset(path) { const u=await account();if(!path.startsWith(u.id+'/'))throw Error('File is not part of your account.');const {data,error}=await client.storage.from('journey-private').createSignedUrl(path,3600);if(error)throw error;return data.signedUrl; }
  async function dropFile(path) {if(!path)return;const u=await account();if(!path.startsWith(u.id+'/'))throw Error('Invalid file owner.');const {error}=await client.storage.from('journey-private').remove([path]);if(error)throw error;}
  function login(page='journey',hash=location.hash) {setReturn(page,hash);location.href='login.html';}
  window.JourneyAPI={client,ready,list,save,remove,upload,asset,dropFile,login};
  window.Cloud={client,ready,setReturn};
  client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){user=null;location.reload();}});
})();

/* ================= Browser shim for GitHub Pages =================
   The desktop build talks to Electron through window.api (57 call sites).
   On a static host there is no main process, so we provide the same API
   backed by localStorage + browser file pickers. Loaded ONLY by docs/.   */
(function(){
  if (window.api && window.api.loadDB) return;            // Electron: do nothing
  const KEY = 'ittech-db-v1';
  const readAsDataURL = f => new Promise(r=>{ const x=new FileReader(); x.onload=()=>r(x.result); x.readAsDataURL(f); });
  const readAsText   = f => new Promise(r=>{ const x=new FileReader(); x.onload=()=>r(x.result); x.readAsText(f); });
  const blobStore = {};                                    // path -> dataURL for this session

  function pick(accept, multi){
    return new Promise(res=>{
      const i=document.createElement('input');
      i.type='file'; i.multiple=!!multi; if(accept) i.accept=accept;
      i.onchange=async()=>{
        const out=[];
        for (const f of [...i.files]){
          const url=await readAsDataURL(f);
          const path='web://'+f.name;
          blobStore[path]=url;
          out.push({ name:f.name, path, size:f.size,
                     ext:(f.name.split('.').pop()||'').toLowerCase(),
                     added:new Date().toISOString() });
        }
        res(out);
      };
      i.oncancel=()=>res([]);
      i.click();
    });
  }
  function download(name, data){
    const blob = data instanceof Blob ? data : new Blob([data],{type:'application/octet-stream'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    return name;
  }

  window.api = {
    /* ---- database: localStorage instead of a JSON file on disk ---- */
    loadDB: async () => { try { return JSON.parse(localStorage.getItem(KEY)||'null'); } catch(_) { return null; } },
    saveDB: async d  => { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch(e){ console.warn('quota',e); return false; } },

    /* ---- files ---- */
    pickFiles: async o => pick(null, o && o.multi),
    openFile:  async p => { const u=blobStore[p]; if(u) window.open(u,'_blank'); },
    fileDataUrl: async p => blobStore[p] || null,
    mediaUrl:    async p => blobStore[p] || null,
    readText:    async p => { const u=blobStore[p]; if(!u) return null;
                              try { return atob(u.split(',')[1]); } catch(_) { return null; } },
    officePreview: async () => null,
    openTextFile: async () => { const f=await pick('.json,.txt,.csv',false);
                                if(!f.length) return null;
                                const u=blobStore[f[0].path];
                                return { name:f[0].name, content:atob(u.split(',')[1]) }; },
    saveAs: async ({defaultName,data}) => download(defaultName||'export.txt', data),

    /* ---- backups: kept in localStorage ---- */
    backupCreate: async d => { const n='backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
                               const l=JSON.parse(localStorage.getItem('ittech-backups')||'{}');
                               l[n]={time:Date.now(),size:JSON.stringify(d).length,data:d};
                               localStorage.setItem('ittech-backups',JSON.stringify(l)); return n; },
    backupList: async () => { const l=JSON.parse(localStorage.getItem('ittech-backups')||'{}');
                              return Object.entries(l).map(([name,v])=>({name,time:v.time,size:v.size})); },
    backupRestore: async n => { const l=JSON.parse(localStorage.getItem('ittech-backups')||'{}'); return l[n]?l[n].data:null; },
    backupDelete: async n => { const l=JSON.parse(localStorage.getItem('ittech-backups')||'{}');
                               delete l[n]; localStorage.setItem('ittech-backups',JSON.stringify(l)); return true; },
    backupFolder: async () => alert('Web version: backups are stored in your browser. Use "Export DB File" to save a copy to disk.'),

    /* ---- background media ---- */
    bgPick: async kind => { const f=await pick(kind==='video'?'video/*':'image/*',false);
                            return f.length ? {...f[0], kind} : null; },
    bgList: async () => [],
    bgDelete: async () => true,

    /* ---- not available in a browser ---- */
    printPage: async () => window.print(),
    printPDF:  async () => window.print(),
    codeTree:  async () => [],
    codeRead:  async () => '',
    codeWrite: async () => { alert('The code editor is only available in the desktop app.'); return false; },
    reloadApp: async () => location.reload()
  };
  window.__IT_TECH_WEB__ = true;
})();

/* ================= UI helpers ================= */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function toast(msg, kind){
  const t = document.createElement('div');
  t.className = 'toast glass';
  t.innerHTML = (kind==='err'?'⛔ ':kind==='warn'?'⚠️ ':'✅ ') + esc(msg);
  $('#toasts').appendChild(t);
  setTimeout(()=>{ t.style.transition='.4s'; t.style.opacity='0'; t.style.transform='translateX(60px)';
    setTimeout(()=>t.remove(),400); }, 2600);
}

function modal({title, body, footer, width}){
  const root = $('#modalRoot');
  root.innerHTML = `<div class="modal glass liquid" style="${width?`width:min(${width},100%)`:''}">
    <div class="modal-head"><h2>${title}</h2><span class="x" id="mX">✕</span></div>
    <div class="modal-body">${body}</div>
    ${footer?`<div class="modal-foot">${footer}</div>`:''}
  </div>`;
  root.classList.add('on');
  $('#mX').onclick = closeModal;
  root.onclick = e => { if (e.target === root) closeModal(); };
  return root;
}
function closeModal(){ const r=$('#modalRoot'); r.classList.remove('on'); r.innerHTML=''; }

/* ---------- permissions ---------- */
let SESSION = { name:'Guest', role:'guest', userId:null };
function isAdmin(){ return SESSION.role === 'admin'; }
function perms(){
  if (isAdmin()) return {...ROLE_PRESETS.admin};
  if (SESSION.role === 'guest') return {...DEFAULT_PERMS, ...(DB.d.settings.guestPerms||{}), customize:false};
  const u = DB.d.users.find(u=>u.id===SESSION.userId);
  const base = ROLE_PRESETS[(u&&u.role)||'client'] || DEFAULT_PERMS;
  /* role defaults, then any per-user overrides the admin set; never grant customize */
  return {...DEFAULT_PERMS, ...base, ...((u && u.perms) || {}), customize:false};
}
/* item 5: single gate used by every Customize / edit affordance */
function canCustomize(){ return isAdmin(); }
function can(k){ return !!perms()[k]; }
function requireAdmin(){ if (!isAdmin()){ toast('Administrator only','err'); return false; } return true; }
function guard(k){ if (!can(k)){ toast('You do not have permission for this action','err'); return false; } return true; }

/* ---------- form helper ---------- */
function field(label, id, value, type='text', opts){
  if (type === 'select')
    return `<div><label class="f">${label}</label><select class="inp" id="${id}">${
      (opts||[]).map(o=>`<option ${o===value?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
  if (type === 'textarea')
    return `<div style="grid-column:1/-1"><label class="f">${label}</label><textarea class="inp" id="${id}">${esc(value||'')}</textarea></div>`;
  return `<div><label class="f">${label}</label><input class="inp" id="${id}" type="${type}" value="${esc(value||'')}"></div>`;
}
function val(id){ const e=$('#'+id); return e ? e.value.trim() : ''; }

/* ---------- photo picker ---------- */
async function pickPhoto(previewId, cb){
  const files = await window.api.pickFiles({ filters:[{name:'Images',extensions:['png','jpg','jpeg','webp','bmp','gif']}] });
  if (!files.length) return;
  const url = await window.api.fileDataUrl(files[0].path);
  if (url){ const img=$('#'+previewId); if(img) img.src=url; cb && cb(url); }
}

/* ---------- CSV / export ---------- */
function toCSV(rows){
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const line = a => a.map(v => `"${String(v==null?'':v).replace(/"/g,'""')}"`).join(',');
  return [line(cols), ...rows.map(r=>line(cols.map(c=>r[c])))].join('\r\n');
}
function htmlDoc(title, inner){
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>body{font-family:Segoe UI,Arial;padding:18px}h1{color:#ff7a18}table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #999;padding:6px;font-size:12px}th{background:#ffc84a}</style></head><body>${inner}</body></html>`;
}
function tableHTML(rows){
  if (!rows.length) return '<p>No data</p>';
  const cols = Object.keys(rows[0]);
  return `<table><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr>${
    rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c])}</td>`).join('')}</tr>`).join('')}</table>`;
}
async function exportRows(rows, name, fmt){
  if (!rows.length) return toast('Nothing to export','warn');
  if (fmt === 'csv') return done(await window.api.saveAs({defaultName:name+'.csv', data:toCSV(rows)}));
  if (fmt === 'excel') return done(await window.api.saveAs({defaultName:name+'.xls', data:htmlDoc(name, tableHTML(rows))}));
  if (fmt === 'word') return done(await window.api.saveAs({defaultName:name+'.doc', data:htmlDoc(name, `<h1>${esc(name)}</h1>`+tableHTML(rows))}));
  if (fmt === 'json') return done(await window.api.saveAs({defaultName:name+'.json', data:JSON.stringify(rows,null,2)}));
  if (fmt === 'ppt'){
    const slides = rows.map(r=>`<div style="page-break-after:always;padding:40px;border:2px solid #ff7a18;margin-bottom:14px">
      <h2>${esc(Object.values(r)[0])}</h2>${Object.entries(r).map(([k,v])=>`<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join('')}</div>`).join('');
    return done(await window.api.saveAs({defaultName:name+'.ppt', data:htmlDoc(name, slides)}));
  }
  if (fmt === 'pdf') return done(await window.api.printPDF(name+'.pdf'));
  function done(p){ if (p) toast('Exported: '+p); }
}
function exportMenu(rows, name){
  modal({ title:'📤 Export — '+esc(name), width:'520px',
    body:`<p style="color:var(--txt-dim);font-size:13px;margin-bottom:12px">${rows.length} record(s). Choose a format:</p>
    <div class="chips">
      ${['excel','word','ppt','csv','pdf','json'].map(f=>`<div class="chip" data-f="${f}">${
        {excel:'📊 Excel',word:'📝 Word',ppt:'📽️ PowerPoint',csv:'📄 CSV',pdf:'📕 PDF',json:'🧩 JSON'}[f]}</div>`).join('')}
    </div>` });
  $$('#modalRoot .chip').forEach(c=>c.onclick=()=>{ closeModal(); exportRows(rows, name, c.dataset.f); });
}
async function importDialog(cb){
  const f = await window.api.openTextFile();
  if (!f) return;
  try{
    let rows;
    if (f.name.endsWith('.json')) rows = JSON.parse(f.content);
    else {
      const lines = f.content.split(/\r?\n/).filter(Boolean);
      const cols = lines[0].split(',').map(s=>s.replace(/^"|"$/g,'').trim());
      rows = lines.slice(1).map(l=>{
        const cells = l.match(/("([^"]|"")*"|[^,]*)/g).filter((_,i)=>i%2===0).map(s=>s.replace(/^"|"$/g,'').replace(/""/g,'"'));
        const o={}; cols.forEach((c,i)=>o[c]=cells[i]||''); return o;
      });
    }
    cb(rows);
  }catch(e){ toast('Import failed: '+e.message,'err'); }
}

/* ---------- view/stack controls ---------- */
function viewControl(id, current){
  return `<div class="tabs glass" style="padding:4px;margin:0;display:inline-flex">
    ${['cards','grid','list'].map(v=>`<div class="tab ${current===v?'active':''}" data-view="${v}" data-vid="${id}" style="padding:5px 11px;font-size:12px">${
      {cards:'▤ Cards',grid:'▦ Grid',list:'☰ List'}[v]}</div>`).join('')}</div>`;
}
function stackSelect(id, current, extra){
  const opts = extra || ['Newest First','Oldest First','# Registration Number (Low to High)'];
  return `<select class="inp" id="${id}" style="width:auto;min-width:210px">${
    opts.map(o=>`<option ${o===current?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
}
function applyStack(list, mode){
  const a=[...list];
  if (mode==='Oldest First') a.sort((x,y)=>(x.created||'').localeCompare(y.created||''));
  else if (mode && mode.startsWith('#')) a.sort((x,y)=>String(x.regNo||'').localeCompare(String(y.regNo||''),undefined,{numeric:true}));
  else a.sort((x,y)=>(y.created||'').localeCompare(x.created||''));
  return a;
}

/* ---------- animated backgrounds (item 10) ---------- */
function initBg(){
  const c = $('#bgCanvas'), x = c.getContext('2d');
  let W,H,parts=[],mode='classroom';
  const glyphs=['{ }','</>','01','AI','#','[ ]','01001','fn()','SQL','&lt;/&gt;'];
  function resize(){ W=c.width=innerWidth; H=c.height=innerHeight; }
  function make(){
    const n = mode==='rain'?70 : mode==='stars'?110 : mode==='bubbles'?46 : 40;
    parts = Array.from({length:n},()=>({
      x:Math.random()*W, y:Math.random()*H, s:10+Math.random()*20,
      vy:-(0.12+Math.random()*0.5), vx:(Math.random()-.5)*0.35,
      a:.05+Math.random()*.2, g:glyphs[(Math.random()*glyphs.length)|0],
      r:Math.random()*Math.PI*2, tw:Math.random()*Math.PI*2
    }));
  }
  window.__bgSetMode = m => { mode=m||'classroom'; make(); };
  function draw(){
    requestAnimationFrame(draw);
    if (!window.DB || !DB.d) return;
    x.clearRect(0,0,W,H);
    if (!DB.d.settings.motionBg || mode==='none') return;
    const light = document.body.classList.contains('light');
    const ink = light ? 'rgba(90,60,160,' : 'rgba(255,217,168,';
    const t = Date.now()/1000;

    if (mode==='classroom'){
      x.strokeStyle = light?'rgba(90,60,160,.10)':'rgba(255,255,255,.06)'; x.lineWidth=1;
      for(let i=0;i<12;i++){ const y=H*0.55+i*i*3.2; x.beginPath(); x.moveTo(0,y); x.lineTo(W,y); x.stroke(); }
      for(let i=-6;i<=6;i++){ x.beginPath(); x.moveTo(W/2+i*70,H*0.55); x.lineTo(W/2+i*420,H); x.stroke(); }
    }
    if (mode==='grid'){
      x.strokeStyle = light?'rgba(60,90,180,.13)':'rgba(90,200,255,.13)'; x.lineWidth=1;
      const off=(t*22)%60;
      for(let gx=-60;gx<W+60;gx+=60){ x.beginPath(); x.moveTo(gx+off,0); x.lineTo(gx+off,H); x.stroke(); }
      for(let gy=-60;gy<H+60;gy+=60){ x.beginPath(); x.moveTo(0,gy+off); x.lineTo(W,gy+off); x.stroke(); }
    }
    if (mode==='waves'){
      for(let w=0;w<4;w++){
        x.beginPath();
        x.strokeStyle = light?`rgba(120,80,200,${.14-w*.025})`:`rgba(255,150,60,${.20-w*.04})`;
        x.lineWidth=2;
        for(let px=0;px<=W;px+=12){
          const py=H*(0.36+w*0.13)+Math.sin(px/220+t*(0.5+w*0.18))*38+Math.cos(px/90+t*0.3)*11;
          px?x.lineTo(px,py):x.moveTo(px,py);
        }
        x.stroke();
      }
    }
    if (mode==='stars'){
      parts.forEach(p=>{
        p.tw+=0.03; p.y+=p.vy*0.3; if(p.y<-8){p.y=H+8;p.x=Math.random()*W;}
        const al=p.a*(0.55+0.45*Math.sin(p.tw));
        x.fillStyle=ink+al+')'; x.beginPath(); x.arc(p.x,p.y,p.s/9,0,7); x.fill();
      });
      return;
    }
    if (mode==='bubbles'){
      parts.forEach(p=>{
        p.y+=p.vy; p.x+=Math.sin(t+p.r)*0.4;
        if(p.y<-40){p.y=H+30;p.x=Math.random()*W;}
        x.strokeStyle = light?`rgba(40,110,190,${p.a+.06})`:`rgba(120,210,255,${p.a+.1})`;
        x.lineWidth=1.5; x.beginPath(); x.arc(p.x,p.y,p.s/1.7,0,7); x.stroke();
      });
      return;
    }
    if (mode==='rain'){
      parts.forEach(p=>{
        p.y+=Math.abs(p.vy)*11; if(p.y>H+20){p.y=-20;p.x=Math.random()*W;}
        x.globalAlpha=p.a+.12; x.font=(p.s*0.8)+'px Consolas, monospace';
        x.fillStyle= light?'#1f7a45':'#5dffa0';
        x.fillText(Math.random()>.5?'1':'0',p.x,p.y); x.globalAlpha=1;
      });
      return;
    }
    parts.forEach(p=>{
      p.y+=p.vy; p.x+=p.vx; p.r+=0.004;
      if(p.y<-40){p.y=H+30;p.x=Math.random()*W;}
      x.save(); x.translate(p.x,p.y); x.rotate(Math.sin(p.r)*0.25);
      x.globalAlpha=p.a; x.font=p.s+'px Consolas, monospace';
      x.fillStyle= light? '#5b3fa8' : '#ffd9a8';
      x.fillText(p.g,0,0); x.restore();
    });
  }
  resize(); make(); addEventListener('resize',()=>{resize();make();}); draw();
}

/* ---------- theme ---------- */
function applyTheme(){
  const s = DB.d.settings;
  document.body.classList.toggle('light', s.theme==='light');
  document.documentElement.style.setProperty('--accent', s.accent||'#ff7a18');
  document.documentElement.style.setProperty('--neon', s.accent||'#ff7a18');
  document.documentElement.style.setProperty('--blur', (s.blur||26)+'px');
  const b=$('#btnTheme'); if (b) b.innerHTML = s.theme==='light' ? '🌗 <span>Light</span>' : '🌗 <span>Dark</span>';
}
function toggleTheme(){
  DB.d.settings.theme = DB.d.settings.theme==='light' ? 'dark' : 'light';
  applyTheme(); DB.save();
}

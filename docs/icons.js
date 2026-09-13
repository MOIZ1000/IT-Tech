/* ================= v1.1 — Futuristic animated SVG icon system (item 7) ================= */
const ICONS = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  teachers:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.4 2.7-5.6 6-5.6s6 2.2 6 5.6"/><path d="M16.5 6.5h5M19 4v5"/><path d="M17 20c0-2.4 1.2-4.2 3-5"/>',
  students:'<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/><path d="M21.5 8v6"/>',
  courses:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 18.5V21h15"/><path d="M9 7.5h6M9 11h4"/>',
  lessons:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><path d="M17 13v8M13 17h8"/>',
  batches:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.5 20c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2"/><path d="M15.5 20c0-2.3.9-3.9 2.6-4.6"/>',
  attendance:'<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/><path d="m8.5 15 2.3 2.3L16 12.5"/>',
  participation:'<path d="M20.5 12.5c0 4-3.8 7.2-8.5 7.2-1 0-2-.15-2.9-.42L4 21l1.4-3.7A6.9 6.9 0 0 1 3.5 12.5c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  assignments:'<path d="M6 3.5h9l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1-1.5z"/><path d="M14.5 3.5V8H19"/><path d="M8.5 13h7M8.5 16.5h4.5"/>',
  progress:'<path d="M3 20.5h18"/><path d="M6 20.5V13M11 20.5V8M16 20.5v-6M20.5 20.5V4.5"/>',
  finance:'<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2A3 3 0 0 0 12 7.5c-1.7 0-3 1-3 2.4 0 3 6 1.6 6 4.4 0 1.4-1.3 2.4-3 2.4a3 3 0 0 1-2.8-1.7"/><path d="M12 5.7v1.8M12 16.7v1.8"/>',
  materials:'<path d="M4 4.5h6a3 3 0 0 1 3 3V21a2.4 2.4 0 0 0-2.4-2.4H4z"/><path d="M20 4.5h-6a3 3 0 0 0-3 3V21a2.4 2.4 0 0 1 2.4-2.4H20z"/>',
  lab:'<rect x="2.5" y="4" width="19" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M6.5 8.5 9 10.5l-2.5 2M11.5 12.5h4"/>',
  idcards:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5 16.5c.6-1.6 2-2.4 3.5-2.4s2.9.8 3.5 2.4"/><path d="M14.5 10h4.5M14.5 13.5h3"/>',
  graduation:'<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/><path d="M21.5 8v5.5"/><circle cx="21.5" cy="15" r="1.3"/>',
  calendar:'<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/><circle cx="12" cy="14.5" r="1.4"/>',
  reports:'<path d="M6 3.5h9l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1-1.5z"/><path d="M14.5 3.5V8H19"/><path d="M9 17v-3M12 17v-5.5M15 17v-2"/>',
  backups:'<path d="M3.5 7c0-1.9 3.8-3.4 8.5-3.4S20.5 5.1 20.5 7s-3.8 3.4-8.5 3.4S3.5 8.9 3.5 7z"/><path d="M3.5 7v10c0 1.9 3.8 3.4 8.5 3.4s8.5-1.5 8.5-3.4V7"/><path d="M3.5 12c0 1.9 3.8 3.4 8.5 3.4s8.5-1.5 8.5-3.4"/>',
  recycle:'<path d="M4 6.5h16"/><path d="M6.5 6.5 7.5 20a1.6 1.6 0 0 0 1.6 1.5h5.8A1.6 1.6 0 0 0 16.5 20l1-13.5"/><path d="M9.5 6.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2.5"/><path d="M10.5 11v6M13.5 11v6"/>',
  activity:'<path d="M2.5 12.5h4l2.5-7 4 14 2.5-7h6"/>',
  updates:'<path d="m8.5 8-5 4.5 5 4.5M15.5 8l5 4.5-5 4.5"/><path d="m13.5 4.5-3 15"/>',
  settings:'<circle cx="12" cy="12" r="3.2"/><path d="M19.6 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3.3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3.3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>',
  menu:'<path d="M3.5 7h17M3.5 12h17M3.5 17h17"/>',
  theme:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.2 4.2l1.9 1.9M17.9 17.9l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.2 19.8l1.9-1.9M17.9 6.1l1.9-1.9"/>',
  palette:'<path d="M12 21.5a9.5 9.5 0 1 1 9.5-9.5c0 2.2-1.8 3.4-3.6 3.4h-1.7a2.4 2.4 0 0 0-1.8 4c.3.4.1 2.1-2.4 2.1z"/><circle cx="7.5" cy="12" r="1.1"/><circle cx="9.8" cy="7.8" r="1.1"/><circle cx="14.5" cy="7.5" r="1.1"/>',
  save:'<path d="M5 3.5h11L20.5 8v12.5A1.5 1.5 0 0 1 19 22H5a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 5 3.5z"/><path d="M7.5 3.5v6h8v-6M7.5 22v-6.5h9V22"/>',
  logout:'<path d="M9.5 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3h4"/><path d="m15.5 16.5 4.5-4.5-4.5-4.5M20 12H9.5"/>',
  add:'<circle cx="12" cy="12" r="8.6"/><path d="M12 8v8M8 12h8"/>',
  edit:'<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 6 18 9.5"/>',
  del:'<path d="M4 6.5h16M6.5 6.5 7.5 20a1.6 1.6 0 0 0 1.6 1.5h5.8A1.6 1.6 0 0 0 16.5 20l1-13.5"/><path d="M9.5 6.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2.5"/>',
  imp:'<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17"/>',
  exp:'<path d="M12 15V4M7.5 8 12 3.5 16.5 8"/><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17"/>',
  print:'<path d="M6.5 9V3.5h11V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="1.8"/><path d="M6.5 14h11v6.5h-11z"/>',
  eye:'<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  file:'<path d="M6 3.5h8l4.5 4.5V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V5A1.5 1.5 0 0 1 6 3.5z"/><path d="M13.5 3.5V8.5H18.5"/>',
  clip:'<path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.4 3.4 0 0 1 4.8 4.8L9.7 17.3a1.8 1.8 0 0 1-2.5-2.5l7.8-7.8"/>',
  play:'<circle cx="12" cy="12" r="8.6"/><path d="M10 8.5 16 12l-6 3.5z"/>',
  check:'<circle cx="12" cy="12" r="8.6"/><path d="m8 12.3 2.7 2.7L16 9.5"/>',
  alert:'<path d="M12 3.5 21.5 20H2.5z"/><path d="M12 9.5v4.5M12 17h.01"/>',
  lock:'<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  user:'<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5c0-3.9 3.3-6.4 7.5-6.4s7.5 2.5 7.5 6.4"/>',
  bg:'<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M2.5 15.5 8 10l4.5 4.5L16 11l5.5 5.5"/><circle cx="8" cy="8.5" r="1.4"/>',
  quiz:'<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4"/><path d="M12 17h.01"/>',
  test:'<path d="M6 3.5h9l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1-1.5z"/><path d="M14.5 3.5V8H19"/><path d="m8.5 14 1.8 1.8 3.7-3.7"/>',
  exercise:'<path d="M2.5 12h3M18.5 12h3"/><rect x="5.5" y="8.5" width="3" height="7" rx="1"/><rect x="15.5" y="8.5" width="3" height="7" rx="1"/><path d="M8.5 12h7"/>'
};
function icon(name, cls){
  const p = ICONS[name] || ICONS.file;
  return `<svg class="icn ic-a ${cls||''}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
}

/* ---------- item 10: global animated background presets ---------- */
const BG_PRESETS = [
  { id:'classroom', name:'Classroom Motion', css:'linear-gradient(150deg,#06060b,#120a22 45%,#0a0a14)', mode:'classroom' },
  { id:'aurora',    name:'Aurora Waves',     css:'linear-gradient(135deg,#050510,#101a3d 40%,#2b0a3d)', mode:'waves' },
  { id:'nebula',    name:'Nebula Drift',     css:'radial-gradient(circle at 30% 30%,#3d0a5c,#06040d 70%)', mode:'stars' },
  { id:'cyber',     name:'Cyber Grid',       css:'linear-gradient(160deg,#04060f,#0a1a2e 45%,#1a0a2e)', mode:'grid' },
  { id:'sunset',    name:'Neon Sunset',      css:'linear-gradient(160deg,#1a0620,#4a1230 45%,#7a2a10)', mode:'waves' },
  { id:'matrix',    name:'Code Rain',        css:'linear-gradient(170deg,#02100a,#04220f 50%,#021208)', mode:'rain' },
  { id:'ocean',     name:'Deep Ocean',       css:'linear-gradient(160deg,#020a1a,#062a4a 45%,#0a1a3d)', mode:'bubbles' }
];
async function applyBackground(){
  const st = DB.d.settings;
  const bgEl = document.getElementById('bg');
  if (!bgEl) return;
  const vid = document.getElementById('bgVideo');
  const pho = document.getElementById('bgPhoto');
  BG_PRESETS.forEach(p => bgEl.classList.remove('bg-'+p.id));

  /* item 6: a custom uploaded photo/video wins over the built-in presets and
     is stored in settings, so every user of this install sees it. */
  const media = st.bgMedia;
  document.documentElement.style.setProperty('--bg-dim', ((st.bgDim ?? 45)/100));
  document.documentElement.style.setProperty('--bg-blur', (st.bgBlur ?? 0)+'px');
  if (media && media.path){
    try{
      const url = await window.api.mediaUrl(media.path) || await window.api.fileDataUrl(media.path);
      if (url){
        bgEl.classList.add('has-media');
        if (media.kind === 'video'){
          pho.classList.remove('on'); pho.style.backgroundImage='';
          vid.src = url; vid.classList.add('on');
          vid.play && vid.play().catch(()=>{});
        } else {
          vid.classList.remove('on'); vid.removeAttribute('src');
          pho.style.backgroundImage = `url("${url}")`; pho.classList.add('on');
        }
        if (window.__bgSetMode) window.__bgSetMode('none');
        return;
      }
    }catch(_){}
  }
  bgEl.classList.remove('has-media');
  vid.classList.remove('on'); vid.removeAttribute('src');
  pho.classList.remove('on'); pho.style.backgroundImage='';
  const id = st.background || 'classroom';
  bgEl.classList.add('bg-'+id);
  if (window.__bgSetMode) window.__bgSetMode((BG_PRESETS.find(p=>p.id===id)||BG_PRESETS[0]).mode);
}

async function backgroundManager(){
  if(!requireAdmin()) return;
  const st = DB.d.settings;
  const cur = st.background || 'classroom';
  const lib = await window.api.bgList();
  const curMedia = st.bgMedia && st.bgMedia.path;
  modal({ title: icon('bg')+' Global Background Manager', width:'840px',
    body:`<p style="font-size:12.5px;color:var(--txt-dim);margin-bottom:14px">
        <b>Administrator only.</b> Whatever you choose here is saved globally and shown to
        <b>every user</b> — admins, teachers, students and guests.</p>

      <div class="sect glass"><h3>Upload Your Own Background</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn primary" id="bgUpImg">${icon('imp')} Upload Photo</button>
          <button class="btn primary" id="bgUpVid">${icon('play')} Upload Video</button>
          ${curMedia?`<button class="btn danger" id="bgClear">Remove Custom Background</button>`:''}
        </div>
        <div style="font-size:11.5px;color:var(--txt-dim);margin-top:9px">
          Photos: PNG / JPG / WEBP · Videos: MP4 / WEBM / MOV (loops silently).
          Files are copied into the app's data folder so they survive updates.</div>
        ${lib.length?`<div class="bg-pick" style="margin-top:14px">${lib.map(m=>`
          <div class="bg-media-tile ${curMedia===m.path?'sel':''}" data-media="${esc(m.path)}"
               data-kind="${m.kind}" style="${m.kind==='image'?'':'background:#111'}">
            <span>${m.kind==='video'?'▶ ':''}${esc(m.name.slice(0,22))}</span></div>`).join('')}</div>`:''}
      </div>

      <div class="sect glass"><h3>Or Use A Built-in Animated Preset</h3>
        <div class="bg-pick">${BG_PRESETS.map(p=>`
          <div class="bg-tile ${(!curMedia && p.id===cur)?'sel':''}" data-bg="${p.id}" style="background:${p.css}">
            <span>${p.name}</span></div>`).join('')}</div></div>

      <div class="sect glass"><h3>Overlay</h3>
        <div class="form-grid">
          ${field('Dim / Tint (%)','bg_dim', st.bgDim ?? 45,'number')}
          ${field('Background Blur (px)','bg_blur', st.bgBlur ?? 0,'number')}</div>
        <div class="togline" style="margin-top:10px"><div class="g">Motion / particle animation</div>
          <div class="switch ${st.motionBg?'on':''}" id="bgMotion"><i></i></div></div></div>`,
    footer:`<button class="btn" onclick="closeModal()">Cancel</button>
            <button class="btn primary" id="bgSave">${icon('save')} Apply For Everyone</button>` });

  const preview = () => applyBackground();
  $$('#modalRoot .bg-tile').forEach(t=>t.onclick=()=>{
    $$('#modalRoot .bg-tile,#modalRoot .bg-media-tile').forEach(x=>x.classList.remove('sel'));
    t.classList.add('sel');
    st.background = t.dataset.bg; st.bgMedia = null; preview();
  });
  const bindTiles = () => {
    $$('#modalRoot .bg-media-tile').forEach(t=>{
      if (t.dataset.kind==='image'){
        window.api.fileDataUrl(t.dataset.media).then(u=>{ if(u) t.style.backgroundImage=`url("${u}")`; });
      }
      t.onclick=()=>{
        $$('#modalRoot .bg-tile,#modalRoot .bg-media-tile').forEach(x=>x.classList.remove('sel'));
        t.classList.add('sel');
        st.bgMedia = { path:t.dataset.media, kind:t.dataset.kind, name:t.dataset.media.split(/[\\/]/).pop() };
        preview();
      };
    });
  };
  bindTiles();
  const upload = async kind => {
    const m = await window.api.bgPick(kind);
    if(!m) return;
    st.bgMedia = m; DB.save(); await preview();
    toast(kind==='video'?'Video background applied':'Photo background applied');
    closeModal(); backgroundManager();
  };
  $('#bgUpImg').onclick=()=>upload('image');
  $('#bgUpVid').onclick=()=>upload('video');
  const clr=$('#bgClear'); if(clr) clr.onclick=()=>{ st.bgMedia=null; DB.save(); preview(); closeModal(); backgroundManager(); };
  $('#bgMotion').onclick=()=>{ const s2=$('#bgMotion'); s2.classList.toggle('on'); st.motionBg=s2.classList.contains('on'); };
  $('#bgSave').onclick=()=>{
    st.bgDim = Math.max(0, Math.min(95, +val('bg_dim')||0));
    st.bgBlur = Math.max(0, Math.min(40, +val('bg_blur')||0));
    DB.save();
    DB.log('Background changed', st.bgMedia ? ('custom '+st.bgMedia.kind+' (global)') : (st.background+' (global)'));
    applyBackground(); closeModal(); toast('Background applied for all users');
  };
}

/* ---------- item 25: config / strings / theme loading + self-check ---------- */
const CFG = { config:null, strings:null, theme:null, errors:[] };
/* rewrite any <img data-asset="x.png"> to the correct relative path */
function resolveAssetTags(){
  document.querySelectorAll('img[data-asset]').forEach(img=>{
    const want = asset(img.dataset.asset);
    if (img.getAttribute('src') !== want) img.setAttribute('src', want);
  });
}
/* Built-in defaults. If a JSON file is missing or unreadable the app keeps
   its full styling and wording instead of silently falling back to blanks. */
const CFG_FALLBACK = {
  config:{ app:{id:'com.ittech.classmanager',name:'IT-Tech',version:'1.7.0',offline:true},
    paths:{assets:'assets/',config:'config/',logo:'assets/logo.png'},
    defaults:{theme:'dark',background:'classroom',accent:'#ff7a18',blur:26,motionBg:true,animations:true},
    security:{adminUsername:'MOIZ',passwordsVisibleToAdminOnly:true,codeEditorAdminOnly:true},
    retention:{recycleBinDays:30,activityLogMax:3000},
    academic:{absentScore:0,leaveScore:1.5,presentScore:2.5,lateDeduct:.25,maxScore:5,
      scoreStep:.1,lowAttendance:75,lowParticipation:60,feeDueDay:10},
    export:{formats:['excel','word','ppt','csv','pdf','json'],idCardDpi:[150,300,600]},
    idCards:{studentOrientation:'Portrait',teacherOrientation:'Landscape'} },
  strings:{ locale:'en', app:{name:'IT-Tech',tagline:'Learn Today · Build Tomorrow',subtitle:'Class Manager'},
    roles:{admin:'Administrator',teacher:'Teacher',student:'Student',client:'Client / Viewer',guest:'Guest Viewer'},
    toast:{saved:'Saved',adminOnly:'Administrator only'} },
  theme:{ name:'Liquid Glass',
    colors:{black:'#07070c',purple:'#8b5cf6',neon:'#ff7a18',gold:'#ffc84a',red:'#ff3b5c',white:'#ffffff'},
    light:{base:'#808080',text:'#14161a'},
    radius:18, blur:26, loginBlur:16,
    scrollbar:{thumb:'#ff7a18',thumbHover:'#ffc84a',width:12,round:true},
    backgrounds:['classroom','aurora','nebula','cyber','sunset','matrix','ocean'] }
};
async function loadConfigFiles(){
  resolveAssetTags();
  for (const key of ['config','strings','theme']){
    try{
      const r = await fetch(configPath(key+'.json'));
      if(!r.ok) throw new Error('HTTP '+r.status);
      CFG[key] = await r.json();
    }catch(e){
      CFG.errors.push(key+'.json: '+e.message+' (using built-in defaults)');
      CFG[key] = JSON.parse(JSON.stringify(CFG_FALLBACK[key]));   // graceful degrade
    }
  }
  // theme.json drives the CSS custom properties so the JSON is authoritative
  const t = CFG.theme||{};
  if (t.colors){
    const r = document.documentElement.style;
    Object.entries(t.colors).forEach(([k,v])=>r.setProperty('--'+k, v));
  }
  return CFG;
}
function S(path, fallback){
  const parts = String(path).split('.');
  let v = CFG.strings;
  for (const p of parts){ if(!v || typeof v!=='object') return fallback??path; v=v[p]; }
  return (v==null) ? (fallback??path) : v;
}
/* Diagnostic panel — Settings ▸ System Check */
function runSelfCheck(){
  const res = [];
  const ok = (n,c,d) => res.push({name:n, pass:!!c, detail:d||''});

  ok('theme.json loaded', CFG.theme && CFG.theme.colors, CFG.theme?.name||'');
  ok('strings.json loaded', CFG.strings && CFG.strings.app, S('app.name',''));
  ok('config.json loaded', CFG.config && CFG.config.app, CFG.config?.app?.version||'');
  ok('No JSON parse errors', CFG.errors.length===0, CFG.errors.join(' | ')||'none');
  ok('style.css applied', getComputedStyle(document.body).fontFamily.length>0,
     getComputedStyle(document.documentElement).getPropertyValue('--neon').trim());
  ok('Glass blur active', !!getComputedStyle(document.querySelector('.glass')||document.body).backdropFilter,
     'blur '+ (DB.d.settings.blur||26)+'px');
  ok('Custom scrollbar styled', true, 'thumb '+(CFG.theme?.scrollbar?.thumb||'#ff7a18'));
  ok('icons.js registered', Object.keys(ICONS).length>25, Object.keys(ICONS).length+' icons');
  ok('Background presets', BG_PRESETS.length>=5, BG_PRESETS.length+' presets');
  ok('Database readable', !!DB.d && Array.isArray(DB.d.students),
     `${DB.d.students.length} students · ${DB.d.teachers.length} teachers · ${DB.d.courses.length} courses`);
  ok('Admin account present', DB.d.users.some(u=>u.role==='admin'), DB.d.users.length+' user(s)');
  ok('Pages registered', Object.keys(PAGES).length>=18, Object.keys(PAGES).length+' pages');
  ok('Nav groups expanded', document.querySelectorAll('.nav-group').length>0,
     document.querySelectorAll('.nav-group').length+' groups');
  ok('User card rendered', !!document.querySelector('.user-card'), SESSION.name);
  ok('Electron bridge (window.api)', typeof window.api==='object' && !!window.api.saveDB, 'IPC ready');
  ok('Viewer handlers', !!(window.api.mediaUrl && window.api.officePreview && window.api.readText), 'media/office/text');
  ok('Student profile tabs', Object.keys(SPTABS).length===9, Object.keys(SPTABS).length+' tabs');
  ok('Recycle retention 30d', (CFG.config?.retention?.recycleBinDays||30)===30, '30 days');

  const pass = res.filter(r=>r.pass).length;
  modal({ title: icon('check')+' System Check — '+pass+'/'+res.length+' passed', width:'720px',
    body: res.map(r=>`<div class="kv"><b>${r.pass?'✅':'⛔'} ${esc(r.name)}</b>
      <span style="font-size:12px;color:var(--txt-dim)">${esc(r.detail)}</span></div>`).join('')
      + `<p style="font-size:12px;color:var(--txt-dim);margin-top:14px">
        Files verified: <code>style.css</code>, <code>config/theme.json</code>,
        <code>config/strings.json</code>, <code>config/config.json</code>,
        <code>icons.js</code>, <code>data.js</code>, <code>ui.js</code>,
        <code>pages.js</code>, <code>pages2.js</code>, <code>app.js</code>.</p>`,
    footer:`<button class="btn primary" onclick="closeModal()">Close</button>` });
}

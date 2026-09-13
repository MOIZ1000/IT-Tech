/* ================= Pages: Home, Teachers, Students ================= */
const PAGES = {};
let ROUTE = { page:'home', arg:null };

function go(page, arg){
  ROUTE = { page, arg };
  $$('#nav .nav-item').forEach(n=>n.classList.toggle('active', n.dataset.page===page));
  render();
}
function render(){
  const fn = PAGES[ROUTE.page] || PAGES.home;
  $('#content').innerHTML = '';
  const el = document.createElement('div');
  el.className = 'page';
  $('#content').appendChild(el);
  fn(el, ROUTE.arg);
}

function head(title, sub, right){
  return `<div class="page-head glass liquid"><div><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div>
    <div class="spacer"></div><div style="display:flex;gap:10px;flex-wrap:wrap">${right||''}</div></div>`;
}
/* item 8: every section gets a Customize entry point */
function customizeBtn(section){
  /* item 5: Customize is administrator-exclusive — teachers, students, clients
     and guests never receive the markup at all. */
  return canCustomize() ? `<button class="btn sm gold" data-customize="${esc(section)}">${icon('palette')} Customize</button>` : '';
}
function bindCustomize(el){
  $$('[data-customize]',el).forEach(b=>b.onclick=()=>sectionCustomize(b.dataset.customize));
}

/* ================= HOME ================= */
PAGES.home = (el) => {
  const st = DB.d.students, s = DB.d.settings;
  const metrics = {
    totalStudents: st.length,
    activeStudents: st.filter(x=>x.status==='Active').length,
    graduated: st.filter(x=>x.status==='Graduated').length,
    totalCourses: DB.d.courses.length,
    activeCourses: DB.d.courses.filter(c=>c.active).length,
    feePending: st.reduce((a,x)=>a+studentPending(x.id),0)
  };
  const cards = (s.homeCards||[]).filter(c=>c.on).map((c,i)=>`
    <div class="stat glass liquid" style="animation:pageIn .5s ${i*0.07}s both" data-key="${c.key}">
      <span class="ic">${c.icon}</span>
      <div class="lbl">${esc(c.label)}</div>
      <div class="val">${c.key==='feePending' ? esc(DB.d.branding.currency)+' '+metrics[c.key].toLocaleString() : metrics[c.key]}</div>
      <div class="foot">${c.key==='feePending'?'Outstanding balance':'Live count'}</div>
    </div>`).join('');

  const a = s.academic;
  const feeList = st.filter(x=>studentPending(x.id)>0);
  const lateList = st.filter(x=>{ const t=overallAtt(x.id); return t.T>=3; });
  const lowAtt = st.filter(x=>{ const t=overallAtt(x.id); return t.total>=3 && t.pct < a.lowAttendance; });
  const lowPart = st.filter(x=>{
    const keys=Object.keys(DB.d.participation).filter(k=>k.startsWith(x.id+'|'));
    if(!keys.length) return false;
    const avg=keys.reduce((s2,k)=>s2+DB.d.participation[k],0)/keys.length;
    return (avg/a.maxScore*100) < a.lowParticipation;
  });
  const alertBlock = (icon,title,arr,color) => `
    <div class="sect glass liquid" style="cursor:pointer" data-alert="${title}">
      <h3 style="color:${color}">${icon} ${title} <span class="pill ${arr.length?'red':'green'}">${arr.length}</span></h3>
      ${arr.length? arr.slice(0,5).map(x=>`<div class="kv"><b>${esc(x.fullName)}</b><span>${esc(x.regNo||'')}</span></div>`).join('')
        : '<div style="color:var(--txt-dim);font-size:13px">All clear ✔</div>'}
      ${arr.length>5?`<div style="font-size:12px;color:var(--txt-dim);margin-top:7px">+${arr.length-5} more…</div>`:''}
    </div>`;

  const prog = DB.d.courses.map(c=>{
    const enrolled = st.filter(x=>(x.courses||[]).includes(c.name));
    const avg = enrolled.length ? Math.round(enrolled.reduce((s2,x)=>s2+courseProgress(x,c.name),0)/enrolled.length) : 0;
    return `<div style="margin-bottom:11px"><div style="display:flex;justify-content:space-between;font-size:12.5px">
      <span>${esc(c.name)}</span><span style="color:var(--txt)">${avg}% · ${enrolled.length} students</span></div>
      <div class="bar"><i style="width:${avg}%"></i></div></div>`;
  }).join('');

  el.innerHTML = head('Home', '',
      isAdmin()?`<button class="btn gold" id="homeCustom">${icon('palette')} Customize Panels</button>`:'')
    + `<div class="stats" style="margin-bottom:14px">${cards}</div>
    <h3 style="margin:16px 4px 10px;letter-spacing:1.4px;font-size:13px;color:var(--txt-dim)">SYSTEM ALERTS</h3>
    <div class="grid2">
      ${alertBlock('💰','Fee Pending',feeList,'var(--red)')}
      ${alertBlock('⏰','Regularly Late Students',lateList,'var(--neon)')}
      ${alertBlock('📉','Low Attendance',lowAtt,'var(--red)')}
      ${alertBlock('🗣️','Low Class Participation',lowPart,'var(--gold)')}
    </div>
    <div class="grid2" style="margin-top:12px">
      <div class="sect glass liquid"><h3>📈 Course Progress System</h3>${prog||'<div class="empty">No courses</div>'}</div>
      <div class="sect glass liquid"><h3>🕒 Recent Activity</h3>
        ${DB.d.activity.slice(0,12).map(x=>`<div class="kv"><b>${esc(x.action)}</b><span style="font-size:11.5px">${esc(x.detail).slice(0,42)} · ${new Date(x.time).toLocaleString()}</span></div>`).join('')
          || '<div style="color:var(--txt-dim);font-size:13px">No activity yet</div>'}
      </div>
    </div>`;

  $$('[data-alert]',el).forEach(b=>b.onclick=()=>go('students'));
  const hc = $('#homeCustom', el); if (hc) hc.onclick = customizeHome;
};

function customizeHome(){
  if(!requireAdmin()) return;
  const cards = DB.d.settings.homeCards;
  modal({ title:'🎨 Customize Home Panels', width:'640px',
    body: cards.map(c=>`<div class="togline">
      <input class="inp" style="width:58px;text-align:center" value="${esc(c.icon)}" data-ic="${c.id}">
      <input class="inp g" value="${esc(c.label)}" data-lb="${c.id}">
      <div class="switch ${c.on?'on':''}" data-sw="${c.id}"><i></i></div></div>`).join('')
      + `<div style="margin-top:14px"><label class="f">Add custom panel label</label>
         <div style="display:flex;gap:8px"><input class="inp" id="newPanel" placeholder="e.g. This Month Revenue">
         <button class="btn primary" id="addPanel">+ Add</button></div></div>`,
    footer:`<button class="btn" onclick="closeModal()">Close</button><button class="btn primary" id="saveHome">💾 Save</button>` });

  $$('[data-sw]').forEach(s=>s.onclick=()=>s.classList.toggle('on'));
  $('#addPanel').onclick=()=>{
    const t=val('newPanel'); if(!t) return;
    cards.push({id:uid('c'),key:'totalStudents',label:t,icon:'✨',on:true});
    DB.save(); closeModal(); customizeHome();
  };
  $('#saveHome').onclick=()=>{
    cards.forEach(c=>{
      const ic=$(`[data-ic="${c.id}"]`), lb=$(`[data-lb="${c.id}"]`), sw=$(`[data-sw="${c.id}"]`);
      if(ic) c.icon=ic.value; if(lb) c.label=lb.value; if(sw) c.on=sw.classList.contains('on');
    });
    DB.save(); DB.log('Customized','Home panels'); closeModal(); render(); toast('Home panels updated');
  };
}

/* ================= TEACHERS ================= */
PAGES.teachers = (el) => {
  const s = DB.d.settings;
  s.view.teachers = s.view.teachers || 'cards';
  const right = `
    <button class="btn sm" id="tImport">${icon('imp')} Import</button>
    <button class="btn sm" id="tExport">${icon('exp')} Export</button>
    ${customizeBtn('teachers')}
    ${can('editTeachers')?`<button class="btn primary" id="tAdd">${icon('add')} Add Teacher</button>`:''}`;
  el.innerHTML = head('Teachers', `${DB.d.teachers.length} teacher(s) registered`, right)
   + `<div class="toolbar glass"><input class="inp grow" id="tSearch" placeholder="🔍 Search teachers…">
      ${viewControl('teachers', s.view.teachers)}
      <span style="font-size:12px;color:var(--txt-dim)">Stack order</span>${stackSelect('tStack', s.tStack||'Newest First')}</div>
      <div id="tList" class="cards view-${s.view.teachers}"></div>`;

  const draw = () => {
    const q = ($('#tSearch',el).value||'').toLowerCase();
    let list = DB.d.teachers.filter(t => !q || JSON.stringify(t).toLowerCase().includes(q));
    list = applyStack(list, $('#tStack',el).value);
    const box = $('#tList', el);
    box.className = 'cards view-'+s.view.teachers;
    /* item 6 + 12: each teacher is its own glass panel in EVERY view incl. List */
    box.innerHTML = list.length ? list.map((t,i)=>`
      <div class="card glass liquid" data-id="${t.id}" style="animation:pageIn .4s ${Math.min(i*0.04,.5)}s both">
        <img class="pic" src="${t.photo||asset('teacher.png')}">
        <div class="body"><div class="nm">${esc(t.fullName)}</div>
          <div class="mt">${esc(t.qualification||'Instructor')} · ${esc(t.regNo||'')}</div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><span class="pill ${t.status==='Active'?'green':t.status==='Left'?'red':'gold'}">${esc(t.status||'Active')}</span>
          <span class="pill purple">${(t.subjects||[]).length} courses</span>
          ${t.mobile?`<span class="pill gray">${esc(t.mobile)}</span>`:''}</div></div>
      </div>`).join('') : `<div class="empty glass" style="grid-column:1/-1">${icon('teachers')}<br>No teachers yet. Click “Add Teacher”.</div>`;
    $$('.card',box).forEach(c=>c.onclick=()=>go('teacherProfile', c.dataset.id));
  };
  draw();
  $('#tSearch',el).oninput = draw;
  $('#tStack',el).onchange = e => { s.tStack=e.target.value; DB.save(); draw(); };
  $$('[data-vid="teachers"]',el).forEach(v=>v.onclick=()=>{
    s.view.teachers=v.dataset.view; DB.save();
    $$('[data-vid="teachers"]',el).forEach(x=>x.classList.toggle('active', x.dataset.view===s.view.teachers));
    draw();
  });
  bindCustomize(el);
  const add=$('#tAdd',el); if(add) add.onclick=()=>teacherForm();
  $('#tExport',el).onclick=()=>exportMenu(DB.d.teachers.map(t=>({
    Name:t.fullName, Father:t.fatherName, Reg:t.regNo, Qualification:t.qualification, Mobile:t.mobile,
    WhatsApp:t.whatsapp, Email:t.email, Gender:t.gender, CNIC:t.cnic, Joined:t.joinDate, Status:t.status,
    Courses:(t.subjects||[]).join('; '), Address:t.address })),'Teachers');
  $('#tImport',el).onclick=()=>importDialog(rows=>{
    rows.forEach(r=>DB.d.teachers.push({ id:uid('t'), created:new Date().toISOString(),
      fullName:r.Name||r.fullName||'Unnamed', fatherName:r.Father||'', regNo:r.Reg||'', qualification:r.Qualification||'',
      mobile:r.Mobile||'', whatsapp:r.WhatsApp||'', email:r.Email||'', gender:r.Gender||'Male', cnic:r.CNIC||'',
      joinDate:r.Joined||today(), status:r.Status||'Active', subjects:(r.Courses||'').split(';').map(x=>x.trim()).filter(Boolean),
      address:r.Address||'', notes:'', photo:'' }));
    DB.save(); DB.log('Imported','Teachers: '+rows.length); render(); toast(rows.length+' teachers imported');
  });
};

function teacherForm(id){
  const t = id ? DB.teacher(id) : { photo:'', subjects:[], status:'Active', joinDate:today(), gender:'Male' };
  let photo = t.photo || '';
  modal({ title: (id?'✏️ Edit':'➕ Add')+' Teacher', width:'880px',
    body:`<div style="display:flex;gap:18px;flex-wrap:wrap">
      <div style="text-align:center">
        <img id="tPhoto" src="${photo||asset('teacher.png')}" style="width:120px;height:120px;border-radius:18px;object-fit:cover;border:1px solid var(--glass-brd)">
        <div style="height:8px"></div><button class="btn sm" id="tPick">📷 Choose Photo</button></div>
      <div style="flex:1;min-width:340px" class="form-grid">
        ${field('Full Name','f_name',t.fullName)}${field("Father's Name",'f_father',t.fatherName)}
        ${field('Registration Number','f_reg',t.regNo)}${field('Qualification','f_qual',t.qualification)}
        ${field('Mobile Number','f_mob',t.mobile)}${field('WhatsApp','f_wa',t.whatsapp)}
        ${field('Email','f_mail',t.email,'email')}${field('Gender','f_gender',t.gender,'select',['Male','Female','Other'])}
        ${field('CNIC','f_cnic',t.cnic)}${field('Joining Date','f_join',t.joinDate,'date')}
        ${field('Status','f_status',t.status,'select',['Active','On Leave','Left'])}
        ${field('Address','f_addr',t.address)}
      </div></div>
      <div class="sect glass" style="margin-top:18px"><h3>Subjects / Courses</h3><div class="chips" id="tCourses">
        ${DB.d.courses.map(c=>`<div class="chip ${(t.subjects||[]).includes(c.name)?'on':''}" data-c="${esc(c.name)}">${esc(c.name)}</div>`).join('')}</div></div>
      <div class="sect glass">${field('Notes','f_notes',t.notes,'textarea')}</div>`,
    footer:`${id?'<button class="btn danger" id="tDel">🗑 Delete</button>':''}
      <button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="tSave">💾 Save Teacher</button>` });

  $('#tPick').onclick = () => pickPhoto('tPhoto', u=>photo=u);
  $$('#tCourses .chip').forEach(c=>c.onclick=()=>c.classList.toggle('on'));
  const del=$('#tDel'); if(del) del.onclick=()=>{
    if(!guard('deleteData')) return;
    DB.trash('teacher', t); DB.d.teachers = DB.d.teachers.filter(x=>x.id!==id);
    DB.save(); closeModal(); go('teachers'); toast('Moved to Recycle Bin');
  };
  $('#tSave').onclick = () => {
    if(!val('f_name')) return toast('Full name required','err');
    const o = { fullName:val('f_name'), fatherName:val('f_father'), regNo:val('f_reg'), qualification:val('f_qual'),
      mobile:val('f_mob'), whatsapp:val('f_wa'), email:val('f_mail'), gender:val('f_gender'), cnic:val('f_cnic'),
      joinDate:val('f_join'), status:val('f_status'), address:val('f_addr'), notes:val('f_notes'), photo,
      subjects:$$('#tCourses .chip.on').map(c=>c.dataset.c) };
    if (id) Object.assign(t, o);
    else DB.d.teachers.push({ id:uid('t'), created:new Date().toISOString(), ...o });
    DB.save(); DB.log(id?'Edited teacher':'Added teacher', o.fullName);
    closeModal(); render(); toast('Teacher saved');
  };
}

PAGES.teacherProfile = (el, id) => {
  const t = DB.teacher(id); if(!t) return go('teachers');
  const courses = t.subjects||[];
  const students = DB.d.students.filter(s=>(s.courses||[]).some(c=>courses.includes(c)));
  const abs = Object.keys(DB.d.attendance).filter(k=>k.startsWith(t.id+'|')&&DB.d.attendance[k]==='A').length;
  const st = overallAtt(t.id);
  el.innerHTML = head('👤 '+esc(t.fullName), `${esc(t.qualification||'Instructor')} · Joined ${esc(t.joinDate||'-')}`,
    `<button class="btn sm" id="back">← Back</button>${can('editTeachers')?'<button class="btn primary" id="edit">✏️ Edit</button>':''}`)
   + `<div class="stats" style="margin-bottom:12px">
      ${[['Courses',courses.length,'📚'],['Batches',DB.d.batches.filter(b=>b.teacher===t.id).length,'👥'],
         ['Students',students.length,'🎓'],['Absences',abs,'🚫'],['Attendance %',st.pct+'%','📈']]
        .map(([l,v,i])=>`<div class="stat glass liquid"><span class="ic">${i}</span><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')}</div>
    <div class="tabs glass" id="tpTabs">${['Overview','Teacher Information','Assigned Courses'].map((x,i)=>`<div class="tab ${i===0?'active':''}" data-t="${x}">${x}</div>`).join('')}</div>
    <div id="tpBody"></div>`;
  const body = $('#tpBody', el);
  const showTab = n => {
    if (n==='Overview') body.innerHTML = `<div class="grid2">
      <div class="sect glass liquid"><h3>Summary</h3>
        <div class="kv"><b>Status</b><span class="pill ${t.status==='Active'?'green':'gold'}">${esc(t.status)}</span></div>
        <div class="kv"><b>Registration</b><span>${esc(t.regNo||'-')}</span></div>
        <div class="kv"><b>Gender</b><span>${esc(t.gender||'-')}</span></div>
        <div class="kv"><b>Notes</b><span>${esc(t.notes||'-')}</span></div></div>
      <div class="sect glass liquid"><h3>Students Under Teacher</h3>
        ${students.slice(0,10).map(s=>`<div class="kv"><b>${esc(s.fullName)}</b><span>${esc(s.regNo||'')}</span></div>`).join('')||'<div style="color:var(--txt-dim)">None</div>'}</div></div>`;
    if (n==='Teacher Information') body.innerHTML = `<div class="sect glass liquid"><h3>Teacher Information</h3><div class="grid2">
      ${[['Full Name',t.fullName],["Father's Name",t.fatherName],['Qualification',t.qualification],['Mobile',t.mobile],
         ['WhatsApp',t.whatsapp],['Email',t.email],['CNIC',t.cnic],['Gender',t.gender],['Joining Date',t.joinDate],
         ['Status',t.status],['Address',t.address]].map(([k,v])=>`<div class="kv"><b>${k}</b><span>${esc(v||'-')}</span></div>`).join('')}</div></div>`;
    if (n==='Assigned Courses') body.innerHTML = `<div class="cards view-cards">${
      courses.map(c=>{ const cc=DB.d.courses.find(x=>x.name===c)||{};
        const en=DB.d.students.filter(s=>(s.courses||[]).includes(c)).length;
        return `<div class="card glass liquid"><div class="body"><div class="nm">${esc(c)}</div>
        <div class="mt">${esc(cc.duration||'')} · ${en} students</div><div class="bar"><i style="width:${Math.min(100,en*10)}%"></i></div></div></div>`;
      }).join('') || '<div class="empty glass">No courses assigned</div>'}</div>`;
  };
  showTab('Overview');
  $$('#tpTabs .tab',el).forEach(tb=>tb.onclick=()=>{ $$('#tpTabs .tab',el).forEach(x=>x.classList.remove('active')); tb.classList.add('active'); showTab(tb.dataset.t); });
  $('#back',el).onclick=()=>go('teachers');
  const e2=$('#edit',el); if(e2) e2.onclick=()=>teacherForm(id);
};

/* ================= STUDENTS ================= */
PAGES.students = (el) => {
  const s = DB.d.settings;
  s.view.students = s.view.students || 'cards';
  const right = `
    <button class="btn sm" id="sImport">${icon('imp')} Import</button>
    <button class="btn sm" id="sExport">${icon('exp')} Export</button>
    ${customizeBtn('students')}
    ${can('editStudents')?`<button class="btn primary" id="sAdd">${icon('add')} Add Student</button>`:''}`;
  el.innerHTML = head('Students', `${DB.d.students.length} student(s) registered`, right)
   + `<div class="toolbar glass liquid">
      <input class="inp grow" id="sSearch" placeholder="🔍 Search by reg#, serial, name, father's name or course…">
      <select class="inp" id="sStatus" style="width:auto"><option>All Status</option>${STATUSES.map(x=>`<option>${x}</option>`).join('')}</select>
      <select class="inp" id="sCourse" style="width:auto"><option value="All Courses">All Courses</option>${DB.d.courses.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}</select>
      ${viewControl('students', s.view.students)}
      <span style="font-size:12px;color:var(--txt-dim)">Stack</span>${stackSelect('sStack', s.sStack||'Newest First')}</div>
      <div id="sList" class="cards view-${s.view.students}"></div>`;

  const draw = () => {
    const q=($('#sSearch',el).value||'').toLowerCase(), stf=$('#sStatus',el).value, cf=$('#sCourse',el).value;
    let list = DB.d.students.filter(x=>{
      if (stf!=='All Status' && x.status!==stf) return false;
      if (cf!=='All Courses' && !(x.courses||[]).includes(cf)) return false;
      if (!q) return true;
      return [x.fullName,x.fatherName,x.regNo,x.serial,(x.courses||[]).join(' ')].join(' ').toLowerCase().includes(q);
    });
    list = applyStack(list, $('#sStack',el).value);
    const box=$('#sList',el); box.className='cards view-'+s.view.students;
    box.innerHTML = list.length ? list.map((x,i)=>{
      const att=overallAtt(x.id), pend=studentPending(x.id);
      const ph = x.photo || (x.gender==='Female' ? asset('girl.png') : asset('boy.png'));
      /* item 12/14: individual panel per student in every view, no hover blur */
      return `<div class="card glass liquid ${statusClass(x.status)}" data-id="${x.id}" style="animation:pageIn .4s ${Math.min(i*0.03,.5)}s both">
        <img class="pic" src="${ph}">
        <div class="body"><div class="nm">${esc(x.fullName)}</div>
        <div class="mt">${esc(x.regNo||'')} · ${esc(x.fatherName||'')}</div>
        <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
          <span class="pill ${x.status==='Active'?'green':['Dropped Out','Suspended'].includes(x.status)?'red':'gray'}">${esc(x.status||'Active')}</span>
          <span class="pill purple">${(x.courses||[]).length} courses</span>
          <span class="pill gold">${att.pct}% att</span>
          ${pend>0?`<span class="pill red">${esc(DB.d.branding.currency)} ${pend}</span>`:''}
        </div></div></div>`;
    }).join('') : `<div class="empty glass" style="grid-column:1/-1"><span class="e">🎓</span>No students found.</div>`;
    $$('.card',box).forEach(c=>c.onclick=()=>go('studentProfile', c.dataset.id));
  };
  draw();
  $('#sSearch',el).oninput=draw; $('#sStatus',el).onchange=draw; $('#sCourse',el).onchange=draw;
  $('#sStack',el).onchange=e=>{ s.sStack=e.target.value; DB.save(); draw(); };
  $$('[data-vid="students"]',el).forEach(v=>v.onclick=()=>{
    s.view.students=v.dataset.view; DB.save();
    $$('[data-vid="students"]',el).forEach(x=>x.classList.toggle('active', x.dataset.view===s.view.students));
    draw();
  });
  bindCustomize(el);
  const add=$('#sAdd',el); if(add) add.onclick=()=>studentForm();
  $('#sExport',el).onclick=()=>exportMenu(DB.d.students.map(x=>({
    Reg:x.regNo, Name:x.fullName, Father:x.fatherName, Gender:x.gender, Status:x.status,
    Mobile:x.mobile, WhatsApp:x.whatsapp, Email:x.email, FatherMobile:x.fMobile, Guardian:x.gName,
    Admission:x.admissionDate, DOB:x.dob, Timing:x.classTiming, Courses:(x.courses||[]).join('; '),
    Attendance:overallAtt(x.id).pct+'%', Pending:studentPending(x.id), Address:x.address })),'Students');
  $('#sImport',el).onclick=()=>importDialog(rows=>{
    rows.forEach(r=>DB.d.students.push(newStudent({
      fullName:r.Name||r.fullName||'Unnamed', fatherName:r.Father||'', regNo:r.Reg||DB.nextReg(),
      gender:r.Gender||'Male', status:r.Status||'Active', mobile:r.Mobile||'', email:r.Email||'',
      admissionDate:r.Admission||today(), courses:(r.Courses||'').split(';').map(x=>x.trim()).filter(Boolean) })));
    DB.save(); DB.log('Imported','Students: '+rows.length); render(); toast(rows.length+' students imported');
  });
};

function newStudent(o){
  return { id:uid('s'), created:new Date().toISOString(), serial:DB.d.students.length+1,
    photo:'', fullName:'', fatherName:'', gender:'Male', regNo:DB.nextReg(), qualification:'', cnic:'',
    admissionDate:today(), classTiming:'', mobile:'', whatsapp:'', email:'',
    fMobile:'', fWhatsapp:'', fEmail:'', bMobile:'', bWhatsapp:'', bEmail:'',
    gName:'', gMobile:'', gWhatsapp:'', gCnic:'', dob:'', gEmail:'',
    address:'', note:'', status:'Active', courses:[], courseData:{}, files:[], remarks:[], timeline:[], ...o };
}

function studentForm(id){
  const st = id ? DB.student(id) : newStudent({});
  let photo = st.photo || '';
  const sel = new Set(st.courses||[]);
  modal({ title:(id?'✏️ Edit':'➕ Add')+' Student', width:'980px',
    body:`<div style="display:flex;gap:18px;flex-wrap:wrap">
      <div style="text-align:center"><img id="sPhoto" src="${photo||(st.gender==='Female'?asset('girl.png'):asset('boy.png'))}"
        style="width:120px;height:120px;border-radius:18px;object-fit:cover;border:1px solid var(--glass-brd)">
        <div style="height:8px"></div><button class="btn sm" id="sPick">📷 Choose Photo</button></div>
      <div style="flex:1;min-width:360px" class="form-grid">
        ${field('Full Name','g_name',st.fullName)}${field("Father's Name",'g_father',st.fatherName)}
        ${field('Gender','g_gender',st.gender,'select',['Male','Female','Other'])}
        ${field('Registration Number','g_reg',st.regNo)}
        ${field('Qualification','g_qual',st.qualification)}${field('CNIC / B-Form','g_cnic',st.cnic)}
        ${field('Admission Date','g_adm',st.admissionDate,'date')}${field('Class Timing','g_time',st.classTiming)}
        ${field('Status','g_status',st.status,'select',STATUSES)}
      </div></div>
      <div class="sect glass" style="margin-top:14px"><h3>Contact Info</h3><div class="form-grid">
        ${field('Student Mobile','g_mob',st.mobile)}${field('Student WhatsApp','g_wa',st.whatsapp)}${field('Student Email','g_mail',st.email)}
        ${field("Father's Mobile",'g_fmob',st.fMobile)}${field("Father's WhatsApp",'g_fwa',st.fWhatsapp)}${field("Father's Email",'g_fmail',st.fEmail)}
        ${field("Brother's Mobile",'g_bmob',st.bMobile)}${field("Brother's WhatsApp",'g_bwa',st.bWhatsapp)}${field("Brother's Email",'g_bmail',st.bEmail)}
      </div></div>
      <div class="sect glass"><h3>Other Details</h3><div class="form-grid">
        ${field('Guardian Name','g_gname',st.gName)}${field('Guardian Mobile','g_gmob',st.gMobile)}${field('Guardian WhatsApp','g_gwa',st.gWhatsapp)}
        ${field('Guardian CNIC / B-Form','g_gcnic',st.gCnic)}${field('Date of Birth','g_dob',st.dob,'date')}${field('Guardian Email','g_gmail',st.gEmail)}
      </div></div>
      <div class="sect glass"><h3>Home Address</h3>${field('','g_addr',st.address,'textarea')}</div>
      <div class="sect glass"><h3>Note</h3>${field('','g_note',st.note,'textarea')}</div>
      <div class="sect glass liquid"><h3>Course Enrolment <span class="pill gold" id="ccount">${sel.size} of ${DB.d.courses.length} courses selected</span></h3>
        <div class="chips" id="sCourses">
          <div class="chip" data-all="1">All Courses</div>
          ${DB.d.courses.map(c=>`<div class="chip ${sel.has(c.name)?'on':''}" data-c="${esc(c.name)}">${esc(c.name)}</div>`).join('')}
        </div></div>`,
    footer:`${id?'<button class="btn danger" id="sDel">🗑 Delete</button>':''}
      <button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="sSave">💾 Save Student</button>` });

  /* item 13: counter + "All Courses" only glows orange when EVERY course is on,
     and clicking it a second time (when all are on) deselects everything. */
  const upd = () => {
    const all = $$('#sCourses .chip[data-c]');
    const on  = all.filter(c=>c.classList.contains('on')).length;
    $('#ccount').textContent = `${on} of ${all.length} courses selected`;
    $('[data-all]').classList.toggle('allon', all.length>0 && on === all.length);
  };
  upd();
  $('#sPick').onclick=()=>pickPhoto('sPhoto', u=>photo=u);
  $$('#sCourses .chip[data-c]').forEach(c=>c.onclick=()=>{ c.classList.toggle('on'); upd(); });
  $('[data-all]').onclick=()=>{
    const all = $$('#sCourses .chip[data-c]');
    const everyOn = all.length>0 && all.every(c=>c.classList.contains('on'));
    all.forEach(c=>c.classList.toggle('on', !everyOn));   // second click clears all
    upd();
  };
  const del=$('#sDel'); if(del) del.onclick=()=>{
    if(!guard('deleteData')) return;
    DB.trash('student', st); DB.d.students=DB.d.students.filter(x=>x.id!==id);
    DB.save(); closeModal(); go('students'); toast('Moved to Recycle Bin');
  };
  $('#sSave').onclick=()=>{
    if(!val('g_name')) return toast('Full name required','err');
    const o={ fullName:val('g_name'), fatherName:val('g_father'), gender:val('g_gender'), regNo:val('g_reg'),
      qualification:val('g_qual'), cnic:val('g_cnic'), admissionDate:val('g_adm'), classTiming:val('g_time'),
      status:val('g_status'), mobile:val('g_mob'), whatsapp:val('g_wa'), email:val('g_mail'),
      fMobile:val('g_fmob'), fWhatsapp:val('g_fwa'), fEmail:val('g_fmail'),
      bMobile:val('g_bmob'), bWhatsapp:val('g_bwa'), bEmail:val('g_bmail'),
      gName:val('g_gname'), gMobile:val('g_gmob'), gWhatsapp:val('g_gwa'), gCnic:val('g_gcnic'),
      dob:val('g_dob'), gEmail:val('g_gmail'), address:val('g_addr'), note:val('g_note'), photo,
      courses:$$('#sCourses .chip[data-c].on').map(c=>c.dataset.c) };
    if (id) Object.assign(st,o); else DB.d.students.push({...st, ...o});
    const target = id ? st : DB.d.students[DB.d.students.length-1];
    target.courseData = target.courseData || {};
    target.courses.forEach(c=>{ if(!target.courseData[c]) target.courseData[c]={status:'Active',startDate:target.admissionDate,endDate:'',manualProgress:''}; });
    (target.timeline=target.timeline||[]).unshift({time:new Date().toISOString(), text:(id?'Profile updated':'Student admitted')});
    DB.save(); DB.log(id?'Edited student':'Added student', o.fullName);
    closeModal(); render(); toast('Student saved');
  };
}

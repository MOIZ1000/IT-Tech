/* ============ Student profile + remaining modules ============ */
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
let PSTATE = { year:new Date().getFullYear(), month:new Date().getMonth() };

PAGES.studentProfile = (el, id) => {
  const st = DB.student(id); if(!st) return go('students');
  const att = overallAtt(st.id);
  const pKeys = Object.keys(DB.d.participation).filter(k=>k.startsWith(st.id+'|'));
  const pAvg = pKeys.length ? (pKeys.reduce((a,k)=>a+DB.d.participation[k],0)/pKeys.length) : 0;
  const ph = st.photo || (st.gender==='Female'?asset('girl.png'):asset('boy.png'));
  el.innerHTML = `
    <div class="page-head glass liquid" style="align-items:center">
      <img src="${ph}" style="width:86px;height:86px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)">
      <div><h1>${esc(st.fullName)}</h1>
        <div class="sub">${esc(st.regNo||'')} · S/O ${esc(st.fatherName||'-')} · Admitted ${esc(st.admissionDate||'-')} · ${esc(st.classTiming||'No timing set')}</div>
        <div style="margin-top:7px"><span class="pill ${st.status==='Active'?'green':['Dropped Out','Suspended'].includes(st.status)?'red':'gray'}">${esc(st.status)}</span></div></div>
      <div class="spacer"></div>
      <button class="btn sm" id="pBack">← Back</button>
      ${customizeBtn('student-profile')}
      ${can('editStudents')?`<button class="btn primary" id="pEdit">${icon('edit')} Edit</button>`:''}
    </div>
    <div class="stats" style="margin-bottom:12px">
      ${[['Courses',(st.courses||[]).length,'📚'],['Attendance',att.pct+'%','📈'],
         ['Participation',pAvg.toFixed(1)+'/'+DB.d.settings.academic.maxScore,'🗣️'],
         ['Pending Fees',DB.d.branding.currency+' '+studentPending(st.id),'💰']]
        .map(([l,v,i])=>`<div class="stat glass liquid"><span class="ic">${i}</span><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')}
    </div>
    <div class="tabs glass" id="spTabs">${['Overview','Courses','Attendance','Participation','Tests & Quizzes','Fees & Fines','Files','Teacher Remarks','Timeline']
      .map((t,i)=>`<div class="tab ${i===0?'active':''}" data-t="${t}">${t}</div>`).join('')}</div>
    <div id="spBody"></div>`;
  $('#pBack',el).onclick=()=>go('students');
  const pe=$('#pEdit',el); if(pe) pe.onclick=()=>studentForm(id);
  bindCustomize(el);
  const body=$('#spBody',el);
  const show = t => { body.innerHTML=''; const d=document.createElement('div'); d.className='page'; body.appendChild(d); SPTABS[t](d, st); };
  show('Overview');
  $$('#spTabs .tab',el).forEach(tb=>tb.onclick=()=>{ $$('#spTabs .tab',el).forEach(x=>x.classList.remove('active')); tb.classList.add('active'); show(tb.dataset.t); });
};

const SPTABS = {};
SPTABS['Overview'] = (d, st) => {
  const att=overallAtt(st.id);
  d.innerHTML=`<div class="grid2">
    <div class="sect glass liquid"><h3>Personal Information</h3>
      ${[['Full Name',st.fullName],["Father's Name",st.fatherName],['Gender',st.gender],['CNIC / B-Form',st.cnic],
         ['Date of Birth',st.dob],['Mobile',st.mobile],['WhatsApp',st.whatsapp],['Email',st.email],
         ["Father's Mobile",st.fMobile],['Guardian',st.gName],['Guardian Mobile',st.gMobile],['Address',st.address],['Note',st.note]]
        .map(([k,v])=>`<div class="kv"><b>${k}</b><span>${esc(v||'-')}</span></div>`).join('')}</div>
    <div class="sect glass liquid"><h3>Academic Snapshot</h3>
      <div class="kv"><b>Status</b><span>${esc(st.status)}</span></div>
      <div class="kv"><b>Admission Date</b><span>${esc(st.admissionDate||'-')}</span></div>
      <div class="kv"><b>Class Timing</b><span>${esc(st.classTiming||'-')}</span></div>
      <div class="kv"><b>Courses Enrolled</b><span>${(st.courses||[]).length}</span></div>
      <div class="kv"><b>Attendance</b><span>${att.pct}% (P${att.P}/A${att.A}/L${att.L}/Late${att.T})</span></div>
      <div class="kv"><b>Pending Dues</b><span>${DB.d.branding.currency} ${studentPending(st.id)}</span></div>
      <div style="margin-top:12px">${(st.courses||[]).map(c=>{const p=courseProgress(st,c);
        return `<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>${esc(c)}</span><span style="color:var(--txt)">${p}%</span></div><div class="bar"><i style="width:${p}%"></i></div></div>`}).join('')}</div>
    </div></div>`;
};

SPTABS['Courses'] = (d, st) => {
  st.courseData = st.courseData||{};
  d.innerHTML = `<div class="cards view-cards">${(st.courses||[]).map(c=>{
    const cd = st.courseData[c] || (st.courseData[c]={status:'Active',startDate:st.admissionDate,endDate:'',manualProgress:''});
    const p = courseProgress(st,c);
    const att = overallAtt(st.id);
    const locked = cd.status==='Completed' && !isAdmin();
    return `<div class="card glass liquid" style="flex-direction:column;align-items:stretch;cursor:default">
      <div style="display:flex;align-items:center;gap:8px"><div class="nm" style="flex:1">${esc(c)}</div>
        <select class="inp" data-cs="${esc(c)}" style="width:auto;font-size:12px;padding:5px 8px" ${locked?'disabled':''}>
          ${['Not Started Yet','Active','Completed','Graduated','Dropped Out','Suspended','Pending Admission']
            .map(s=>`<option ${cd.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="bar"><i style="width:${p}%"></i></div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:9px">
        <span class="pill gold">${p}% progress</span><span class="pill purple">Att ${att.pct}%</span>
        <span class="pill">Tests ${(cd.tests||[]).length}</span><span class="pill">Quizzes ${(cd.quizzes||[]).length}</span>
        <span class="pill ${cd.presentation==='Done'?'green':'gray'}">Presentation ${esc(cd.presentation||'Pending')}</span></div>
      <button class="btn sm" style="margin-top:10px" data-det="${esc(c)}">🔽 Details</button>
      <div data-detbox="${esc(c)}" style="display:none;margin-top:10px" class="grid2">
        ${field('Presentation Status','x_pres_'+btoa(c).replace(/=/g,''),cd.presentation||'Pending','select',['Pending','In Progress','Done'])}
        ${field('Manual Progress Override (%)','x_mp_'+btoa(c).replace(/=/g,''),cd.manualProgress,'number')}
        ${field('Quiz Status','x_qz_'+btoa(c).replace(/=/g,''),cd.quizStatus||'Pending','select',['Pending','Ongoing','Completed'])}
        ${field('Start Date','x_sd_'+btoa(c).replace(/=/g,''),cd.startDate,'date')}
        ${field('End Date','x_ed_'+btoa(c).replace(/=/g,''),cd.endDate,'date')}
        ${field('Final Test Status','x_ft_'+btoa(c).replace(/=/g,''),cd.finalTest||'Not Taken','select',['Not Taken','Passed','Failed','Retake'])}
        <div style="grid-column:1/-1"><div class="kv"><b>Class Attendance</b><span>Present ${att.P} · Absent ${att.A} · Late ${att.T} · Leave ${att.L}</span></div></div>
        <div style="grid-column:1/-1"><button class="btn primary sm" data-save="${esc(c)}" ${locked?'disabled':''}>💾 Save Course Details</button></div>
      </div></div>`;
  }).join('') || '<div class="empty glass">No courses enrolled</div>'}</div>`;

  $$('[data-det]',d).forEach(b=>b.onclick=()=>{ const box=$(`[data-detbox="${b.dataset.det}"]`,d); box.style.display = box.style.display==='none'?'grid':'none'; });
  $$('[data-cs]',d).forEach(sl=>sl.onchange=()=>{ st.courseData[sl.dataset.cs].status=sl.value; DB.save(); toast('Course status updated'); });
  $$('[data-save]',d).forEach(b=>b.onclick=()=>{
    const c=b.dataset.save, k=btoa(c).replace(/=/g,''), cd=st.courseData[c];
    cd.presentation=val('x_pres_'+k); cd.manualProgress=val('x_mp_'+k); cd.quizStatus=val('x_qz_'+k);
    cd.startDate=val('x_sd_'+k); cd.endDate=val('x_ed_'+k); cd.finalTest=val('x_ft_'+k);
    DB.save(); DB.log('Course updated', st.fullName+' / '+c); toast('Saved');
  });
};

function monthSelector(){
  return `<div class="toolbar glass" style="margin-bottom:12px">
    <select class="inp" id="yrSel" style="width:auto">${Array.from({length:9},(_,i)=>new Date().getFullYear()-4+i)
      .map(y=>`<option ${y===PSTATE.year?'selected':''}>${y}</option>`).join('')}</select>
    <div style="display:flex;gap:4px;flex-wrap:wrap">${MONTHS.map((m,i)=>`<div class="tab ${i===PSTATE.month?'active':''}" data-m="${i}" style="padding:5px 10px;font-size:12px">${m}</div>`).join('')}</div></div>`;
}
function bindMonth(d, redraw){
  $('#yrSel',d).onchange=e=>{ PSTATE.year=+e.target.value; redraw(); };
  $$('[data-m]',d).forEach(t=>t.onclick=()=>{ PSTATE.month=+t.dataset.m; redraw(); });
}

SPTABS['Attendance'] = (d, st) => {
  /* item 15: keep the user's scroll position when a mark is clicked */
  const redraw = (keepScroll) => {
    const sc = $('#content');
    const y = keepScroll && sc ? sc.scrollTop : null;
    const dates = monthDates(PSTATE.year, PSTATE.month);
    const s = studentAttStats(st.id, dates);
    const adm = st.admissionDate || '1900-01-01', tod = today();
    d.innerHTML = monthSelector() + `<div class="stats" style="margin-bottom:12px">
      ${[['Total Classes',s.total,'📅'],['Present',s.P,'✅'],['Absent',s.A,'❌'],['Late',s.T,'⏰'],['Attendance %',s.pct+'%','📈']]
        .map(([l,v,i])=>`<div class="stat glass liquid"><span class="ic">${i}</span><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')}</div>
      <div class="sect glass liquid"><h3>Daily Attendance — ${MONTHS[PSTATE.month]} ${PSTATE.year}</h3>
      <table><tr><th>Date</th><th>Day</th><th>Class</th><th style="text-align:right">Mark</th></tr>
      ${dates.map(dt=>{
        const locked = (dt < adm || dt > tod) && !isAdmin();
        const cur = getAtt(st.id, dt);
        return `<tr><td>${dt}</td><td>${new Date(dt).toLocaleDateString(undefined,{weekday:'short'})}</td>
          <td>${esc((st.courses||[])[0]||'-')}</td>
          <td style="text-align:right">${['P','A','L','T'].map(m=>`<button class="mk ${cur===m?'on '+m:''}" data-dt="${dt}" data-m="${m}" ${locked?'disabled':''}>${m==='T'?'Lt':m}</button>`).join(' ')}</td></tr>`;
      }).join('')}</table>
      <div style="font-size:11.5px;color:var(--txt-dim);margin-top:9px">P = Present (black) · A = Absent (red) · L = Leave (yellow) · Lt = Late (orange). Dates before admission and future dates are locked${isAdmin()?' (admin override active)':''}.</div></div>`;
    bindMonth(d, ()=>redraw(false));
    $$('.mk',d).forEach(b=>b.onclick=()=>{
      if(!guard('editAttendance')) return;
      const cur=getAtt(st.id,b.dataset.dt);
      const nm = cur===b.dataset.m ? null : b.dataset.m;
      setAtt(st.id, b.dataset.dt, nm);
      if (nm && getPart(st.id,b.dataset.dt)===null) setPart(st.id, b.dataset.dt, defaultScoreFor(nm));
      redraw(true);                        // <- keep scroll
    });
    if (y!=null && sc) sc.scrollTop = y;   // restore after re-render
  };
  redraw(false);
};

SPTABS['Participation'] = (d, st) => {
  const max = DB.d.settings.academic.maxScore;
  const redraw = (keepScroll) => {
    const sc = $('#content');
    const y = keepScroll && sc ? sc.scrollTop : null;
    const dates = monthDates(PSTATE.year, PSTATE.month);
    const entries = dates.filter(dt=>getPart(st.id,dt)!==null);
    const total = entries.reduce((a,dt)=>a+getPart(st.id,dt),0);
    const avg = entries.length ? total/entries.length : 0;
    const outOf = entries.length*max;
    d.innerHTML = monthSelector() + `<div class="stats" style="margin-bottom:12px">
      ${[['Entries',entries.length,'📝'],['Month Total',total.toFixed(1),'➕'],['Daily Average',avg.toFixed(2),'📊'],
         ['Out Of',outOf.toFixed(1),'🎯'],['Percentage',(outOf?Math.round(total/outOf*100):0)+'%','📈']]
        .map(([l,v,i])=>`<div class="stat glass liquid"><span class="ic">${i}</span><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')}</div>
      <div class="sect glass liquid"><h3>Daily Participation — ${MONTHS[PSTATE.month]} ${PSTATE.year}</h3>
      <table><tr><th>Date</th><th>Class</th><th>Attendance</th><th style="text-align:right">Score (0 – ${max})</th></tr>
      ${dates.map(dt=>{
        const m=getAtt(st.id,dt), v=getPart(st.id,dt);
        return `<tr><td>${dt}</td><td>${esc((st.courses||[])[0]||'-')}</td>
          <td>${m?`<span class="pill ${m==='P'?'green':m==='A'?'red':'gold'}">${m==='T'?'Late':m}</span>`:'<span class="pill gray">—</span>'}</td>
          <td style="text-align:right"><button class="btn sm" data-dec="${dt}">−</button>
          <input class="inp" style="width:76px;display:inline-block;text-align:center" type="number" step="0.1" min="0" max="${max}" value="${v===null?'':v}" data-sc="${dt}">
          <button class="btn sm" data-inc="${dt}">+</button></td></tr>`;
      }).join('')}</table>
      <div style="font-size:11.5px;color:var(--txt-dim);margin-top:9px">Defaults: absent 0 · leave ${DB.d.settings.academic.leaveScore} · present ${DB.d.settings.academic.presentScore} · late deducts ${DB.d.settings.academic.lateDeduct}. Adjust in 0.1 steps up to ${max}.</div></div>`;
    bindMonth(d, ()=>redraw(false));
    const set=(dt,v)=>{ if(!guard('editParticipation')) return; setPart(st.id,dt,v); redraw(true); };
    $$('[data-inc]',d).forEach(b=>b.onclick=()=>set(b.dataset.inc, Math.min(max,(getPart(st.id,b.dataset.inc)??defaultScoreFor(getAtt(st.id,b.dataset.inc)))+0.1)));
    $$('[data-dec]',d).forEach(b=>b.onclick=()=>set(b.dataset.dec, Math.max(0,(getPart(st.id,b.dataset.dec)??0)-0.1)));
    $$('[data-sc]',d).forEach(i=>i.onchange=()=>set(i.dataset.sc, i.value===''?null:+i.value));
    if (y!=null && sc) sc.scrollTop = y;
  };
  redraw(false);
};

SPTABS['Tests & Quizzes'] = (d, st) => {
  /* item 17: three dedicated tabs, each with its own panel + Add button */
  st.courseData = st.courseData||{};
  const courses = st.courses||[];
  if (!courses.length){ d.innerHTML='<div class="empty glass">No courses enrolled</div>'; return; }
  let cur = courses[0];
  let tab = 'Tests';
  const KEY = { Tests:'tests', Quizzes:'quizzes', Exercises:'exercises' };
  const ICN = { Tests:'test', Quizzes:'quiz', Exercises:'exercise' };

  const redraw = () => {
    const cd = st.courseData[cur] || (st.courseData[cur]={});
    const key = KEY[tab];
    cd[key] = cd[key] || [];
    const items = cd[key];
    const totalMarks = items.reduce((a,x)=>a+(+x.marks||0),0);
    const gotMarks   = items.reduce((a,x)=>a+(+x.obtained||0),0);
    const attempted  = items.filter(x=>x.attempted).length;
    const pct = totalMarks ? Math.round(gotMarks/totalMarks*100) : 0;

    d.innerHTML = `
      <div class="toolbar glass"><span style="font-size:12px;color:var(--txt-dim)">Course</span>
        <select class="inp" id="tqCourse" style="width:auto">${courses.map(c=>`<option ${c===cur?'selected':''}>${esc(c)}</option>`).join('')}</select>
        <div class="grow"></div>${customizeBtn('tests-quizzes')}</div>
      <div class="subtabs glass">${Object.keys(KEY).map(t=>`
        <div class="tab ${t===tab?'active':''}" data-tq="${t}">${icon(ICN[t])} ${t}</div>`).join('')}</div>
      <div class="toolbar glass">
        <button class="btn primary" id="tqAdd">${icon('add')} Add ${tab.replace(/e?s$/,tab==='Exercises'?'':'')|| tab}</button>
        <div class="grow"></div>
        <span class="pill purple">${items.length} total</span>
        <span class="pill gold">${attempted} attempted</span>
        <span class="pill">${gotMarks}/${totalMarks} marks</span>
        <span class="pill green">${pct}%</span></div>
      <div class="stats">
        ${[['Total '+tab,items.length,'test'],['Attempted',attempted,'check'],
           ['Total Marks',totalMarks,'progress'],['Obtained',gotMarks,'graduation'],['Percentage',pct+'%','activity']]
          .map(([l,v,ic])=>`<div class="stat glass liquid"><span class="ic">${icon(ic)}</span><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')}</div>
      <div class="cards view-cards">${items.map((x,i)=>`
        <div class="card glass liquid" data-i="${i}" style="flex-direction:column;align-items:stretch">
          <div style="display:flex;gap:8px;align-items:center">
            <span class="pill purple">${esc(tab.replace(/s$/,''))}</span>
            <span class="pill ${x.attempted?'green':'gray'}">${x.attempted?'Attempted':'Pending'}</span>
            <span style="flex:1"></span><span style="font-size:11.5px;color:var(--txt-dim)">${esc(x.date||'')}</span></div>
          <div class="nm" style="margin-top:8px">${esc(x.title)}</div>
          <div class="mt">${esc(x.obtained||0)} / ${esc(x.marks||0)} marks</div>
          <div class="bar"><i style="width:${x.marks?Math.min(100,Math.round((x.obtained||0)/x.marks*100)):0}%"></i></div>
          ${(x.files||[]).length?`<div style="margin-top:8px">${x.files.map(f=>`<span class="pill gold">${esc(f.name)}</span>`).join(' ')}</div>`:''}
        </div>`).join('') || `<div class="empty glass" style="grid-column:1/-1">${icon(ICN[tab])}<br>No ${tab.toLowerCase()} yet for ${esc(cur)}</div>`}</div>
      <div class="sect glass liquid"><h3>Final Status — ${esc(cur)}</h3>
        <div class="form-grid">${field('Final Test Status','t_f',cd.finalTest||'Not Taken','select',['Not Taken','Passed','Failed','Retake'])}
        ${field('Overall Remark','t_rm',cd.remark||'')}</div>
        <div style="margin-top:14px"><button class="btn primary" id="tqSaveF">${icon('save')} Save Status</button></div></div>`;

    $('#tqCourse',d).onchange=e=>{ cur=e.target.value; redraw(); };
    $$('[data-tq]',d).forEach(t=>t.onclick=()=>{ tab=t.dataset.tq; redraw(); });
    $('#tqAdd',d).onclick=()=>itemForm(null);
    $$('.card[data-i]',d).forEach(c=>c.onclick=()=>itemForm(+c.dataset.i));
    $('#tqSaveF',d).onclick=()=>{ cd.finalTest=val('t_f'); cd.remark=val('t_rm'); DB.save(); toast('Saved'); };
    applySectionStyle('tests-quizzes');

    function itemForm(idx){
      const single = tab==='Tests'?'Test':tab==='Quizzes'?'Quiz':'Exercise';
      const x = idx!=null ? items[idx] : { title:'', date:today(), marks:10, obtained:0, attempted:false, notes:'', files:[] };
      let files=[...(x.files||[])];
      modal({ title:(idx!=null?'Edit ':'Add ')+single+' — '+esc(cur), width:'760px',
        body:`<div class="form-grid">${field(single+' Title','it_t',x.title)}${field('Date','it_d',x.date,'date')}
          ${field('Total Marks','it_m',x.marks,'number')}${field('Obtained Marks','it_o',x.obtained,'number')}
          ${field('Attempted','it_a',x.attempted?'Yes':'No','select',['Yes','No'])}</div>
          <div class="sect glass">${field('Questions / Topics / Notes','it_n',x.notes,'textarea')}</div>
          <div style="margin-top:12px"><button class="btn sm" id="itF">${icon('clip')} Attach Media</button>
          <span class="pill purple" id="itFc">${files.length} file(s)</span></div>`,
        footer:`${idx!=null?`<button class="btn danger" id="itDel">${icon('del')} Delete</button>`:''}
          <button class="btn" onclick="closeModal()">Cancel</button>
          <button class="btn primary" id="itSave">${icon('save')} Save</button>` });
      $('#itF').onclick=async()=>{ const f=await window.api.pickFiles({multi:true}); files.push(...f); $('#itFc').textContent=files.length+' file(s)'; };
      const del=$('#itDel'); if(del) del.onclick=()=>{ items.splice(idx,1); DB.save(); closeModal(); redraw(); };
      $('#itSave').onclick=()=>{
        const o={ title:val('it_t')||single, date:val('it_d'), marks:+val('it_m')||0,
          obtained:+val('it_o')||0, attempted:val('it_a')==='Yes', notes:val('it_n'), files };
        if(idx!=null) Object.assign(x,o); else items.push(o);
        DB.save(); DB.log(single+' saved', st.fullName+' / '+cur); closeModal(); redraw(); toast('Saved');
      };
    }
  };
  redraw();
};

SPTABS['Fees & Fines'] = (d, st) => {
  const redraw = () => {
    const fees = DB.d.fees.filter(f=>f.studentId===st.id);
    const fines = DB.d.fines.filter(f=>f.studentId===st.id);
    const row = (arr, kind) => arr.map((f,i)=>`<tr>
      <td>${esc(f.title)}</td><td>${esc(f.course||'-')}</td><td>${esc(f.date)}</td>
      <td>${DB.d.branding.currency} ${f.amount}</td><td>${DB.d.branding.currency} ${f.paid||0}</td>
      <td><span class="pill ${f.status==='Paid'?'green':'red'}">${esc(f.status)}</span></td>
      <td style="text-align:right"><button class="btn sm" data-ed="${kind}:${f.id}">✏️</button>
      <button class="btn sm danger" data-rm="${kind}:${f.id}">🗑</button></td></tr>`).join('');
    d.innerHTML = `<div class="toolbar glass">
        <button class="btn primary" id="addFee">➕ Add Fee</button>
        <button class="btn danger" id="addFine">➕ Add Fine</button>
        <div class="grow"></div>
        <span class="pill gold">Pending: ${DB.d.branding.currency} ${studentPending(st.id)}</span></div>
      <div class="sect glass liquid"><h3>Fees</h3><table><tr><th>Title</th><th>Course</th><th>Date</th><th>Amount</th><th>Paid</th><th>Status</th><th></th></tr>${row(fees,'fee')||''}</table>${fees.length?'':'<div style="color:var(--txt-dim);font-size:13px;margin-top:8px">No fee records</div>'}</div>
      <div class="sect glass liquid"><h3>Fines</h3><table><tr><th>Title</th><th>Course</th><th>Date</th><th>Amount</th><th>Paid</th><th>Status</th><th></th></tr>${row(fines,'fine')||''}</table>${fines.length?'':'<div style="color:var(--txt-dim);font-size:13px;margin-top:8px">No fine records</div>'}</div>`;
    $('#addFee',d).onclick=()=>feeForm('fee', st.id, redraw);
    $('#addFine',d).onclick=()=>feeForm('fine', st.id, redraw);
    $$('[data-ed]',d).forEach(b=>b.onclick=()=>{ const [k,i]=b.dataset.ed.split(':'); feeForm(k, st.id, redraw, i); });
    $$('[data-rm]',d).forEach(b=>b.onclick=()=>{ const [k,i]=b.dataset.rm.split(':');
      const list = k==='fee'?DB.d.fees:DB.d.fines; const item=list.find(x=>x.id===i);
      DB.trash(k,item); const idx=list.indexOf(item); list.splice(idx,1); DB.save(); redraw(); });
  };
  redraw();
};
function feeForm(kind, studentId, cb, id){
  const list = kind==='fee'?DB.d.fees:DB.d.fines;
  const f = id ? list.find(x=>x.id===id) : { title:'', course:'', date:today(), amount:0, paid:0, status:'Unpaid', note:'' };
  modal({ title:(id?'Edit ':'Add ')+(kind==='fee'?'Fee':'Fine'), width:'620px',
    body:`<div class="grid2">${field('Title','ff_t',f.title)}
      ${field('Course','ff_c',f.course,'select',['',...DB.d.courses.map(c=>c.name)])}
      ${field('Date','ff_d',f.date,'date')}${field('Amount','ff_a',f.amount,'number')}
      ${field('Paid','ff_p',f.paid,'number')}${field('Status','ff_s',f.status,'select',['Unpaid','Partial','Paid','Waived'])}
      ${field('Note','ff_n',f.note,'textarea')}</div>`,
    footer:`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="ffSave">💾 Save</button>` });
  $('#ffSave').onclick=()=>{
    if(!guard('editFinance')) return;
    const o={ title:val('ff_t')||(kind==='fee'?'Course Fee':'Fine'), course:val('ff_c'), date:val('ff_d'),
      amount:+val('ff_a')||0, paid:+val('ff_p')||0, status:val('ff_s'), note:val('ff_n') };
    if(id) Object.assign(f,o); else list.push({ id:uid(kind), studentId, ...o });
    DB.save(); DB.log(kind+' saved', o.title); closeModal(); cb&&cb(); toast('Saved');
  };
}

SPTABS['Files'] = (d, st) => {
  /* item 18: built-in viewer/player + editable titles & metadata */
  st.files = st.files||[];
  const redraw = () => {
    d.innerHTML = `<div class="toolbar glass">
        <button class="btn primary" id="fUp">${icon('clip')} Attach Files</button>
        <div class="grow"></div><span class="pill purple">${st.files.length} file(s)</span>
        ${customizeBtn('student-files')}</div>
      <div class="sect glass liquid"><h3>Attachments — open inside the app</h3>
      ${st.files.map((f,i)=>{
        const k = VIEW_KIND(f.ext);
        const ic = k==='image'?'eye':k==='video'||k==='audio'?'play':'file';
        return `<div class="file-row glass" data-open="${i}" style="cursor:pointer">
          <span style="font-size:18px">${icon(ic)}</span>
          <div class="f-n">${esc(f.name)}
            <div style="font-size:11.5px;color:var(--txt-dim);font-weight:400">
              ${esc(f.category||'General')}${(f.tags||[]).length?' · '+esc(f.tags.join(', ')):''}
              ${f.desc?' · '+esc(f.desc.slice(0,50)):''}</div></div>
          <span class="pill purple">${esc(f.ext||'file')}</span>
          <span class="pill">${Math.round((f.size||0)/1024)} KB</span>
          <button class="btn sm primary" data-view="${i}">${icon('play')} Open</button>
          <button class="btn sm danger" data-del="${i}">${icon('del')}</button></div>`;
      }).join('') || `<div class="empty">${icon('clip')}<br>No files attached yet</div>`}</div>`;
    $('#fUp',d).onclick=async()=>{ const fs=await window.api.pickFiles({multi:true});
      if(fs.length){ st.files.push(...fs); DB.save(); redraw(); toast(fs.length+' file(s) attached'); } };
    const open = i => openViewer(st.files[i], redraw);
    $$('[data-view]',d).forEach(b2=>b2.onclick=e=>{ e.stopPropagation(); open(+b2.dataset.view); });
    $$('[data-open]',d).forEach(r=>r.onclick=()=>open(+r.dataset.open));
    $$('[data-del]',d).forEach(b2=>b2.onclick=e=>{ e.stopPropagation();
      const f=st.files.splice(+b2.dataset.del,1)[0]; DB.trash('file',f); DB.save(); redraw(); });
    bindCustomize(d);
  };
  redraw();
};

SPTABS['Teacher Remarks'] = (d, st) => {
  st.remarks = st.remarks||[];
  const redraw=()=>{
    d.innerHTML=`<div class="sect glass liquid"><h3>🗒️ Teacher Remarks</h3>
      <div class="grid2">${field('Teacher','rk_t','','select',['',...DB.d.teachers.map(t=>t.fullName)])}
        ${field('Course','rk_c','','select',['',...DB.d.courses.map(c=>c.name)])}
        ${field('Rating (1-10)','rk_r','8','number')}${field('Date','rk_d',today(),'date')}</div>
      ${field('Remark','rk_x','','textarea')}
      <button class="btn primary" id="rkAdd">➕ Add Remark</button>
      <div style="margin-top:14px">${st.remarks.map((r,i)=>`<div class="sect glass" style="margin-bottom:9px">
        <div style="display:flex;gap:8px;align-items:center"><b>${esc(r.teacher||'Teacher')}</b>
        <span class="pill gold">${esc(r.course||'General')}</span><span class="pill purple">⭐ ${esc(r.rating)}</span>
        <span style="flex:1"></span><span style="font-size:11.5px;color:var(--txt-dim)">${esc(r.date)}</span>
        <button class="btn sm danger" data-rk="${i}">🗑</button></div>
        <div style="margin-top:7px;font-size:13.5px">${esc(r.text)}</div></div>`).join('')
        || '<div style="color:var(--txt-dim);font-size:13px">No remarks yet</div>'}</div></div>`;
    $('#rkAdd',d).onclick=()=>{ if(!val('rk_x'))return toast('Write a remark','warn');
      st.remarks.unshift({teacher:val('rk_t'),course:val('rk_c'),rating:val('rk_r'),date:val('rk_d'),text:val('rk_x')});
      (st.timeline=st.timeline||[]).unshift({time:new Date().toISOString(),text:'Teacher remark added'});
      DB.save(); redraw(); toast('Remark added'); };
    $$('[data-rk]',d).forEach(b=>b.onclick=()=>{ st.remarks.splice(+b.dataset.rk,1); DB.save(); redraw(); });
  }; redraw();
};

SPTABS['Timeline'] = (d, st) => {
  st.timeline = st.timeline||[];
  const auto = [
    st.admissionDate ? {time:st.admissionDate, text:'Admission date'} : null,
    ...(st.courses||[]).map(c=>({time:(st.courseData?.[c]?.startDate)||st.admissionDate, text:'Enrolled in '+c}))
  ].filter(Boolean);
  const all=[...st.timeline.map(t=>({...t})), ...auto].sort((a,b)=>String(b.time).localeCompare(String(a.time)));
  d.innerHTML=`<div class="sect glass liquid"><h3>🕒 Timeline</h3>
    <div style="display:flex;gap:8px;margin-bottom:12px"><input class="inp" id="tlx" placeholder="Add a timeline note…">
      <input class="inp" id="tld" type="date" style="width:auto" value="${today()}"><button class="btn primary" id="tlAdd">➕ Add</button></div>
    ${all.map(t=>`<div class="kv"><b>${esc(String(t.time).slice(0,10))}</b><span>${esc(t.text)}</span></div>`).join('')||'<div style="color:var(--txt-dim)">No events</div>'}</div>`;
  $('#tlAdd',d).onclick=()=>{ if(!val('tlx'))return; st.timeline.unshift({time:val('tld'),text:val('tlx')}); DB.save(); SPTABS['Timeline'](d,st); };
};

/* ================= ACADEMICS ================= */
PAGES.courses = (el) => {
  el.innerHTML = head('Courses', `${DB.d.courses.filter(c=>c.active).length} active of ${DB.d.courses.length} total`,
    `${customizeBtn('courses')}${can('editCourses')?`<button class="btn primary" id="cAdd">${icon('add')} Add Course</button>`:''}`)
    + `<div class="cards view-cards" id="cList">${DB.d.courses.map(c=>{
      const en=DB.d.students.filter(s=>(s.courses||[]).includes(c.name));
      const avg=en.length?Math.round(en.reduce((a,s)=>a+courseProgress(s,c.name),0)/en.length):0;
      return `<div class="card glass liquid" data-id="${c.id}" style="flex-direction:column;align-items:stretch;border-left:4px solid ${c.color}">
        <div class="nm">${esc(c.name)}</div><div class="mt">${esc(c.code)} · ${esc(c.duration)} · ${DB.d.branding.currency} ${c.fee}</div>
        <div class="bar"><i style="width:${avg}%"></i></div>
        <div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap"><span class="pill ${c.active?'green':'gray'}">${c.active?'Active':'Inactive'}</span>
        <span class="pill purple">${en.length} students</span><span class="pill gold">${avg}% avg</span></div>
        <div style="font-size:12px;color:var(--txt-dim);margin-top:7px">${esc(c.desc||'No description')}</div></div>`;
    }).join('')}</div>`;
  $$('#cList .card',el).forEach(c=>c.onclick=()=>courseForm(c.dataset.id));
  const a=$('#cAdd',el); if(a) a.onclick=()=>courseForm();
  bindCustomize(el); applySectionStyle('courses');
};
function courseForm(id){
  const c = id ? DB.d.courses.find(x=>x.id===id) : { name:'', code:'', fee:2000, duration:'2 Months', instructor:'', desc:'', active:true, color:'#8b5cf6' };
  modal({ title:(id?'✏️ Edit':'➕ Add')+' Course', width:'680px',
    body:`<div class="grid2">${field('Course Name','co_n',c.name)}${field('Code','co_c',c.code)}
      ${field('Fee','co_f',c.fee,'number')}${field('Duration','co_d',c.duration)}
      ${field('Instructor','co_i',c.instructor,'select',['',...DB.d.teachers.map(t=>t.fullName)])}
      ${field('Panel Color','co_col',c.color,'color')}
      ${field('Active','co_a',c.active?'Yes':'No','select',['Yes','No'])}
      ${field('Description','co_desc',c.desc,'textarea')}</div>`,
    footer:`${id?'<button class="btn danger" id="coDel">🗑 Delete</button>':''}<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="coSave">💾 Save</button>` });
  const del=$('#coDel'); if(del) del.onclick=()=>{ if(!guard('deleteData'))return; DB.trash('course',c);
    DB.d.courses=DB.d.courses.filter(x=>x.id!==id); DB.save(); closeModal(); render(); };
  $('#coSave').onclick=()=>{ if(!guard('editCourses'))return;
    const o={name:val('co_n'),code:val('co_c'),fee:+val('co_f')||0,duration:val('co_d'),instructor:val('co_i'),
      color:val('co_col'),active:val('co_a')==='Yes',desc:val('co_desc')};
    if(id) Object.assign(c,o); else DB.d.courses.push({id:uid('c'),...o});
    DB.save(); DB.log(id?'Edited course':'Added course',o.name); closeModal(); render(); toast('Course saved'); };
}

PAGES.lessons = (el) => {
  const s = DB.d.settings;
  s.lpeTab = s.lpeTab || 'Exercises';
  const kinds = { Exercises:'exercises', Phases:'phases', Lessons:'lessons' };
  const key = kinds[s.lpeTab];
  s.lpeView = s.lpeView || 'cards';
  el.innerHTML = head(s.lpeTab, 'Lessons · Phases · Exercises library',
    `${customizeBtn('lessons')}<button class="btn primary" id="lAdd">${icon('add')} Add ${s.lpeTab.replace(/s$/,'')}</button>`)
    + `<div class="tabs glass">${Object.keys(kinds).map(k=>`<div class="tab ${k===s.lpeTab?'active':''}" data-k="${k}">${k}</div>`).join('')}</div>
    <div class="toolbar glass">${viewControl('lpe', s.lpeView)}<span style="font-size:12px;color:var(--txt-dim)">Stack order</span>
      ${stackSelect('lStack', s.lStack||'Exercises First', ['Exercises First','Phases First','Lessons First','Newest First','Oldest First'])}</div>
    <div class="cards view-${s.lpeView}" id="lList">${(DB.d[key]||[]).map((x,i)=>`
      <div class="card glass liquid" data-i="${i}" style="flex-direction:column;align-items:stretch">
        <div class="nm">${esc(x.name)}</div><div class="mt">${esc(x.course||'General')} · ${esc(x.date||'')}</div>
        ${x.image?`<img src="${x.image}" style="width:100%;max-height:130px;object-fit:cover;border-radius:10px;margin-top:8px">`:''}
        <div style="font-size:12.5px;margin-top:8px;color:var(--txt-dim)">${esc((x.questions||x.desc||'').slice(0,110))}</div>
        <div style="margin-top:8px">${(x.files||[]).map(f=>`<span class="pill purple">${esc(f.name)}</span>`).join(' ')}</div>
      </div>`).join('') || `<div class="empty glass" style="grid-column:1/-1"><span class="e">🧩</span>No ${s.lpeTab.toLowerCase()} yet</div>`}</div>`;
  $$('.tab[data-k]',el).forEach(t=>t.onclick=()=>{ s.lpeTab=t.dataset.k; DB.save(); render(); });
  $$('[data-vid="lpe"]',el).forEach(v=>v.onclick=()=>{ s.lpeView=v.dataset.view; DB.save(); render(); });
  $('#lStack',el).onchange=e=>{ s.lStack=e.target.value; DB.save(); };
  $('#lAdd',el).onclick=()=>lpeForm(key);
  $$('#lList .card',el).forEach(c=>c.onclick=()=>lpeForm(key, +c.dataset.i));
  bindCustomize(el); applySectionStyle('lessons');
};
function lpeForm(key, idx){
  const list = DB.d[key] = DB.d[key]||[];
  const x = idx!=null ? list[idx] : { name:'', course:'', date:today(), desc:'', questions:'', image:'', files:[] };
  let image = x.image||'', files=[...(x.files||[])];
  modal({ title:(idx!=null?'✏️ Edit ':'➕ Add ')+key.replace(/s$/,''), width:'760px',
    body:`<div class="grid2">${field('Name / Title','lp_n',x.name)}
      ${field('Course','lp_c',x.course,'select',['',...DB.d.courses.map(c=>c.name)])}
      ${field('Date','lp_d',x.date,'date')}${field('Duration / Marks','lp_m',x.marks)}</div>
      ${field('Details / Description','lp_desc',x.desc,'textarea')}
      ${field('Questions (for tests)','lp_q',x.questions,'textarea')}
      <div style="margin-top:10px;display:flex;gap:12px;align-items:center">
        <img id="lpImg" src="${image||asset('logo.png')}" style="width:88px;height:88px;object-fit:cover;border-radius:12px;border:1px solid var(--glass-brd)">
        <button class="btn sm" id="lpPick">🖼 Upload Image</button>
        <button class="btn sm" id="lpFiles">📎 Attach Files</button>
        <span id="lpFcount" class="pill purple">${files.length} file(s)</span></div>`,
    footer:`${idx!=null?'<button class="btn danger" id="lpDel">🗑 Delete</button>':''}<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="lpSave">💾 Save</button>` });
  $('#lpPick').onclick=()=>pickPhoto('lpImg', u=>image=u);
  $('#lpFiles').onclick=async()=>{ const f=await window.api.pickFiles({multi:true}); files.push(...f); $('#lpFcount').textContent=files.length+' file(s)'; };
  const del=$('#lpDel'); if(del) del.onclick=()=>{ DB.trash(key,x); list.splice(idx,1); DB.save(); closeModal(); render(); };
  $('#lpSave').onclick=()=>{
    const o={name:val('lp_n')||'Untitled',course:val('lp_c'),date:val('lp_d'),marks:val('lp_m'),
      desc:val('lp_desc'),questions:val('lp_q'),image,files};
    if(idx!=null) Object.assign(x,o); else list.push({id:uid(key),created:new Date().toISOString(),...o});
    DB.save(); DB.log('Saved '+key, o.name); closeModal(); render(); toast('Saved');
  };
}

PAGES.batches = (el) => {
  el.innerHTML = head('Batches','Class batches, timings and enrolled students',`${customizeBtn('batches')}<button class="btn primary" id="bAdd">${icon('add')} Add Batch</button>`)
   + `<div class="cards view-cards">${DB.d.batches.map((b,i)=>`
      <div class="card glass liquid" data-i="${i}" style="flex-direction:column;align-items:stretch">
        <div class="nm">${esc(b.name)}</div>
        <div class="mt">${esc(b.course||'-')} · ${esc(b.timing||'-')} · ${esc(b.room||'')}</div>
        <div style="margin-top:8px"><span class="pill purple">${(b.students||[]).length} students</span>
        <span class="pill gold">${esc((DB.teacher(b.teacher)||{}).fullName||'No teacher')}</span>
        <span class="pill ${b.active?'green':'gray'}">${b.active?'Active':'Closed'}</span></div>
        <div style="font-size:12px;color:var(--txt-dim);margin-top:6px">${esc(b.startDate||'')} → ${esc(b.endDate||'')}</div></div>`).join('')
      || '<div class="empty glass" style="grid-column:1/-1"><span class="e">👥</span>No batches yet</div>'}</div>`;
  $('#bAdd',el).onclick=()=>batchForm();
  $$('.card[data-i]',el).forEach(c=>c.onclick=()=>batchForm(+c.dataset.i));
  bindCustomize(el); applySectionStyle('batches');
};
function batchForm(idx){
  const b = idx!=null ? DB.d.batches[idx] : { name:'', course:'', teacher:'', timing:'', room:'', startDate:today(), endDate:'', students:[], active:true };
  modal({ title:(idx!=null?'✏️ Edit':'➕ Add')+' Batch', width:'760px',
    body:`<div class="grid2">${field('Batch Name','b_n',b.name)}
      ${field('Course','b_c',b.course,'select',['',...DB.d.courses.map(c=>c.name)])}
      ${field('Teacher','b_t',(DB.teacher(b.teacher)||{}).fullName||'','select',['',...DB.d.teachers.map(t=>t.fullName)])}
      ${field('Timing','b_tm',b.timing)}${field('Room / Lab','b_r',b.room)}
      ${field('Start Date','b_s',b.startDate,'date')}${field('End Date','b_e',b.endDate,'date')}
      ${field('Active','b_a',b.active?'Yes':'No','select',['Yes','No'])}</div>
      <div style="margin-top:12px"><label class="f">Students</label><div class="chips" id="bStu">
      ${DB.d.students.map(s=>`<div class="chip ${(b.students||[]).includes(s.id)?'on':''}" data-s="${s.id}">${esc(s.fullName)}</div>`).join('')||'<span style="color:var(--txt-dim)">No students</span>'}</div></div>`,
    footer:`${idx!=null?'<button class="btn danger" id="bDel">🗑 Delete</button>':''}<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="bSave">💾 Save</button>` });
  $$('#bStu .chip').forEach(c=>c.onclick=()=>c.classList.toggle('on'));
  const del=$('#bDel'); if(del) del.onclick=()=>{ DB.trash('batch',b); DB.d.batches.splice(idx,1); DB.save(); closeModal(); render(); };
  $('#bSave').onclick=()=>{
    const t=DB.d.teachers.find(x=>x.fullName===val('b_t'));
    const o={name:val('b_n')||'Batch',course:val('b_c'),teacher:t?t.id:'',timing:val('b_tm'),room:val('b_r'),
      startDate:val('b_s'),endDate:val('b_e'),active:val('b_a')==='Yes',students:$$('#bStu .chip.on').map(c=>c.dataset.s)};
    if(idx!=null) Object.assign(b,o); else DB.d.batches.push({id:uid('b'),created:new Date().toISOString(),...o});
    DB.save(); closeModal(); render(); toast('Batch saved');
  };
}

/* ================= v1.1 additions ================= */

/* ---- item 8: per-section customization, available in EVERY section ---- */
function sectionCustomize(section){
  if(!requireAdmin()) return;
  DB.d.settings.sections = DB.d.settings.sections || {};
  const cfg = DB.d.settings.sections[section] = Object.assign(
    { title:'', accent:'', density:'Comfortable', showPhotos:true, showBadges:true,
      showProgress:true, cardRadius:18, animate:true, columns:'Auto' },
    DB.d.settings.sections[section]||{});
  modal({ title: icon('palette')+' Customize — '+esc(section), width:'700px',
    body:`<div class="form-grid">
        ${field('Custom Section Title (blank = default)','sc_t',cfg.title)}
        ${field('Section Accent Colour','sc_a',cfg.accent||DB.d.settings.accent,'color')}
        ${field('Density','sc_d',cfg.density,'select',['Compact','Comfortable','Spacious'])}
        ${field('Columns','sc_c',cfg.columns,'select',['Auto','2','3','4'])}
        ${field('Panel Corner Radius','sc_r',cfg.cardRadius,'number')}</div>
      <div class="sect glass" style="margin-top:16px"><h3>Panel Elements</h3>
        <div class="togline"><div class="g">Show photos / avatars</div><div class="switch ${cfg.showPhotos?'on':''}" data-sc="showPhotos"><i></i></div></div>
        <div class="togline"><div class="g">Show status badges</div><div class="switch ${cfg.showBadges?'on':''}" data-sc="showBadges"><i></i></div></div>
        <div class="togline"><div class="g">Show progress bars</div><div class="switch ${cfg.showProgress?'on':''}" data-sc="showProgress"><i></i></div></div>
        <div class="togline"><div class="g">Animations &amp; transitions</div><div class="switch ${cfg.animate?'on':''}" data-sc="animate"><i></i></div></div>
      </div>
      <p style="font-size:12px;color:var(--txt-dim)">Saved per section and applied for every user. Admin only.</p>`,
    footer:`<button class="btn danger" id="scReset">Reset</button>
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" id="scSave">${icon('save')} Save</button>` });
  $$('[data-sc]').forEach(t=>t.onclick=()=>t.classList.toggle('on'));
  $('#scReset').onclick=()=>{ delete DB.d.settings.sections[section]; DB.save(); closeModal(); render(); toast('Section reset'); };
  $('#scSave').onclick=()=>{
    cfg.title=val('sc_t'); cfg.accent=val('sc_a'); cfg.density=val('sc_d');
    cfg.columns=val('sc_c'); cfg.cardRadius=+val('sc_r')||18;
    $$('[data-sc]').forEach(t=>cfg[t.dataset.sc]=t.classList.contains('on'));
    DB.save(); DB.log('Section customized', section);
    applySectionStyle(section); closeModal(); render(); toast('Customization saved');
  };
}
function sectionCfg(section){
  return (DB.d.settings.sections||{})[section] || {};
}
function applySectionStyle(section){
  const c = sectionCfg(section);
  const el = $('#content'); if(!el) return;
  el.style.setProperty('--r', (c.cardRadius||18)+'px');
  if (c.columns && c.columns!=='Auto'){
    $$('.cards.view-cards',el).forEach(b=>b.style.gridTemplateColumns=`repeat(${c.columns},1fr)`);
  }
  const pad = c.density==='Compact'?'10px 12px':c.density==='Spacious'?'20px 24px':'';
  if(pad) $$('.card',el).forEach(x=>x.style.padding=pad);
  if(c.showPhotos===false) $$('.card .pic',el).forEach(x=>x.style.display='none');
  if(c.showBadges===false) $$('.card .pill',el).forEach(x=>x.style.display='none');
  if(c.showProgress===false) $$('.card .bar',el).forEach(x=>x.style.display='none');
  if(c.animate===false) $$('.card,.stat',el).forEach(x=>x.style.animation='none');
}

/* ---- item 18: built-in viewer / media player ---- */
const VIEW_KIND = ext => {
  ext=(ext||'').toLowerCase();
  if(['png','jpg','jpeg','gif','webp','bmp','svg','ico'].includes(ext)) return 'image';
  if(['mp4','webm','ogv','mkv','mov','avi'].includes(ext)) return 'video';
  if(['mp3','wav','ogg','oga','m4a','aac','flac','opus'].includes(ext)) return 'audio';
  if(ext==='pdf') return 'pdf';
  if(['txt','md','csv','json','log','js','css','html','xml','ini','yml','yaml'].includes(ext)) return 'text';
  if(['ppt','pptx','doc','docx','xls','xlsx'].includes(ext)) return 'office';
  return 'other';
};
async function openViewer(f, onSave){
  const kind = VIEW_KIND(f.ext);
  let stage = '<div class="empty">Preview not available for this format.</div>';
  if (kind==='image'){
    const u = await window.api.fileDataUrl(f.path);
    stage = u ? `<img src="${u}">` : stage;
  } else if (kind==='video' || kind==='audio'){
    const u = await window.api.mediaUrl(f.path);
    stage = kind==='video' ? `<video src="${u}" controls autoplay style="width:100%"></video>`
                           : `<audio src="${u}" controls autoplay style="width:100%"></audio>`;
  } else if (kind==='pdf'){
    const u = await window.api.mediaUrl(f.path);
    stage = `<iframe src="${u}"></iframe>`;
  } else if (kind==='text'){
    const t = await window.api.readText(f.path);
    stage = `<pre>${esc(t||'')}</pre>`;
  } else if (kind==='office'){
    const r = await window.api.officePreview(f.path);
    stage = r && r.html ? `<iframe srcdoc="${esc(r.html)}"></iframe>`
      : `<div class="empty">${icon('file')}<br>${esc(f.name)}<br><span style="font-size:12px">Built-in text extraction unavailable for this file.</span></div>`;
  }
  modal({ title: icon('play')+' '+esc(f.name), width:'1000px',
    body:`<div class="viewer-stage">${stage}</div>
      <div class="sect glass" style="margin-top:14px"><h3>File Details (editable)</h3>
        <div class="form-grid">
          ${field('Title / Name','vw_n',f.name)}
          ${field('Category','vw_c',f.category||'General')}
          ${field('Tags','vw_t',(f.tags||[]).join(', '))}
          ${field('Date Added','vw_d',(f.added||'').slice(0,10),'date')}</div>
        ${field('Description / Notes','vw_x',f.desc||'','textarea')}
        <div style="font-size:11.5px;color:var(--txt-dim);margin-top:8px">
          Type: ${esc(f.ext||'—')} · Size: ${Math.round((f.size||0)/1024)} KB</div>
      </div>`,
    footer:`<button class="btn sm" id="vwExt">Open Externally</button>
      <button class="btn" onclick="closeModal()">Close</button>
      <button class="btn primary" id="vwSave">${icon('save')} Save Details</button>` });
  $('#vwExt').onclick=()=>window.api.openFile(f.path);
  $('#vwSave').onclick=()=>{
    f.name=val('vw_n')||f.name; f.category=val('vw_c');
    f.tags=val('vw_t').split(',').map(x=>x.trim()).filter(Boolean);
    f.added=val('vw_d')||f.added; f.desc=val('vw_x');
    DB.save(); DB.log('File metadata edited', f.name); closeModal(); onSave&&onSave(); toast('Saved');
  };
}

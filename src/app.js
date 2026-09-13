/* ================= Daily Work, Finance, Resources, System, Login ================= */

/* ---------- Attendance (daily register) ---------- */
PAGES.attendance = (el) => {
  const s = DB.d.settings; s.attWho = s.attWho || 'Student';
  s.attDate = s.attDate || today();
  const who = s.attWho;

  const draw = () => {
    const date = s.attDate;
    const people = who==='Student'
      ? DB.d.students.filter(x=>!['Left','Graduated','Completed'].includes(x.status))
      : DB.d.teachers.filter(x=>x.status!=='Left');
    const marks = people.map(p=>getAtt(p.id,date));
    el.innerHTML = head('Attendance', 'Daily register · monthly summary · leave management',
        `<button class="btn sm" id="aExport">${icon('exp')} Export</button>
         <button class="btn sm gold" id="aMonth">${icon('reports')} Monthly Summary</button>
         ${customizeBtn('attendance')}`)
      + `<div class="tabs glass">${['Student','Teacher'].map(k=>`
          <div class="tab ${k===who?'active':''}" data-w="${k}">${icon(k==='Student'?'students':'teachers')} ${k} Attendance</div>`).join('')}</div>
        <div class="toolbar glass">
          <input class="inp" id="aDate" type="date" value="${date}" style="width:auto">
          <button class="btn sm" id="allP">${icon('check')} Mark all Present</button>
          <button class="btn sm danger" id="allA">Mark all Absent</button>
          <div class="grow"></div>
          <span class="pill green">P ${marks.filter(m=>m==='P').length}</span>
          <span class="pill red">A ${marks.filter(m=>m==='A').length}</span>
          <span class="pill gold">L ${marks.filter(m=>m==='L').length}</span>
          <span class="pill purple">Late ${marks.filter(m=>m==='T').length}</span></div>
        <div id="attList">${people.map((p,i)=>{
          /* item 19: one separate glass card per person, spaced status buttons */
          const cur=getAtt(p.id,date);
          const locked = who==='Student' && ((date < (p.admissionDate||'1900-01-01')) || date > today()) && !isAdmin();
          const ph = p.photo || (who==='Teacher' ? asset('teacher.png')
                    : (p.gender==='Female'?asset('girl.png'):asset('boy.png')));
          return `<div class="att-card glass liquid" style="animation:pageIn .35s ${Math.min(i*0.03,.4)}s both">
            <img class="pic" src="${ph}" style="width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid var(--glass-brd)">
            <div class="a-name"><b>${esc(p.fullName)}</b>
              <div class="a-sub">${esc(who==='Student' ? ((p.regNo||'')+' · '+((p.courses||[])[0]||'No course'))
                                                       : (p.qualification||'Instructor'))}</div></div>
            ${cur?`<span class="pill ${cur==='P'?'green':cur==='A'?'red':'gold'}">${cur==='T'?'Late':cur==='P'?'Present':cur==='A'?'Absent':'Leave'}</span>`:'<span class="pill gray">Not marked</span>'}
            <div class="mk-row">${['P','A','L','T'].map(m=>`
              <button class="mk ${cur===m?'on '+m:''}" data-p="${p.id}" data-m="${m}" ${locked?'disabled':''}
                title="${m==='P'?'Present':m==='A'?'Absent':m==='L'?'Leave':'Late'}">${m==='T'?'Lt':m}</button>`).join('')}</div>
          </div>`;
        }).join('') || `<div class="empty glass">${icon('attendance')}<br>No ${who.toLowerCase()}s to show</div>`}</div>`;

    $$('[data-w]',el).forEach(t=>t.onclick=()=>{ s.attWho=t.dataset.w; DB.save(); PAGES.attendance(el); });
    $('#aDate',el).onchange=e=>{ s.attDate=e.target.value; DB.save(); draw(); };
    $$('.mk',el).forEach(btn=>btn.onclick=()=>{
      if(!guard('editAttendance')) return;
      const sc=$('#content'), y=sc?sc.scrollTop:0;          // item 15: keep scroll
      const cur=getAtt(btn.dataset.p,s.attDate);
      const nm = cur===btn.dataset.m?null:btn.dataset.m;
      setAtt(btn.dataset.p, s.attDate, nm);
      if (nm && who==='Student') setPart(btn.dataset.p, s.attDate, defaultScoreFor(nm));
      draw(); if(sc) sc.scrollTop=y;
    });
    const markAll = m => { if(!guard('editAttendance'))return;
      const sc=$('#content'), y=sc?sc.scrollTop:0;
      people.forEach(p=>{ setAtt(p.id,s.attDate,m); if(who==='Student') setPart(p.id,s.attDate,defaultScoreFor(m)); });
      draw(); if(sc) sc.scrollTop=y; };
    $('#allP',el).onclick=()=>markAll('P'); $('#allA',el).onclick=()=>markAll('A');
    $('#aExport',el).onclick=()=>exportMenu(people.map(p=>({Name:p.fullName,Reg:p.regNo||'',Date:s.attDate,Mark:getAtt(p.id,s.attDate)||'-'})),'Attendance-'+s.attDate);
    $('#aMonth',el).onclick=()=>{
      const dates=monthDates(PSTATE.year,PSTATE.month);
      modal({title:`Monthly Summary — ${MONTHS[PSTATE.month]} ${PSTATE.year}`,width:'840px',
        body:`<table><tr><th>Name</th><th>P</th><th>A</th><th>L</th><th>Late</th><th>%</th></tr>${
          people.map(p=>{const t=studentAttStats(p.id,dates);
            return `<tr><td>${esc(p.fullName)}</td><td>${t.P}</td><td>${t.A}</td><td>${t.L}</td><td>${t.T}</td><td>${t.pct}%</td></tr>`}).join('')}</table>`});
    };
    bindCustomize(el);
    applySectionStyle('attendance');
  };
  draw();
};

/* ---------- Class participation marks (daily) ---------- */
PAGES.participation = (el) => {
  const s=DB.d.settings, a=s.academic;
  s.attDate = s.attDate || today();
  s.partWho = s.partWho || 'Student';

  const draw = () => {
    const date = s.attDate, who = s.partWho;
    /* item 20 fix: the old code filtered on status==='Active' only, so a fresh
       database (or students with any other status) rendered an empty screen.
       Now every non-archived person is listed, for students AND teachers. */
    const people = who==='Student'
      ? DB.d.students.filter(x=>!['Left','Graduated'].includes(x.status))
      : DB.d.teachers.filter(x=>x.status!=='Left');
    const scores = people.map(p=>getPart(p.id,date)).filter(v=>v!==null);
    const totalS = scores.reduce((x,y)=>x+y,0);

    el.innerHTML = head('Class Participation Marks',
        `Absent ${a.absentScore} · Leave ${a.leaveScore} · Present ${a.presentScore} → up to ${a.maxScore}`,
        `<button class="btn sm" id="pExport">${icon('exp')} Export</button>${customizeBtn('participation')}`)
      + `<div class="tabs glass">${['Student','Teacher'].map(k=>`
          <div class="tab ${k===who?'active':''}" data-pw="${k}">${icon(k==='Student'?'students':'teachers')} ${k}s</div>`).join('')}</div>
        <div class="toolbar glass">
          <input class="inp" id="pDate" type="date" value="${date}" style="width:auto">
          <button class="btn sm" id="pFill">${icon('check')} Auto-fill from attendance</button>
          <div class="grow"></div>
          <span class="pill purple">${people.length} listed</span>
          <span class="pill gold">${scores.length} scored</span>
          <span class="pill green">avg ${(scores.length?totalS/scores.length:0).toFixed(2)}</span></div>
        <div>${people.map((p,i)=>{
          const m=getAtt(p.id,date), v=getPart(p.id,date);
          const ph = p.photo || (who==='Teacher' ? asset('teacher.png')
                    : (p.gender==='Female'?asset('girl.png'):asset('boy.png')));
          return `<div class="att-card glass liquid" style="animation:pageIn .35s ${Math.min(i*0.03,.4)}s both">
            <img class="pic" src="${ph}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--glass-brd)">
            <div class="a-name"><b>${esc(p.fullName)}</b>
              <div class="a-sub">${esc(p.regNo||p.qualification||'')}</div></div>
            ${m?`<span class="pill ${m==='P'?'green':m==='A'?'red':'gold'}">${m==='T'?'Late':m}</span>`:'<span class="pill gray">Not marked</span>'}
            <div class="mk-row" style="align-items:center">
              <button class="btn sm" data-d="${p.id}">−</button>
              <input class="inp" style="width:86px;text-align:center" type="number" step="0.1" min="0"
                     max="${a.maxScore}" value="${v===null?'':v}" data-v="${p.id}">
              <button class="btn sm" data-i="${p.id}">+</button>
              <span class="pill gold">/ ${a.maxScore}</span></div>
          </div>`;
        }).join('') || `<div class="empty glass">${icon('participation')}<br>No ${who.toLowerCase()}s found. Add ${who==='Student'?'students':'teachers'} first.</div>`}</div>`;

    $$('[data-pw]',el).forEach(t=>t.onclick=()=>{ s.partWho=t.dataset.pw; DB.save(); draw(); });
    $('#pDate',el).onchange=e=>{ s.attDate=e.target.value; DB.save(); draw(); };
    const set=(id,v)=>{ if(!guard('editParticipation'))return;
      const sc=$('#content'), y=sc?sc.scrollTop:0;
      setPart(id,s.attDate,v); draw(); if(sc) sc.scrollTop=y; };
    $$('[data-i]',el).forEach(b2=>b2.onclick=()=>set(b2.dataset.i, Math.min(a.maxScore,(getPart(b2.dataset.i,s.attDate)??defaultScoreFor(getAtt(b2.dataset.i,s.attDate)))+0.1)));
    $$('[data-d]',el).forEach(b2=>b2.onclick=()=>set(b2.dataset.d, Math.max(0,(getPart(b2.dataset.d,s.attDate)??0)-0.1)));
    $$('[data-v]',el).forEach(i2=>i2.onchange=()=>set(i2.dataset.v, i2.value===''?null:+i2.value));
    $('#pFill',el).onclick=()=>{ if(!guard('editParticipation'))return;
      people.forEach(p=>{ const m=getAtt(p.id,s.attDate); if(m) setPart(p.id,s.attDate,defaultScoreFor(m)); });
      draw(); toast('Auto-filled from attendance'); };
    $('#pExport',el).onclick=()=>exportMenu(people.map(p=>({Name:p.fullName,Reg:p.regNo||'',Date:s.attDate,
      Attendance:getAtt(p.id,s.attDate)||'-',Score:getPart(p.id,s.attDate)??''})),'Participation-'+s.attDate);
    bindCustomize(el);
    applySectionStyle('participation');
  };
  draw();
};

/* ---------- Assessment ---------- */
PAGES.assignments = (el) => {
  const kinds=['Test','Quiz','Assignment','Presentation'];
  el.innerHTML = head('Tests, Quizzes, Assignments & Presentations','All assessments with attachments and grading criteria',
    customizeBtn('assignments')+kinds.map(k=>`<button class="btn ${k==='Test'?'primary':''} sm" data-add="${k}">${icon('add')} Add ${k}</button>`).join(''))
    + `<div class="cards view-cards">${DB.d.assessments.map((x,i)=>`
      <div class="card glass liquid" data-i="${i}" style="flex-direction:column;align-items:stretch">
        <div style="display:flex;gap:7px;align-items:center"><span class="pill purple">${esc(x.kind)}</span>
          <span class="pill gold">${esc(x.course||'General')}</span><span style="flex:1"></span>
          <span style="font-size:11.5px;color:var(--txt-dim)">${esc(x.date)}</span></div>
        <div class="nm" style="margin-top:7px">${esc(x.title)}</div>
        <div class="mt">${esc(x.student? (DB.student(x.student)||{}).fullName||'' : 'Whole class')} · ${esc(x.obtained||0)}/${esc(x.marks||0)}</div>
        <div style="font-size:12px;color:var(--txt-dim);margin-top:6px">${esc((x.criteria||'').slice(0,90))}</div>
        <div style="margin-top:7px">${(x.files||[]).map(f=>`<span class="pill">${esc(f.name)}</span>`).join(' ')}</div></div>`).join('')
      || '<div class="empty glass" style="grid-column:1/-1"><span class="e">📝</span>No assessments yet</div>'}</div>`;
  $$('[data-add]',el).forEach(b=>b.onclick=()=>assessForm(b.dataset.add));
  $$('.card[data-i]',el).forEach(c=>c.onclick=()=>assessForm(null,+c.dataset.i));
  bindCustomize(el); applySectionStyle('assignments');
};
function assessForm(kind, idx){
  const x = idx!=null ? DB.d.assessments[idx] : { kind, title:'', course:'', student:'', date:today(), marks:10, obtained:0, criteria:'', questions:'', files:[] };
  let files=[...(x.files||[])];
  modal({ title:(idx!=null?'✏️ Edit ':'➕ Add ')+(x.kind), width:'780px',
    body:`<div class="grid2">${field('Title','as_t',x.title)}
      ${field('Type','as_k',x.kind,'select',['Test','Quiz','Assignment','Presentation'])}
      ${field('Course','as_c',x.course,'select',['',...DB.d.courses.map(c=>c.name)])}
      ${field('Student (blank = whole class)','as_s',(DB.student(x.student)||{}).fullName||'','select',['',...DB.d.students.map(s=>s.fullName)])}
      ${field('Date','as_d',x.date,'date')}${field('Total Marks','as_m',x.marks,'number')}${field('Obtained','as_o',x.obtained,'number')}</div>
      ${field('Grading Criteria / Marking Details','as_cr',x.criteria,'textarea')}
      ${field('Questions / Topics','as_q',x.questions,'textarea')}
      <div style="margin-top:10px"><button class="btn sm" id="asF">📎 Upload work (image / video / audio / document)</button>
      <span class="pill purple" id="asFc">${files.length} file(s)</span></div>`,
    footer:`${idx!=null?'<button class="btn danger" id="asDel">🗑 Delete</button>':''}<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="asSave">💾 Save</button>` });
  $('#asF').onclick=async()=>{ const f=await window.api.pickFiles({multi:true}); files.push(...f); $('#asFc').textContent=files.length+' file(s)'; };
  const del=$('#asDel'); if(del) del.onclick=()=>{ DB.trash('assessment',x); DB.d.assessments.splice(idx,1); DB.save(); closeModal(); render(); };
  $('#asSave').onclick=()=>{
    const st=DB.d.students.find(s=>s.fullName===val('as_s'));
    const o={kind:val('as_k'),title:val('as_t')||'Untitled',course:val('as_c'),student:st?st.id:'',date:val('as_d'),
      marks:+val('as_m')||0,obtained:+val('as_o')||0,criteria:val('as_cr'),questions:val('as_q'),files};
    if(idx!=null) Object.assign(x,o); else DB.d.assessments.push({id:uid('as'),created:new Date().toISOString(),...o});
    DB.save(); DB.log('Assessment saved',o.title); closeModal(); render(); toast('Saved');
  };
}

PAGES.progress = (el) => {
  const rows = DB.d.students.map(s=>{
    const att=overallAtt(s.id);
    const pk=Object.keys(DB.d.participation).filter(k=>k.startsWith(s.id+'|'));
    const pa=pk.length?pk.reduce((a,k)=>a+DB.d.participation[k],0)/pk.length:0;
    const cp=(s.courses||[]).length?Math.round((s.courses||[]).reduce((a,c)=>a+courseProgress(s,c),0)/s.courses.length):0;
    const asg=DB.d.assessments.filter(a=>a.student===s.id);
    const marks=asg.reduce((a,x)=>a+(+x.marks||0),0), got=asg.reduce((a,x)=>a+(+x.obtained||0),0);
    return { s, att, pa, cp, tests:asg.length, pct: marks?Math.round(got/marks*100):0 };
  });
  el.innerHTML = head('Student Progress','Overall progress across attendance, participation, courses and tests',
    `<button class="btn sm" id="prExport">${icon('exp')} Export</button>${customizeBtn('progress')}`)
    + `<div class="cards view-cards">${rows.map(r=>`
      <div class="card glass liquid" data-id="${r.s.id}" style="flex-direction:column;align-items:stretch">
        <div class="nm">${esc(r.s.fullName)}</div><div class="mt">${esc(r.s.regNo||'')}</div>
        <div style="font-size:11.5px;margin-top:8px">Course progress <b style="color:var(--txt)">${r.cp}%</b></div><div class="bar"><i style="width:${r.cp}%"></i></div>
        <div style="font-size:11.5px;margin-top:8px">Attendance <b style="color:var(--txt)">${r.att.pct}%</b></div><div class="bar"><i style="width:${r.att.pct}%"></i></div>
        <div style="font-size:11.5px;margin-top:8px">Participation <b style="color:var(--txt)">${r.pa.toFixed(1)}/${DB.d.settings.academic.maxScore}</b></div>
        <div class="bar"><i style="width:${(r.pa/DB.d.settings.academic.maxScore*100).toFixed(0)}%"></i></div>
        <div style="margin-top:9px"><span class="pill purple">${r.tests} assessments</span><span class="pill gold">${r.pct}% marks</span></div>
      </div>`).join('') || '<div class="empty glass" style="grid-column:1/-1">No students</div>'}</div>`;
  $$('.card[data-id]',el).forEach(c=>c.onclick=()=>go('studentProfile',c.dataset.id));
  bindCustomize(el); applySectionStyle('progress');
  $('#prExport',el).onclick=()=>exportMenu(rows.map(r=>({Name:r.s.fullName,Reg:r.s.regNo,CourseProgress:r.cp+'%',Attendance:r.att.pct+'%',Participation:r.pa.toFixed(1),Assessments:r.tests,Marks:r.pct+'%'})),'Student-Progress');
};

/* ---------- Finance ---------- */
PAGES.finance = (el) => {
  const s=DB.d.settings; s.finFilter=s.finFilter||'all';
  const pendFees = DB.d.fees.filter(f=>f.status!=='Paid'), pendFines=DB.d.fines.filter(f=>f.status!=='Paid');
  const sum = a => a.reduce((x,f)=>x+(+f.amount||0)-(+f.paid||0),0);
  let list = DB.d.students;
  if (s.finFilter==='fees') list = list.filter(st=>pendFees.some(f=>f.studentId===st.id));
  if (s.finFilter==='fines') list = list.filter(st=>pendFines.some(f=>f.studentId===st.id));
  el.innerHTML = head('Fees & Fines','Editable roster of all fee and fine records',
    `<button class="btn sm" id="fExport">${icon('exp')} Export</button>${customizeBtn('finance')}<button class="btn primary" id="fAdd">${icon('add')} Add Record</button>`)
    + `<div class="stats" style="margin-bottom:12px">
        <div class="stat glass liquid ${s.finFilter==='fees'?'shimmer':''}" id="cardFees"><span class="ic">💵</span><div class="lbl">Fees Outstanding</div>
          <div class="val">${DB.d.branding.currency} ${sum(pendFees).toLocaleString()}</div><div class="foot">${pendFees.length} unpaid record(s) · click to filter</div></div>
        <div class="stat glass liquid ${s.finFilter==='fines'?'shimmer':''}" id="cardFines"><span class="ic">⚖️</span><div class="lbl">Fines Outstanding</div>
          <div class="val">${DB.d.branding.currency} ${sum(pendFines).toLocaleString()}</div><div class="foot">${pendFines.length} unpaid record(s) · click to filter</div></div>
        <div class="stat glass liquid" id="cardAll"><span class="ic">📋</span><div class="lbl">All Students</div>
          <div class="val">${DB.d.students.length}</div><div class="foot">Show everyone</div></div></div>
      <div class="sect glass liquid"><table>
        <tr><th>Reg</th><th>Student</th><th>Fees Due</th><th>Fines Due</th><th>Total Pending</th><th>Status</th><th></th></tr>
        ${list.map(st=>{
          const fd=sum(pendFees.filter(f=>f.studentId===st.id)), fn=sum(pendFines.filter(f=>f.studentId===st.id));
          return `<tr><td>${esc(st.regNo||'')}</td><td><b>${esc(st.fullName)}</b></td>
            <td>${DB.d.branding.currency} ${fd}</td><td>${DB.d.branding.currency} ${fn}</td>
            <td><b style="color:var(--txt)">${DB.d.branding.currency} ${fd+fn}</b></td>
            <td><span class="pill ${fd+fn?'red':'green'}">${fd+fn?'Pending':'Clear'}</span></td>
            <td style="text-align:right"><button class="btn sm" data-fee="${st.id}">💵 Fee</button>
              <button class="btn sm danger" data-fine="${st.id}">⚖️ Fine</button>
              <button class="btn sm" data-open="${st.id}">👁 Open</button></td></tr>`}).join('')}
      </table>${list.length?'':'<div class="empty">Nothing here</div>'}</div>`;
  $('#cardFees',el).onclick=()=>{ s.finFilter=s.finFilter==='fees'?'all':'fees'; DB.save(); render(); };
  $('#cardFines',el).onclick=()=>{ s.finFilter=s.finFilter==='fines'?'all':'fines'; DB.save(); render(); };
  $('#cardAll',el).onclick=()=>{ s.finFilter='all'; DB.save(); render(); };
  $$('[data-fee]',el).forEach(b=>b.onclick=()=>feeForm('fee',b.dataset.fee,()=>render()));
  $$('[data-fine]',el).forEach(b=>b.onclick=()=>feeForm('fine',b.dataset.fine,()=>render()));
  $$('[data-open]',el).forEach(b=>b.onclick=()=>go('studentProfile',b.dataset.open));
  $('#fAdd',el).onclick=()=>{ if(DB.d.students[0]) feeForm('fee',DB.d.students[0].id,()=>render()); else toast('Add a student first','warn'); };
  bindCustomize(el); applySectionStyle('finance');
  $('#fExport',el).onclick=()=>exportMenu(DB.d.students.map(st=>({Reg:st.regNo,Name:st.fullName,
    FeesDue:sum(pendFees.filter(f=>f.studentId===st.id)),FinesDue:sum(pendFines.filter(f=>f.studentId===st.id)),Total:studentPending(st.id)})),'Fees-and-Fines');
};

/* ---------- Resources ---------- */
PAGES.materials = (el) => {
  DB.d.materials = DB.d.materials||[];
  el.innerHTML = head('Learning Materials','Organised by chapter and phase',`${customizeBtn('materials')}<button class="btn primary" id="mAdd">${icon('add')} Add Chapter</button>`)
    + `<div id="mList">${DB.d.materials.map((m,i)=>`
      <div class="sect glass liquid"><h3>📘 ${esc(m.chapter)} <span class="pill purple">${esc(m.course||'General')}</span>
        <button class="btn sm" data-ph="${i}" style="float:right">➕ Add Phase</button>
        <button class="btn sm danger" data-chdel="${i}" style="float:right;margin-right:6px">🗑</button></h3>
        ${(m.phases||[]).map((p,j)=>`<div class="kv"><b>${esc(p.name)}</b><span>
          ${(p.files||[]).map(f=>`<span class="pill gold" data-of="${esc(f.path)}" style="cursor:pointer">${esc(f.name)}</span>`).join(' ')}
          <button class="btn sm" data-up="${i}:${j}">📎 Upload</button>
          <button class="btn sm danger" data-phd="${i}:${j}">🗑</button></span></div>`).join('')||'<div style="color:var(--txt-dim);font-size:13px">No phases</div>'}
      </div>`).join('') || '<div class="empty glass"><span class="e">📖</span>No chapters yet</div>'}</div>`;
  $('#mAdd',el).onclick=()=>modalPrompt('Add Chapter',[['Chapter Name','ch'],['Course','co']],v=>{
    DB.d.materials.push({chapter:v.ch||'Chapter',course:v.co,phases:[]}); DB.save(); render(); });
  $$('[data-ph]',el).forEach(b=>b.onclick=()=>modalPrompt('Add Phase',[['Phase Name','ph']],v=>{
    DB.d.materials[b.dataset.ph].phases.push({name:v.ph||'Phase',files:[]}); DB.save(); render(); }));
  $$('[data-up]',el).forEach(b=>b.onclick=async()=>{ const [i,j]=b.dataset.up.split(':');
    const f=await window.api.pickFiles({multi:true}); if(f.length){ const p=DB.d.materials[i].phases[j]; p.files=(p.files||[]).concat(f); DB.save(); render(); }});
  $$('[data-phd]',el).forEach(b=>b.onclick=()=>{ const [i,j]=b.dataset.phd.split(':'); DB.d.materials[i].phases.splice(j,1); DB.save(); render(); });
  $$('[data-chdel]',el).forEach(b=>b.onclick=()=>{ DB.trash('chapter',DB.d.materials[b.dataset.chdel]); DB.d.materials.splice(b.dataset.chdel,1); DB.save(); render(); });
  $$('[data-of]',el).forEach(b=>b.onclick=()=>window.api.openFile(b.dataset.of));
  bindCustomize(el); applySectionStyle('materials');
};
function modalPrompt(title, fields, cb){
  modal({title, width:'520px', body:fields.map(([l,i])=>field(l,'mp_'+i,'')).join(''),
    footer:`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="mpOk">OK</button>`});
  $('#mpOk').onclick=()=>{ const v={}; fields.forEach(([l,i])=>v[i]=val('mp_'+i)); closeModal(); cb(v); };
}

/* item 21: ten demo systems are seeded the first time the Lab is opened */
const DEMO_LAB = [
  {name:'PC-01', cpu:'Intel Core i5-10400 @ 2.90GHz (6C/12T)', mb:'Gigabyte H410M H V3', ram:'8 GB DDR4', storage:'512 GB NVMe SSD', os:'Windows 11 Pro 23H2', condition:'Working'},
  {name:'PC-02', cpu:'Intel Core i5-9400 @ 2.90GHz (6C/6T)',  mb:'ASUS PRIME H310M-E',   ram:'8 GB DDR4', storage:'480 GB SSD',      os:'Windows 11 Pro 23H2', condition:'Working'},
  {name:'PC-03', cpu:'Intel Core i3-10100 @ 3.60GHz (4C/8T)', mb:'MSI H510M PRO',        ram:'8 GB DDR4', storage:'256 GB SSD + 1 TB HDD', os:'Windows 10 Pro 22H2', condition:'Working'},
  {name:'PC-04', cpu:'AMD Ryzen 5 3600 @ 3.60GHz (6C/12T)',   mb:'ASRock B450M Steel Legend', ram:'16 GB DDR4', storage:'1 TB NVMe SSD', os:'Windows 11 Pro 23H2', condition:'Working'},
  {name:'PC-05', cpu:'Intel Core i7-8700 @ 3.20GHz (6C/12T)', mb:'Dell OptiPlex 3060 OEM', ram:'16 GB DDR4', storage:'512 GB SSD', os:'Windows 11 Pro 23H2', condition:'Working'},
  {name:'PC-06', cpu:'Intel Core i5-7500 @ 3.40GHz (4C/4T)',  mb:'HP ProDesk 400 G4 OEM', ram:'8 GB DDR4', storage:'256 GB SSD', os:'Windows 10 Pro 22H2', condition:'Needs Repair'},
  {name:'PC-07', cpu:'AMD Ryzen 3 3200G @ 3.60GHz (4C/4T)',   mb:'Gigabyte A320M-S2H',   ram:'8 GB DDR4', storage:'480 GB SSD', os:'Windows 11 Pro 23H2', condition:'Working'},
  {name:'PC-08', cpu:'Intel Core i3-9100 @ 3.60GHz (4C/4T)',  mb:'ASUS PRIME B365M-K',   ram:'4 GB DDR4', storage:'1 TB HDD',   os:'Windows 10 Pro 22H2', condition:'Working'},
  {name:'PC-09', cpu:'Intel Pentium G5400 @ 3.70GHz (2C/4T)', mb:'Biostar H310MHP',      ram:'4 GB DDR4', storage:'240 GB SSD', os:'Windows 10 Pro 21H2', condition:'Faulty'},
  {name:'PC-10', cpu:'Intel Core i5-11400 @ 2.60GHz (6C/12T)',mb:'MSI PRO B560M-A',      ram:'16 GB DDR4',storage:'1 TB NVMe SSD', os:'Windows 11 Pro 24H2', condition:'Working'}
];
PAGES.lab = (el) => {
  DB.d.lab = DB.d.lab||[];
  if (!DB.d.lab.length && !DB.d.settings.labSeeded){
    DB.d.lab = DEMO_LAB.map(x=>({ ...x, assigned:'', note:'Lab workstation', id:uid('lab') }));
    DB.d.settings.labSeeded = true; DB.save();
  }
  const ok = DB.d.lab.filter(x=>x.condition==='Working').length;
  el.innerHTML = head('Computer Lab', `${DB.d.lab.length} systems · ${ok} working`,
      `<button class="btn sm" id="labExp">${icon('exp')} Export</button>
       ${customizeBtn('lab')}
       <button class="btn sm" id="labSeed">Reload Demo Set</button>
       <button class="btn primary" id="labAdd">${icon('add')} Add System</button>`)
    + `<div class="cards view-cards">${DB.d.lab.map((x,i)=>`
      <div class="card glass liquid" data-i="${i}" style="flex-direction:column;align-items:stretch;
           border-left:4px solid ${x.condition==='Working'?'#3cdc8c':x.condition==='Faulty'?'#ff3b5c':'#ffc84a'}">
        <div style="display:flex;align-items:center;gap:9px">
          <span style="font-size:19px">${icon('lab')}</span>
          <div class="nm" style="flex:1">${esc(x.name)}</div>
          <span class="pill ${x.condition==='Working'?'green':x.condition==='Faulty'?'red':'gold'}">${esc(x.condition)}</span></div>
        <div style="margin-top:10px">
          <div class="spec"><b>Processor</b><span>${esc(x.cpu||x.specs||'—')}</span></div>
          <div class="spec"><b>Motherboard</b><span>${esc(x.mb||'—')}</span></div>
          <div class="spec"><b>RAM</b><span>${esc(x.ram||'—')}</span></div>
          <div class="spec"><b>Storage</b><span>${esc(x.storage||'—')}</span></div>
          <div class="spec"><b>Windows</b><span>${esc(x.os||'—')}</span></div>
          <div class="spec"><b>Status</b><span>${esc(x.condition)}</span></div>
          <div class="spec" style="border:0"><b>Assigned</b><span>${esc(x.assigned||'Unassigned')}</span></div>
        </div></div>`).join('')}</div>`;
  const form = idx => { const x = idx!=null?DB.d.lab[idx]:{name:'',cpu:'',mb:'',ram:'',storage:'',os:'Windows 11 Pro',condition:'Working',assigned:'',note:''};
    modal({title:(idx!=null?'Edit':'Add')+' System',width:'720px',
      body:`<div class="form-grid">${field('System Name / Number','lb_n',x.name)}
        ${field('Processor','lb_cpu',x.cpu||x.specs)}${field('Motherboard','lb_mb',x.mb)}
        ${field('RAM','lb_ram',x.ram)}${field('Storage','lb_st',x.storage)}
        ${field('Windows Version','lb_os',x.os)}
        ${field('Working Status','lb_c',x.condition,'select',['Working','Needs Repair','Faulty','Retired'])}
        ${field('Assigned To','lb_a',x.assigned,'select',['',...DB.d.students.map(s2=>s2.fullName)])}</div>
        <div class="sect glass">${field('Note','lb_no',x.note,'textarea')}</div>`,
      footer:`${idx!=null?`<button class="btn danger" id="lbDel">${icon('del')}</button>`:''}
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn primary" id="lbSave">${icon('save')} Save</button>`});
    const d2=$('#lbDel'); if(d2) d2.onclick=()=>{ DB.d.lab.splice(idx,1); DB.save(); closeModal(); render(); };
    $('#lbSave').onclick=()=>{ const o={name:val('lb_n')||'PC',cpu:val('lb_cpu'),mb:val('lb_mb'),ram:val('lb_ram'),
        storage:val('lb_st'),os:val('lb_os'),condition:val('lb_c'),assigned:val('lb_a'),note:val('lb_no')};
      if(idx!=null) Object.assign(x,o); else DB.d.lab.push({id:uid('lab'),...o});
      DB.save(); closeModal(); render(); toast('Saved'); }; };
  $('#labAdd',el).onclick=()=>form();
  $('#labSeed',el).onclick=()=>{ if(confirm('Replace the list with the 10 demo systems?')){
    DB.d.lab = DEMO_LAB.map(x=>({...x,assigned:'',note:'Lab workstation',id:uid('lab')})); DB.save(); render(); } };
  $('#labExp',el).onclick=()=>exportMenu(DB.d.lab.map(x=>({System:x.name,Processor:x.cpu,Motherboard:x.mb,
    RAM:x.ram,Storage:x.storage,Windows:x.os,Status:x.condition,Assigned:x.assigned})),'Computer-Lab');
  $$('.card[data-i]',el).forEach(c=>c.onclick=()=>form(+c.dataset.i));
  bindCustomize(el); applySectionStyle('lab');
};

/* ---------- ID Cards (designer) ---------- */
PAGES.idcards = (el) => {
  /* item 22: two sessions instead of three tabs; portrait default for students,
     landscape default for teachers; customization opens the advanced designer. */
  const s=DB.d.settings;
  s.idSession = s.idSession==='Teacher' ? 'Teacher' : 'Student';
  s.idOrient = s.idOrient || {};
  if (s.idOrient.Student===undefined) s.idOrient.Student='Portrait';
  if (s.idOrient.Teacher===undefined) s.idOrient.Teacher='Landscape';
  const sess = s.idSession;
  const teacher = sess==='Teacher';
  const subhead = teacher ? 'Customize Teacher ID Card' : 'Customize Student ID';

  el.innerHTML = head('ID Cards', 'Print · batch export · 600 DPI',
      `<button class="btn sm" id="idPrint">${icon('print')} Print</button>
       <button class="btn sm" id="idExport">${icon('exp')} Batch Export</button>
       ${customizeBtn('idcards')}`)
    + `<div class="tabs glass">${['Student','Teacher'].map(k=>`
        <div class="tab ${k===sess?'active':''}" data-sess="${k}">${icon(k==='Student'?'students':'teachers')} ${k} Session</div>`).join('')}</div>
      <div class="page-head glass liquid"><div><h1 style="font-size:18px">${esc(sess)} Session</h1>
        <div class="sub">${esc(subhead)}</div></div><div class="spacer"></div>
        <button class="btn primary" id="idDesign">${icon('palette')} ${esc(subhead)}</button></div>
      <div class="toolbar glass">
        <span style="font-size:12px;color:var(--txt-dim)">Orientation</span>
        <select class="inp" id="orient" style="width:auto">
          <option ${s.idOrient[sess]==='Portrait'?'selected':''}>Portrait</option>
          <option ${s.idOrient[sess]==='Landscape'?'selected':''}>Landscape</option></select>
        <span class="pill gold">Default: ${teacher?'Landscape':'Portrait'}</span>
        <span style="font-size:12px;color:var(--txt-dim)">Export DPI</span>
        <select class="inp" id="dpi" style="width:auto"><option>150</option><option>300</option><option selected>600</option></select>
        <div class="grow"></div><span class="pill purple" id="idCount"></span></div>
      <div class="cards view-cards" id="idList"></div>`;

  const people = teacher?DB.d.teachers:DB.d.students;
  const drawCards=()=>{
    const L=$('#orient',el).value==='Landscape';
    s.idOrient[sess]=$('#orient',el).value; DB.save();
    $('#idCount',el).textContent = people.length+' card(s)';
    $('#idList',el).innerHTML = people.map(p=>idCardHTML(p, teacher, L)).join('')
      || `<div class="empty glass" style="grid-column:1/-1">${icon('idcards')}<br>No ${sess.toLowerCase()} records yet</div>`;
  };
  drawCards();
  $$('[data-sess]',el).forEach(t=>t.onclick=()=>{ s.idSession=t.dataset.sess; DB.save(); render(); });
  $('#orient',el).onchange=drawCards;
  $('#idDesign',el).onclick=()=>idDesignerModal(sess);
  $('#idPrint',el).onclick=()=>window.api.printPage();
  $('#idExport',el).onclick=async()=>{
    const dpi=+$('#dpi',el).value;
    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Segoe UI;background:#fff}
      .wrap{display:flex;flex-wrap:wrap;gap:12px}</style></head><body><div class="wrap">${
      people.map(p=>idCardHTML(p, teacher, $('#orient',el).value==='Landscape')).join('')}</div></body></html>`;
    const path = await window.api.saveAs({defaultName:`ID-Cards-${sess}-${dpi}dpi.html`, data:html});
    if (path) toast('Exported (print at '+dpi+' DPI): '+path);
  };
  bindCustomize(el); applySectionStyle('idcards');
};
function idDesignerModal(sess){
  modal({ title: icon('palette')+' '+(sess==='Teacher'?'Customize Teacher ID Card':'Customize Student ID'),
    width:'1150px', body:`<div id="designHost"></div>` });
  idDesigner($('#designHost'), sess);
}

function idCardHTML(p, teacher, landscape){
  const t = DB.d.idcardTemplates[teacher?1:0] || {};
  const b = DB.d.branding;
  const ph = p.photo || (teacher?asset('teacher.png'):(p.gender==='Female'?asset('girl.png'):asset('boy.png')));
  const W = landscape?400:250, H = landscape?250:400;
  return `<div class="idcard" style="width:${W}px;height:${H}px;background:${t.bg||'linear-gradient(150deg,#12081f,#3b1a5e 55%,#ff7a18)'};color:#fff;padding:14px;display:flex;flex-direction:${landscape?'row':'column'};gap:12px;align-items:center;text-align:center">
    <div><img src=asset('logo.png') style="width:44px;height:44px;object-fit:contain">
      <div style="font-weight:800;font-size:15px;color:#ffc84a">${esc(b.institute)}</div>
      <div style="font-size:9px;letter-spacing:1px;opacity:.8">${esc(b.tagline||'')}</div></div>
    <img src="${ph}" style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid #ffc84a">
    <div><div style="font-weight:800;font-size:15px">${esc(p.fullName)}</div>
      <div style="font-size:11px;opacity:.85">${esc(teacher?(p.qualification||'Instructor'):(p.fatherName||''))}</div>
      <div style="font-size:11px;margin-top:5px;background:rgba(255,255,255,.18);border-radius:8px;padding:3px 8px">${esc(p.regNo||'')}</div>
      <div style="font-size:10px;margin-top:6px;opacity:.85">${esc(teacher?('Joined '+(p.joinDate||'')):((p.courses||[])[0]||''))}</div>
      <div style="font-size:9px;margin-top:6px;opacity:.7">${esc(b.phone||'')} ${esc(b.email||'')}</div></div>
  </div>`;
}
function idDesigner(body, sess){
  const slot = sess==='Teacher' ? 1 : 0;
  DB.d.idcardTemplates[slot] = DB.d.idcardTemplates[slot] || { bg:'#2b1055', els:[] };
  const t = DB.d.idcardTemplates[slot];
  body.innerHTML = `<div class="toolbar glass">
      <button class="btn sm" data-add="text">🔤 Text</button><button class="btn sm" data-add="rect">▭ Rectangle</button>
      <button class="btn sm" data-add="circle">⬤ Circle</button><button class="btn sm" data-add="line">╱ Line</button>
      <button class="btn sm" data-add="image">🖼 Image / Logo</button>
      <span style="font-size:12px;color:var(--txt-dim)">Background</span><input class="inp" type="color" id="bgCol" value="${/^#/.test(t.bg)?t.bg:'#2b1055'}" style="width:56px;padding:3px">
      <div class="grow"></div><button class="btn sm danger" id="clr">🗑 Clear</button><button class="btn primary sm" id="svT">💾 Save Template</button></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <div class="sect glass liquid" style="flex:1;min-width:420px"><h3>Canvas — drag any element</h3>
        <div class="canvas-wrap"><div id="cv" style="width:${sess==='Teacher'?620:400}px;height:${sess==='Teacher'?400:620}px;position:relative;background:${t.bg};border-radius:12px;overflow:hidden"></div></div></div>
      <div class="sect glass liquid" style="width:290px"><h3>Properties</h3><div id="props"><div style="color:var(--txt-dim);font-size:13px">Select an element</div></div></div></div>`;
  const cv=$('#cv',body); let selIdx=null;
  const paint=()=>{
    cv.style.background=t.bg;
    cv.innerHTML=t.els.map((e,i)=>{
      const base=`position:absolute;left:${e.x}px;top:${e.y}px;cursor:move;outline:${selIdx===i?'2px dashed #ff7a18':'none'}`;
      if(e.type==='text') return `<div data-i="${i}" style="${base};color:${e.color};font-size:${e.size}px;font-weight:${e.bold?800:400};font-family:${e.font}">${esc(e.text)}</div>`;
      if(e.type==='rect') return `<div data-i="${i}" style="${base};width:${e.w}px;height:${e.h}px;background:${e.color};border-radius:${e.r}px;opacity:${e.op}"></div>`;
      if(e.type==='circle') return `<div data-i="${i}" style="${base};width:${e.w}px;height:${e.w}px;background:${e.color};border-radius:50%;opacity:${e.op}"></div>`;
      if(e.type==='line') return `<div data-i="${i}" style="${base};width:${e.w}px;height:${e.h}px;background:${e.color};transform:rotate(${e.rot}deg)"></div>`;
      if(e.type==='image') return `<img data-i="${i}" src="${e.src||asset('logo.png')}" style="${base};width:${e.w}px;height:${e.h}px;object-fit:contain">`;
      return '';
    }).join('');
    $$('[data-i]',cv).forEach(n=>{
      n.onmousedown=ev=>{
        selIdx=+n.dataset.i; showProps(); ev.preventDefault();
        const e=t.els[selIdx], sx=ev.clientX-e.x, sy=ev.clientY-e.y;
        const mv=m=>{ e.x=Math.round(m.clientX-sx); e.y=Math.round(m.clientY-sy); paint(); };
        const up=()=>{ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); };
        document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
      };
    });
  };
  const showProps=()=>{
    if(selIdx==null) return;
    const e=t.els[selIdx];
    $('#props',body).innerHTML = `<div class="grid2">
      ${e.type==='text'?field('Text','pr_text',e.text)+field('Font Size','pr_size',e.size,'number')+field('Font','pr_font',e.font,'select',['Segoe UI','Arial','Georgia','Impact','Courier New','Times New Roman'])+field('Bold','pr_bold',e.bold?'Yes':'No','select',['Yes','No']):''}
      ${['rect','circle','line','image'].includes(e.type)?field('Width','pr_w',e.w,'number'):''}
      ${['rect','line','image'].includes(e.type)?field('Height','pr_h',e.h,'number'):''}
      ${e.type==='rect'?field('Corner Radius','pr_r',e.r,'number'):''}
      ${e.type==='line'?field('Rotation','pr_rot',e.rot,'number'):''}
      ${e.type!=='image'?field('Color','pr_col',e.color,'color'):''}
      ${['rect','circle'].includes(e.type)?field('Opacity','pr_op',e.op,'number'):''}
      ${field('X','pr_x',e.x,'number')}${field('Y','pr_y',e.y,'number')}</div>
      ${e.type==='image'?'<button class="btn sm" id="prImg" style="margin-top:8px">🖼 Pick Image</button>':''}
      <div style="margin-top:10px;display:flex;gap:6px"><button class="btn primary sm" id="prApply">Apply</button>
      <button class="btn sm" id="prDup">⧉ Duplicate</button><button class="btn danger sm" id="prDel">🗑 Delete</button></div>`;
    const im=$('#prImg'); if(im) im.onclick=async()=>{ const f=await window.api.pickFiles({filters:[{name:'Images',extensions:['png','jpg','jpeg','webp']}]});
      if(f.length){ e.src=await window.api.fileDataUrl(f[0].path); paint(); } };
    $('#prApply').onclick=()=>{
      if(e.type==='text'){ e.text=val('pr_text'); e.size=+val('pr_size')||14; e.font=val('pr_font'); e.bold=val('pr_bold')==='Yes'; }
      ['w','h','r','rot','op','x','y'].forEach(k=>{ const v=$('#pr_'+k); if(v) e[k]=+v.value; });
      const c=$('#pr_col'); if(c) e.color=c.value;
      paint(); showProps();
    };
    $('#prDup').onclick=()=>{ t.els.push({...e,x:e.x+14,y:e.y+14}); selIdx=t.els.length-1; paint(); showProps(); };
    $('#prDel').onclick=()=>{ t.els.splice(selIdx,1); selIdx=null; paint(); $('#props',body).innerHTML='<div style="color:var(--txt-dim);font-size:13px">Select an element</div>'; };
  };
  $$('[data-add]',body).forEach(b=>b.onclick=()=>{
    const k=b.dataset.add;
    const base={x:40,y:40,color:'#ffc84a',op:1};
    if(k==='text') t.els.push({...base,type:'text',text:'{{Student Name}}',size:20,font:'Segoe UI',bold:true});
    if(k==='rect') t.els.push({...base,type:'rect',w:200,h:60,r:10,color:'#ff7a18'});
    if(k==='circle') t.els.push({...base,type:'circle',w:90,color:'#8b5cf6'});
    if(k==='line') t.els.push({...base,type:'line',w:180,h:3,rot:0,color:'#ffffff'});
    if(k==='image') t.els.push({...base,type:'image',w:90,h:90,src:''});
    selIdx=t.els.length-1; paint(); showProps();
  });
  $('#bgCol',body).oninput=e=>{ t.bg=e.target.value; paint(); };
  $('#clr',body).onclick=()=>{ t.els=[]; selIdx=null; paint(); };
  $('#svT',body).onclick=()=>{ DB.save(); DB.log('ID template saved', sess||'Student'); toast('Template saved'); };
  paint();
}

/* ---------- Completion ---------- */
PAGES.graduation = (el) => {
  const s=DB.d.settings; s.gradTab=s.gradTab||'Candidates';
  const cands = DB.d.students.filter(x=>x.status!=='Graduated');
  const grads = DB.d.students.filter(x=>x.status==='Graduated');
  const list = s.gradTab==='Candidates'?cands:grads;
  el.innerHTML = head('Graduation','Candidates and graduates with certificate designer',customizeBtn('graduation'))
    + `<div class="tabs glass">${['Candidates','Graduates'].map(t=>`<div class="tab ${t===s.gradTab?'active':''}" data-t="${t}">${t} (${t==='Candidates'?cands.length:grads.length})</div>`).join('')}</div>
      <div class="cards view-cards">${list.map(st=>{
        const cp=(st.courses||[]).length?Math.round(st.courses.reduce((a,c)=>a+courseProgress(st,c),0)/st.courses.length):0;
        const cert=DB.d.certificates.find(c=>c.studentId===st.id);
        return `<div class="card glass liquid" style="flex-direction:column;align-items:stretch">
          <div class="nm">${esc(st.fullName)}</div><div class="mt">${esc(st.regNo||'')} · ${overallAtt(st.id).pct}% attendance</div>
          <div class="bar"><i style="width:${cp}%"></i></div>
          <div style="margin-top:9px;display:flex;gap:6px;flex-wrap:wrap">
            ${s.gradTab==='Candidates'?`<button class="btn sm gold" data-grad="${st.id}">🎓 Mark Graduated</button>`:''}
            <button class="btn sm ${cert?'':'primary'}" data-cert="${st.id}">${cert?'✏️ Edit Certificate':'➕ Add Certificate'}</button>
            ${cert?`<button class="btn sm" data-print="${st.id}">🖨 Print</button>`:''}
          </div></div>`;}).join('') || '<div class="empty glass" style="grid-column:1/-1">Nobody here yet</div>'}</div>`;
  $$('[data-t]',el).forEach(t=>t.onclick=()=>{ s.gradTab=t.dataset.t; DB.save(); render(); });
  $$('[data-grad]',el).forEach(b=>b.onclick=()=>{ const st=DB.student(b.dataset.grad); st.status='Graduated';
    (st.timeline=st.timeline||[]).unshift({time:today(),text:'Graduated'}); DB.save(); DB.log('Graduated',st.fullName); render(); toast('Marked graduated'); });
  $$('[data-cert]',el).forEach(b=>b.onclick=()=>certDesigner(b.dataset.cert));
  bindCustomize(el); applySectionStyle('graduation');
  $$('[data-print]',el).forEach(b=>b.onclick=()=>{ certPreview(b.dataset.print); setTimeout(()=>window.api.printPage(),400); });
};
function certHTML(sid){
  const st=DB.student(sid), c=DB.d.certificates.find(x=>x.studentId===sid)||{};
  return `<div style="width:900px;height:620px;background:${c.bg||'linear-gradient(140deg,#fffdf5,#fff3d6)'};color:#241a05;
     border:14px double #c9a227;border-radius:10px;padding:44px;text-align:center;font-family:Georgia,serif;position:relative">
    <img src=asset('logo.png') style="width:70px;height:70px;object-fit:contain">
    <div style="font-size:15px;letter-spacing:4px;color:#8a6b12">${esc(DB.d.branding.institute)}</div>
    <h1 style="font-size:42px;margin:16px 0;color:#a8801a">${esc(c.title||'Certificate of Completion')}</h1>
    <div style="font-size:15px">This is to certify that</div>
    <div style="font-size:32px;font-weight:800;margin:10px 0;border-bottom:2px solid #c9a227;display:inline-block;padding:0 26px">${esc(st.fullName)}</div>
    <div style="font-size:15px;margin-top:12px;line-height:1.7">${esc(c.body||`son/daughter of ${st.fatherName||'-'} has successfully completed the course(s) ${(st.courses||[]).join(', ')} at ${DB.d.branding.institute} with ${overallAtt(st.id).pct}% attendance.`)}</div>
    <div style="display:flex;justify-content:space-between;margin-top:56px;font-size:13px">
      <div>____________________<br>${esc(c.sign1||'Instructor')}</div>
      <div>${esc(c.date||today())}<br>Date</div>
      <div>____________________<br>${esc(c.sign2||'Director')}</div></div>
    <div style="position:absolute;right:36px;bottom:120px;width:96px;height:96px;border:3px solid #c9a227;border-radius:50%;
      display:grid;place-items:center;color:#a8801a;font-size:11px;transform:rotate(-14deg)">OFFICIAL<br>SEAL</div></div>`;
}
function certPreview(sid){ modal({title:'🎖 Certificate Preview',width:'980px',body:`<div class="canvas-wrap">${certHTML(sid)}</div>`}); }
function certDesigner(sid){
  const c = DB.d.certificates.find(x=>x.studentId===sid) || { studentId:sid, title:'Certificate of Completion', body:'', bg:'#fffdf5', sign1:'Instructor', sign2:'Director', date:today() };
  modal({ title:'🎖 Certificate Designer', width:'1000px',
    body:`<div class="grid2">${field('Title','ce_t',c.title)}${field('Date','ce_d',c.date,'date')}
      ${field('Left Signature','ce_s1',c.sign1)}${field('Right Signature','ce_s2',c.sign2)}
      ${field('Background Color','ce_bg',/^#/.test(c.bg)?c.bg:'#fffdf5','color')}</div>
      ${field('Body Text (leave blank for auto text)','ce_b',c.body,'textarea')}
      <div id="cePrev" class="canvas-wrap" style="margin-top:12px;transform:scale(.72);transform-origin:top center">${certHTML(sid)}</div>`,
    footer:`<button class="btn" onclick="closeModal()">Close</button><button class="btn sm" id="cePrint">🖨 Print</button><button class="btn primary" id="ceSave">💾 Save Certificate</button>` });
  $('#ceSave').onclick=()=>{
    Object.assign(c,{title:val('ce_t'),date:val('ce_d'),sign1:val('ce_s1'),sign2:val('ce_s2'),bg:val('ce_bg'),body:val('ce_b')});
    if(!DB.d.certificates.includes(c)) DB.d.certificates.push(c);
    DB.save(); DB.log('Certificate saved',(DB.student(sid)||{}).fullName); closeModal(); render(); toast('Certificate saved');
  };
  $('#cePrint').onclick=()=>window.api.printPage();
}

PAGES.calendar = (el) => {
  const s=DB.d.settings; s.calY=s.calY??new Date().getFullYear(); s.calM=s.calM??new Date().getMonth();
  const first=new Date(s.calY,s.calM,1).getDay(), days=new Date(s.calY,s.calM+1,0).getDate();
  const cells=[]; for(let i=0;i<first;i++) cells.push('');
  for(let d=1;d<=days;d++) cells.push(`${s.calY}-${String(s.calM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  el.innerHTML = head('Academic Calendar', `${MONTHS[s.calM]} ${s.calY}`,
    `<button class="btn sm" id="prev">←</button><button class="btn sm" id="tdy">Today</button><button class="btn sm" id="next">→</button>`)
    + `<div class="sect glass liquid"><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div style="text-align:center;font-size:11px;color:var(--txt-dim);letter-spacing:1px">${d}</div>`).join('')}
      ${cells.map(dt=>{ if(!dt) return '<div></div>';
        const evs=DB.d.events.filter(e=>dt>=e.start && dt<=(e.end||e.start));
        const isT=dt===today();
        return `<div class="glass" data-d="${dt}" style="min-height:92px;padding:8px;cursor:pointer;${isT?'box-shadow:0 0 0 2px var(--gold),0 0 22px rgba(255,200,74,.4)':''}">
          <div style="font-weight:700;font-size:13px;${isT?'color:var(--gold)':''}">${+dt.slice(-2)}</div>
          ${evs.map(e=>`<div class="pill ${e.type==='Holiday'?'red':'purple'}" style="display:block;margin-top:4px;font-size:9.5px">${esc(e.title)}</div>`).join('')}</div>`;
      }).join('')}</div></div>`;
  $('#prev',el).onclick=()=>{ s.calM--; if(s.calM<0){s.calM=11;s.calY--;} DB.save(); render(); };
  $('#next',el).onclick=()=>{ s.calM++; if(s.calM>11){s.calM=0;s.calY++;} DB.save(); render(); };
  $('#tdy',el).onclick=()=>{ s.calY=new Date().getFullYear(); s.calM=new Date().getMonth(); DB.save(); render(); };
  $$('[data-d]',el).forEach(c=>c.onclick=()=>eventForm(c.dataset.d));
};
function eventForm(date){
  const list=DB.d.events.filter(e=>date>=e.start && date<=(e.end||e.start));
  modal({ title:'📅 '+date, width:'640px',
    body:`${list.map((e,i)=>`<div class="kv"><b>${esc(e.title)}</b><span><span class="pill ${e.type==='Holiday'?'red':'purple'}">${esc(e.type)}</span>
      ${esc(e.desc||'')} <button class="btn sm danger" data-ed="${DB.d.events.indexOf(e)}">🗑</button></span></div>`).join('')}
      <div class="sect glass" style="margin-top:12px"><h3>Add Event / Holiday</h3><div class="grid2">
      ${field('Title','ev_t','')}${field('Type','ev_k','Event','select',['Event','Holiday','Exam','Meeting','Result Day'])}
      ${field('Start Date','ev_s',date,'date')}${field('End Date','ev_e',date,'date')}</div>
      ${field('Description / Reason','ev_d','','textarea')}</div>`,
    footer:`<button class="btn" onclick="closeModal()">Close</button><button class="btn primary" id="evSave">💾 Save</button>` });
  $$('[data-ed]').forEach(b=>b.onclick=()=>{ DB.d.events.splice(+b.dataset.ed,1); DB.save(); closeModal(); render(); });
  $('#evSave').onclick=()=>{ if(!val('ev_t'))return toast('Title required','err');
    DB.d.events.push({id:uid('e'),title:val('ev_t'),type:val('ev_k'),start:val('ev_s'),end:val('ev_e'),desc:val('ev_d')});
    DB.save(); DB.log('Event added',val('ev_t')); closeModal(); render(); toast('Saved'); };
}

PAGES.reports = (el) => {
  const s=DB.d.settings; s.repSel=s.repSel||'Student List'; s.repCourse=s.repCourse||'All Courses';
  const cats=['Student List','Attendance','Participation','Fees','Fines','Course Progress','Tests & Quizzes','Results','Graduation','Course List','Teacher Information','Computer Lab'];
  const rows = reportRows(s.repSel, s.repCourse);
  el.innerHTML = head('Reports','Print or export to PDF, Excel, Word and CSV',
    `<button class="btn sm" id="rPrint">${icon('print')} Print</button>${customizeBtn('reports')}<button class="btn primary" id="rExport">${icon('exp')} Export</button>`)
    + `<div class="toolbar glass"><span style="font-size:12px;color:var(--txt-dim)">Filter by course</span>
      <select class="inp" id="rCourse" style="width:auto"><option>All Courses</option>${DB.d.courses.map(c=>`<option ${s.repCourse===c.name?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="cards view-grid" style="margin-bottom:12px">${cats.map(c=>`
        <div class="card glass liquid ${c===s.repSel?'shimmer':''}" data-c="${esc(c)}" style="flex-direction:column;text-align:center">
          <div style="font-size:26px">${{'Student List':'🎓','Attendance':'🗓️','Participation':'🗣️','Fees':'💵','Fines':'⚖️','Course Progress':'📈','Tests & Quizzes':'🧩','Results':'🏆','Graduation':'🎓','Course List':'📚','Teacher Information':'👩‍🏫','Computer Lab':'🖥️'}[c]}</div>
          <div class="nm" style="font-size:13px">${esc(c)}</div></div>`).join('')}</div>
      <div class="sect glass liquid"><h3>Preview — ${esc(s.repSel)} (${rows.length})</h3>
        <div style="overflow:auto;max-height:420px">${tableHTML(rows.slice(0,200)).replace('<table>','<table>')}</div></div>`;
  $$('[data-c]',el).forEach(c=>c.onclick=()=>{ s.repSel=c.dataset.c; DB.save(); render(); });
  $('#rCourse',el).onchange=e=>{ s.repCourse=e.target.value; DB.save(); render(); };
  $('#rExport',el).onclick=()=>exportMenu(rows, s.repSel.replace(/\s+/g,'-'));
  $('#rPrint',el).onclick=()=>window.api.printPage();
  bindCustomize(el); applySectionStyle('reports');
};
function reportRows(kind, courseFilter){
  const f = s => courseFilter==='All Courses' || (s.courses||[]).includes(courseFilter);
  const S = DB.d.students.filter(f);
  switch(kind){
    case 'Student List': return S.map(s=>({Reg:s.regNo,Name:s.fullName,Father:s.fatherName,Gender:s.gender,Status:s.status,Mobile:s.mobile,Admission:s.admissionDate,Courses:(s.courses||[]).join('; ')}));
    case 'Attendance': return S.map(s=>{const a=overallAtt(s.id);return{Reg:s.regNo,Name:s.fullName,Present:a.P,Absent:a.A,Leave:a.L,Late:a.T,Percent:a.pct+'%'}});
    case 'Participation': return S.map(s=>{const k=Object.keys(DB.d.participation).filter(x=>x.startsWith(s.id+'|'));
      const t=k.reduce((a,x)=>a+DB.d.participation[x],0); return{Reg:s.regNo,Name:s.fullName,Entries:k.length,Total:t.toFixed(1),Average:(k.length?t/k.length:0).toFixed(2)}});
    case 'Fees': return DB.d.fees.map(x=>({Student:(DB.student(x.studentId)||{}).fullName||'',Title:x.title,Course:x.course,Date:x.date,Amount:x.amount,Paid:x.paid,Status:x.status}));
    case 'Fines': return DB.d.fines.map(x=>({Student:(DB.student(x.studentId)||{}).fullName||'',Title:x.title,Date:x.date,Amount:x.amount,Paid:x.paid,Status:x.status}));
    case 'Course Progress': return S.flatMap(s=>(s.courses||[]).filter(c=>courseFilter==='All Courses'||c===courseFilter)
      .map(c=>({Student:s.fullName,Course:c,Progress:courseProgress(s,c)+'%',Status:(s.courseData?.[c]?.status)||'Active'})));
    case 'Tests & Quizzes': return DB.d.assessments.map(a=>({Type:a.kind,Title:a.title,Course:a.course,Student:(DB.student(a.student)||{}).fullName||'Class',Date:a.date,Marks:a.marks,Obtained:a.obtained}));
    case 'Results': return S.map(s=>{const a=DB.d.assessments.filter(x=>x.student===s.id);
      const m=a.reduce((t,x)=>t+(+x.marks||0),0),o=a.reduce((t,x)=>t+(+x.obtained||0),0);
      return{Reg:s.regNo,Name:s.fullName,Assessments:a.length,Total:m,Obtained:o,Percent:(m?Math.round(o/m*100):0)+'%',Grade:grade(m?o/m*100:0)}});
    case 'Graduation': return DB.d.students.filter(s=>s.status==='Graduated').map(s=>({Reg:s.regNo,Name:s.fullName,Courses:(s.courses||[]).join('; '),Attendance:overallAtt(s.id).pct+'%'}));
    case 'Course List': return DB.d.courses.map(c=>({Name:c.name,Code:c.code,Fee:c.fee,Duration:c.duration,Instructor:c.instructor,Active:c.active?'Yes':'No',Students:DB.d.students.filter(s=>(s.courses||[]).includes(c.name)).length}));
    case 'Teacher Information': return DB.d.teachers.map(t=>({Reg:t.regNo,Name:t.fullName,Qualification:t.qualification,Mobile:t.mobile,Email:t.email,Status:t.status,Courses:(t.subjects||[]).join('; ')}));
    case 'Computer Lab': return (DB.d.lab||[]).map(x=>({System:x.name,Specs:x.specs,Condition:x.condition,Assigned:x.assigned,Note:x.note}));
    default: return [];
  }
}
function grade(p){ return p>=90?'A+':p>=80?'A':p>=70?'B':p>=60?'C':p>=50?'D':'F'; }

/* ---------- System ---------- */
/* item 23: administrator-only Readme documentation panel */
function backupReadmeHTML(){
  const step = (n,t,body)=>`<div style="display:flex;gap:12px;margin-bottom:14px">
      <div class="avatar" style="width:28px;height:28px;font-size:13px;flex:none">${n}</div>
      <div><b style="font-size:13.5px">${t}</b>
        <div style="font-size:12.5px;color:var(--txt-dim);margin-top:4px;line-height:1.65">${body}</div></div></div>`;
  return `<h3>${icon('file')} Readme — Backup, Restore &amp; Update Procedures</h3>
    <p style="font-size:12px;color:var(--txt-dim);margin-bottom:16px">
      <b>Administrator only.</b> This panel is hidden from client accounts and guests.</p>

    <div class="grid2">
      <div class="sect glass"><h3 style="color:var(--txt)">A · Taking a Backup</h3>
        ${step(1,'Create the snapshot','Click <b>Create Backup</b> above (or the disk icon in the top toolbar). A timestamped <code>.json</code> snapshot of every student, teacher, mark, fee and setting is written instantly.')}
        ${step(2,'Verify it appears','The new file shows at the top of the “Available Backups” list with its size and date. Nothing is uploaded — it stays on this PC.')}
        ${step(3,'Keep an off-site copy','Click <b>Open Folder</b> and copy the <code>.json</code> files to a USB drive or cloud folder. Do this at least once a week, and always before an update.')}
        ${step(4,'Portable export','Use <b>Export DB File</b> to save a single named copy anywhere you like — handy for moving to a new computer.')}
      </div>

      <div class="sect glass"><h3 style="color:var(--txt)">B · Restoring Data</h3>
        ${step(1,'Back up the current state first','Restoring <u>replaces</u> everything in the app. Always click Create Backup before restoring, so you can undo it.')}
        ${step(2,'Pick a restore point','Find the snapshot you want in “Available Backups” and click <b>Restore</b>. Confirm the prompt.')}
        ${step(3,'From an external file','If your snapshot lives on a USB, use <b>Import DB File</b> and select the <code>.json</code>.')}
        ${step(4,'Check the result','Open Students and Attendance to confirm the data looks right. If not, restore the safety backup from step 1.')}
        ${step(5,'Deleted something by mistake?','You may not need a restore — <b>System → Recycle Bin</b> holds deleted records for 30 days and can put them back individually.')}
      </div>
    </div>

    <div class="sect glass"><h3 style="color:var(--txt)">C · Managing App Updates</h3>
      ${step(1,'Always back up first','Create a fresh backup and copy it off the machine before applying any update.')}
      ${step(2,'Editing code in-app','<b>System → Upload / Updates</b> opens the built-in code editor (admin only). Pick a file, edit, press <b>Apply Changes</b> to stage, then <b>Save</b>. Use <b>Undo</b> / <b>Redo</b> while editing.')}
      ${step(3,'Reload to test','After saving you will be asked to reload. Accept it, then test the affected screen. Every file you save is auto-copied to <code>filename.bak</code> next to the original.')}
      ${step(4,'Installing a newer setup','Run the newer <code>IT-Tech-Setup.exe</code> over the top — your data lives in <code>%AppData%\\IT-Tech\\data</code> and is <b>not</b> touched by installing or uninstalling.')}
      ${step(5,'Moving to a new PC','Install IT-Tech there, then use <b>Import DB File</b> with the exported <code>.json</code>. Copy the <code>files</code> folder too if you attached documents.')}
      ${step(6,'If an update breaks something','Reinstall the previous setup, then Restore the backup you took in step 1.')}
    </div>

    <div class="sect glass"><h3 style="color:var(--txt)">D · Where Everything Lives</h3>
      <div class="kv"><b>Database</b><span><code>%AppData%\\IT-Tech\\data\\ittech-db.json</code></span></div>
      <div class="kv"><b>Attached files</b><span><code>%AppData%\\IT-Tech\\data\\files\\</code></span></div>
      <div class="kv"><b>Backups</b><span><code>%AppData%\\IT-Tech\\data\\backups\\</code></span></div>
      <div class="kv"><b>Retention</b><span>Recycle Bin auto-clears after 30 days · backups are kept until you delete them</span></div>
      <div class="kv" style="border:0"><b>Recommended routine</b><span>Backup weekly · before every update · before bulk imports</span></div>
    </div>`;
}
PAGES.backups = (el) => {
  if(!requireAdmin()) return go('home');
  el.innerHTML = head('Backups & Restore','Local snapshots of your entire database',
    `<button class="btn primary" id="bkNew">${icon('add')} Create Backup</button>
     <button class="btn sm" id="bkFolder">${icon('materials')} Open Folder</button>
     <button class="btn sm" id="bkExp">${icon('exp')} Export DB File</button>
     <button class="btn sm" id="bkImp">${icon('imp')} Import DB File</button>
     <button class="btn sm gold" id="bkDoc">${icon('file')} Readme</button>`)
    + `<div class="sect glass liquid" id="bkList">Loading…</div>
       <div class="sect glass liquid" id="bkReadme">${backupReadmeHTML()}</div>`;
  const draw=async()=>{
    const l=await window.api.backupList();
    $('#bkList',el).innerHTML = `<h3>Available Backups (${l.length})</h3>` + (l.map(b=>`<div class="kv"><b>${esc(b.name)}</b><span>
      ${Math.round(b.size/1024)} KB · ${new Date(b.time).toLocaleString()}
      <button class="btn sm gold" data-r="${esc(b.name)}">♻️ Restore</button>
      <button class="btn sm danger" data-x="${esc(b.name)}">🗑</button></span></div>`).join('')
      || '<div style="color:var(--txt-dim);font-size:13px">No backups yet</div>');
    $$('[data-r]',el).forEach(b=>b.onclick=async()=>{ if(!confirm('Restore this backup? Current data will be replaced.'))return;
      DB.d=await window.api.backupRestore(b.dataset.r); await DB.save(); toast('Restored'); buildNav(); render(); });
    $$('[data-x]',el).forEach(b=>b.onclick=async()=>{ await window.api.backupDelete(b.dataset.x); draw(); });
  };
  draw();
  $('#bkNew',el).onclick=async()=>{ const n=await window.api.backupCreate(DB.d); DB.log('Backup created',n); toast('Backup created'); draw(); };
  $('#bkFolder',el).onclick=()=>window.api.backupFolder();
  $('#bkDoc',el).onclick=()=>{ const r=$('#bkReadme',el); r.scrollIntoView({behavior:'smooth'}); };
  $('#bkExp',el).onclick=async()=>{ const p=await window.api.saveAs({defaultName:'ittech-database.json',data:JSON.stringify(DB.d,null,2)}); if(p) toast('Saved: '+p); };
  $('#bkImp',el).onclick=async()=>{ const f=await window.api.openTextFile(); if(!f)return;
    try{ DB.d=JSON.parse(f.content); await DB.save(); toast('Database imported'); buildNav(); render(); }catch(e){ toast('Invalid file','err'); } };
};

PAGES.recycle = (el) => {
  if(!requireAdmin()) return go('home');
  DB.purgeRecycle();
  el.innerHTML = head('Recycle Bin','Deleted items are kept for 30 days, then removed automatically',
    `<button class="btn danger" id="rcEmpty">${icon('del')} Empty Bin</button>`)
    + `<div class="sect glass liquid">${DB.d.recycle.map((r,i)=>{
      const days = 30 - Math.floor((Date.now()-new Date(r.deleted))/86400000);
      return `<div class="kv"><b>${esc(r.type)}: ${esc(r.item.fullName||r.item.name||r.item.title||r.item.id||'item')}</b><span>
        <span class="pill ${days<7?'red':'gold'}">${days} day(s) left</span>
        <span style="font-size:11.5px;color:var(--txt-dim)">${new Date(r.deleted).toLocaleString()}</span>
        <button class="btn sm gold" data-res="${i}">♻️ Restore</button>
        <button class="btn sm danger" data-perm="${i}">🗑 Delete Forever</button></span></div>`;
      }).join('') || '<div class="empty"><span class="e">🗑️</span>Recycle bin is empty</div>'}</div>`;
  $$('[data-res]',el).forEach(b=>b.onclick=()=>{
    const r=DB.d.recycle[b.dataset.res];
    const map={student:'students',teacher:'teachers',course:'courses',batch:'batches',assessment:'assessments',fee:'fees',fine:'fines',lessons:'lessons',phases:'phases',exercises:'exercises',chapter:'materials'};
    const k=map[r.type]; if(k) DB.d[k].push(r.item); else if(r.type==='file') toast('File record restored','warn');
    DB.d.recycle.splice(b.dataset.res,1); DB.save(); render(); toast('Restored');
  });
  $$('[data-perm]',el).forEach(b=>b.onclick=()=>{ DB.d.recycle.splice(b.dataset.perm,1); DB.save(); render(); });
  $('#rcEmpty',el).onclick=()=>{ if(confirm('Permanently delete everything in the bin?')){ DB.d.recycle=[]; DB.save(); render(); } };
};

PAGES.activity = (el) => {
  if(!requireAdmin()) return go('home');
  el.innerHTML = head('Activity History',`${DB.d.activity.length} recorded action(s)`,
    `<button class="btn sm gold" id="acXls">${icon('exp')} Excel</button>
     <button class="btn sm gold" id="acDoc">${icon('exp')} Word</button>
     <button class="btn sm gold" id="acPpt">${icon('exp')} PowerPoint</button>
     <button class="btn sm" id="acCsv">${icon('exp')} CSV</button>
     <button class="btn sm" id="acExp">${icon('exp')} More…</button>
     <button class="btn sm danger" id="acClr">${icon('del')} Clear</button>`)
    + `<div class="toolbar glass"><input class="inp grow" id="acQ" placeholder="🔍 Filter activity…"></div>
      <div class="sect glass liquid" id="acList"></div>`;
  const draw=()=>{ const q=($('#acQ',el).value||'').toLowerCase();
    $('#acList',el).innerHTML=DB.d.activity.filter(a=>!q||JSON.stringify(a).toLowerCase().includes(q)).slice(0,400)
      .map(a=>`<div class="kv"><b>${esc(a.action)}</b><span>${esc(a.detail)} · <span style="color:var(--txt)">${esc(a.user)}</span> · ${new Date(a.time).toLocaleString()}</span></div>`).join('')
      || '<div style="color:var(--txt-dim)">No activity</div>'; };
  draw(); $('#acQ',el).oninput=draw;
  /* item 24: one-click Excel / Word / PowerPoint / CSV exports */
  const rows = () => DB.d.activity.map(a=>({
    Date: new Date(a.time).toLocaleDateString(),
    Time: new Date(a.time).toLocaleTimeString(),
    User: a.user, Action: a.action, Detail: a.detail }));
  $('#acXls',el).onclick=()=>exportActivity('excel');
  $('#acDoc',el).onclick=()=>exportActivity('word');
  $('#acPpt',el).onclick=()=>exportActivity('ppt');
  $('#acCsv',el).onclick=()=>exportRows(rows(),'Activity-History','csv');
  $('#acExp',el).onclick=()=>exportMenu(rows(),'Activity-History');
  async function exportActivity(fmt){
    const r = rows();
    if(!r.length) return toast('No activity to export','warn');
    const stamp = new Date().toLocaleString();
    const head2 = `<h1 style="color:#ff7a18;margin:0 0 4px">IT-Tech — Activity History</h1>
      <p style="color:#555;margin:0 0 14px">${esc(DB.d.branding.institute||'IT-Tech')} · ${r.length} entries · generated ${esc(stamp)}</p>`;
    if (fmt==='excel'){
      const p2=await window.api.saveAs({defaultName:'Activity-History.xls',
        data:htmlDoc('Activity History', head2+tableHTML(r))});
      if(p2) toast('Excel saved: '+p2); return;
    }
    if (fmt==='word'){
      const p2=await window.api.saveAs({defaultName:'Activity-History.doc',
        data:htmlDoc('Activity History', head2+tableHTML(r))});
      if(p2) toast('Word saved: '+p2); return;
    }
    if (fmt==='ppt'){
      const per=8, slides=[];
      for(let i=0;i<r.length;i+=per){
        const chunk=r.slice(i,i+per);
        slides.push(`<div style="page-break-after:always;width:960px;min-height:540px;padding:44px;
            background:linear-gradient(140deg,#12081f,#3b1a5e);color:#fff;font-family:Segoe UI,Arial;margin-bottom:18px">
          <h2 style="color:#ffc84a;margin:0 0 6px">Activity History</h2>
          <div style="font-size:13px;opacity:.8;margin-bottom:18px">${esc(DB.d.branding.institute||'IT-Tech')} · slide ${slides.length+1} · ${esc(stamp)}</div>
          ${chunk.map(x=>`<div style="border-left:3px solid #ff7a18;padding:6px 0 6px 12px;margin-bottom:10px">
            <b style="font-size:15px">${esc(x.Action)}</b>
            <div style="font-size:12px;opacity:.85">${esc(x.Detail||'—')}</div>
            <div style="font-size:11px;color:#ffc84a">${esc(x.User)} · ${esc(x.Date)} ${esc(x.Time)}</div></div>`).join('')}
        </div>`);
      }
      const p2=await window.api.saveAs({defaultName:'Activity-History.ppt',
        data:htmlDoc('Activity History', slides.join(''))});
      if(p2) toast('PowerPoint saved: '+p2); return;
    }
  }
  $('#acClr',el).onclick=()=>{ if(confirm('Clear all activity history?')){ DB.d.activity=[]; DB.save(); render(); } };
};

PAGES.updates = (el) => {
  if(!requireAdmin()) return go('home');
  el.innerHTML = head('Upload / Updates — Code Editor',
      'Administrator only. Edit the app source, apply, undo, redo and save.','')
    + `<div class="toolbar glass">
        <button class="btn sm primary" id="cApply">${icon('check')} Apply Changes</button>
        <button class="btn sm" id="cUndo">${icon('updates')} Undo</button>
        <button class="btn sm" id="cRedo">${icon('updates')} Redo</button>
        <button class="btn sm" id="cSave">${icon('save')} Save</button>
        <button class="btn sm" id="cRevert">Revert File</button>
        <button class="btn sm" id="cReload">Reload App</button>
        <div class="grow"></div>
        <span class="pill" id="cDirty">No changes</span>
        <span class="pill" id="cFile">No file selected</span></div>
      <div style="display:flex;gap:14px;flex-wrap:wrap">
        <div class="sect glass" style="width:260px">
          <h3>Project Files</h3>
          <input class="inp" id="cFilter" placeholder="Filter files…" style="margin-bottom:10px">
          <div class="filelist" id="cTree">Loading…</div></div>
        <div class="sect glass" style="flex:1;min-width:430px">
          <h3>Editor</h3>
          <textarea id="codeArea" spellcheck="false" placeholder="Select a file from the list to start editing…"></textarea>
          <div id="cStatus" style="font-size:12px;color:var(--txt-dim);margin-top:8px">
            Apply Changes writes the file to disk and reloads the app so you see the result immediately.
            A .bak copy of the previous version is kept next to every file you save.</div></div></div>`;

  let cur=null, saved='', stack=[], ptr=-1, files=[];
  const area = $('#codeArea',el);
  const setDirty = () => {
    const d = cur && area.value !== saved;
    $('#cDirty',el).textContent = !cur ? 'No file' : d ? 'Unsaved changes' : 'Saved';
  };
  const push = v => { stack = stack.slice(0, ptr+1); stack.push(v); ptr = stack.length-1; };

  const drawTree = () => {
    const q = ($('#cFilter',el).value||'').toLowerCase();
    $('#cTree',el).innerHTML = files.filter(f=>!q||f.toLowerCase().includes(q))
      .map(f=>`<div data-f="${esc(f)}" class="${f===cur?'sel':''}">${esc(f)}</div>`).join('') || '<div>No match</div>';
    $$('#cTree [data-f]',el).forEach(n=>n.onclick=()=>openFile(n.dataset.f));
  };
  const openFile = async rel => {
    if (cur && area.value !== saved && !confirm('Discard unsaved changes to '+cur+'?')) return;
    cur = rel;
    const c = await window.api.codeRead(rel);
    area.value = c; saved = c; stack=[c]; ptr=0;
    $('#cFile',el).textContent = rel;
    drawTree(); setDirty();
  };

  window.api.codeTree().then(list=>{ files=list; drawTree(); });
  $('#cFilter',el).oninput = drawTree;
  area.oninput = () => setDirty();
  /* capture history on pauses so Undo/Redo have meaningful steps */
  let tmr=null;
  area.addEventListener('input',()=>{ clearTimeout(tmr); tmr=setTimeout(()=>push(area.value),400); });

  /* ---- item 4 FIX ----
     Previously "Apply Changes" only pushed the text onto an in-memory undo
     stack, so nothing was ever written and the edit appeared to do nothing.
     It now validates, writes to disk, then reloads so the change is live. */
  const writeFile = async (reload) => {
    if(!cur) { toast('Select a file first','warn'); return false; }
    const content = area.value;
    if (/\.json$/i.test(cur)) {
      try { JSON.parse(content); }
      catch(e){ toast('Invalid JSON — not saved: '+e.message,'err'); return false; }
    }
    if (/\.js$/i.test(cur)) {
      try { new Function(content); }
      catch(e){
        if(!confirm('This JavaScript has a syntax error:\n\n'+e.message+'\n\nSave anyway?')) return false;
      }
    }
    try {
      await window.api.codeWrite({ rel:cur, content });
      saved = content; push(content); setDirty();
      DB.log('Code edited', cur);
      if (reload){
        toast('Applied — reloading…');
        setTimeout(()=>window.api.reloadApp(), 600);
      } else toast('Saved to '+cur);
      return true;
    } catch(e){ toast('Write failed: '+e.message,'err'); return false; }
  };

  $('#cApply',el).onclick = () => writeFile(true);    // write + reload = changes actually apply
  $('#cSave',el).onclick  = () => writeFile(false);   // write only
  $('#cUndo',el).onclick  = () => { if(ptr>0){ ptr--; area.value=stack[ptr]; setDirty(); toast('Undo'); } else toast('Nothing to undo','warn'); };
  $('#cRedo',el).onclick  = () => { if(ptr<stack.length-1){ ptr++; area.value=stack[ptr]; setDirty(); toast('Redo'); } else toast('Nothing to redo','warn'); };
  $('#cRevert',el).onclick= async () => { if(!cur) return toast('Select a file first','warn');
    if(!confirm('Reload '+cur+' from disk and lose unsaved edits?')) return;
    const c=await window.api.codeRead(cur); area.value=c; saved=c; push(c); setDirty(); toast('Reverted'); };
  $('#cReload',el).onclick= () => { if(area.value!==saved && !confirm('You have unsaved changes. Reload anyway?')) return;
    window.api.reloadApp(); };
  setDirty();
};

/* ---------- Settings ---------- */
PAGES.settings = (el) => {
  const s=DB.d.settings, b=DB.d.branding;
  const admin=isAdmin();
  el.innerHTML = head('Settings', admin?'Administrative Settings + Other Settings':'Other Settings','')
    + `<div class="tabs glass" id="setTabs">${(admin?['Branding','Feature Toggles','Sidebar','Academic Rules','Users & Access','Account & Security','Appearance','System Check']:['Appearance','Account & Security'])
      .map((t,i)=>`<div class="tab ${i===0?'active':''}" data-t="${t}">${t}</div>`).join('')}</div><div id="setBody"></div>`;
  const body=$('#setBody',el);
  const show=t=>{ body.innerHTML=''; const d=document.createElement('div'); d.className='page'; body.appendChild(d); SET[t](d); };
  show(admin?'Branding':'Appearance');
  $$('#setTabs .tab',el).forEach(tb=>tb.onclick=()=>{ $$('#setTabs .tab',el).forEach(x=>x.classList.remove('active')); tb.classList.add('active'); show(tb.dataset.t); });
};
const SET={};
SET['Branding']=d=>{ const b=DB.d.branding;
  d.innerHTML=`<div class="sect glass liquid"><h3>Branding</h3><div class="form-grid">
    ${field('Institution Name','br_i',b.institute)}${field('Short Name','br_s',b.short)}
    ${field('Tagline','br_t',b.tagline)}${field('Phone Number','br_p',b.phone)}
    ${field('Email','br_e',b.email)}${field('Currency','br_c',b.currency)}
    ${field('Registration Reference / Prefix','br_r',b.regPrefix)}</div>
    <div style="margin-top:16px;display:flex;gap:14px;align-items:center">
      <img id="brLogo" src="${b.logo||asset('logo.png')}" style="width:74px;height:74px;object-fit:contain">
      <button class="btn sm" id="brPick">${icon('palette')} Upload Logo</button></div>
    <div style="margin-top:16px"><button class="btn primary" id="brSave">${icon('save')} Save Branding</button></div></div>`;
  let logo=b.logo;
  $('#brPick',d).onclick=()=>pickPhoto('brLogo',u=>logo=u);
  $('#brSave',d).onclick=()=>{
    /* item 2 fix: read the live DOM values directly and always assign (even when
       the field was cleared) so deleting text really clears it. */
    const get = id => { const e=document.getElementById(id); return e ? e.value.trim() : ''; };
    b.institute = get('br_i');
    b.short     = get('br_s');
    b.tagline   = get('br_t');
    b.phone     = get('br_p');
    b.email     = get('br_e');
    b.currency  = get('br_c');
    b.regPrefix = get('br_r');
    b.logo      = logo || '';
    DB.save();
    DB.log('Branding updated', b.institute || '(cleared)');
    const sn=$('#sideName'); if(sn) sn.textContent = b.institute || 'IT-Tech';
    const bt=$('#brandTitle'); if(bt) bt.textContent = b.institute || 'IT-Tech';
    toast('Branding saved');
    render();
  };
};
SET['Feature Toggles']=d=>{
  const p=DB.d.settings.guestPerms;
  d.innerHTML=`<div class="sect glass liquid"><h3>Guest / Client Permissions (applies to “Continue Without Username” users)</h3>
    ${Object.keys(DEFAULT_PERMS).map(k=>`<div class="togline"><div class="g">${k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())}</div>
      <div class="switch ${p[k]?'on':''}" data-p="${k}"><i></i></div></div>`).join('')}
    <div style="margin-top:12px"><button class="btn primary" id="ftSave">💾 Save Permissions</button></div></div>`;
  $$('[data-p]',d).forEach(s=>s.onclick=()=>s.classList.toggle('on'));
  $('#ftSave',d).onclick=()=>{ $$('[data-p]',d).forEach(s=>p[s.dataset.p]=s.classList.contains('on'));
    DB.save(); DB.log('Permissions updated','guest'); buildNav(); toast('Saved'); };
};
SET['Sidebar']=d=>{
  const sb=DB.d.settings.sidebar;
  d.innerHTML=`<div class="sect glass liquid"><h3>Sidebar Visibility</h3>
    ${NAV.flatMap(g=>g.items).map(i=>`<div class="togline"><div class="g">${i.icon} ${i.label}</div>
      <div class="switch ${sb[i.page]===false?'':'on'}" data-sb="${i.page}"><i></i></div></div>`).join('')}
    <div style="margin-top:12px"><button class="btn primary" id="sbSave">💾 Save</button></div></div>`;
  $$('[data-sb]',d).forEach(s=>s.onclick=()=>s.classList.toggle('on'));
  $('#sbSave',d).onclick=()=>{ $$('[data-sb]',d).forEach(s=>sb[s.dataset.sb]=s.classList.contains('on'));
    DB.save(); buildNav(); toast('Sidebar updated'); };
};
SET['Academic Rules']=d=>{ const a=DB.d.settings.academic;
  d.innerHTML=`<div class="sect glass liquid"><h3>Academic Rules</h3><div class="grid2">
    ${field('Absent Score','ar_a',a.absentScore,'number')}${field('Leave Score','ar_l',a.leaveScore,'number')}
    ${field('Present Score','ar_p',a.presentScore,'number')}${field('Late Deduction','ar_d',a.lateDeduct,'number')}
    ${field('Maximum Score','ar_m',a.maxScore,'number')}${field('Low Attendance Alert (%)','ar_la',a.lowAttendance,'number')}
    ${field('Low Participation Alert (%)','ar_lp',a.lowParticipation,'number')}${field('Fee Due Day of Month','ar_f',a.feeDueDay,'number')}</div>
    <div style="margin-top:12px"><button class="btn primary" id="arSave">💾 Save Rules</button></div></div>`;
  $('#arSave',d).onclick=()=>{ Object.assign(a,{absentScore:+val('ar_a'),leaveScore:+val('ar_l'),presentScore:+val('ar_p'),
    lateDeduct:+val('ar_d'),maxScore:+val('ar_m'),lowAttendance:+val('ar_la'),lowParticipation:+val('ar_lp'),feeDueDay:+val('ar_f')});
    DB.save(); DB.log('Academic rules updated',''); toast('Saved'); };
};
SET['Users & Access']=d=>{
  /* item 5: administrative dashboard — create teacher/student accounts and
     toggle every permission per account. Admin-only by construction. */
  if(!isAdmin()){ d.innerHTML='<div class="empty glass">Administrator only</div>'; return; }
  const count = r => DB.d.users.filter(u=>u.role===r).length;
  d.innerHTML=`
    <div class="stats">
      ${[['Administrators',count('admin'),'lock'],['Teacher Accounts',count('teacher'),'teachers'],
         ['Student Accounts',count('student'),'students'],['Other / Client',count('client'),'user']]
        .map(([l,v,ic])=>`<div class="stat glass"><span class="ic">${icon(ic)}</span>
          <div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')}</div>

    <div class="toolbar glass">
      <button class="btn primary" id="uAddT">${icon('teachers')} Create Teacher Account</button>
      <button class="btn primary" id="uAddS">${icon('students')} Create Student Account</button>
      <button class="btn sm" id="uAdd">${icon('add')} Other Account</button>
      <div class="grow"></div>
      <button class="btn sm" id="uRoleDefaults">${icon('settings')} Role Defaults</button></div>

    <div class="sect glass"><h3>All Accounts — credentials visible to the administrator only</h3>
    <table><tr><th>Name</th><th>Username</th><th>Password</th><th>Role</th><th>Linked To</th><th>Access</th><th></th></tr>
    ${DB.d.users.map(u=>{
      const p2 = {...DEFAULT_PERMS, ...(ROLE_PRESETS[u.role]||{}), ...(u.perms||{})};
      const granted = Object.keys(DEFAULT_PERMS).filter(k=>p2[k]).length;
      const link = u.linkId ? ((DB.teacher(u.linkId)||DB.student(u.linkId)||{}).fullName||'—') : '—';
      return `<tr><td>${esc(u.name)}</td><td><b>${esc(u.username)}</b></td>
        <td><code>${esc(dec(u.password))}</code></td>
        <td><span class="pill">${esc(u.role)}</span></td>
        <td style="font-size:12px">${esc(link)}</td>
        <td><span class="pill">${u.role==='admin'?'Full control':granted+' of '+Object.keys(DEFAULT_PERMS).length}</span></td>
        <td style="text-align:right">
          <button class="btn sm" data-eu="${u.id}">${icon('edit')} Edit</button>
          ${u.role!=='admin'?`<button class="btn sm danger" data-du="${u.id}">${icon('del')}</button>`:''}
        </td></tr>`;
    }).join('')}</table></div>

    <div class="sect glass"><h3>What each role can do</h3>
      <div class="kv"><b>Administrator</b><span>Full control · sees Customize, Background Manager, Code Editor, Settings and every record</span></div>
      <div class="kv"><b>Teacher</b><span>Marks attendance &amp; participation, edits students, views courses/reports · no Customize, no System tools</span></div>
      <div class="kv"><b>Student</b><span>Read-only view of their courses, attendance, marks and resources · no editing</span></div>
      <div class="kv" style="border:0"><b>Guest</b><span>Whatever the admin enables under Feature Toggles</span></div></div>`;

  $$('[data-eu]',d).forEach(b2=>b2.onclick=()=>userForm(b2.dataset.eu, ()=>SET['Users & Access'](d)));
  $$('[data-du]',d).forEach(b2=>b2.onclick=()=>{
    const u=DB.d.users.find(x=>x.id===b2.dataset.du);
    if(!confirm('Delete the account "'+u.username+'"?')) return;
    DB.d.users=DB.d.users.filter(x=>x.id!==b2.dataset.du);
    DB.save(); DB.log('User deleted',u.username); SET['Users & Access'](d);
  });
  $('#uAdd',d).onclick=()=>userForm(null,()=>SET['Users & Access'](d),'client');
  $('#uAddT',d).onclick=()=>userForm(null,()=>SET['Users & Access'](d),'teacher');
  $('#uAddS',d).onclick=()=>userForm(null,()=>SET['Users & Access'](d),'student');
  $('#uRoleDefaults',d).onclick=()=>roleDefaults(()=>SET['Users & Access'](d));
};

function roleDefaults(cb){
  if(!requireAdmin()) return;
  DB.d.settings.rolePresets = DB.d.settings.rolePresets || {};
  let role = 'teacher';
  const draw = () => {
    const eff = {...DEFAULT_PERMS, ...(ROLE_PRESETS[role]||{}), ...((DB.d.settings.rolePresets||{})[role]||{})};
    modal({ title: icon('settings')+' Role Defaults', width:'760px',
      body:`<div class="tabs glass">${['teacher','student','client'].map(r=>`
          <div class="tab ${r===role?'active':''}" data-rr="${r}">${r[0].toUpperCase()+r.slice(1)}</div>`).join('')}</div>
        <p style="font-size:12px;color:var(--txt-dim);margin-bottom:12px">
          These defaults apply to every new <b>${esc(role)}</b> account. Existing accounts keep their own overrides.</p>
        ${PERM_GROUPS.map(g=>`<div class="sect glass"><h3>${g.title}</h3>
          ${g.keys.map(k=>`<div class="togline"><div class="g">${PERM_LABEL[k]||k}</div>
            <div class="switch ${eff[k]?'on':''}" data-rp="${k}" ${k==='customize'?'data-locked="1"':''}><i></i></div></div>`).join('')}
        </div>`).join('')}`,
      footer:`<button class="btn" onclick="closeModal()">Cancel</button>
              <button class="btn primary" id="rpSave">${icon('save')} Save Defaults</button>` });
    $$('[data-rr]').forEach(t=>t.onclick=()=>{ role=t.dataset.rr; draw(); });
    $$('[data-rp]').forEach(t=>t.onclick=()=>{
      if(t.dataset.locked){ toast('Customize stays administrator-only','warn'); return; }
      t.classList.toggle('on');
    });
    $('#rpSave').onclick=()=>{
      const o={}; $$('[data-rp]').forEach(t=>o[t.dataset.rp]=t.classList.contains('on'));
      o.customize=false;
      DB.d.settings.rolePresets[role]=o;
      DB.save(); DB.log('Role defaults updated', role); closeModal(); cb&&cb(); toast('Defaults saved');
    };
  };
  draw();
}

function userForm(id, cb, presetRole){
  if(!requireAdmin()) return;
  const u = id ? DB.d.users.find(x=>x.id===id)
              : { name:'', username:'', password:enc(''), role:presetRole||'client', perms:null, linkId:'' };
  const effective = r => ({...DEFAULT_PERMS, ...(ROLE_PRESETS[r]||{}),
                           ...((DB.d.settings.rolePresets||{})[r]||{}), ...(u.perms||{})});
  const permHTML = r => {
    const p = effective(r);
    if (r==='admin') return `<div class="sect glass"><h3>Permissions</h3>
      <div style="font-size:13px;color:var(--txt-dim)">Administrators always have full control of every feature.</div></div>`;
    return PERM_GROUPS.map(g=>`<div class="sect glass"><h3>${g.title}</h3>
      ${g.keys.map(k=>`<div class="togline"><div class="g">${PERM_LABEL[k]||k}
        ${k==='customize'?'<span class="pill" style="margin-left:6px">Admin only</span>':''}</div>
        <div class="switch ${k==='customize'?'':(p[k]?'on':'')}" data-up="${k}" ${k==='customize'?'data-locked="1"':''}><i></i></div>
      </div>`).join('')}</div>`).join('');
  };
  const linkHTML = r => {
    if (r==='teacher') return field('Link to Teacher Record','us_link',
      (DB.teacher(u.linkId)||{}).fullName||'','select',['',...DB.d.teachers.map(t=>t.fullName)]);
    if (r==='student') return field('Link to Student Record','us_link',
      (DB.student(u.linkId)||{}).fullName||'','select',['',...DB.d.students.map(t=>t.fullName)]);
    return '';
  };
  modal({ title:(id?icon('edit')+' Edit':icon('add')+' Create')+' Account', width:'780px',
    body:`<div class="form-grid">
        ${field('Full Name','us_n',u.name)}${field('Username','us_u',u.username)}
        ${field('Password','us_p',dec(u.password))}
        ${field('Role','us_r',u.role,'select',['admin','teacher','student','client'])}</div>
      <div id="linkBox" style="margin-top:14px">${linkHTML(u.role)}</div>
      <div id="permBox">${permHTML(u.role)}</div>`,
    footer:`<button class="btn" onclick="closeModal()">Cancel</button>
            <button class="btn primary" id="usSave">${icon('save')} Save Account</button>` });
  const wire = () => {
    $$('[data-up]').forEach(t=>t.onclick=()=>{
      if(t.dataset.locked){ toast('Customize is reserved for administrators','warn'); return; }
      t.classList.toggle('on');
    });
  };
  wire();
  $('#us_r').onchange = e => {
    const r=e.target.value;
    $('#linkBox').innerHTML = linkHTML(r);
    $('#permBox').innerHTML = permHTML(r);
    wire();
  };
  $('#usSave').onclick=()=>{
    const uname=val('us_u');
    if(!uname) return toast('Username is required','err');
    if(DB.d.users.some(x=>x.username.toLowerCase()===uname.toLowerCase() && x.id!==id))
      return toast('That username already exists','err');
    const r=val('us_r');
    const np={}; $$('[data-up]').forEach(t=>np[t.dataset.up]=t.classList.contains('on'));
    np.customize=false;
    let linkId='';
    const ln=$('#us_link');
    if(ln && ln.value){
      const rec = r==='teacher' ? DB.d.teachers.find(t=>t.fullName===ln.value)
                                : DB.d.students.find(t=>t.fullName===ln.value);
      linkId = rec?rec.id:'';
    }
    const o={ name:val('us_n')||uname, username:uname, password:enc(val('us_p')),
              role:r, perms:(r==='admin'?null:np), linkId };
    if(id) Object.assign(u,o);
    else DB.d.users.push({ id:uid('u'), created:new Date().toISOString(), active:true, ...o });
    DB.save(); DB.log(id?'Account updated':'Account created', uname+' ('+r+')');
    closeModal(); cb?cb():render(); toast('Account saved');
  };
}

SET['Account & Security']=d=>{
  const u = DB.d.users.find(x=>x.id===SESSION.userId);
  d.innerHTML=`<div class="sect glass liquid"><h3>Change My Username / Password</h3>
    ${u?`<div class="grid2">${field('Username','ac_u',u.username)}${field('Current Password','ac_c','','password')}
      ${field('New Password','ac_n','','password')}${field('Confirm New Password','ac_n2','','password')}</div>
      <div style="margin-top:12px"><button class="btn primary" id="acSave">🔐 Update Credentials</button></div>`
     :'<div style="color:var(--txt-dim);font-size:13px">You are browsing as a guest — no account to modify. Create an account from the login screen.</div>'}
    </div>`;
  const b=$('#acSave',d); if(b) b.onclick=()=>{
    if(dec(u.password)!==val('ac_c')) return toast('Current password is incorrect','err');
    if(val('ac_n')!==val('ac_n2')) return toast('New passwords do not match','err');
    u.username=val('ac_u')||u.username;
    if(val('ac_n')) u.password=enc(val('ac_n'));
    SESSION.name=u.name||u.username; $('#whoName').textContent=SESSION.name;
    DB.save(); DB.log('Credentials changed',u.username); toast('Credentials updated');
  };
};
SET['System Check']=d=>{
  d.innerHTML=`<div class="sect glass liquid"><h3>Configuration &amp; Runtime Verification</h3>
    <p style="font-size:12.5px;color:var(--txt-dim);line-height:1.7">
      Validates the theme CSS, <code>theme.json</code>, <code>strings.json</code>,
      <code>config.json</code> and every custom JS module, then confirms they are
      parsed and executing correctly at runtime.</p>
    <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn primary" id="scRun">${icon('check')} Run System Check</button>
      <button class="btn sm" id="scBg">${icon('bg')} Background Manager</button>
      <button class="btn sm" id="scOpen">${icon('materials')} Open Data Folder</button></div></div>`;
  $('#scRun',d).onclick=runSelfCheck;
  $('#scBg',d).onclick=backgroundManager;
  $('#scOpen',d).onclick=()=>window.api.backupFolder();
};
SET['Appearance']=d=>{ const s=DB.d.settings;
  d.innerHTML=`<div class="sect glass liquid"><h3>Appearance</h3>
    <div class="togline"><div class="g">Light Mode (glass turns white)</div><div class="switch ${s.theme==='light'?'on':''}" id="apTheme"><i></i></div></div>
    <div class="togline"><div class="g">Motion Graphics Background</div><div class="switch ${s.motionBg?'on':''}" id="apMotion"><i></i></div></div>
    <div class="togline"><div class="g">Animations & Transitions</div><div class="switch ${s.animations?'on':''}" id="apAnim"><i></i></div></div>
    <div class="grid2" style="margin-top:12px">${field('Accent Color','ap_acc',s.accent,'color')}${field('Glass Blur (px)','ap_blur',s.blur,'number')}</div>
    <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn primary" id="apSave">${icon('save')} Apply</button>
      ${isAdmin()?`<button class="btn gold" id="apBg">${icon('bg')} Global Background Manager</button>`:''}</div></div>`;
  const ab=$('#apBg',d); if(ab) ab.onclick=backgroundManager;
  $('#apTheme',d).onclick=()=>{ $('#apTheme',d).classList.toggle('on'); s.theme=$('#apTheme',d).classList.contains('on')?'light':'dark'; applyTheme(); DB.save(); };
  $('#apMotion',d).onclick=()=>{ $('#apMotion',d).classList.toggle('on'); s.motionBg=$('#apMotion',d).classList.contains('on'); DB.save(); };
  $('#apAnim',d).onclick=()=>{ $('#apAnim',d).classList.toggle('on'); s.animations=$('#apAnim',d).classList.contains('on'); DB.save(); };
  $('#apSave',d).onclick=()=>{ s.accent=val('ap_acc'); s.blur=+val('ap_blur')||26; applyTheme(); DB.save(); toast('Appearance applied'); };
};

/* ---------- global Customize ---------- */
function openCustomize(){
  if(!requireAdmin()) return;
  const s=DB.d.settings;
  modal({ title:'🎨 Customize Application', width:'720px',
    body:`<div class="grid2">${field('Accent Color','cz_a',s.accent,'color')}${field('Glass Blur','cz_b',s.blur,'number')}
      ${field('Theme','cz_t',s.theme,'select',['dark','light'])}
      ${field('Institution Name','cz_i',DB.d.branding.institute)}</div>
      <div class="togline" style="margin-top:10px"><div class="g">Motion background</div><div class="switch ${s.motionBg?'on':''}" id="cz_m"><i></i></div></div>
      <div class="togline"><div class="g">Animations & transitions</div><div class="switch ${s.animations?'on':''}" id="cz_an"><i></i></div></div>
      <p style="font-size:12px;color:var(--txt-dim);margin-top:10px">More options: Settings → Branding, Feature Toggles, Sidebar, Academic Rules.</p>`,
    footer:`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="czSave">💾 Apply</button>` });
  $('#cz_m').onclick=()=>$('#cz_m').classList.toggle('on');
  $('#cz_an').onclick=()=>$('#cz_an').classList.toggle('on');
  $('#czSave').onclick=()=>{ s.accent=val('cz_a'); s.blur=+val('cz_b')||26; s.theme=val('cz_t');
    s.motionBg=$('#cz_m').classList.contains('on'); s.animations=$('#cz_an').classList.contains('on');
    DB.d.branding.institute=val('cz_i'); $('#sideName').textContent=DB.d.branding.institute;
    applyTheme(); DB.save(); DB.log('Customized','App theme'); closeModal(); render(); toast('Applied'); };
}

/* ================= NAVIGATION ================= */
const NAV = [
  { group:'Overview', items:[{page:'home',label:'Home',icon:'home'}] },
  { group:'People', items:[{page:'teachers',label:'Teachers',icon:'teachers',perm:'viewTeachers'},{page:'students',label:'Students',icon:'students',perm:'viewStudents'}] },
  { group:'Academies', items:[{page:'courses',label:'Courses',icon:'courses',perm:'viewCourses'},
      {page:'lessons',label:'Lessons | Phases | Exercises',icon:'lessons',perm:'viewCourses'},{page:'batches',label:'Batches',icon:'batches',perm:'viewCourses'}] },
  { group:'Daily Works', items:[{page:'attendance',label:'Attendance',icon:'attendance',perm:'viewAttendance'},
      {page:'participation',label:'Class Participation Marks',icon:'participation',perm:'viewParticipation'}] },
  { group:'Assessment', items:[{page:'assignments',label:'Assignments',icon:'assignments',perm:'viewAssessment'},
      {page:'progress',label:'Student Progress',icon:'progress',perm:'viewAssessment'}] },
  { group:'Finance', items:[{page:'finance',label:'Fees & Fines',icon:'finance',perm:'viewFinance'}] },
  { group:'Resources', items:[{page:'materials',label:'Learning Materials',icon:'materials',perm:'viewResources'},
      {page:'lab',label:'Computer Lab',icon:'lab',perm:'viewResources'},{page:'idcards',label:'ID Cards',icon:'idcards',perm:'viewIdCards'}] },
  { group:'Completion', items:[{page:'graduation',label:'Graduation',icon:'graduation',perm:'viewCompletion'},
      {page:'calendar',label:'Academic Calendar',icon:'calendar',perm:'viewCompletion'},{page:'reports',label:'Reports',icon:'reports',perm:'viewReports'}] },
  { group:'System', items:[{page:'backups',label:'Backups & Restore',icon:'backups',admin:true},{page:'recycle',label:'Recycle Bin',icon:'recycle',admin:true},
      {page:'activity',label:'Activity History',icon:'activity',admin:true},{page:'updates',label:'Upload / Updates',icon:'updates',admin:true},
      {page:'settings',label:'Settings',icon:'settings'}] }
];
/* item 3: every group is permanently expanded — no click-to-collapse.
   The .nav-group wrapper draws the persistent vertical hierarchy line. */
function buildNav(){
  const sb = DB.d.settings.sidebar||{};
  $('#nav').innerHTML = NAV.map(g=>{
    const items = g.items.filter(i => (!i.admin || isAdmin()) && (!i.perm || can(i.perm)) && sb[i.page] !== false);
    if(!items.length) return '';
    return `<div class="group-title">${g.group}</div><div class="nav-group">` + items.map(i=>
      `<div class="nav-item ${ROUTE.page===i.page?'active':''}" data-page="${i.page}">${icon(i.icon)}<span class="nav-label">${i.label}</span></div>`).join('') + `</div>`;
  }).join('');
  $$('#nav .nav-item').forEach(n=>n.onclick=()=>go(n.dataset.page));
  renderUserCard();
}
/* item 4: user profile card above the logout button, for every role */
function renderUserCard(){
  const foot = $('.side-foot'); if(!foot) return;
  const role = { admin:'Administrator', teacher:'Teacher', student:'Student',
                 client:'Client / Viewer', guest:'Guest Viewer' }[SESSION.role] || 'Viewer';
  foot.innerHTML = `
    <div class="user-card">
      <div class="avatar" id="avatar">${esc((SESSION.name[0]||'G').toUpperCase())}</div>
      <div class="u-meta" style="flex:1;min-width:0">
        <div class="u-n" id="whoName">${esc(SESSION.name)}</div>
        <div class="u-r" id="whoRole">${role}</div>
      </div>
    </div>
    <button class="btn sm logout-btn" id="btnLogout">${icon('logout')}<span>Logout</span></button>`;
  $('#btnLogout').onclick=()=>{ DB.log('Logout',SESSION.name); location.reload(); };
}

/* ================= SEARCH ================= */
function initSearch(){
  const inp=$('#searchInput'), box=$('#searchResults');
  const run=()=>{
    const q=inp.value.trim().toLowerCase();
    if(!q){ box.style.display='none'; return; }
    const res=[];
    DB.d.students.forEach(s=>{ if([s.fullName,s.regNo,s.fatherName,(s.courses||[]).join(' ')].join(' ').toLowerCase().includes(q))
      res.push({tag:'Student',label:s.fullName+' · '+(s.regNo||''),go:()=>go('studentProfile',s.id)}); });
    DB.d.teachers.forEach(t=>{ if([t.fullName,t.regNo,t.qualification].join(' ').toLowerCase().includes(q))
      res.push({tag:'Teacher',label:t.fullName,go:()=>go('teacherProfile',t.id)}); });
    DB.d.courses.forEach(c=>{ if(c.name.toLowerCase().includes(q)) res.push({tag:'Course',label:c.name,go:()=>go('courses')}); });
    NAV.flatMap(g=>g.items).forEach(i=>{ if(i.label.toLowerCase().includes(q)) res.push({tag:'Page',label:i.label,go:()=>go(i.page)}); });
    DB.d.events.forEach(e=>{ if(e.title.toLowerCase().includes(q)) res.push({tag:'Event',label:e.title+' · '+e.start,go:()=>go('calendar')}); });
    box.innerHTML = res.length? res.slice(0,25).map((r,i)=>`<div class="sr" data-i="${i}"><span class="tag">${r.tag}</span>${esc(r.label)}</div>`).join('')
      : '<div class="sr">No results</div>';
    box.style.display='block';
    $$('.sr',box).forEach(n=>n.onclick=()=>{ const r=res[+n.dataset.i]; if(r){ box.style.display='none'; inp.value=''; r.go(); } });
  };
  inp.oninput=run;
  document.addEventListener('click',e=>{ if(!$('#globalSearch').contains(e.target)) box.style.display='none'; });
}

/* ================= LOGIN ================= */
function showLogin(){
  $('#login').style.display='grid';
  $('#login').style.backgroundImage = "url('" + asset('loginbg.png') + "')";
  $('#app').style.display='none';
}
function startApp(user){
  SESSION = user ? { name:user.name||user.username, role:user.role, userId:user.id } : { name:'Guest', role:'guest', userId:null };
  $('#login').style.display='none';
  $('#app').style.display='grid';
  $('#sideName').textContent=DB.d.branding.institute||'IT-Tech';
  renderUserCard();
  applyBackground();
  /* item 5: hide every admin-only affordance from non-administrators */
  ['btnCustomize','btnBg'].forEach(id=>{
    const b=document.getElementById(id);
    if(b) b.style.display = canCustomize() ? '' : 'none';
  });
  document.body.classList.toggle('role-admin', isAdmin());
  document.body.classList.toggle('role-restricted', !isAdmin());
  DB.log('Login', SESSION.role);
  buildNav(); go('home');
}

async function boot(){
  await loadConfigFiles();          // item 25
  await DB.load();
  applyTheme(); initBg(); applyBackground(); showLogin();
  const bt=$('#brandTitle'); if(bt) bt.textContent = DB.d.branding.institute||'IT-Tech';

  /* ---------- item 1: keyboard navigation on both login tabs ---------- */
  const wireKeys = (userId, passId, confirmId, submit) => {
    const U=$('#'+userId), P=$('#'+passId), C=confirmId?$('#'+confirmId):null;
    const chain=[U,P,C].filter(Boolean);
    chain.forEach((el,i)=>{
      el.addEventListener('keydown', e=>{
        if(e.key==='ArrowDown'){ e.preventDefault(); const n=chain[i+1]; if(n){ n.focus(); n.select&&n.select(); } }
        else if(e.key==='ArrowUp'){ e.preventDefault(); const pr=chain[i-1]; if(pr){ pr.focus(); pr.select&&pr.select(); } }
        else if(e.key==='Enter'){ e.preventDefault(); submit(); }
      });
    });
  };

  $('#btnShowCreate').onclick=()=>{ $('#loginForm').style.display='none'; $('#createForm').style.display='block'; $('#loginMsg').textContent=''; };
  $('#btnBackLogin').onclick=()=>{ $('#createForm').style.display='none'; $('#loginForm').style.display='block'; $('#loginMsg').textContent=''; };
  $('#loginTheme').onclick=()=>{ toggleTheme(); };
  const tryLogin=()=>{
    const u=$('#luser').value.trim(), p=$('#lpass').value;
    const found=DB.d.users.find(x=>x.username.toLowerCase()===u.toLowerCase() && dec(x.password)===p);
    if(!found){ $('#loginMsg').textContent='Invalid username or password'; return; }
    startApp(found);
  };
  $('#btnLogin').onclick=tryLogin;
  $('#btnGuest').onclick=()=>startApp(null);
  $('#btnCreate').onclick=async()=>{
    const n=$('#cname').value.trim(), u=$('#cuser').value.trim(), p=$('#cpass').value, p2=$('#cpass2').value;
    if(!u||!p) return $('#loginMsg').textContent='Username and password are required';
    if(p!==p2) return $('#loginMsg').textContent='Passwords do not match';
    if(DB.d.users.some(x=>x.username.toLowerCase()===u.toLowerCase())) return $('#loginMsg').textContent='Username already exists';
    const user={ id:uid('u'), name:n||u, username:u, password:enc(p), role:'client',
      created:new Date().toISOString(), active:true, perms:{...DEFAULT_PERMS} };
    DB.d.users.push(user); await DB.save(); DB.log('Account created',u);
    $('#loginMsg').style.color='#7dffc0'; $('#loginMsg').textContent='Account created — logging you in…';
    setTimeout(()=>startApp(user),700);
  };

  /* Sign In tab: Username -> ArrowDown -> Password ; Enter anywhere = Unlock App */
  wireKeys('luser','lpass',null,tryLogin);
  /* Create Account tab: same behaviour, Enter submits the create form */
  wireKeys('cuser','cpass','cpass2',()=>$('#btnCreate').click());
  $('#cname').addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){ e.preventDefault(); $('#cuser').focus(); }
    else if(e.key==='Enter'){ e.preventDefault(); $('#btnCreate').click(); }
  });
  setTimeout(()=>{ const u=$('#luser'); if(u) u.focus(); }, 300);

  $('#btnTheme').onclick=toggleTheme;
  $('#btnCollapse').onclick=()=>$('#app').classList.toggle('collapsed');
  $('#btnCustomize').onclick=()=>{ if(canCustomize()) openCustomize(); };
  $('#btnBg').onclick=()=>{ if(canCustomize()) backgroundManager(); };
  $('#btnBackupQuick').onclick=async()=>{ const n=await window.api.backupCreate(DB.d); toast('Backup: '+n); };
  ['themeIco:theme','bgIco:bg','bkIco:save','czIco:palette','menuIco:menu','searchIco:search']
    .forEach(pair=>{ const [id,ic]=pair.split(':'); const el=document.getElementById(id); if(el) el.innerHTML=icon(ic); });
  initSearch();
}
boot();

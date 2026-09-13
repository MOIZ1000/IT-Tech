/* ============ RELATIVE PATH RESOLUTION (Electron + GitHub Pages) ============
   Electron serves this file from  <app>/src/index.html      -> assets live at ../assets/
   GitHub Pages serves it from     <repo>/index.html         -> assets live at assets/
   Both are RELATIVE (never a leading "/") so a project site such as
   https://user.github.io/IT-Tech/ resolves correctly instead of hitting
   https://user.github.io/assets/ and 404-ing.                              */
const IS_WEB = (typeof window !== 'undefined') && !(window.api && window.api.loadDB);
/* if the page lives in a /src/ directory we must step up one level */
const IN_SRC_DIR = (typeof location !== 'undefined') && /\/src\/?$|\/src\/[^/]*$/.test(location.pathname);
const ASSET_BASE = IN_SRC_DIR ? '../assets/' : 'assets/';
const CONFIG_BASE = IN_SRC_DIR ? '../src/config/' : 'config/';
/* asset('logo.png') -> '../assets/logo.png' or 'assets/logo.png' */
function asset(name){ return ASSET_BASE + String(name).replace(/^.*[\\/]/, ''); }
function configPath(name){ return CONFIG_BASE + name; }

/* ================= IT-Tech data layer ================= */
const COURSES = ["History Of Computer","Fundamentals Of Computer","Typing Skills","Operating System",
  "MS Office","Internet & Network","Database","Graphics Designing","Artificial Intelligence (AI)"];

const STATUSES = ["Active","Not Started Yet","Completed","Graduated","Dropped Out","Suspended","Left"];

function uid(p){ return (p||'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function today(){ return new Date().toISOString().slice(0,10); }

/* simple reversible obfuscation so plain passwords are never written raw,
   but the administrator can still view them (as the requirement asks). */
function enc(s){ try{ return btoa(unescape(encodeURIComponent('itx:'+s))); }catch(e){ return s; } }
function dec(s){ try{ const d=decodeURIComponent(escape(atob(s))); return d.startsWith('itx:')?d.slice(4):d; }catch(e){ return s; } }

const DEFAULT_PERMS = {
  viewStudents:true, viewTeachers:true, viewCourses:true, viewAttendance:true,
  viewParticipation:true, viewAssessment:true, viewFinance:false, viewResources:true,
  viewIdCards:false, viewCompletion:true, viewReports:true, viewSystem:false,
  editStudents:false, editTeachers:false, editAttendance:false, editParticipation:false,
  editFinance:false, editCourses:false, exportData:false, deleteData:false,
  customize:false
};

/* item 5: role presets. `customize` is what reveals every Customize / theme
   control — only the administrator gets it by default. */
const ROLES = ['admin','teacher','student','client'];
const ROLE_PRESETS = {
  teacher: { viewStudents:true, viewTeachers:true, viewCourses:true, viewAttendance:true,
    viewParticipation:true, viewAssessment:true, viewFinance:false, viewResources:true,
    viewIdCards:false, viewCompletion:true, viewReports:true, viewSystem:false,
    editStudents:true, editTeachers:false, editAttendance:true, editParticipation:true,
    editFinance:false, editCourses:false, exportData:true, deleteData:false, customize:false },
  student: { viewStudents:false, viewTeachers:true, viewCourses:true, viewAttendance:true,
    viewParticipation:true, viewAssessment:true, viewFinance:false, viewResources:true,
    viewIdCards:false, viewCompletion:true, viewReports:false, viewSystem:false,
    editStudents:false, editTeachers:false, editAttendance:false, editParticipation:false,
    editFinance:false, editCourses:false, exportData:false, deleteData:false, customize:false },
  client: { ...DEFAULT_PERMS },
  admin: Object.fromEntries(Object.keys(DEFAULT_PERMS).map(k=>[k,true]))
};
const PERM_GROUPS = [
  { title:'Sections the role can open', keys:['viewStudents','viewTeachers','viewCourses','viewAttendance',
      'viewParticipation','viewAssessment','viewFinance','viewResources','viewIdCards','viewCompletion','viewReports'] },
  { title:'What the role may change', keys:['editStudents','editTeachers','editAttendance','editParticipation',
      'editCourses','editFinance','exportData','deleteData'] },
  { title:'Administrative power', keys:['customize','viewSystem'] }
];
const PERM_LABEL = {
  viewStudents:'View Students', viewTeachers:'View Teachers', viewCourses:'View Courses',
  viewAttendance:'View Attendance', viewParticipation:'View Participation Marks',
  viewAssessment:'View Assessments', viewFinance:'View Fees & Fines', viewResources:'View Resources',
  viewIdCards:'View ID Cards', viewCompletion:'View Graduation / Calendar', viewReports:'View Reports',
  viewSystem:'View System Tools', editStudents:'Add / Edit Students', editTeachers:'Add / Edit Teachers',
  editAttendance:'Mark Attendance', editParticipation:'Give Participation Marks',
  editCourses:'Add / Edit Courses', editFinance:'Edit Fees & Fines', exportData:'Export / Import Data',
  deleteData:'Delete Records', customize:'Customize UI, Theme & Background'
};

function defaultDB(){
  return {
    meta:{ version:1, created:new Date().toISOString() },
    branding:{ institute:"IT-Tech", short:"ITT", tagline:"Learn Today · Build Tomorrow",
      phone:"", email:"", currency:"PKR", regPrefix:"ITT-", logo:"" },
    users:[
      { id:uid('u'), name:"MOIZ", username:"MOIZ", password:enc("Hacked"), role:"admin",
        created:new Date().toISOString(), perms:null, active:true }
    ],
    settings:{
      theme:"dark", accent:"#ff7a18", view:{students:"cards",teachers:"cards"},
      guestPerms:{...DEFAULT_PERMS, viewFinance:false, viewSystem:false},
      sidebar:{}, animations:true, motionBg:true, blur:26,
      academic:{ lateDeduct:0.25, presentScore:2.5, leaveScore:1.5, absentScore:0, maxScore:5,
                 lowAttendance:75, lowParticipation:60, feeDueDay:10 },
      homeCards:[
        {id:'c1',key:'totalStudents',label:'Total Students',icon:'👨‍🎓',on:true},
        {id:'c2',key:'activeStudents',label:'Active Students',icon:'⚡',on:true},
        {id:'c3',key:'graduated',label:'Graduated',icon:'🎓',on:true},
        {id:'c4',key:'totalCourses',label:'Total Courses',icon:'📚',on:true},
        {id:'c5',key:'activeCourses',label:'Active Courses',icon:'🔥',on:true},
        {id:'c6',key:'feePending',label:'Fee Pending',icon:'💰',on:true}
      ]
    },
    courses: COURSES.map((c,i)=>({ id:uid('c'), name:c, code:'C'+(101+i), fee:2000, duration:'2 Months',
      instructor:'', desc:'', active:true, color:['#8b5cf6','#ff7a18','#ffc84a','#ff3b5c'][i%4] })),
    teachers:[], students:[], lessons:[], phases:[], exercises:[], batches:[],
    attendance:{}, participation:{}, assessments:[], fees:[], fines:[],
    materials:[], lab:[], events:[], certificates:[], idcardTemplates:[],
    files:[], recycle:[], activity:[]
  };
}

const DB = {
  d: null,
  async load(){
    const saved = await window.api.loadDB();
    this.d = saved || defaultDB();
    // migrate missing keys
    const def = defaultDB();
    for (const k of Object.keys(def)) if (this.d[k] === undefined) this.d[k] = def[k];
    for (const k of Object.keys(def.settings)) if (this.d.settings[k] === undefined) this.d.settings[k] = def.settings[k];
    this.purgeRecycle();
    return this.d;
  },
  async save(){ await window.api.saveDB(this.d); },
  log(action, detail){
    this.d.activity.unshift({ id:uid('a'), time:new Date().toISOString(),
      user: (window.SESSION && SESSION.name) || 'system', action, detail: detail||'' });
    if (this.d.activity.length > 3000) this.d.activity.length = 3000;
    this.save();
  },
  trash(type, item){
    this.d.recycle.unshift({ id:uid('r'), type, item, deleted:new Date().toISOString() });
    this.log('Deleted', type + ': ' + (item.name || item.fullName || item.id));
    this.save();
  },
  purgeRecycle(){
    const cutoff = Date.now() - 30*24*3600*1000;
    const before = this.d.recycle.length;
    this.d.recycle = this.d.recycle.filter(r => new Date(r.deleted).getTime() > cutoff);
    if (this.d.recycle.length !== before) this.save();
  },
  students(){ return this.d.students; },
  teachers(){ return this.d.teachers; },
  student(id){ return this.d.students.find(s=>s.id===id); },
  teacher(id){ return this.d.teachers.find(t=>t.id===id); },
  nextReg(){
    const p = this.d.branding.regPrefix || 'ITT-';
    const n = this.d.students.length + 1;
    return p + String(n).padStart(3,'0');
  }
};

/* ---------- attendance & participation helpers ---------- */
function attKey(studentId, date){ return studentId + '|' + date; }
function getAtt(sid, date){ return DB.d.attendance[attKey(sid,date)] || null; }
function setAtt(sid, date, mark){
  if (!mark) delete DB.d.attendance[attKey(sid,date)];
  else DB.d.attendance[attKey(sid,date)] = mark;   // P A L T(late)
  DB.save();
}
function getPart(sid, date){ const v = DB.d.participation[attKey(sid,date)]; return v===undefined?null:v; }
function setPart(sid, date, score){
  if (score===null) delete DB.d.participation[attKey(sid,date)];
  else DB.d.participation[attKey(sid,date)] = Math.max(0, Math.min(DB.d.settings.academic.maxScore, +score));
  DB.save();
}
function defaultScoreFor(mark){
  const a = DB.d.settings.academic;
  if (mark==='A') return a.absentScore;
  if (mark==='L') return a.leaveScore;
  if (mark==='T') return Math.max(0, a.presentScore - a.lateDeduct*2);
  if (mark==='P') return a.presentScore;
  return 0;
}
function monthDates(year, month){ // month 0-11
  const out=[], last=new Date(year, month+1, 0).getDate();
  for(let d=1; d<=last; d++) out.push(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  return out;
}
function studentAttStats(sid, dates){
  let P=0,A=0,L=0,T=0;
  dates.forEach(d=>{ const m=getAtt(sid,d); if(m==='P')P++; else if(m==='A')A++; else if(m==='L')L++; else if(m==='T')T++; });
  const total=P+A+L+T;
  return {P,A,L,T,total, pct: total? Math.round(((P+T)/total)*100) : 0};
}
function allDatesFor(sid){
  return Object.keys(DB.d.attendance).filter(k=>k.startsWith(sid+'|')).map(k=>k.split('|')[1]);
}
function overallAtt(sid){
  const ds = allDatesFor(sid);
  return studentAttStats(sid, ds);
}
function studentPending(sid){
  return DB.d.fees.filter(f=>f.studentId===sid && f.status!=='Paid')
                  .reduce((a,f)=>a + (+f.amount||0) - (+f.paid||0), 0)
       + DB.d.fines.filter(f=>f.studentId===sid && f.status!=='Paid')
                  .reduce((a,f)=>a + (+f.amount||0) - (+f.paid||0), 0);
}
function courseProgress(st, courseName){
  const c = (st.courseData||{})[courseName] || {};
  if (c.manualProgress != null && c.manualProgress !== '') return +c.manualProgress;
  let p = 0;
  if (c.status==='Completed'||c.status==='Graduated') return 100;
  if (c.startDate && c.endDate){
    const s=new Date(c.startDate), e=new Date(c.endDate), n=Date.now();
    if (e>s) p = Math.max(0, Math.min(100, Math.round(((n-s)/(e-s))*100)));
  }
  return p;
}
function isInactiveStatus(s){ return ['Completed','Graduated','Left','Not Started Yet'].includes(s); }
function statusClass(s){
  if (s==='Dropped Out') return 'st-dropped';
  if (s==='Suspended') return 'st-suspended';
  if (isInactiveStatus(s) && s!=='Not Started Yet') return 'st-inactive';
  return '';
}

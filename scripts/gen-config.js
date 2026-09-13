#!/usr/bin/env node
/* Generates src/config/*.json. Idempotent - safe to re-run any time.
   Keeping these in a generator means they can always be restored.       */
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', 'src', 'config');
fs.mkdirSync(DIR, { recursive: true });

const config = {
  app: { id:"com.ittech.classmanager", name:"IT-Tech", version:"1.7.0", channel:"stable", offline:true },
  paths: {
    comment:"All paths are RELATIVE (no leading slash) so the app works from any sub-directory, including a GitHub Pages project site such as https://user.github.io/repo/",
    assets:"assets/", config:"config/", logo:"assets/logo.png", icon:"assets/icon.png",
    loginBackground:"assets/loginbg.png",
    defaultPhotos:{ boy:"assets/boy.png", girl:"assets/girl.png", teacher:"assets/teacher.png" }
  },
  defaults: { theme:"dark", background:"classroom", accent:"#ff7a18", blur:26,
    motionBg:true, animations:true, view:{ students:"cards", teachers:"cards" } },
  security: { adminUsername:"MOIZ", passwordsVisibleToAdminOnly:true, guestCanEdit:false, codeEditorAdminOnly:true },
  retention: { recycleBinDays:30, activityLogMax:3000 },
  academic: { absentScore:0, leaveScore:1.5, presentScore:2.5, lateDeduct:0.25,
    maxScore:5, scoreStep:0.1, lowAttendance:75, lowParticipation:60, feeDueDay:10 },
  export: { formats:["excel","word","ppt","csv","pdf","json"], idCardDpi:[150,300,600] },
  idCards: { studentOrientation:"Portrait", teacherOrientation:"Landscape" }
};

const strings = {
  locale:"en",
  app:{ name:"IT-Tech", tagline:"Learn Today · Build Tomorrow", subtitle:"Class Manager" },
  login:{ username:"Username", password:"Password", signIn:"Unlock App",
    create:"Create Username & Password", guest:"Continue Without Username",
    invalid:"Invalid username or password", mismatch:"Passwords do not match",
    exists:"Username already exists", required:"Username and password are required",
    created:"Account created — logging you in…",
    hintKeys:"Press Down Arrow to move to Password · Press Enter to sign in" },
  roles:{ admin:"Administrator", teacher:"Teacher", student:"Student", client:"Client / Viewer", guest:"Guest Viewer" },
  nav:{ overview:"Overview", people:"People", academies:"Academies", dailyWorks:"Daily Works",
    assessment:"Assessment", finance:"Finance", resources:"Resources", completion:"Completion", system:"System" },
  actions:{ add:"Add", edit:"Edit", delete:"Delete", save:"Save", cancel:"Cancel", import:"Import",
    export:"Export", print:"Print", customize:"Customize", restore:"Restore", open:"Open", close:"Close", apply:"Apply" },
  attendance:{ present:"Present", absent:"Absent", leave:"Leave", late:"Late", notMarked:"Not marked" },
  status:{ active:"Active", notStarted:"Not Started Yet", completed:"Completed", graduated:"Graduated",
    droppedOut:"Dropped Out", suspended:"Suspended", left:"Left" },
  toast:{ saved:"Saved", deleted:"Moved to Recycle Bin", restored:"Restored", backup:"Backup created",
    noPermission:"You do not have permission for this action", adminOnly:"Administrator only" },
  empty:{ students:"No students found.", teachers:"No teachers yet.", files:"No files attached yet", activity:"No activity" }
};

const theme = {
  name:"Liquid Glass",
  colors:{ black:"#07070c", purple:"#8b5cf6", neon:"#ff7a18", gold:"#ffc84a", red:"#ff3b5c", white:"#ffffff" },
  dark:{ text:"#f4f4ff", textDim:"#b9b9d4", glassBg:"rgba(255,255,255,.07)", glassBorder:"rgba(255,255,255,.18)" },
  light:{ base:"#808080", text:"#14161a", textDim:"#3c4046", glassBg:"rgba(255,255,255,.24)", glassBorder:"rgba(255,255,255,.42)" },
  radius:18, blur:26, loginBlur:16,
  scrollbar:{ railOpacity:0.07, thumb:"#ff7a18", thumbHover:"#ffc84a", width:12, round:true },
  backgrounds:["classroom","aurora","nebula","cyber","sunset","matrix","ocean"],
  animations:{ iconHover:"scale(1.3) rotate(-10deg)", cardHover:"translateY(-4px)",
    pageIn:"0.45s cubic-bezier(.2,.9,.3,1)", elastic:"cubic-bezier(.2,1.6,.4,1)" }
};

for (const [n,o] of [['config',config],['strings',strings],['theme',theme]]){
  fs.writeFileSync(path.join(DIR, n+'.json'), JSON.stringify(o,null,2));
  console.log('wrote src/config/'+n+'.json');
}

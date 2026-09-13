const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
const DATA_DIR = () => path.join(app.getPath('userData'), 'data');
const DB_FILE = () => path.join(DATA_DIR(), 'ittech-db.json');
const FILES_DIR = () => path.join(DATA_DIR(), 'files');
const BACKUP_DIR = () => path.join(DATA_DIR(), 'backups');

function ensureDirs() {
  [DATA_DIR(), FILES_DIR(), BACKUP_DIR()].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1500, height: 940, minWidth: 1100, minHeight: 700,
    backgroundColor: '#07070c',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => { ensureDirs(); createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

/* ---------------- Database ---------------- */
ipcMain.handle('db:load', () => {
  ensureDirs();
  try { return fs.existsSync(DB_FILE()) ? JSON.parse(fs.readFileSync(DB_FILE(), 'utf8')) : null; }
  catch (e) { return null; }
});

ipcMain.handle('db:save', (e, data) => {
  ensureDirs();
  fs.writeFileSync(DB_FILE(), JSON.stringify(data, null, 2), 'utf8');
  return true;
});

ipcMain.handle('db:path', () => DATA_DIR());
ipcMain.handle('app:version', () => app.getVersion());

/* ---------------- Backups ---------------- */
ipcMain.handle('backup:create', (e, data) => {
  ensureDirs();
  const name = 'backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  fs.writeFileSync(path.join(BACKUP_DIR(), name), JSON.stringify(data, null, 2), 'utf8');
  return name;
});
ipcMain.handle('backup:list', () => {
  ensureDirs();
  return fs.readdirSync(BACKUP_DIR()).filter(f => f.endsWith('.json')).map(f => {
    const st = fs.statSync(path.join(BACKUP_DIR(), f));
    return { name: f, size: st.size, time: st.mtime.toISOString() };
  }).sort((a, b) => b.time.localeCompare(a.time));
});
ipcMain.handle('backup:restore', (e, name) => {
  const p = path.join(BACKUP_DIR(), name);
  if (!fs.existsSync(p)) throw new Error('Backup not found');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
});
ipcMain.handle('backup:delete', (e, name) => {
  const p = path.join(BACKUP_DIR(), name);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  return true;
});
ipcMain.handle('backup:openFolder', () => { ensureDirs(); shell.openPath(BACKUP_DIR()); return true; });

/* ---------------- File attachments ---------------- */
ipcMain.handle('file:pick', async (e, opts = {}) => {
  const r = await dialog.showOpenDialog(win, {
    properties: ['openFile', ...(opts.multi ? ['multiSelections'] : [])],
    filters: opts.filters || [{ name: 'All Files', extensions: ['*'] }]
  });
  if (r.canceled) return [];
  ensureDirs();
  return r.filePaths.map(fp => {
    const id = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + path.extname(fp);
    const dest = path.join(FILES_DIR(), id);
    fs.copyFileSync(fp, dest);
    const st = fs.statSync(dest);
    return { id, name: path.basename(fp), path: dest, size: st.size, ext: path.extname(fp).toLowerCase().replace('.', ''), added: new Date().toISOString() };
  });
});
ipcMain.handle('file:open', (e, p) => { shell.openPath(p); return true; });
ipcMain.handle('file:reveal', (e, p) => { shell.showItemInFolder(p); return true; });
ipcMain.handle('file:remove', (e, p) => { try { fs.unlinkSync(p); } catch (_) {} return true; });
ipcMain.handle('file:dataUrl', (e, p) => {
  try {
    const ext = path.extname(p).toLowerCase().replace('.', '');
    const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' }[ext];
    if (!mime) return null;
    return 'data:' + mime + ';base64,' + fs.readFileSync(p).toString('base64');
  } catch (_) { return null; }
});

/* ---------------- Background media (item 6) ---------------- */
const BG_DIR = () => path.join(DATA_DIR(), 'backgrounds');
ipcMain.handle('bg:pick', async (e, kind) => {
  const filters = kind === 'video'
    ? [{ name: 'Videos', extensions: ['mp4','webm','ogv','mkv','mov'] }]
    : [{ name: 'Images', extensions: ['png','jpg','jpeg','webp','bmp','gif'] }];
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters });
  if (r.canceled) return null;
  ensureDirs();
  if (!fs.existsSync(BG_DIR())) fs.mkdirSync(BG_DIR(), { recursive: true });
  const src = r.filePaths[0];
  const id = 'bg-' + Date.now().toString(36) + path.extname(src).toLowerCase();
  const dest = path.join(BG_DIR(), id);
  fs.copyFileSync(src, dest);
  const st = fs.statSync(dest);
  return { id, name: path.basename(src), path: dest, size: st.size,
           kind, ext: path.extname(src).toLowerCase().replace('.', '') };
});
ipcMain.handle('bg:list', () => {
  try {
    if (!fs.existsSync(BG_DIR())) return [];
    return fs.readdirSync(BG_DIR()).map(f => {
      const fp = path.join(BG_DIR(), f), st = fs.statSync(fp);
      const ext = path.extname(f).toLowerCase().replace('.', '');
      return { id: f, name: f, path: fp, size: st.size, ext,
               kind: ['mp4','webm','ogv','mkv','mov'].includes(ext) ? 'video' : 'image' };
    });
  } catch (_) { return []; }
});
ipcMain.handle('bg:delete', (e, p2) => { try { fs.unlinkSync(p2); } catch (_) {} return true; });

/* ---------------- Built-in viewer support (item 18) ---------------- */
ipcMain.handle('file:mediaUrl', (e, p) => {
  try {
    const ext = path.extname(p).toLowerCase().replace('.', '');
    const mime = {
      mp4:'video/mp4', webm:'video/webm', ogv:'video/ogg', mkv:'video/x-matroska',
      mov:'video/quicktime', avi:'video/x-msvideo',
      mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg', oga:'audio/ogg',
      m4a:'audio/mp4', aac:'audio/aac', flac:'audio/flac', opus:'audio/opus',
      pdf:'application/pdf'
    }[ext] || 'application/octet-stream';
    return 'data:' + mime + ';base64,' + fs.readFileSync(p).toString('base64');
  } catch (_) { return null; }
});
ipcMain.handle('file:readText', (e, p) => {
  try { return fs.readFileSync(p, 'utf8').slice(0, 400000); } catch (_) { return null; }
});
/* Extract readable text/HTML from Office files without external apps.
   OOXML files are ZIPs; pull the XML parts and strip tags. */
ipcMain.handle('file:officePreview', (e, p) => {
  try {
    const buf = fs.readFileSync(p);
    const ext = path.extname(p).toLowerCase();
    const zlib = require('zlib');
    const parts = [];
    // minimal ZIP local-header walk
    let i = 0;
    while (i < buf.length - 4) {
      if (buf.readUInt32LE(i) !== 0x04034b50) { i++; continue; }
      const method = buf.readUInt16LE(i + 8);
      let csize = buf.readUInt32LE(i + 18);
      const nameLen = buf.readUInt16LE(i + 26);
      const extraLen = buf.readUInt16LE(i + 28);
      const name = buf.toString('utf8', i + 30, i + 30 + nameLen);
      const dataStart = i + 30 + nameLen + extraLen;
      if (!csize || csize > buf.length) { i = dataStart; continue; }
      const wanted = /(word\/document\.xml|ppt\/slides\/slide\d+\.xml|xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml)$/.test(name);
      if (wanted) {
        try {
          const raw = buf.slice(dataStart, dataStart + csize);
          const xml = method === 8 ? zlib.inflateRawSync(raw).toString('utf8') : raw.toString('utf8');
          parts.push({ name, xml });
        } catch (_) {}
      }
      i = dataStart + csize;
    }
    if (!parts.length) return null;
    const clean = xml => xml
      .replace(/<a:p[ >]/g, '\n<a:p ').replace(/<w:p[ >]/g, '\n<w:p ')
      .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
    let body = '';
    if (ext === '.pptx') {
      parts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      body = parts.map((s2, n) => `<section><h3>Slide ${n + 1}</h3><pre>${clean(s2.xml)}</pre></section>`).join('');
    } else {
      body = parts.map(s2 => `<pre>${clean(s2.xml)}</pre>`).join('');
    }
    const esc2 = t => t;
    return { html: `<html><head><meta charset="utf-8"><style>
      body{font-family:Segoe UI,Arial;padding:18px;background:#fff;color:#111;line-height:1.6}
      h3{color:#ff7a18;margin:18px 0 6px} pre{white-space:pre-wrap;font-family:inherit;font-size:14px}
      section{border-bottom:1px solid #ddd;padding-bottom:12px;margin-bottom:12px}
      </style></head><body>${esc2(body)}</body></html>` };
  } catch (_) { return null; }
});

/* ---------------- Save / export ---------------- */
ipcMain.handle('save:dialog', async (e, { defaultName, data, base64 }) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: defaultName });
  if (r.canceled) return null;
  fs.writeFileSync(r.filePath, base64 ? Buffer.from(data, 'base64') : data, base64 ? undefined : 'utf8');
  return r.filePath;
});
ipcMain.handle('open:textFile', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Data', extensions: ['json', 'csv', 'txt', 'xml'] }] });
  if (r.canceled) return null;
  return { name: path.basename(r.filePaths[0]), content: fs.readFileSync(r.filePaths[0], 'utf8') };
});
ipcMain.handle('print:page', () => { win.webContents.print({ silent: false, printBackground: true }); return true; });
ipcMain.handle('print:pdf', async (e, defaultName) => {
  const buf = await win.webContents.printToPDF({ printBackground: true, landscape: false });
  const r = await dialog.showSaveDialog(win, { defaultPath: defaultName || 'report.pdf' });
  if (r.canceled) return null;
  fs.writeFileSync(r.filePath, buf);
  return r.filePath;
});

/* ---------------- Admin code editor ---------------- */
const ROOT = __dirname;
function safe(p) {
  const abs = path.resolve(ROOT, p);
  if (!abs.startsWith(ROOT)) throw new Error('Access denied');
  return abs;
}
ipcMain.handle('code:tree', () => {
  const out = [];
  (function walk(dir, rel) {
    for (const f of fs.readdirSync(dir)) {
      if (['node_modules', 'release', '.git'].includes(f)) continue;
      const abs = path.join(dir, f), r = rel ? rel + '/' + f : f;
      if (fs.statSync(abs).isDirectory()) walk(abs, r);
      else if (/\.(js|html|css|json|md|txt)$/i.test(f)) out.push(r);
    }
  })(ROOT, '');
  return out.sort();
});
ipcMain.handle('code:read', (e, rel) => fs.readFileSync(safe(rel), 'utf8'));
ipcMain.handle('code:write', (e, { rel, content }) => {
  const abs = safe(rel);
  const bak = abs + '.bak';
  if (fs.existsSync(abs)) fs.copyFileSync(abs, bak);
  fs.writeFileSync(abs, content, 'utf8');
  return true;
});
ipcMain.handle('app:reload', () => { win.reload(); return true; });

#!/usr/bin/env node
/* Build the GitHub Pages bundle into docs/ .
   Layout is FLAT so every path stays relative with no leading slash:
     docs/index.html   docs/*.js   docs/style.css
     docs/assets/...   docs/config/...                                   */
const fs = require('fs'), path = require('path');
const R = __dirname, OUT = path.join(R, 'docs');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'config'), { recursive: true });

// 1. code
for (const f of ['style.css','data.js','icons.js','ui.js','pages.js','pages2.js','app.js','web-shim.js'])
  fs.copyFileSync(path.join(R,'src',f), path.join(OUT,f));

// 2. config JSON  -> docs/config/
for (const f of fs.readdirSync(path.join(R,'src','config')))
  fs.copyFileSync(path.join(R,'src','config',f), path.join(OUT,'config',f));

// 3. images -> docs/assets/
for (const f of fs.readdirSync(path.join(R,'assets')).filter(f=>/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(f)))
  fs.copyFileSync(path.join(R,'assets',f), path.join(OUT,'assets',f));

// 4. index.html: rewrite ../assets/ -> assets/ and inject the browser shim
let html = fs.readFileSync(path.join(R,'src','index.html'),'utf8');
html = html.replace(/(src|href)="\.\.\/assets\//g, '$1="assets/');   // relative, no leading slash
html = html.replace('<script src="data.js"></script>',
                    '<script src="web-shim.js"></script>\n<script src="data.js"></script>');
// CSP must allow the shim's data: URLs
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/,
  '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob:; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; media-src \'self\' data: blob:; frame-src \'self\' data: blob:; connect-src \'self\' data: blob:;">');
fs.writeFileSync(path.join(OUT,'index.html'), html);

// 5. GitHub Pages housekeeping
fs.writeFileSync(path.join(OUT,'.nojekyll'), '');   // serve files/dirs verbatim
fs.writeFileSync(path.join(OUT,'404.html'), html);  // deep links fall back to the app

// 6. verify nothing absolute slipped in
const bad = [];
for (const f of fs.readdirSync(OUT)) {
  if (!/\.(html|js|css)$/.test(f)) continue;
  const t = fs.readFileSync(path.join(OUT,f),'utf8');
  const m = t.match(/(?:src|href)="\/[^"]*"|url\(\s*\/[^)]*\)/g);
  if (m) bad.push(f+': '+m.slice(0,3).join(', '));
}
console.log(bad.length ? '!! absolute paths found:\n'+bad.join('\n')
                       : 'OK - every path is relative (no leading slash)');
console.log('docs/ built');

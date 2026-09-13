const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadDB: () => ipcRenderer.invoke('db:load'),
  saveDB: (d) => ipcRenderer.invoke('db:save', d),
  dataPath: () => ipcRenderer.invoke('db:path'),
  appVersion: () => ipcRenderer.invoke('app:version'),

  backupCreate: (d) => ipcRenderer.invoke('backup:create', d),
  backupList: () => ipcRenderer.invoke('backup:list'),
  backupRestore: (n) => ipcRenderer.invoke('backup:restore', n),
  backupDelete: (n) => ipcRenderer.invoke('backup:delete', n),
  backupFolder: () => ipcRenderer.invoke('backup:openFolder'),

  pickFiles: (o) => ipcRenderer.invoke('file:pick', o),
  openFile: (p) => ipcRenderer.invoke('file:open', p),
  revealFile: (p) => ipcRenderer.invoke('file:reveal', p),
  removeFile: (p) => ipcRenderer.invoke('file:remove', p),
  fileDataUrl: (p) => ipcRenderer.invoke('file:dataUrl', p),
  mediaUrl: (p) => ipcRenderer.invoke('file:mediaUrl', p),
  bgPick: (k) => ipcRenderer.invoke('bg:pick', k),
  bgList: () => ipcRenderer.invoke('bg:list'),
  bgDelete: (p) => ipcRenderer.invoke('bg:delete', p),
  readText: (p) => ipcRenderer.invoke('file:readText', p),
  officePreview: (p) => ipcRenderer.invoke('file:officePreview', p),

  saveAs: (o) => ipcRenderer.invoke('save:dialog', o),
  openTextFile: () => ipcRenderer.invoke('open:textFile'),
  printPage: () => ipcRenderer.invoke('print:page'),
  printPDF: (n) => ipcRenderer.invoke('print:pdf', n),

  codeTree: () => ipcRenderer.invoke('code:tree'),
  codeRead: (r) => ipcRenderer.invoke('code:read', r),
  codeWrite: (o) => ipcRenderer.invoke('code:write', o),
  reloadApp: () => ipcRenderer.invoke('app:reload')
});

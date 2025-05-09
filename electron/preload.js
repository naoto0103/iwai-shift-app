const { contextBridge, ipcRenderer } = require('electron');

// Electronの機能をウィンドウオブジェクトに安全に公開
contextBridge.exposeInMainWorld('electronAPI', {
  // 必要に応じてAPIを追加
});
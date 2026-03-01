import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  connectDatabase: (config: any) => ipcRenderer.invoke('connect-database', config),
  dbOperation: (operation: string, collection: string, data?: any) => 
    ipcRenderer.invoke('db-operation', operation, collection, data),
  
  // Dialog operations
  showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  
  // File system operations
  openPath: (folderPath: string) => ipcRenderer.invoke('open-path', folderPath),
  saveFile: (relativePath: string, data: Uint8Array) => ipcRenderer.invoke('save-file', relativePath, data),
  
  // Auto-updater operations
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('update-status', (event, status) => callback(status));
  },
  removeUpdateStatusListener: () => {
    ipcRenderer.removeAllListeners('update-status');
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      connectDatabase: (config: any) => Promise<any>;
      dbOperation: (operation: string, collection: string, data?: any) => Promise<any>;
      showMessageBox: (options: any) => Promise<any>;
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      openPath: (folderPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      saveFile: (relativePath: string, data: Uint8Array) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      checkForUpdates: () => Promise<{ success: boolean; data?: any; message?: string }>;
      downloadUpdate: () => Promise<{ success: boolean; message?: string }>;
      installUpdate: () => Promise<{ success: boolean; message?: string }>;
      getAppVersion: () => Promise<string>;
      onUpdateStatus: (callback: (status: any) => void) => void;
      removeUpdateStatusListener: () => void;
    };
  }
}

export {};

declare global {
  interface Window {
    electronAPI: {
      dbOperation: (operation: string, data: string) => Promise<string>;
      // Add other IPC methods as needed
      openExternal: (url: string) => Promise<void>;
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
    };
  }
}
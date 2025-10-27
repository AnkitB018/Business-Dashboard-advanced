import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { MongoClient, Db } from 'mongodb';

// Keep a global reference of the window object
let mainWindow: BrowserWindow;
let database: Db | null = null;

// Database configuration storage
interface DatabaseConfig {
  connectionString: string;
  databaseName: string;
}

const createWindow = (): void => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    height: 900,
    width: 1400,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false, // Don't show until ready
    autoHideMenuBar: true, // Hide the menu bar (File, Edit, View, etc.)
    titleBarStyle: 'default',
    frame: true,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile('dist/index.html');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('dist/index.html');
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null!;
  });
};

// App event listeners
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Database connection handler
ipcMain.handle('connect-database', async (event, config: DatabaseConfig) => {
  try {
    const client = new MongoClient(config.connectionString);
    await client.connect();
    database = client.db(config.databaseName);
    
    // Test the connection
    await database.admin().ping();
    
    return { success: true, message: 'Connected to database successfully' };
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown connection error' 
    };
  }
});

// Database operations handlers
ipcMain.handle('db-operation', async (event, operation: string, collection: string, data?: any) => {
  if (!database) {
    return { success: false, message: 'Database not connected' };
  }

  try {
    let result;
    const coll = database.collection(collection);

    switch (operation) {
      case 'find':
        result = await coll.find(data?.query || {}).toArray();
        break;
      case 'findOne':
        result = await coll.findOne(data?.query || {});
        break;
      case 'insertOne':
        result = await coll.insertOne(data);
        break;
      case 'updateOne':
        result = await coll.updateOne(data.filter, { $set: data.update });
        break;
      case 'deleteOne':
        result = await coll.deleteOne(data);
        break;
      case 'count':
        result = await coll.countDocuments(data?.query || {});
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Database operation error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
});

// File dialog handlers
ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

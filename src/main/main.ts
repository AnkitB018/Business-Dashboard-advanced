import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { MongoClient, Db, ObjectId } from 'mongodb';

// Keep a global reference of the window object
let mainWindow: BrowserWindow;
let database: Db | null = null;
let mongoClient: MongoClient | null = null;

// Database configuration storage
interface DatabaseConfig {
  connectionString: string;
  databaseName: string;
}

// Auto-updater configuration
autoUpdater.autoDownload = false; // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true; // Install when app quits

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info: UpdateInfo) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'available', 
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate
    });
  }
});

autoUpdater.on('update-not-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'not-available' });
  }
});

autoUpdater.on('error', (error: Error) => {
  console.error('Auto-update error:', error);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'error', 
      error: error.message 
    });
  }
});

autoUpdater.on('download-progress', (progress: ProgressInfo) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloading', 
      progress: {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond
      }
    });
  }
});

autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloaded',
      version: info.version
    });
  }
});

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
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
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
app.on('ready', () => {
  createWindow();
  
  // Check for updates after a delay (5 seconds) to allow app to fully load
  // Only check in production
  if (process.env.NODE_ENV !== 'development') {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err: Error) => {
        console.error('Failed to check for updates:', err);
      });
    }, 5000);
  }
});

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
    // Close existing connection if any
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch (e) {
        // Ignore close errors
      }
      mongoClient = null;
      database = null;
    }
    
    const client = new MongoClient(config.connectionString, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout for connection
      connectTimeoutMS: 5000
    });
    
    // Actually connect to the server
    await client.connect();
    const db = client.db(config.databaseName);
    
    // Test the connection with a real operation
    await db.admin().ping();
    
    // Try to list collections to verify we have proper access
    await db.listCollections().toArray();
    
    // Only set if all tests pass
    mongoClient = client;
    database = db;
    
    return { success: true, message: 'Connected to database successfully' };
  } catch (error) {
    console.error('Database connection error:', error);
    // Clear database on failure
    database = null;
    mongoClient = null;
    
    // Extract meaningful error message
    let errorMessage = 'Unknown connection error';
    if (error instanceof Error) {
      // MongoDB specific error messages
      if (error.message.includes('authentication')) {
        errorMessage = 'Authentication failed. Please check your username and password.';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Could not reach database server. Please check your cluster URL.';
      } else if (error.message.includes('not authorized')) {
        errorMessage = 'Not authorized to access this database. Please check your credentials and database name.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { 
      success: false, 
      message: errorMessage
    };
  }
});

// Database operations handlers
ipcMain.handle('db-operation', async (event, operation: string, collection: string, data?: any) => {
  if (!database || !mongoClient) {
    return { success: false, message: 'Database not connected' };
  }
  
  // Verify connection is still alive
  try {
    await database.admin().ping();
  } catch (error) {
    database = null;
    mongoClient = null;
    return { success: false, message: 'Database connection lost. Please reconnect.' };
  }

  // Helper function to convert _id to ObjectId if needed
  const convertId = (obj: any) => {
    if (!obj) return obj;
    if (obj._id) {
      try {
        const idValue = obj._id;
        // Try to convert to ObjectId if it's a valid 24-char hex string
        if (typeof idValue === 'string' && /^[0-9a-fA-F]{24}$/.test(idValue)) {
          obj._id = new ObjectId(idValue);
        } else if (typeof idValue === 'object' && idValue.$oid) {
          obj._id = new ObjectId(idValue.$oid);
        }
      } catch (e) {
        // Keep ID as-is if conversion fails
      }
    }
    return obj;
  };

  try {
    let result;
    const coll = database.collection(collection);

    switch (operation) {
      case 'find':
        result = await coll.find(convertId(data?.query) || {}).toArray();
        break;
      case 'findOne':
        result = await coll.findOne(convertId(data?.query) || {});
        break;
      case 'insertOne':
        result = await coll.insertOne(data);
        break;
      case 'updateOne':
        result = await coll.updateOne(convertId(data.filter), { $set: data.update });
        break;
      case 'deleteOne':
        result = await coll.deleteOne(convertId(data));
        break;
      case 'count':
        result = await coll.countDocuments(convertId(data?.query) || {});
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

// File system handlers
ipcMain.handle('open-path', async (event, folderPath: string) => {
  try {
    // Create the backup folder if it doesn't exist
    const documentsPath = os.homedir();
    const backupPath = path.join(documentsPath, 'Documents', 'Business Dashboard', 'Backups');
    
    // Ensure the directory exists
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    // Open the folder in file explorer
    await shell.openPath(backupPath);
    return { success: true, path: backupPath };
  } catch (error) {
    console.error('Error opening path:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('save-file', async (event, relativePath: string, data: Uint8Array) => {
  try {
    // Create the full path using the user's Documents folder
    const documentsPath = os.homedir();
    const fullPath = path.join(documentsPath, relativePath);
    
    // Ensure the directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Convert Uint8Array to Buffer and write the file
    const buffer = Buffer.from(data);
    fs.writeFileSync(fullPath, buffer);
    return { success: true, filePath: fullPath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      return { 
        success: false, 
        message: 'Updates not available in development mode' 
      };
    }
    const result = await autoUpdater.checkForUpdates();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error checking for updates' 
    };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error downloading update:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error downloading update' 
    };
  }
});

ipcMain.handle('install-update', async () => {
  try {
    // This will quit the app and install the update
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } catch (error) {
    console.error('Error installing update:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error installing update' 
    };
  }
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

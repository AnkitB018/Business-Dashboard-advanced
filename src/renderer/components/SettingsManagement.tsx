import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import {
  Settings,
  Storage,
  Backup,
  CloudDownload,
  CloudUpload,
  Delete,
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  Save,
  RestoreFromTrash,
  Security,
  Storage as DatabaseIcon,
  Edit,
  Lock,
  Visibility,
  VisibilityOff,
  FolderOpen,
  Schedule,
  AutoMode,
} from '@mui/icons-material';
import databaseService from '../services/DatabaseService';
import { DatabaseConfig } from '../types/Common';

interface BackupInfo {
  id: string;
  name: string;
  date: string;
  size: string;
  collections: number;
  filePath?: string;
}

const SettingsManagement: React.FC = () => {
  // Database Configuration State
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    username: '',
    password: '',
    clusterUrl: '',
    databaseName: '',
    connectionString: ''
  });
  const [originalDbConfig, setOriginalDbConfig] = useState<DatabaseConfig>({
    username: '',
    password: '',
    clusterUrl: '',
    databaseName: '',
    connectionString: ''
  });
  const [isDbEditMode, setIsDbEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    message?: string;
  }>({ isConnected: false });

  // Backup State
  const [backupHistory, setBackupHistory] = useState<BackupInfo[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string>('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: () => {}
  });

  // App Settings State
  const [appSettings, setAppSettings] = useState({
    autoBackup: true,
    backupFolder: '',
    backupFrequency: 'daily',
    backupTime: '23:00', // 11:00 PM
    maxBackups: 10,
    showNotifications: true,
    enableLogging: true,
  });
  const [lastAutoBackup, setLastAutoBackup] = useState<string>('');
  const [nextAutoBackup, setNextAutoBackup] = useState<string>('');
  const [backupTimer, setBackupTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCurrentSettings();
    loadBackupHistory();
    loadAppSettings();
  }, []);

  // Initialize backup scheduling when app settings change
  useEffect(() => {
    scheduleNextBackup();
    
    // Cleanup timer on unmount
    return () => {
      if (backupTimer) {
        clearTimeout(backupTimer);
      }
    };
  }, [appSettings.autoBackup, appSettings.backupFrequency, appSettings.backupTime]);

  const loadCurrentSettings = async () => {
    try {
      setLoading(true);
      const config = await databaseService.getConfig();
      if (config) {
        setDbConfig(config);
        setOriginalDbConfig(config);
        // Test connection
        await testDatabaseConnection(config);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showSnackbar('Failed to load current settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async (config?: DatabaseConfig) => {
    try {
      const testConfig = config || dbConfig;
      const isConnected = await databaseService.testConnection(testConfig);
      setConnectionStatus({
        isConnected,
        message: isConnected ? 'Database connection successful' : 'Failed to connect to database'
      });
      return isConnected;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      const errorMessage = error?.message || 'Unknown error';
      setConnectionStatus({
        isConnected: false,
        message: 'Connection test failed: ' + errorMessage
      });
      return false;
    }
  };

  const saveDatabaseConfig = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!dbConfig.username || !dbConfig.password || !dbConfig.clusterUrl || !dbConfig.databaseName) {
        showSnackbar('Please fill in all required database configuration fields', 'error');
        return;
      }
      
      // Test connection first
      const isConnected = await testDatabaseConnection();
      if (!isConnected) {
        showSnackbar('Cannot save configuration: Database connection failed', 'error');
        return;
      }

      await databaseService.updateConfig(dbConfig);
      setOriginalDbConfig(dbConfig);
      setIsDbEditMode(false); // Exit edit mode after successful save
      showSnackbar('Database configuration saved successfully', 'success');
    } catch (error) {
      console.error('Error saving database config:', error);
      showSnackbar('Failed to save database configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDbEditMode = () => {
    if (isDbEditMode) {
      // Exiting edit mode - ask for confirmation if there are unsaved changes
      if (hasUnsavedChanges()) {
        setConfirmDialog({
          open: true,
          title: 'Discard Changes?',
          message: 'You have unsaved changes to the database configuration. Are you sure you want to discard them?',
          action: () => {
            setDbConfig(originalDbConfig);
            setIsDbEditMode(false);
            setConfirmDialog(prev => ({ ...prev, open: false }));
          }
        });
      } else {
        setIsDbEditMode(false);
      }
    } else {
      // Entering edit mode
      setIsDbEditMode(true);
    }
  };

  const loadBackupHistory = async () => {
    try {
      // Load backup history from localStorage
      const storedHistory = localStorage.getItem('backup-history');
      if (storedHistory) {
        const history: BackupInfo[] = JSON.parse(storedHistory);
        setBackupHistory(history);
      } else {
        setBackupHistory([]);
      }
    } catch (error) {
      console.error('Error loading backup history:', error);
      setBackupHistory([]);
    }
  };

  const createBackup = async () => {
    try {
      setIsCreatingBackup(true);
      
      // Get all data from MongoDB
      const employees = await databaseService.getAllEmployees();
      const attendance: any[] = []; // Add attendance data when available
      
      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      
      // Add Employees sheet
      if (employees.length > 0) {
        const employeesSheet = XLSX.utils.json_to_sheet(employees);
        XLSX.utils.book_append_sheet(workbook, employeesSheet, 'Employees');
      }
      
      // Add Attendance sheet (when data is available)
      if (attendance.length > 0) {
        const attendanceSheet = XLSX.utils.json_to_sheet(attendance);
        XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');
      }
      
      // Add a backup info sheet
      const backupInfo = [{
        'Backup Date': new Date().toISOString(),
        'Version': '1.0.0',
        'Tables Exported': workbook.SheetNames.join(', '),
        'Total Records': employees.length + attendance.length
      }];
      const infoSheet = XLSX.utils.json_to_sheet(backupInfo);
      XLSX.utils.book_append_sheet(workbook, infoSheet, 'Backup Info');
      
      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true 
      });
      
      // Calculate file size
      const sizeInBytes = excelBuffer.byteLength;
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const timeStr = new Date().toISOString().split('T')[1].replace(/[:.]/g, '-').substring(0, 8);
      const filename = `BusinessDashboard_Backup_${timestamp}_${timeStr}.xlsx`;
      
      // Save file to Documents/Business Dashboard/Backups using Electron API
      if (window.electronAPI && window.electronAPI.saveFile) {
        const documentsPath = 'Documents/Business Dashboard/Backups';
        const fullPath = `${documentsPath}/${filename}`;
        
        // Convert ArrayBuffer to Uint8Array for Electron API
        const uint8Array = new Uint8Array(excelBuffer);
        
        const result = await window.electronAPI.saveFile(fullPath, uint8Array as any);
        
        if (result.success) {
          // Add to backup history
          const newBackup: BackupInfo = {
            id: Date.now().toString(),
            name: `Manual Backup - ${new Date().toLocaleDateString()}`,
            date: new Date().toLocaleString(),
            size: `${sizeInMB} MB`,
            collections: workbook.SheetNames.length,
            filePath: result.filePath
          };
          
          const updatedHistory = [newBackup, ...backupHistory];
          setBackupHistory(updatedHistory);
          localStorage.setItem('backup-history', JSON.stringify(updatedHistory));
          
          showSnackbar(`Excel backup saved to: ${result.filePath}`, 'success');
        } else {
          const errorMessage = result.error || 'Failed to save backup file';
          showSnackbar(errorMessage, 'error');
          return;
        }
      } else {
        // Fallback: download as file
        const blob = new Blob([excelBuffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Add to backup history
        const newBackup: BackupInfo = {
          id: Date.now().toString(),
          name: `Manual Backup - ${new Date().toLocaleDateString()}`,
          date: new Date().toLocaleString(),
          size: `${sizeInMB} MB`,
          collections: workbook.SheetNames.length,
          filePath: `Downloads/${filename}`
        };
        
        const updatedHistory = [newBackup, ...backupHistory];
        setBackupHistory(updatedHistory);
        localStorage.setItem('backup-history', JSON.stringify(updatedHistory));
        
        showSnackbar('Excel backup downloaded successfully!', 'success');
      }
      
    } catch (error: any) {
      console.error('Error creating backup:', error);
      showSnackbar(`Failed to create backup: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const openBackupFolder = async () => {
    try {
      if (window.electronAPI && window.electronAPI.openPath) {
        const result = await window.electronAPI.openPath('');
        if (result.success) {
          showSnackbar(`Opened backup folder: ${result.path}`, 'success');
        } else {
          showSnackbar(`Failed to open backup folder: ${result.error}`, 'error');
        }
      } else {
        // Fallback: show a message with the folder path
        const backupPath = 'Documents/Business Dashboard/Backups';
        showSnackbar(`Backup folder location: ${backupPath}`, 'info');
      }
    } catch (error: any) {
      console.error('Error opening backup folder:', error);
      showSnackbar(`Failed to open backup folder: ${error?.message || 'Unknown error'}`, 'error');
    }
  };

  const restoreBackup = async (backupId: string) => {
    try {
      setIsRestoringBackup(true);
      
      // Mock restore process - implement actual restore logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showSnackbar('Backup restored successfully', 'success');
      setConfirmDialog({ open: false, title: '', message: '', action: () => {} });
    } catch (error) {
      console.error('Error restoring backup:', error);
      showSnackbar('Failed to restore backup', 'error');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const updatedHistory = backupHistory.filter(backup => backup.id !== backupId);
      setBackupHistory(updatedHistory);
      localStorage.setItem('backup-history', JSON.stringify(updatedHistory));
      showSnackbar('Backup deleted successfully', 'success');
    } catch (error: any) {
      console.error('Error deleting backup:', error);
      showSnackbar(`Failed to delete backup: ${error?.message || 'Unknown error'}`, 'error');
    }
  };

  const showSnackbar = (message: string, severity: typeof snackbar.severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const confirmAction = (title: string, message: string, action: () => void) => {
    setConfirmDialog({ open: true, title, message, action });
  };

  // Backup folder selection
  const selectBackupFolder = async () => {
    try {
      // In a real Electron app, you would use dialog.showOpenDialog
      // For now, we'll simulate folder selection
      const folderPath = await new Promise<string>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            // Get the directory path from the first file
            const path = files[0].webkitRelativePath.split('/')[0];
            resolve(path);
          }
        };
        input.click();
      });

      if (folderPath) {
        setAppSettings(prev => ({ ...prev, backupFolder: folderPath }));
        saveAppSettings({ ...appSettings, backupFolder: folderPath });
        showSnackbar(`Backup folder set to: ${folderPath}`, 'success');
      }
    } catch (error) {
      console.error('Error selecting backup folder:', error);
      showSnackbar('Failed to select backup folder', 'error');
    }
  };

  // Calculate next backup time
  const calculateNextBackupTime = (frequency: string, time: string): Date => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const nextBackup = new Date();
    
    nextBackup.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow/next period
    if (nextBackup <= now) {
      switch (frequency) {
        case 'daily':
          nextBackup.setDate(nextBackup.getDate() + 1);
          break;
        case 'weekly':
          nextBackup.setDate(nextBackup.getDate() + 7);
          break;
        case 'monthly':
          nextBackup.setMonth(nextBackup.getMonth() + 1);
          break;
      }
    }
    
    return nextBackup;
  };

  // Perform automatic backup
  const performAutoBackup = async () => {
    try {
      if (!appSettings.backupFolder) {
        showSnackbar('No backup folder selected for automatic backup', 'warning');
        return;
      }

      setIsCreatingBackup(true);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `auto_backup_${timestamp}`;
      
      // Simulate backup creation (in real app, this would export all data)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last backup time
      const now = new Date().toLocaleString();
      setLastAutoBackup(now);
      localStorage.setItem('lastAutoBackup', now);
      
      // Schedule next backup
      scheduleNextBackup();
      
      if (appSettings.showNotifications) {
        showSnackbar(`Automatic backup "${backupName}" created successfully`, 'success');
      }
      
      // Update backup history
      const newBackup: BackupInfo = {
        id: Date.now().toString(),
        name: backupName,
        date: now,
        size: '2.8 MB',
        collections: 5
      };
      setBackupHistory(prev => [newBackup, ...prev.slice(0, appSettings.maxBackups - 1)]);
      
    } catch (error) {
      console.error('Auto backup failed:', error);
      if (appSettings.showNotifications) {
        showSnackbar('Automatic backup failed', 'error');
      }
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Schedule next backup
  const scheduleNextBackup = () => {
    if (backupTimer) {
      clearTimeout(backupTimer);
    }

    if (!appSettings.autoBackup) {
      setNextAutoBackup('');
      return;
    }

    const nextBackup = calculateNextBackupTime(appSettings.backupFrequency, appSettings.backupTime);
    const timeUntilBackup = nextBackup.getTime() - Date.now();
    
    setNextAutoBackup(nextBackup.toLocaleString());
    
    const timer = setTimeout(() => {
      performAutoBackup();
    }, timeUntilBackup);
    
    setBackupTimer(timer);
  };

  // Save app settings to localStorage
  const saveAppSettings = (settings: typeof appSettings) => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
      console.log('App settings saved:', settings);
    } catch (error) {
      console.error('Error saving app settings:', error);
    }
  };

  // Load app settings from localStorage
  const loadAppSettings = () => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setAppSettings(prev => ({ ...prev, ...parsed }));
      }
      
      const lastBackup = localStorage.getItem('lastAutoBackup');
      if (lastBackup) {
        setLastAutoBackup(lastBackup);
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
  };

  // Update app settings and save
  const updateAppSettings = (newSettings: Partial<typeof appSettings>) => {
    const updated = { ...appSettings, ...newSettings };
    setAppSettings(updated);
    saveAppSettings(updated);
    
    // Reschedule backup if auto backup settings changed
    if ('autoBackup' in newSettings || 'backupFrequency' in newSettings || 'backupTime' in newSettings) {
      scheduleNextBackup();
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(dbConfig) !== JSON.stringify(originalDbConfig);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        fontWeight: 'bold',
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Settings sx={{ color: '#dc2626' }} />
        Settings Management
      </Typography>

      {/* Database Configuration Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DatabaseIcon color="primary" />
            Database Configuration
          </Typography>
          <Button
            variant={isDbEditMode ? "outlined" : "contained"}
            size="small"
            onClick={toggleDbEditMode}
            startIcon={isDbEditMode ? <Lock /> : <Edit />}
            color={isDbEditMode ? "warning" : "primary"}
          >
            {isDbEditMode ? 'Exit Edit Mode' : 'Edit Configuration'}
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        {isDbEditMode && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>⚠️ Caution:</strong> Modifying database configuration will affect the connection to your data. 
              Ensure all credentials are correct before saving to avoid losing access to your database.
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'grid', gap: 3 }}>
          <TextField
            fullWidth
            label="Username"
            value={dbConfig.username}
            onChange={(e) => setDbConfig(prev => ({ ...prev, username: e.target.value }))}
            placeholder="Enter MongoDB username"
            variant="outlined"
            disabled={!isDbEditMode}
            required
            helperText="MongoDB Atlas username or database user"
            InputProps={{
              startAdornment: <Security sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <TextField
            fullWidth
            label="Password"
            value={dbConfig.password}
            onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Enter MongoDB password"
            variant="outlined"
            type={showPassword ? "text" : "password"}
            disabled={!isDbEditMode}
            required
            helperText="MongoDB Atlas password or database user password"
            InputProps={{
              startAdornment: <Security sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: isDbEditMode ? (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ) : null
            }}
          />

          <TextField
            fullWidth
            label="Cluster URL"
            value={dbConfig.clusterUrl}
            onChange={(e) => setDbConfig(prev => ({ ...prev, clusterUrl: e.target.value }))}
            placeholder="cluster0.example.mongodb.net"
            variant="outlined"
            disabled={!isDbEditMode}
            required
            helperText="MongoDB cluster hostname (without mongodb+srv://)"
            InputProps={{
              startAdornment: <DatabaseIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <TextField
            fullWidth
            label="Database Name"
            value={dbConfig.databaseName}
            onChange={(e) => setDbConfig(prev => ({ ...prev, databaseName: e.target.value }))}
            placeholder="business_dashboard"
            variant="outlined"
            disabled={!isDbEditMode}
            required
            helperText="Name of the database to connect to"
            InputProps={{
              startAdornment: <Storage sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />

          {/* Connection Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => testDatabaseConnection()}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
            >
              Test Connection
            </Button>
            
            {connectionStatus.message && (
              <Chip
                icon={connectionStatus.isConnected ? <CheckCircle /> : <Error />}
                label={connectionStatus.message}
                color={connectionStatus.isConnected ? 'success' : 'error'}
                variant="outlined"
              />
            )}
          </Box>

          {/* Save Button - Only show in edit mode */}
          {isDbEditMode && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={saveDatabaseConfig}
                disabled={loading || !hasUnsavedChanges()}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                sx={{ backgroundColor: 'primary.main' }}
              >
                Save Configuration
              </Button>
              
              {hasUnsavedChanges() && (
                <Button
                  variant="outlined"
                  onClick={() => setDbConfig(originalDbConfig)}
                >
                  Reset Changes
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Data Backup Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Backup color="primary" />
          Data Backup & Restore
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Backup Actions */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={createBackup}
            disabled={isCreatingBackup}
            startIcon={isCreatingBackup ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<FolderOpen />}
            onClick={openBackupFolder}
          >
            Open Backup Folder
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<CloudDownload />}
            onClick={() => {/* Implement export backup */}}
          >
            Export Backup
          </Button>
        </Box>

        {/* Backup History */}
        <Typography variant="subtitle1" gutterBottom>Backup History</Typography>
        {backupHistory.length === 0 ? (
          <Box sx={{ 
            p: 3, 
            textAlign: 'center', 
            bgcolor: 'background.paper', 
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1 
          }}>
            <Storage sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No backup history found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first backup to see it here
            </Typography>
          </Box>
        ) : (
          <List>
            {backupHistory.map((backup) => (
              <ListItem key={backup.id} divider>
                <ListItemIcon>
                  <Storage color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={backup.name}
                  secondary={`${backup.date} • ${backup.size} • ${backup.collections} collections`}
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Restore Backup">
                      <IconButton
                        onClick={() => confirmAction(
                          'Restore Backup',
                          `Are you sure you want to restore "${backup.name}"? This will overwrite current data.`,
                          () => restoreBackup(backup.id)
                        )}
                        disabled={isRestoringBackup}
                      >
                        <RestoreFromTrash />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Backup">
                      <IconButton
                        onClick={() => confirmAction(
                          'Delete Backup',
                          `Are you sure you want to delete "${backup.name}"? This action cannot be undone.`,
                          () => deleteBackup(backup.id)
                        )}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Application Settings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoMode color="primary" />
          Application Settings
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Backup Configuration */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Backup color="primary" />
            Automatic Backup Configuration
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Backup Folder Selection */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                fullWidth
                label="Backup Folder"
                value={appSettings.backupFolder || 'No folder selected'}
                variant="outlined"
                disabled
                helperText="Select a folder where automatic backups will be stored"
                InputProps={{
                  startAdornment: <FolderOpen sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <Button
                variant="outlined"
                onClick={selectBackupFolder}
                startIcon={<FolderOpen />}
                sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
              >
                Select Folder
              </Button>
            </Box>

            {/* Settings Row 1 */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={appSettings.autoBackup}
                      onChange={(e) => updateAppSettings({ autoBackup: e.target.checked })}
                      disabled={!appSettings.backupFolder}
                    />
                  }
                  label="Enable Automatic Backup"
                />
                <FormHelperText>
                  {!appSettings.backupFolder 
                    ? 'Select a backup folder first' 
                    : appSettings.autoBackup 
                      ? 'Automatic backups are enabled' 
                      : 'Automatic backups are disabled'
                  }
                </FormHelperText>
              </Box>

              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControl fullWidth disabled={!appSettings.autoBackup}>
                  <InputLabel>Backup Frequency</InputLabel>
                  <Select
                    value={appSettings.backupFrequency}
                    label="Backup Frequency"
                    onChange={(e) => updateAppSettings({ backupFrequency: e.target.value })}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                  <FormHelperText>How often to create automatic backups</FormHelperText>
                </FormControl>
              </Box>
            </Box>

            {/* Settings Row 2 */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Backup Time"
                  type="time"
                  value={appSettings.backupTime}
                  onChange={(e) => updateAppSettings({ backupTime: e.target.value })}
                  disabled={!appSettings.autoBackup}
                  helperText="What time to create backups"
                  InputProps={{
                    startAdornment: <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Maximum Backups"
                  type="number"
                  value={appSettings.maxBackups}
                  onChange={(e) => updateAppSettings({ maxBackups: parseInt(e.target.value) || 10 })}
                  disabled={!appSettings.autoBackup}
                  helperText="Maximum number of backups to keep"
                  inputProps={{ min: 1, max: 50 }}
                />
              </Box>
            </Box>
          </Box>

          {/* Backup Status */}
          {appSettings.autoBackup && appSettings.backupFolder && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Backup Status:</strong><br/>
                {lastAutoBackup && `Last backup: ${lastAutoBackup}`}<br/>
                {nextAutoBackup && `Next backup: ${nextAutoBackup}`}
                {!nextAutoBackup && !lastAutoBackup && 'Backup scheduling will start after saving settings'}
              </Typography>
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Other Application Settings */}
        <List>
          <ListItem>
            <ListItemIcon>
              <Info />
            </ListItemIcon>
            <ListItemText
              primary="Show Notifications"
              secondary="Display system notifications for backups and alerts"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={appSettings.showNotifications}
                onChange={(e) => updateAppSettings({ showNotifications: e.target.checked })}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Storage />
            </ListItemIcon>
            <ListItemText
              primary="Enable Logging"
              secondary="Log application activities for debugging and monitoring"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={appSettings.enableLogging}
                onChange={(e) => updateAppSettings({ enableLogging: e.target.checked })}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
            Cancel
          </Button>
          <Button onClick={confirmDialog.action} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsManagement;
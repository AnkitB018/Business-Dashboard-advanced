import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import MainLayout from './components/MainLayout';
import DatabaseSetupDialog from './components/DatabaseSetupDialog';
import EmployeeManagement from './components/EmployeeManagement';
import AttendanceManagement from './components/AttendanceManagement';
import SalesManagement from './components/SalesManagement';
import SimpleSalesTest from './components/SimpleSalesTest';
import PurchaseManagement from './components/PurchaseManagement';
import ReportsAndAnalytics from './components/ReportsAndAnalytics';
import WageManagement from './components/WageManagement';
import databaseService from './services/DatabaseService';
import { DatabaseConfig, ConnectionStatus } from './types/Common';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#dc2626', // red accent
      light: '#ef4444',
      dark: '#991b1b',
    },
    secondary: {
      main: '#1f2937', // dark grey/black
      light: '#374151',
      dark: '#111827',
    },
    background: {
      default: '#f6f7f8',
      paper: 'rgba(255, 255, 255, 0.72)',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
    },
  },
  typography: {
    fontSize: 13,
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    // user requested smaller radius (~8px)
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(248,250,252,0.9) 100%)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(220, 38, 38, 0.1)',
          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(220, 38, 38, 0.12)',
          boxShadow: '0 12px 32px rgba(31, 41, 55, 0.08)',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#e0e0e0',
            },
            '&:hover fieldset': {
              borderColor: '#bdbdbd',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1a1a1a',
            },
          },
        },
      },
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false
  });

  const dbService = databaseService;

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      // Check if database is configured
      const config = await dbService.getConfig();
      console.log('Retrieved config during init:', config);
      
      if (!config || !config.connectionString) {
        console.log('No config found, showing first time setup');
        // First time setup
        setIsFirstTime(true);
        setShowDatabaseSetup(true);
      } else {
        console.log('Config found, testing connection...');
        // Test existing connection
        const isConnected = await dbService.testConnection(config);
        console.log('Connection test result:', isConnected);
        setConnectionStatus({
          isConnected,
          lastConnected: isConnected ? new Date() : undefined,
          error: isConnected ? undefined : 'Failed to connect to database'
        });
        
        if (!isConnected) {
          console.log('Connection failed, showing database setup');
          setShowDatabaseSetup(true);
        } else {
          console.log('Connection successful, app ready');
        }
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsFirstTime(true);
      setShowDatabaseSetup(true);
    } finally {
      setIsInitializing(false);
    }
  };  const handleDatabaseConnect = async (config: DatabaseConfig): Promise<boolean> => {
    try {
      const success = await dbService.testConnection(config);
      
      if (success) {
        await dbService.saveConfig(config);
        setConnectionStatus({
          isConnected: true,
          lastConnected: new Date()
        });
        setShowDatabaseSetup(false);
        setIsFirstTime(false);
        
        console.log('Database connected successfully, status updated');
      } else {
        setConnectionStatus({
          isConnected: false,
          error: 'Failed to connect to database'
        });
      }
      
      return success;
    } catch (error) {
      console.error('Database connection failed:', error);
      setConnectionStatus({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
      return false;
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'employees':
        return <EmployeesPage />;
      case 'wages':
        return <WagesPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'sales':
        return <SalesPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  if (isInitializing) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
          flexDirection="column"
          sx={{
            backgroundColor: '#fafafa',
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#1a1a1a', mb: 3 }} />
            <Typography variant="h6" sx={{ mt: 2, color: '#1a1a1a', fontWeight: 500 }}>
              Initializing Business Dashboard...
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#666666' }}>
              Setting up your business management system
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {connectionStatus.isConnected ? (
        <Box sx={{ 
          backgroundColor: '#fafafa',
          minHeight: '100vh',
          position: 'relative',
        }}>
          <MainLayout currentPage={currentPage} onNavigate={handleNavigate}>
            {renderPageContent()}
          </MainLayout>
        </Box>
      ) : (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
          sx={{ 
            backgroundColor: '#fafafa',
            position: 'relative',
          }}
        >
          <Paper sx={{ 
            p: 5, 
            textAlign: 'center', 
            maxWidth: 500,
            position: 'relative',
            zIndex: 1,
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1a1a1a', fontWeight: 600 }}>
              🚀 Business Dashboard
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ color: '#666666' }}>
              Comprehensive Business Management System
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {isFirstTime 
                ? 'Welcome! Let\'s set up your database to get started.'
                : 'Database connection required to continue.'
              }
            </Typography>
          </Paper>
        </Box>
      )}

      <DatabaseSetupDialog
        open={showDatabaseSetup}
        onClose={() => !isFirstTime && setShowDatabaseSetup(false)}
        onConnect={handleDatabaseConnect}
        isFirstTime={isFirstTime}
      />
    </ThemeProvider>
  );
}

// Page components
const DashboardPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    monthlySales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load employee statistics
      const employees = await databaseService.getAllEmployees();
      const activeEmployees = employees.filter((emp: any) => emp.status === 'active');
      
      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        todayAttendance: Math.floor(activeEmployees.length * 0.85), // Mock attendance
        monthlySales: 45000 // Mock sales data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        📊 Business Dashboard
      </Typography>
      
      {/* Key Metrics Cards (compact) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.08)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h5" fontWeight={700} sx={{ 
            color: 'transparent', 
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            mb: 0.5 
          }}>{stats.totalEmployees}</Typography>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Total Employees</Typography>
        </Paper>
        
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.08)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h5" fontWeight={700} sx={{ 
            color: 'transparent', 
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            mb: 0.5 
          }}>{stats.activeEmployees}</Typography>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Active Employees</Typography>
        </Paper>
        
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.08)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h5" fontWeight={700} sx={{ 
            color: 'transparent', 
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            mb: 0.5 
          }}>{stats.todayAttendance}</Typography>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Today's Attendance</Typography>
        </Paper>
        
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.08)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h5" fontWeight={700} sx={{ 
            color: 'transparent', 
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            mb: 0.5 
          }}>₹{stats.monthlySales.toLocaleString()}</Typography>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Monthly Sales</Typography>
        </Paper>
      </Box>
    </Box>
  );
};

const EmployeesPage = () => <EmployeeManagement />;

const WagesPage = () => <WageManagement />;

const AttendancePage = () => <AttendanceManagement />;

const SalesPage = () => <SalesManagement />;

const PurchasesPage = () => <PurchaseManagement />;

const ReportsPage = () => <ReportsAndAnalytics />;

const SettingsPage = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>⚙️ Settings</Typography>
    <Typography>Configure application settings, database connections, and user preferences.</Typography>
  </Paper>
);

export default App;

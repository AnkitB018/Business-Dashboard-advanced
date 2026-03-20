import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Paper, CircularProgress, Chip, Divider } from '@mui/material';
import { Dashboard as DashboardIcon, CalendarToday, People, TrendingUp, AccountBalance, Today } from '@mui/icons-material';
import MainLayout from './components/MainLayout';
import DatabaseSetupDialog from './components/DatabaseSetupDialog';
import EmployeeManagement from './components/EmployeeManagement';
import AttendanceManagement from './components/AttendanceManagement';
import ReportsAndAnalytics from './components/ReportsAndAnalytics';
import WageManagement from './components/WageManagement';
import SettingsManagement from './components/SettingsManagement';
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
      // Check if database is configured
      const config = await dbService.getConfig();
      
      if (!config || !config.connectionString) {
        // First time setup
        setIsFirstTime(true);
        setShowDatabaseSetup(true);
      } else {
        // Test existing connection
        const isConnected = await dbService.testConnection(config);
        setConnectionStatus({
          isConnected,
          lastConnected: isConnected ? new Date() : undefined,
          error: isConnected ? undefined : 'Failed to connect to database'
        });
        
        if (!isConnected) {
          setShowDatabaseSetup(true);
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
    resignedEmployees: 0,
    todayAttendance: 0,
    todayAbsent: 0,
    monthlyPayouts: 0,
    totalPayoutsAmount: 0,
    avgWagePerEmployee: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Update date every minute
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setDbError(null);
      
      // Load employee statistics
      const employees = await databaseService.getAllEmployees();
      const activeEmployees = employees.filter((emp: any) => emp.employment_status === 'active');
      const resignedEmployees = employees.filter((emp: any) => emp.employment_status === 'resigned');
      
      // Load today's attendance
      const today = new Date().toISOString().split('T')[0];
      const allAttendance = await databaseService.getAllAttendance();
      
      const todaysAttendance = allAttendance.filter((att: any) => {
        const attDate = new Date(att.date).toISOString().split('T')[0];
        return attDate === today && att.status === 'Present';
      });
      const todaysAbsent = allAttendance.filter((att: any) => {
        const attDate = new Date(att.date).toISOString().split('T')[0];
        return attDate === today && att.status === 'Absent';
      });
      
      // Load monthly wage payouts
      const allPayouts = await databaseService.getAllPayouts();
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyPayouts = allPayouts.filter((payout: any) => {
        // Use payout_date field from PayoutRecord interface
        const payoutDate = new Date(payout.payout_date);
        return payoutDate.getMonth() === currentMonth && payoutDate.getFullYear() === currentYear;
      });
      
      // Use actual_amount field from PayoutRecord interface
      const totalPayoutsAmount = monthlyPayouts.reduce((sum: number, payout: any) => sum + (payout.actual_amount || 0), 0);
      const avgWagePerEmployee = activeEmployees.length > 0 ? totalPayoutsAmount / activeEmployees.length : 0;
      
      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        resignedEmployees: resignedEmployees.length,
        todayAttendance: todaysAttendance.length,
        todayAbsent: todaysAbsent.length,
        monthlyPayouts: monthlyPayouts.length,
        totalPayoutsAmount: totalPayoutsAmount,
        avgWagePerEmployee: avgWagePerEmployee
      });
      
      setDbConnected(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDbConnected(false);
      setDbError(error instanceof Error ? error.message : 'Failed to load data');
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

  const formatDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      day: days[currentDate.getDay()],
      date: currentDate.getDate(),
      month: months[currentDate.getMonth()],
      year: currentDate.getFullYear()
    };
  };

  const dateInfo = formatDate();

  return (
    <Box>
      {/* Header with Date and Connection Status */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DashboardIcon color="primary" />
              Business Dashboard
            </Typography>
            <Chip 
              label={dbConnected ? "Database Connected" : "Database Disconnected"}
              color={dbConnected ? "success" : "error"}
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Today color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {dateInfo.day}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                {dateInfo.date} {dateInfo.month} {dateInfo.year}
              </Typography>
            </Box>
          </Box>
        </Box>
        {dbError && (
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={`Error: ${dbError}`}
              color="error"
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {/* Statistics Section - Employee & Wage Stats (30% of page) */}
      <Box sx={{ maxWidth: '100%' }}>
        {/* Employee Statistics */}
        <Paper sx={{ p: 2.5, mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <People color="primary" />
            Employee Statistics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats.totalEmployees}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Employees</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#16a34a' }}>
                {stats.activeEmployees}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Employees</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#dc2626' }}>
                {stats.resignedEmployees}
              </Typography>
              <Typography variant="body2" color="text.secondary">Resigned Employees</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Today's Attendance */}
        <Paper sx={{ p: 2.5, mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CalendarToday color="primary" />
            Today's Attendance
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#16a34a' }}>
                {stats.todayAttendance}
              </Typography>
              <Typography variant="body2" color="text.secondary">Present</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#dc2626' }}>
                {stats.todayAbsent}
              </Typography>
              <Typography variant="body2" color="text.secondary">Absent</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats.activeEmployees > 0 ? Math.round((stats.todayAttendance / stats.activeEmployees) * 100) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Attendance Rate</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Wage Statistics */}
        <Paper sx={{ p: 2.5, mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AccountBalance color="primary" />
            Wage Statistics (This Month)
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats.monthlyPayouts}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Payouts</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#16a34a' }}>
                ₹{stats.totalPayoutsAmount.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Amount Paid</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                ₹{Math.round(stats.avgWagePerEmployee).toLocaleString('en-IN')}
              </Typography>
              <Typography variant="body2" color="text.secondary">Avg per Employee</Typography>
            </Box>
          </Box>
        </Paper>

      </Box>
    </Box>
  );
};

const EmployeesPage = () => <EmployeeManagement />;

const WagesPage = () => <WageManagement />;

const AttendancePage = () => <AttendanceManagement />;

const ReportsPage = () => <ReportsAndAnalytics />;

const SettingsPage = () => <SettingsManagement />;

export default App;

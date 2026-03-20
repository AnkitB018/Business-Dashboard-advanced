import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  ShoppingCart,
  Assignment,
  CalendarToday,
  Business,
  Assessment,
  FileDownload,
  DateRange,
  Analytics,
  BarChart,
  PieChart,
  Timeline,
  CalendarMonth,
  NavigateBefore,
  NavigateNext,
  GetApp,
  PersonAdd,
  PersonOff,
  WorkHistory,
  AccountBalance,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../utils/formatters';
import databaseService from '../services/DatabaseService';

interface ReportFilters {
  dateRange: string;
  startDate: string;
  endDate: string;
  reportType: string;
  department: string;
}

interface AttendanceMetrics {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateArrivals: number;
  averageWorkingHours: number;
  departmentAttendance: Array<{ department: string; present: number; total: number }>;
}

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: Array<{ month: string; income: number; expenses: number; profit: number }>;
}

interface EmployeeLifecycleMetrics {
  totalEmployees: number;
  activeEmployees: number;
  resignedEmployees: number;
  terminatedEmployees: number;
  retiredEmployees: number;
  onLeaveEmployees: number;
  attritionRate: number;
  avgTenure: number;
  avgSalary: number;
  salaryGrowthRate: number;
  monthlySalaryTrend: Array<{ month: string; avgSalary: number; employees: number }>;
  attritionTrend: Array<{ month: string; resignations: number; terminations: number; total: number }>;
  departmentAttrition: Array<{ department: string; resigned: number; terminated: number; total: number; rate: number }>;
  salaryDistribution: Array<{ range: string; count: number; percentage: number }>;
  tenureDistribution: Array<{ range: string; count: number; percentage: number }>;
  topReasons: Array<{ reason: string; count: number }>;
  recentChanges: Array<{ employee_name: string; type: string; change: string; date: string }>;
}

const ReportsAndAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'thisMonth',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reportType: 'all',
    department: 'all'
  });

  const [attendanceMetrics, setAttendanceMetrics] = useState<AttendanceMetrics>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateArrivals: 0,
    averageWorkingHours: 0,
    departmentAttendance: []
  });

  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    cashFlow: []
  });

  const [lifecycleMetrics, setLifecycleMetrics] = useState<EmployeeLifecycleMetrics>({
    totalEmployees: 0,
    activeEmployees: 0,
    resignedEmployees: 0,
    terminatedEmployees: 0,
    retiredEmployees: 0,
    onLeaveEmployees: 0,
    attritionRate: 0,
    avgTenure: 0,
    avgSalary: 0,
    salaryGrowthRate: 0,
    monthlySalaryTrend: [],
    attritionTrend: [],
    departmentAttrition: [],
    salaryDistribution: [],
    tenureDistribution: [],
    topReasons: [],
    recentChanges: []
  });

  // Calendar state for attendance view
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [calendarData, setCalendarData] = useState<any[]>([]);
  
  // Chart colors for data visualization
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];

  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    loadReportsData();
  }, [filters]);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      // Load real data from database
      const [attendanceData, employeeData] = await Promise.all([
        databaseService.getAllAttendance(),
        databaseService.getAllEmployees()
      ]);

      // Calculate attendance metrics from real data
      const today = new Date().toDateString();
      const todaysAttendance = attendanceData.filter(record => 
        new Date(record.date).toDateString() === today
      );
      const presentToday = todaysAttendance.filter(record => record.status === 'Present').length;
      const totalEmployees = employeeData.length;

      // Calculate department attendance
      const departmentAttendance = calculateDepartmentAttendance(employeeData, todaysAttendance);

      setAttendanceMetrics({
        totalEmployees,
        presentToday,
        absentToday: totalEmployees - presentToday,
        lateArrivals: 0,
        averageWorkingHours: 8.0,
        departmentAttendance
      });

      // Set simple financial metrics
      setFinancialMetrics({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        cashFlow: []
      });

      // Load Employee Lifecycle Metrics
      await loadEmployeeLifecycleMetrics();

      showSnackbar('Reports data loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading reports data:', error);
      showSnackbar('Failed to load reports data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load calendar data for the selected month
  const loadCalendarData = async () => {
    try {
      // Get all attendance records for the current calendar month
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const allAttendance = await databaseService.getAllAttendance();
      
      // Filter attendance for current month
      const monthAttendance = allAttendance.filter((record: any) => {
        const recordDate = new Date(record.date);
        return recordDate >= firstDay && recordDate <= lastDay;
      });
      
      setCalendarData(monthAttendance);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  // Load calendar data when calendar date or selected employee changes
  useEffect(() => {
    if (tabValue === 2) { // Calendar tab
      loadCalendarData();
    }
  }, [calendarDate, selectedEmployee, tabValue]);

  // Helper calculation functions for attendance

  const calculateDepartmentAttendance = (employees: any[], todaysAttendance: any[]) => {
    const departments = new Set(employees.map(e => e.department).filter(Boolean));
    const result: Array<{ department: string; present: number; total: number }> = [];
    
    departments.forEach(dept => {
      const deptEmployees = employees.filter(e => e.department === dept);
      const deptPresent = todaysAttendance.filter(att => {
        const emp = employees.find(e => e._id?.toString() === att.employeeId || e.employee_id === att.employeeId);
        return emp && emp.department === dept && att.status === 'Present';
      });
      
      result.push({
        department: dept,
        present: deptPresent.length,
        total: deptEmployees.length
      });
    });
    
    return result.sort((a, b) => b.total - a.total);
  };

  const loadEmployeeLifecycleMetrics = async () => {
    try {
      const [employees, salaryHistory, employmentHistory, attritionStats] = await Promise.all([
        databaseService.getEmployees(),
        databaseService.getAllSalaryHistory?.() || Promise.resolve([]),
        databaseService.getAllEmploymentHistory?.() || Promise.resolve([]),
        databaseService.getAttritionStats()
      ]);

      // Status counts
      const activeCount = employees.filter(e => e.employment_status === 'active').length;
      const resignedCount = employees.filter(e => e.employment_status === 'resigned').length;
      const terminatedCount = employees.filter(e => e.employment_status === 'terminated').length;
      const retiredCount = employees.filter(e => e.employment_status === 'retired').length;
      const onLeaveCount = employees.filter(e => e.employment_status === 'on_leave').length;

      // Calculate attrition rate (resignations + terminations) / total * 100
      const totalAttrition = resignedCount + terminatedCount;
      const attritionRate = employees.length > 0 ? (totalAttrition / employees.length) * 100 : 0;

      // Calculate average tenure (in years)
      const avgTenure = employees.length > 0
        ? employees.reduce((sum, e) => {
            if (e.hire_date) {
              const tenure = (Date.now() - new Date(e.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
              return sum + tenure;
            }
            return sum;
          }, 0) / employees.length
        : 0;

      // Calculate average salary
      const avgSalary = employees.length > 0
        ? employees.reduce((sum, e) => sum + (e.daily_wage || 0), 0) / employees.length
        : 0;

      // Calculate salary growth rate (from history)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const recentChanges = Array.isArray(salaryHistory) 
        ? salaryHistory.filter((h: any) => new Date(h.effective_date) > oneYearAgo)
        : [];
      const salaryGrowthRate = recentChanges.length > 0
        ? recentChanges.reduce((sum: number, h: any) => sum + (h.change_percentage || 0), 0) / recentChanges.length
        : 0;

      // Monthly salary trend (last 12 months)
      const monthlySalaryTrend = calculateMonthlySalaryTrend(employees, salaryHistory);

      // Attrition trend (last 12 months)
      const attritionTrend = calculateAttritionTrend(employmentHistory);

      // Department-wise attrition
      const departmentAttrition = calculateDepartmentAttrition(employees, employmentHistory);

      // Salary distribution (ranges)
      const salaryDistribution = calculateSalaryDistribution(employees);

      // Tenure distribution
      const tenureDistribution = calculateTenureDistribution(employees);

      // Top termination reasons
      const topReasons = calculateTopReasons(employmentHistory);

      // Recent changes (last 10)
      const recentChangesList = getRecentChanges(salaryHistory, employmentHistory, employees);

      setLifecycleMetrics({
        totalEmployees: employees.length,
        activeEmployees: activeCount,
        resignedEmployees: resignedCount,
        terminatedEmployees: terminatedCount,
        retiredEmployees: retiredCount,
        onLeaveEmployees: onLeaveCount,
        attritionRate,
        avgTenure,
        avgSalary,
        salaryGrowthRate,
        monthlySalaryTrend,
        attritionTrend,
        departmentAttrition,
        salaryDistribution,
        tenureDistribution,
        topReasons,
        recentChanges: recentChangesList
      });
    } catch (error) {
      console.error('Error loading employee lifecycle metrics:', error);
    }
  };

  // Helper calculation functions for employee lifecycle metrics
  const calculateMonthlySalaryTrend = (employees: any[], salaryHistory: any[]) => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      // Calculate average salary for employees at that time
      const relevantEmployees = employees.filter(e => {
        if (!e.hire_date) return false;
        return new Date(e.hire_date) <= monthDate;
      });
      
      const avgSalary = relevantEmployees.length > 0
        ? relevantEmployees.reduce((sum, e) => sum + (e.daily_wage || 0), 0) / relevantEmployees.length
        : 0;
      
      months.push({
        month: monthStr,
        avgSalary: Math.round(avgSalary),
        employees: relevantEmployees.length
      });
    }
    
    return months;
  };

  const calculateAttritionTrend = (employmentHistory: any[]) => {
    if (!Array.isArray(employmentHistory)) return [];
    
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthEvents = employmentHistory.filter((h: any) => {
        const eventDate = new Date(h.event_date);
        return eventDate >= monthDate && eventDate < nextMonth;
      });
      
      const resignations = monthEvents.filter((h: any) => h.event_type === 'resigned').length;
      const terminations = monthEvents.filter((h: any) => h.event_type === 'terminated').length;
      
      months.push({
        month: monthStr,
        resignations,
        terminations,
        total: resignations + terminations
      });
    }
    
    return months;
  };

  const calculateDepartmentAttrition = (employees: any[], employmentHistory: any[]) => {
    const departments = new Set(employees.map(e => e.department).filter(Boolean));
    const result: Array<{ department: string; resigned: number; terminated: number; total: number; rate: number }> = [];
    
    departments.forEach(dept => {
      const deptEmployees = employees.filter(e => e.department === dept);
      const deptTotal = deptEmployees.length;
      
      const resigned = deptEmployees.filter(e => e.employment_status === 'resigned').length;
      const terminated = deptEmployees.filter(e => e.employment_status === 'terminated').length;
      const total = resigned + terminated;
      const rate = deptTotal > 0 ? (total / deptTotal) * 100 : 0;
      
      result.push({ department: dept, resigned, terminated, total, rate });
    });
    
    return result.sort((a, b) => b.rate - a.rate);
  };

  const calculateSalaryDistribution = (employees: any[]) => {
    const ranges = [
      { min: 0, max: 20000, label: '< ₹20K' },
      { min: 20000, max: 40000, label: '₹20K-40K' },
      { min: 40000, max: 60000, label: '₹40K-60K' },
      { min: 60000, max: 80000, label: '₹60K-80K' },
      { min: 80000, max: 100000, label: '₹80K-100K' },
      { min: 100000, max: Infinity, label: '> ₹100K' }
    ];
    
    const distribution = ranges.map(range => {
      const count = employees.filter(e => {
        const salary = e.daily_wage || 0;
        return salary >= range.min && salary < range.max;
      }).length;
      
      const percentage = employees.length > 0 ? (count / employees.length) * 100 : 0;
      
      return {
        range: range.label,
        count,
        percentage: Math.round(percentage * 10) / 10
      };
    });
    
    return distribution.filter(d => d.count > 0);
  };

  const calculateTenureDistribution = (employees: any[]) => {
    const ranges = [
      { min: 0, max: 1, label: '< 1 year' },
      { min: 1, max: 3, label: '1-3 years' },
      { min: 3, max: 5, label: '3-5 years' },
      { min: 5, max: 10, label: '5-10 years' },
      { min: 10, max: Infinity, label: '> 10 years' }
    ];
    
    const distribution = ranges.map(range => {
      const count = employees.filter(e => {
        if (!e.hire_date) return false;
        const tenure = (Date.now() - new Date(e.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
        return tenure >= range.min && tenure < range.max;
      }).length;
      
      const percentage = employees.length > 0 ? (count / employees.length) * 100 : 0;
      
      return {
        range: range.label,
        count,
        percentage: Math.round(percentage * 10) / 10
      };
    });
    
    return distribution.filter(d => d.count > 0);
  };

  const calculateTopReasons = (employmentHistory: any[]) => {
    if (!Array.isArray(employmentHistory)) return [];
    
    const reasonCounts: { [key: string]: number } = {};
    
    employmentHistory.forEach((h: any) => {
      if (h.reason && (h.event_type === 'resigned' || h.event_type === 'terminated')) {
        reasonCounts[h.reason] = (reasonCounts[h.reason] || 0) + 1;
      }
    });
    
    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getRecentChanges = (salaryHistory: any[], employmentHistory: any[], employees: any[]) => {
    const changes: Array<{ employee_name: string; type: string; change: string; date: string }> = [];
    
    // Add recent salary changes
    if (Array.isArray(salaryHistory)) {
      salaryHistory
        .sort((a: any, b: any) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
        .slice(0, 5)
        .forEach((h: any) => {
          const employee = employees.find((e: any) => e._id?.toString() === h.employee_id);
          if (employee) {
            changes.push({
              employee_name: employee.name,
              type: 'Salary Change',
              change: `₹${h.previous_salary.toLocaleString()} → ₹${h.new_salary.toLocaleString()} (${h.change_percentage > 0 ? '+' : ''}${h.change_percentage.toFixed(1)}%)`,
              date: new Date(h.effective_date).toLocaleDateString()
            });
          }
        });
    }
    
    // Add recent employment changes
    if (Array.isArray(employmentHistory)) {
      employmentHistory
        .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
        .slice(0, 5)
        .forEach((h: any) => {
          const employee = employees.find((e: any) => e._id?.toString() === h.employee_id);
          if (employee) {
            changes.push({
              employee_name: employee.name,
              type: 'Status Change',
              change: `${h.previous_status || 'hired'} → ${h.new_status}`,
              date: new Date(h.event_date).toLocaleDateString()
            });
          }
        });
    }
    
    return changes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  };

  // Export functionality
  const exportLifecycleDataToCSV = () => {
    try {
      const csvRows = [];
      
      // Header
      csvRows.push(['Employee Lifecycle Analytics Report']);
      csvRows.push(['Generated on:', new Date().toLocaleString()]);
      csvRows.push([]);
      
      // Summary metrics
      csvRows.push(['Summary Metrics']);
      csvRows.push(['Total Employees', lifecycleMetrics.totalEmployees]);
      csvRows.push(['Active Employees', lifecycleMetrics.activeEmployees]);
      csvRows.push(['Resigned', lifecycleMetrics.resignedEmployees]);
      csvRows.push(['Terminated', lifecycleMetrics.terminatedEmployees]);
      csvRows.push(['Retired', lifecycleMetrics.retiredEmployees]);
      csvRows.push(['Attrition Rate', `${lifecycleMetrics.attritionRate.toFixed(2)}%`]);
      csvRows.push(['Average Tenure', `${lifecycleMetrics.avgTenure.toFixed(1)} years`]);
      csvRows.push(['Average Salary', `₹${lifecycleMetrics.avgSalary.toFixed(2)}`]);
      csvRows.push(['Salary Growth Rate', `${lifecycleMetrics.salaryGrowthRate.toFixed(2)}%`]);
      csvRows.push([]);
      
      // Department attrition
      csvRows.push(['Department Attrition']);
      csvRows.push(['Department', 'Resigned', 'Terminated', 'Total', 'Rate (%)']);
      lifecycleMetrics.departmentAttrition.forEach(dept => {
        csvRows.push([dept.department, dept.resigned, dept.terminated, dept.total, dept.rate.toFixed(2)]);
      });
      csvRows.push([]);
      
      // Salary distribution
      csvRows.push(['Salary Distribution']);
      csvRows.push(['Range', 'Count', 'Percentage (%)']);
      lifecycleMetrics.salaryDistribution.forEach(dist => {
        csvRows.push([dist.range, dist.count, dist.percentage]);
      });
      csvRows.push([]);
      
      // Tenure distribution
      csvRows.push(['Tenure Distribution']);
      csvRows.push(['Range', 'Count', 'Percentage (%)']);
      lifecycleMetrics.tenureDistribution.forEach(dist => {
        csvRows.push([dist.range, dist.count, dist.percentage]);
      });
      csvRows.push([]);
      
      // Top reasons
      csvRows.push(['Top Termination Reasons']);
      csvRows.push(['Reason', 'Count']);
      lifecycleMetrics.topReasons.forEach(reason => {
        csvRows.push([reason.reason, reason.count]);
      });
      
      // Convert to CSV string
      const csvContent = csvRows.map(row => row.join(',')).join('\\n');
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee_lifecycle_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSnackbar('Report exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showSnackbar('Failed to export report', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (field: keyof ReportFilters) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value as string;
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'thisWeek':
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        endDate = new Date();
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date();
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date();
        break;
      case 'custom':
        return; // Don't auto-set dates for custom range
    }

    setFilters(prev => ({
      ...prev,
      dateRange: range,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    showSnackbar(`Exporting report as ${format.toUpperCase()}...`, 'success');
    // Real export logic would be implemented here based on format
  };

  const getAttendanceRate = (present: number, total: number): number => {
    return total > 0 ? (present / total) * 100 : 0;
  };

  // Calendar helper functions
  const renderCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <Box key={`empty-${i}`} sx={{ p: 1, minHeight: 60 }} />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === new Date().toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      // Get real attendance status from database
      const attendanceStatus = getAttendanceStatus(date);
      
      days.push(
        <Box
          key={day}
          sx={{
            p: 1,
            minHeight: 60,
            border: 1,
            borderColor: isToday ? 'primary.main' : 'grey.300',
            borderRadius: 1,
            backgroundColor: getDateBackgroundColor(attendanceStatus, isWeekend),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'grey.100',
            }
          }}
          onClick={() => handleDateClick(date)}
        >
          <Typography variant="body2" fontWeight={isToday ? 'bold' : 'normal'}>
            {day}
          </Typography>
          {attendanceStatus !== 'weekend' && (
            <Typography variant="caption" color="white">
              {getAttendanceLabel(attendanceStatus)}
            </Typography>
          )}
        </Box>
      );
    }

    return days;
  };

  const getAttendanceStatus = (date: Date) => {
    // Real logic - query from calendarData
    const day = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    if (day === 0 || day === 6) return 'weekend'; // Weekend
    
    // Find attendance record for this date
    const attendanceRecord = calendarData.find((record: any) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateStr && (selectedEmployee === 'all' || record.employee_id === selectedEmployee);
    });
    
    if (!attendanceRecord) {
      // No record found - could be holiday or no data yet
      return date > new Date() ? 'future' : 'absent';
    }
    
    // Map database status to calendar status
    switch (attendanceRecord.status) {
      case 'Present': return 'present';
      case 'Absent': return 'absent';
      case 'Late': return 'late';
      case 'Half Day': return 'halfday';
      case 'Holiday': return 'holiday';
      default: return 'present';
    }
  };

  const getDateBackgroundColor = (status: string, isWeekend: boolean) => {
    if (isWeekend) return 'grey.200';
    switch (status) {
      case 'present': return '#4caf50';
      case 'absent': return '#f44336';
      case 'late': return '#ff9800';
      case 'halfday': return '#2196f3';
      case 'holiday': return '#9e9e9e';
      default: return 'transparent';
    }
  };

  const getAttendanceLabel = (status: string) => {
    switch (status) {
      case 'present': return 'P';
      case 'absent': return 'A';
      case 'late': return 'L';
      case 'halfday': return 'H';
      case 'holiday': return 'X';
      default: return '';
    }
  };

  const handleDateClick = (date: Date) => {
    // Handle date click - could show detailed attendance info for that date
    console.log('Date clicked:', date);
  };

  const exportChart = (chartType: string) => {
    // Implement chart export functionality
    showSnackbar(`Exporting ${chartType} chart...`, 'success');
    console.log('Exporting chart:', chartType);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assessment color="primary" />
        Reports & Analytics
      </Typography>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Report Filters</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, alignItems: 'center' }}>
          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={filters.dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="thisWeek">This Week</MenuItem>
              <MenuItem value="thisMonth">This Month</MenuItem>
              <MenuItem value="thisYear">This Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          {filters.dateRange === 'custom' && (
            <>
              <TextField
                type="date"
                label="Start Date"
                value={filters.startDate}
                onChange={handleFilterChange('startDate')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                label="End Date"
                value={filters.endDate}
                onChange={handleFilterChange('endDate')}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={filters.reportType}
              onChange={handleFilterChange('reportType')}
              label="Report Type"
            >
              <MenuItem value="all">All Reports</MenuItem>
              <MenuItem value="attendance">Attendance Only</MenuItem>
              <MenuItem value="financial">Financial Only</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={filters.department}
              onChange={handleFilterChange('department')}
              label="Department"
            >
              <MenuItem value="all">All Departments</MenuItem>
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="hr">HR</MenuItem>
              <MenuItem value="finance">Finance</MenuItem>
              <MenuItem value="operations">Operations</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<FileDownload />}
              onClick={() => exportReport('pdf')}
            >
              Export PDF
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FileDownload />}
              onClick={() => exportReport('excel')}
            >
              Export Excel
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Report Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Dashboard Overview" icon={<Assessment />} iconPosition="start" />
          <Tab label="Attendance Reports" icon={<People />} iconPosition="start" />
          <Tab label="Attendance Calendar" icon={<CalendarMonth />} iconPosition="start" />
          <Tab label="Financial Summary" icon={<AttachMoney />} iconPosition="start" />
          <Tab label="Employee Lifecycle" icon={<WorkHistory />} iconPosition="start" />
          <Tab label="Data Visualizations" icon={<Timeline />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Dashboard Overview Tab */}
      {tabValue === 0 && (
        <Box>
          {/* Key Metrics Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ 
                  mx: 'auto', 
                  mb: 1, 
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' 
                }}>
                  <AttachMoney />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">{formatCurrency(financialMetrics.totalRevenue)}</Typography>
                <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                <Chip 
                  label={`+${financialMetrics.profitMargin}% profit margin`} 
                  color="success" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'success.main' }}>
                  <People />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">
                  {attendanceMetrics.presentToday}/{attendanceMetrics.totalEmployees}
                </Typography>
                <Typography variant="body2" color="text.secondary">Attendance Today</Typography>
                <Chip 
                  label={`${((attendanceMetrics.presentToday / attendanceMetrics.totalEmployees) * 100).toFixed(1)}% present`} 
                  color="success" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Box>

          {/* Quick Insights */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
            {/* Department Attendance */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Department Attendance</Typography>
              <Box sx={{ mt: 2 }}>
                {attendanceMetrics.departmentAttendance.map((dept) => (
                  <Box key={dept.department} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{dept.department}</Typography>
                      <Typography variant="body2">{dept.present}/{dept.total}</Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        backgroundColor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${getAttendanceRate(dept.present, dept.total)}%`,
                          background: getAttendanceRate(dept.present, dept.total) >= 90 
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : getAttendanceRate(dept.present, dept.total) >= 70
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {getAttendanceRate(dept.present, dept.total).toFixed(1)}% attendance
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Attendance Reports Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Attendance Overview */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Attendance Overview</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {attendanceMetrics.presentToday}
                  </Typography>
                  <Typography variant="body2">Present Today</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {attendanceMetrics.absentToday}
                  </Typography>
                  <Typography variant="body2">Absent Today</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {attendanceMetrics.lateArrivals}
                  </Typography>
                  <Typography variant="body2">Late Arrivals</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {attendanceMetrics.averageWorkingHours}h
                  </Typography>
                  <Typography variant="body2">Avg Working Hours</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Department-wise Attendance */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Department-wise Attendance</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell align="center">Present</TableCell>
                      <TableCell align="center">Total</TableCell>
                      <TableCell align="center">Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceMetrics.departmentAttendance.map((dept) => (
                      <TableRow key={dept.department}>
                        <TableCell>{dept.department}</TableCell>
                        <TableCell align="center">{dept.present}</TableCell>
                        <TableCell align="center">{dept.total}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${getAttendanceRate(dept.present, dept.total).toFixed(1)}%`}
                            color={getAttendanceRate(dept.present, dept.total) >= 90 ? 'success' : 
                                   getAttendanceRate(dept.present, dept.total) >= 70 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Attendance Calendar Tab */}
      {tabValue === 2 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth color="primary" />
                Attendance Calendar View
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={selectedEmployee}
                    label="Employee"
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <MenuItem value="all">All Employees</MenuItem>
                    {/* Will be populated with real employee data */}
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}>
                    <NavigateBefore />
                  </IconButton>
                  <Typography variant="h6" sx={{ minWidth: 150, textAlign: 'center' }}>
                    {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>
                  <IconButton onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}>
                    <NavigateNext />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            {/* Calendar Grid */}
            <Box sx={{ mb: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: 1,
                  mb: 2
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Box key={day} sx={{ 
                      p: 1, 
                      textAlign: 'center', 
                      fontWeight: 'bold',
                      backgroundColor: 'grey.100',
                      borderRadius: 1
                    }}>
                      {day}
                    </Box>
                  ))}
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: 1
                }}>
                  {renderCalendarDays()}
                </Box>
              </Paper>
            </Box>

            {/* Calendar Legend */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 1 }} />
                <Typography variant="body2">Present</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#f44336', borderRadius: 1 }} />
                <Typography variant="body2">Absent</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#ff9800', borderRadius: 1 }} />
                <Typography variant="body2">Late</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#2196f3', borderRadius: 1 }} />
                <Typography variant="body2">Half Day</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#9e9e9e', borderRadius: 1 }} />
                <Typography variant="body2">Holiday</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Calendar Summary Statistics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">92%</Typography>
                <Typography variant="body2" color="text.secondary">Attendance Rate</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">23</Typography>
                <Typography variant="body2" color="text.secondary">Present Days</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">2</Typography>
                <Typography variant="body2" color="text.secondary">Absent Days</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">3</Typography>
                <Typography variant="body2" color="text.secondary">Late Arrivals</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Financial Summary Tab */}
      {tabValue === 3 && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Financial Overview */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Financial Overview</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total Revenue:</Typography>
                  <Typography fontWeight="bold" color="success.main">{formatCurrency(financialMetrics.totalRevenue)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total Expenses:</Typography>
                  <Typography fontWeight="bold" color="error.main">{formatCurrency(financialMetrics.totalExpenses)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Net Profit:</Typography>
                  <Typography fontWeight="bold" color="primary.main">{formatCurrency(financialMetrics.netProfit)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Profit Margin:</Typography>
                  <Typography fontWeight="bold" color="primary.main">{financialMetrics.profitMargin}%</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Cash Flow Trend */}
            <Paper sx={{ p: 3, gridColumn: 'span 2' }}>
              <Typography variant="h6" gutterBottom>Monthly Cash Flow</Typography>
              <Box sx={{ height: 250, display: 'flex', alignItems: 'end', gap: 2, mt: 2 }}>
                {financialMetrics.cashFlow.map((data, index) => (
                  <Box key={data.month} sx={{ flex: 1, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'end', height: 200 }}>
                      {/* Income Bar */}
                      <Box
                        sx={{
                          flex: 1,
                          height: `${(data.income / 35000) * 150}px`,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          borderRadius: 1,
                          minHeight: 10
                        }}
                      />
                      {/* Expenses Bar */}
                      <Box
                        sx={{
                          flex: 1,
                          height: `${(data.expenses / 35000) * 150}px`,
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          borderRadius: 1,
                          minHeight: 10
                        }}
                      />
                      {/* Profit Bar */}
                      <Box
                        sx={{
                          flex: 1,
                          height: `${(data.profit / 35000) * 150}px`,
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          borderRadius: 1,
                          minHeight: 10
                        }}
                      />
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {data.month}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      P: ₹{(data.profit / 1000).toFixed(0)}k
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 1 }} />
                  <Typography variant="caption">Income</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: 1 }} />
                  <Typography variant="caption">Expenses</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: 1 }} />
                  <Typography variant="caption">Profit</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Employee Lifecycle Analytics Tab */}
      {tabValue === 4 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkHistory color="primary" />
              Employee Lifecycle Analytics
            </Typography>
            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={exportLifecycleDataToCSV}
            >
              Export CSV Report
            </Button>
          </Box>

          {/* Key Metrics Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'success.main' }}>
                  <People />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">{lifecycleMetrics.activeEmployees}</Typography>
                <Typography variant="body2" color="text.secondary">Active Employees</Typography>
                <Typography variant="caption" color="text.secondary">
                  {lifecycleMetrics.totalEmployees} total
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'error.main' }}>
                  <TrendingDown />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">{lifecycleMetrics.attritionRate.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text.secondary">Attrition Rate</Typography>
                <Typography variant="caption" color="error.main">
                  {lifecycleMetrics.resignedEmployees + lifecycleMetrics.terminatedEmployees} exits
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'info.main' }}>
                  <CalendarToday />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">{lifecycleMetrics.avgTenure.toFixed(1)}</Typography>
                <Typography variant="body2" color="text.secondary">Avg Tenure (Years)</Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'warning.main' }}>
                  <AttachMoney />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">₹{Math.round(lifecycleMetrics.avgSalary / 1000)}K</Typography>
                <Typography variant="body2" color="text.secondary">Avg Salary</Typography>
                <Chip
                  label={`${lifecycleMetrics.salaryGrowthRate > 0 ? '+' : ''}${lifecycleMetrics.salaryGrowthRate.toFixed(1)}% growth`}
                  color={lifecycleMetrics.salaryGrowthRate >= 0 ? 'success' : 'error'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'warning.main' }}>
                  <PersonOff />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">{lifecycleMetrics.resignedEmployees}</Typography>
                <Typography variant="body2" color="text.secondary">Resignations</Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'error.main' }}>
                  <PersonOff />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">{lifecycleMetrics.terminatedEmployees}</Typography>
                <Typography variant="body2" color="text.secondary">Terminations</Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Charts Row 1: Attrition Trend & Salary Trend */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
            {/* Attrition Trend */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Monthly Attrition Trend (Last 12 Months)</Typography>
                <Tooltip title="Shows resignations and terminations over time">
                  <IconButton size="small">
                    <Assessment />
                  </IconButton>
                </Tooltip>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={lifecycleMetrics.attritionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="resignations" fill="#ff9800" name="Resignations" />
                  <Bar dataKey="terminations" fill="#f44336" name="Terminations" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Paper>

            {/* Salary Trend */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Average Salary Trend (Last 12 Months)</Typography>
                <Tooltip title="Shows average salary changes over time">
                  <IconButton size="small">
                    <TrendingUp />
                  </IconButton>
                </Tooltip>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={lifecycleMetrics.monthlySalaryTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Avg Salary']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgSalary" 
                    stroke="#4caf50" 
                    fill="#4caf50" 
                    fillOpacity={0.3}
                    name="Average Salary"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          {/* Charts Row 2: Department Attrition & Employment Status Distribution */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
            {/* Department Attrition */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Department-wise Attrition</Typography>
              {lifecycleMetrics.departmentAttrition.length > 0 ? (
                <Box>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsBarChart 
                      data={lifecycleMetrics.departmentAttrition} 
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="department" type="category" width={100} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="resigned" fill="#ff9800" name="Resigned" />
                      <Bar dataKey="terminated" fill="#f44336" name="Terminated" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                  <Divider sx={{ my: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Department</strong></TableCell>
                          <TableCell align="right"><strong>Resigned</strong></TableCell>
                          <TableCell align="right"><strong>Terminated</strong></TableCell>
                          <TableCell align="right"><strong>Rate</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lifecycleMetrics.departmentAttrition.map((dept) => (
                          <TableRow key={dept.department}>
                            <TableCell>{dept.department}</TableCell>
                            <TableCell align="right">{dept.resigned}</TableCell>
                            <TableCell align="right">{dept.terminated}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${dept.rate.toFixed(1)}%`}
                                color={dept.rate > 15 ? 'error' : dept.rate > 10 ? 'warning' : 'success'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Alert severity="info">No attrition data available</Alert>
              )}
            </Paper>

            {/* Employment Status Distribution */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Employment Status Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: lifecycleMetrics.activeEmployees, color: '#4caf50' },
                      { name: 'Resigned', value: lifecycleMetrics.resignedEmployees, color: '#ff9800' },
                      { name: 'Terminated', value: lifecycleMetrics.terminatedEmployees, color: '#f44336' },
                      { name: 'Retired', value: lifecycleMetrics.retiredEmployees, color: '#2196f3' },
                      { name: 'On Leave', value: lifecycleMetrics.onLeaveEmployees, color: '#9e9e9e' }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Active', value: lifecycleMetrics.activeEmployees, color: '#4caf50' },
                      { name: 'Resigned', value: lifecycleMetrics.resignedEmployees, color: '#ff9800' },
                      { name: 'Terminated', value: lifecycleMetrics.terminatedEmployees, color: '#f44336' },
                      { name: 'Retired', value: lifecycleMetrics.retiredEmployees, color: '#2196f3' },
                      { name: 'On Leave', value: lifecycleMetrics.onLeaveEmployees, color: '#9e9e9e' }
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          {/* Charts Row 3: Salary & Tenure Distributions */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
            {/* Salary Distribution */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Salary Distribution</Typography>
              {lifecycleMetrics.salaryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={lifecycleMetrics.salaryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#2196f3" name="Employees">
                      {lifecycleMetrics.salaryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No salary distribution data available</Alert>
              )}
            </Paper>

            {/* Tenure Distribution */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Tenure Distribution</Typography>
              {lifecycleMetrics.tenureDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={lifecycleMetrics.tenureDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.range}: ${entry.count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {lifecycleMetrics.tenureDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No tenure distribution data available</Alert>
              )}
            </Paper>
          </Box>

          {/* Top Reasons & Recent Changes */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {/* Top Termination Reasons */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Top Termination Reasons</Typography>
              {lifecycleMetrics.topReasons.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Reason</strong></TableCell>
                        <TableCell align="right"><strong>Count</strong></TableCell>
                        <TableCell align="right"><strong>%</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lifecycleMetrics.topReasons.map((reason) => {
                        const total = lifecycleMetrics.topReasons.reduce((sum, r) => sum + r.count, 0);
                        const percentage = total > 0 ? (reason.count / total) * 100 : 0;
                        return (
                          <TableRow key={reason.reason}>
                            <TableCell>{reason.reason}</TableCell>
                            <TableCell align="right">{reason.count}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: `${percentage}%`,
                                    height: 8,
                                    bgcolor: 'error.main',
                                    borderRadius: 1,
                                    minWidth: 20
                                  }}
                                />
                                <Typography variant="caption">{percentage.toFixed(0)}%</Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No termination data available</Alert>
              )}
            </Paper>

            {/* Recent Changes */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Recent Changes</Typography>
              {lifecycleMetrics.recentChanges.length > 0 ? (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Employee</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Change</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lifecycleMetrics.recentChanges.map((change, index) => (
                        <TableRow key={index}>
                          <TableCell>{change.employee_name}</TableCell>
                          <TableCell>
                            <Chip
                              label={change.type}
                              size="small"
                              color={change.type === 'Salary Change' ? 'primary' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">{change.change}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {change.date}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No recent changes</Alert>
              )}
            </Paper>
          </Box>
        </Box>
      )}

      {/* Data Visualizations Tab */}
      {tabValue === 5 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Timeline color="primary" />
            Interactive Data Visualizations
          </Typography>

          {/* Department Attendance and Financial Analysis */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Department Attendance</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={attendanceMetrics.departmentAttendance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="department" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#4caf50" name="Present" />
                  <Bar dataKey="total" fill="#e0e0e0" name="Total" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          {/* Financial Cash Flow Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Monthly Cash Flow Analysis</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financialMetrics.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stackId="1" 
                  stroke="#4caf50" 
                  fill="#4caf50" 
                  name="Income"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2" 
                  stroke="#f44336" 
                  fill="#f44336" 
                  name="Expenses"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#2196f3" 
                  strokeWidth={3}
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          {/* Export Options for Charts */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Export Charts</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                startIcon={<GetApp />}
                onClick={() => exportChart('attendance-chart')}
              >
                Export Attendance Chart
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<GetApp />}
                onClick={() => exportChart('cash-flow')}
              >
                Export Cash Flow
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

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

export default ReportsAndAnalytics;
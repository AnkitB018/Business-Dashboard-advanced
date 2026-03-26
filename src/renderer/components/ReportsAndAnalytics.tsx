import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
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
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  CalendarToday,
  Assessment,
  FileDownload,
  PersonOff,
  WorkHistory,
  Analytics,
  BarChart,
} from '@mui/icons-material';
import {
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
import databaseService from '../services/DatabaseService';

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

  // Attendance Reports State
  const [attendanceReportData, setAttendanceReportData] = useState<Array<{
    employee_name: string;
    total_hours: number;
    break_hours: number;
    effective_hours: number;
    present_days: number;
    absent_days: number;
  }>>([]);
  const [attendanceTimeRange, setAttendanceTimeRange] = useState('thisMonth');
  const [attendanceStartDate, setAttendanceStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [attendanceEndDate, setAttendanceEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

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
  
  // Chart colors for data visualization
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];

  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    loadEmployeeLifecycleMetrics();
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      loadAttendanceReportData();
    }
  }, [tabValue, attendanceStartDate, attendanceEndDate]);

  const loadAttendanceReportData = async () => {
    setLoading(true);
    try {
      const [employees, attendance] = await Promise.all([
        databaseService.getAllEmployees(),
        databaseService.getAllAttendance()
      ]);

      // Filter attendance by date range
      const filteredAttendance = attendance.filter((record: any) => {
        const recordDate = record.date;
        return recordDate >= attendanceStartDate && recordDate <= attendanceEndDate;
      });

      // Calculate metrics for each employee
      const employeeMetrics = employees.map((employee: any) => {
        const employeeRecords = filteredAttendance.filter((r: any) => r.employee_id === employee._id);
        
        const presentRecords = employeeRecords.filter((r: any) => r.status === 'Present');
        const absentRecords = employeeRecords.filter((r: any) => r.status === 'Absent');

        const totalHours = presentRecords.reduce((sum: number, r: any) => {
          return sum + (Number(r.working_hours) || 0);
        }, 0);

        const breakHours = presentRecords.reduce((sum: number, r: any) => {
          return sum + (Number(r.break_time) || 0);
        }, 0);

        return {
          employee_name: employee.name,
          total_hours: Number(totalHours.toFixed(2)),
          break_hours: Number(breakHours.toFixed(2)),
          effective_hours: Number((totalHours - breakHours).toFixed(2)),
          present_days: presentRecords.length,
          absent_days: absentRecords.length
        };
      });

      // Sort by total hours descending
      employeeMetrics.sort((a, b) => b.total_hours - a.total_hours);

      setAttendanceReportData(employeeMetrics);
    } catch (error) {
      console.error('Error loading attendance report data:', error);
      showSnackbar('Failed to load attendance report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceDateRangeChange = (range: string) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case 'thisWeek':
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        endDate = new Date();
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date();
        break;
      case 'last3Months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        endDate = new Date();
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0,  1);
        endDate = new Date();
        break;
      case 'custom':
        return; // Don't auto-set dates for custom range
    }

    setAttendanceTimeRange(range);
    setAttendanceStartDate(startDate.toISOString().split('T')[0]);
    setAttendanceEndDate(endDate.toISOString().split('T')[0]);
  };

  const loadEmployeeLifecycleMetrics = async () => {
    setLoading(true);
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

      showSnackbar('Employee lifecycle data loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading employee lifecycle metrics:', error);
      showSnackbar('Failed to load employee lifecycle data', 'error');
    } finally {
      setLoading(false);
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
      { min: 0, max: 100, label: '< ₹100' },
      { min: 100, max: 150, label: '₹100-150' },
      { min: 150, max: 200, label: '₹150-200' },
      { min: 200, max: 250, label: '₹200-250' },
      { min: 250, max: 300, label: '₹250-300' },
      { min: 300, max: 350, label: '₹300-350' },
      { min: 350, max: 400, label: '₹350-400' },
      { min: 400, max: 450, label: '₹400-450' },
      { min: 450, max: 500, label: '₹450-500' },
      { min: 500, max: 550, label: '₹500-550' },
      { min: 550, max: 600, label: '₹550-600' },
      { min: 600, max: 650, label: '₹600-650' },
      { min: 650, max: 700, label: '₹650-700' },
      { min: 700, max: 750, label: '₹700-750' },
      { min: 750, max: 800, label: '₹750-800' },
      { min: 800, max: 850, label: '₹800-850' },
      { min: 850, max: 900, label: '₹850-900' },
      { min: 900, max: 950, label: '₹900-950' },
      { min: 950, max: 1000, label: '₹950-1000' },
      { min: 1000, max: Infinity, label: '> ₹1000' }
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
    
    // Add only recent employment status changes
    if (Array.isArray(employmentHistory)) {
      employmentHistory
        .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
        .slice(0, 10)
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
    
    return changes;
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
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assessment color="primary" />
        Reports & Analytics
      </Typography>

      {/* Report Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Attendance Reports" icon={<People />} iconPosition="start" />
          <Tab label="Employee Lifecycle" icon={<WorkHistory />} iconPosition="start" />
          <Tab label="Wage & Payout Reports" icon={<AttachMoney />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Attendance Reports Tab */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People color="primary" />
              Attendance Reports
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={attendanceTimeRange}
                  onChange={(e) => handleAttendanceDateRangeChange(e.target.value)}
                  label="Time Range"
                >
                  <MenuItem value="thisWeek">This Week</MenuItem>
                  <MenuItem value="thisMonth">This Month</MenuItem>
                  <MenuItem value="last3Months">Last 3 Months</MenuItem>
                  <MenuItem value="thisYear">This Year</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>

              {attendanceTimeRange === 'custom' && (
                <>
                  <TextField
                    type="date"
                    label="Start Date"
                    value={attendanceStartDate}
                    onChange={(e) => setAttendanceStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                  <TextField
                    type="date"
                    label="End Date"
                    value={attendanceEndDate}
                    onChange={(e) => setAttendanceEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </>
              )}
            </Box>
          </Box>

          {/* Summary Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'primary.main' }}>
                  <People />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">
                  {attendanceReportData.reduce((sum, emp) => sum + emp.total_hours, 0).toFixed(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total Hours Worked</Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'warning.main' }}>
                  <CalendarToday />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">
                  {attendanceReportData.reduce((sum, emp) => sum + emp.break_hours, 0).toFixed(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total Break Hours</Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'success.main' }}>
                  <Analytics />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">
                  {attendanceReportData.reduce((sum, emp) => sum + emp.effective_hours, 0).toFixed(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">Effective Hours</Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'info.main' }}>
                  <BarChart />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">
                  {(attendanceReportData.reduce((sum, emp) => sum + emp.total_hours, 0) / 
                    (attendanceReportData.length || 1)).toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">Avg Hours/Employee</Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Working Hours Comparison - Bar Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Total Working Hours by Employee</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RechartsBarChart data={attendanceReportData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="employee_name" type="category" width={120} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="effective_hours" fill="#4caf50" name="Effective Hours" />
                <Bar dataKey="break_hours" fill="#ff9800" name="Break Hours" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Attendance Comparison - Grouped Bar Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Present vs Absent Days by Employee</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RechartsBarChart data={attendanceReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="employee_name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="present_days" fill="#4caf50" name="Present Days" />
                <Bar dataKey="absent_days" fill="#f44336" name="Absent Days" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Detailed Table */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Detailed Attendance Summary</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Employee</strong></TableCell>
                    <TableCell align="right"><strong>Total Hours</strong></TableCell>
                    <TableCell align="right"><strong>Break Hours</strong></TableCell>
                    <TableCell align="right"><strong>Effective Hours</strong></TableCell>
                    <TableCell align="right"><strong>Present Days</strong></TableCell>
                    <TableCell align="right"><strong>Absent Days</strong></TableCell>
                    <TableCell align="right"><strong>Avg Hours/Day</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceReportData.map((employee) => (
                    <TableRow key={employee.employee_name}>
                      <TableCell>{employee.employee_name}</TableCell>
                      <TableCell align="right">{employee.total_hours.toFixed(2)}</TableCell>
                      <TableCell align="right">{employee.break_hours.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={employee.effective_hours.toFixed(2)} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={employee.present_days} 
                          color="success" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={employee.absent_days} 
                          color={employee.absent_days > 2 ? 'error' : 'default'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="right">
                        {employee.present_days > 0 
                          ? (employee.total_hours / employee.present_days).toFixed(2) 
                          : '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* Employee Lifecycle Analytics Tab */}
      {tabValue === 1 && (
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
                <Typography variant="h4" fontWeight="bold">₹{Math.round(lifecycleMetrics.avgSalary)}</Typography>
                <Typography variant="body2" color="text.secondary">Avg Daily Wage</Typography>
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

          {/* Charts Row 2: Recent Employment Changes */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 3, mb: 3 }}>
            {/* Recent Employment Changes */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Recent Employment Changes</Typography>
              {lifecycleMetrics.recentChanges.length > 0 ? (
                <TableContainer sx={{ maxHeight: 400 }}>
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

          {/* Top Reasons & Employment Status */}
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
        </Box>
      )}

      {/* Wage & Payout Reports Tab */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AttachMoney color="primary" />
            Wage & Payout Reports
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Wage & Payout Reports - Coming Soon
          </Alert>
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

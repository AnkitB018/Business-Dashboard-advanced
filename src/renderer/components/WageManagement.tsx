import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Snackbar,
  InputAdornment
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Employee } from '../types/Employee';
import databaseService, { PayoutRecord } from '../services/DatabaseService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wage-tabpanel-${index}`}
      aria-labelledby={`wage-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface WageCalculationResult {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  exceptionHours: number;
  effectiveHours: number;
  dailyWage: number;
  calculatedWage: number;
  paidWage: number;
  remainingWage: number;
  periodStart: string;
  periodEnd: string;
  attendanceRecords: number;
}

interface BonusCalculationResult {
  employeeId: string;
  employeeName: string;
  totalEarned: number;
  bonusRate: number;
  bonusAmount: number;
  periodStart: string;
  periodEnd: string;
  lastBonusPaid: string;
}

interface PayoutEmployeeData {
  employeeId: string;
  employeeIdNumber: string;
  employeeName: string;
  totalHours: number;
  exceptionHours: number;
  effectiveHours: number;
  dailyWage: number;
  calculatedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  payoutAmount: number;
  selected: boolean;
}

const WageManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  // Wage calculation state
  const [wageCalculationPeriod, setWageCalculationPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [wageResults, setWageResults] = useState<WageCalculationResult[]>([]);
  const [wagePayoutHistory, setWagePayoutHistory] = useState<PayoutRecord[]>([]);
  
  // Bonus calculation state
  const [bonusCalculationPeriod, setBonusCalculationPeriod] = useState({
    startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [bonusResults, setBonusResults] = useState<BonusCalculationResult[]>([]);
  const [bonusRate, setBonusRate] = useState(8.33);

  // Payout dialog state
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutType, setPayoutType] = useState<'wage' | 'bonus'>('wage');
  const [payoutPeriod, setPayoutPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [payoutEmployees, setPayoutEmployees] = useState<PayoutEmployeeData[]>([]);
  const [savingPayout, setSavingPayout] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');


  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeeData = await databaseService.getAllEmployees();
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Time parsing utility function
  const parseTime = (timeStr: string): { hour: number; minute: number } | null => {
    try {
      if (!timeStr || timeStr === '--:--' || timeStr.trim() === '') {
        return null;
      }

      const cleanTime = timeStr.trim();
      
      // Handle 12-hour format (e.g., "08:30 AM")
      if (cleanTime.toUpperCase().includes('AM') || cleanTime.toUpperCase().includes('PM')) {
        const timePart = cleanTime.replace(/\s*(AM|PM)/i, '').trim();
        const [hourStr, minuteStr] = timePart.split(':');
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr || '0');
        
        if (cleanTime.toUpperCase().includes('PM') && hour !== 12) {
          hour += 12;
        } else if (cleanTime.toUpperCase().includes('AM') && hour === 12) {
          hour = 0;
        }
        
        return { hour, minute };
      }
      
      // Handle 24-hour format (e.g., "17:30")
      const [hourStr, minuteStr] = cleanTime.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr || '0');
      
      return { hour, minute };
    } catch (error) {
      console.error('Error parsing time:', error);
      return null;
    }
  };

  // Calculate total hours worked from time in and time out
  const calculateTotalHours = (timeIn: string, timeOut: string): number => {
    const inTime = parseTime(timeIn);
    const outTime = parseTime(timeOut);
    
    if (!inTime || !outTime) {
      return 0;
    }
    
    const inTotalMinutes = inTime.hour * 60 + inTime.minute;
    let outTotalMinutes = outTime.hour * 60 + outTime.minute;
    
    // Handle next day scenario (night shift)
    if (outTotalMinutes < inTotalMinutes) {
      outTotalMinutes += 24 * 60; // Add 24 hours
    }
    
    const diffMinutes = outTotalMinutes - inTotalMinutes;
    return Math.max(0, diffMinutes / 60.0);
  };

  // Calculate wage for selected employee(s)
  const calculateWages = async () => {
    try {
      setCalculating(true);
      const results: WageCalculationResult[] = [];
      
      let employeesToCalculate = selectedEmployee 
        ? employees.filter(emp => emp._id === selectedEmployee)
        : employees;

      // Filter employees based on active status during the period
      employeesToCalculate = employeesToCalculate.filter(emp => {
        const empData = emp as any;
        // If employee was terminated before the period start, exclude them
        if (empData.termination_date) {
          const terminationDateStr = empData.termination_date instanceof Date 
            ? empData.termination_date.toISOString().split('T')[0]
            : empData.termination_date;
          if (terminationDateStr < wageCalculationPeriod.startDate) {
            return false;
          }
        }
        return true;
      });

      for (const employee of employeesToCalculate) {
        const employeeData = employee as any;
        
        // Get attendance records for the period (use MongoDB _id as employeeId)
        const attendanceRecords = await databaseService.getAttendanceByEmployeeAndDateRange(
          employeeData._id,
          wageCalculationPeriod.startDate,
          wageCalculationPeriod.endDate
        );

        let totalHours = 0;
        let totalBreakHours = 0; // Accumulate break time from attendance records
        
        // Calculate total hours and break hours from attendance records
        for (const record of attendanceRecords) {
          const recordData = record as any;
          if (recordData.check_in_time && recordData.check_out_time) {
            const hoursWorked = calculateTotalHours(recordData.check_in_time, recordData.check_out_time);
            totalHours += hoursWorked;
          } else if (recordData.working_hours) {
            // If working hours are directly available
            totalHours += recordData.working_hours;
          } else if (recordData.status === 'present') {
            // Default to 8 hours for present days without time data
            totalHours += 8;
          }
          
          // Accumulate break time from each record
          if (recordData.break_time) {
            totalBreakHours += recordData.break_time;
          }
        }

        // Calculate effective hours and wage
        const effectiveHours = Math.max(0, totalHours - totalBreakHours);
        const dailyWage = employeeData.daily_wage || employeeData.salary || 0;
        const calculatedWage = (effectiveHours * dailyWage) / 8;

        // Get payout records for this employee in this period
        const allPayouts = await databaseService.getAllPayouts();
        const employeePayouts = allPayouts.filter((payout: any) => 
          payout.employeeId === employeeData._id &&
          payout.payout_type === 'wage' &&
          payout.payout_date >= wageCalculationPeriod.startDate &&
          payout.payout_date <= wageCalculationPeriod.endDate
        );
        
        // Sum up all paid amounts
        const paidWage = employeePayouts.reduce((sum: number, payout: any) => 
          sum + (payout.actual_amount || 0), 0
        );
        
        const remainingWage = calculatedWage - paidWage;

        results.push({
          employeeId: employeeData.employee_id || employeeData._id,
          employeeName: employeeData.name || 'Unknown',
          totalHours,
          exceptionHours: totalBreakHours,
          effectiveHours,
          dailyWage,
          calculatedWage,
          paidWage,
          remainingWage,
          periodStart: wageCalculationPeriod.startDate,
          periodEnd: wageCalculationPeriod.endDate,
          attendanceRecords: attendanceRecords.length
        });
      }

      setWageResults(results);
      
      // Load payout history for the selected period and employees
      await loadWagePayoutHistory();
    } catch (error) {
      console.error('Error calculating wages:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Load payout history for wage calculations
  const loadWagePayoutHistory = async () => {
    try {
      const allPayouts = await databaseService.getAllPayouts();
      
      // Filter payouts based on selected employee(s) and period
      let filteredPayouts = allPayouts.filter((payout: any) => 
        payout.payout_type === 'wage' &&
        payout.payout_date >= wageCalculationPeriod.startDate &&
        payout.payout_date <= wageCalculationPeriod.endDate
      );

      // If specific employee is selected, filter further
      if (selectedEmployee) {
        filteredPayouts = filteredPayouts.filter((payout: any) => 
          payout.employeeId === selectedEmployee
        );
      }

      // Sort by payout date (oldest first, chronological order)
      filteredPayouts.sort((a: any, b: any) => 
        new Date(a.payout_date).getTime() - new Date(b.payout_date).getTime()
      );

      setWagePayoutHistory(filteredPayouts as PayoutRecord[]);
    } catch (error) {
      console.error('Error loading payout history:', error);
      setWagePayoutHistory([]);
    }
  };

  // Delete a payout record
  const deletePayoutRecord = async (payoutId: string) => {
    if (!window.confirm('Are you sure you want to delete this payout transaction?')) {
      return;
    }

    try {
      await databaseService.deletePayoutRecord(payoutId);
      setSnackbarMessage('Payout transaction deleted successfully');
      setSnackbarOpen(true);
      
      // Reload calculations and history
      if (wageResults.length > 0) {
        await calculateWages();
      }
    } catch (error) {
      console.error('Error deleting payout:', error);
      setSnackbarMessage('Error deleting payout transaction');
      setSnackbarOpen(true);
    }
  };

  // Calculate bonus for selected employee(s)
  const calculateBonus = async () => {
    try {
      setCalculating(true);
      const results: BonusCalculationResult[] = [];
      
      let employeesToCalculate = selectedEmployee 
        ? employees.filter(emp => emp._id === selectedEmployee)
        : employees;

      // Filter employees based on active status during the period
      employeesToCalculate = employeesToCalculate.filter(emp => {
        const empData = emp as any;
        // If employee was terminated before the period start, exclude them
        if (empData.termination_date) {
          const terminationDateStr = empData.termination_date instanceof Date 
            ? empData.termination_date.toISOString().split('T')[0]
            : empData.termination_date;
          if (terminationDateStr < bonusCalculationPeriod.startDate) {
            return false;
          }
        }
        return true;
      });

      for (const employee of employeesToCalculate) {
        const employeeData = employee as any;
        
        // Get attendance records for the bonus period (use MongoDB _id as employeeId)
        const attendanceRecords = await databaseService.getAttendanceByEmployeeAndDateRange(
          employeeData._id,
          bonusCalculationPeriod.startDate,
          bonusCalculationPeriod.endDate
        );

        let totalEarned = 0;
        const dailyWage = employeeData.daily_wage || employeeData.salary || 0;
        
        // Calculate total earnings for the period
        for (const record of attendanceRecords) {
          const recordData = record as any;
          let hoursWorked = 0;
          
          if (recordData.check_in_time && recordData.check_out_time) {
            hoursWorked = calculateTotalHours(recordData.check_in_time, recordData.check_out_time);
          } else if (recordData.working_hours) {
            hoursWorked = recordData.working_hours;
          } else if (recordData.status === 'present') {
            hoursWorked = 8; // Default to 8 hours
          }
          
          // Calculate daily earnings with break time from attendance record
          const breakHours = recordData.break_time || 0;
          const effectiveHours = Math.max(0, hoursWorked - breakHours);
          const dailyEarnings = (effectiveHours * dailyWage) / 8;
          totalEarned += dailyEarnings;
        }

        // Calculate bonus
        const bonusAmount = (totalEarned * bonusRate) / 100;

        results.push({
          employeeId: employeeData.employee_id || employeeData._id,
          employeeName: employeeData.name || 'Unknown',
          totalEarned,
          bonusRate,
          bonusAmount,
          periodStart: bonusCalculationPeriod.startDate,
          periodEnd: bonusCalculationPeriod.endDate,
          lastBonusPaid: employeeData.last_bonus_paid || 'Never'
        });
      }

      setBonusResults(results);
    } catch (error) {
      console.error('Error calculating bonus:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Open payout dialog
  const openPayoutDialog = async (type: 'wage' | 'bonus') => {
    setPayoutType(type);
    setPayoutDialogOpen(true);
    
    // Set default period based on type
    if (type === 'wage') {
      setPayoutPeriod({
        startDate: wageCalculationPeriod.startDate,
        endDate: wageCalculationPeriod.endDate
      });
    } else {
      setPayoutPeriod({
        startDate: bonusCalculationPeriod.startDate,
        endDate: bonusCalculationPeriod.endDate
      });
    }
    
    // Load employee payout data
    await loadPayoutEmployees(type, payoutPeriod.startDate, payoutPeriod.endDate);
  };

  // Load employees with calculated payout amounts
  const loadPayoutEmployees = async (type: 'wage' | 'bonus', startDate: string, endDate: string) => {
    try {
      setCalculating(true);
      const payoutData: PayoutEmployeeData[] = [];
      
      let employeesToProcess = selectedEmployee 
        ? employees.filter(emp => emp._id === selectedEmployee)
        : employees;

      // Filter employees based on active status during the period
      employeesToProcess = employeesToProcess.filter(emp => {
        const empData = emp as any;
        // If employee was terminated before the period start, exclude them
        if (empData.termination_date) {
          const terminationDateStr = empData.termination_date instanceof Date 
            ? empData.termination_date.toISOString().split('T')[0]
            : empData.termination_date;
          if (terminationDateStr < startDate) {
            return false;
          }
        }
        return true;
      });

      for (const employee of employeesToProcess) {
        const employeeData = employee as any;
        
        // Get attendance records for the period
        const attendanceRecords = await databaseService.getAttendanceByEmployeeAndDateRange(
          employeeData._id,
          startDate,
          endDate
        );

        let totalHours = 0;
        let totalBreakHours = 0;
        let totalEarned = 0;
        const dailyWage = employeeData.daily_wage || employeeData.salary || 0;
        
        // Calculate hours and earnings
        for (const record of attendanceRecords) {
          const recordData = record as any;
          let hoursWorked = 0;
          
          if (recordData.check_in_time && recordData.check_out_time) {
            hoursWorked = calculateTotalHours(recordData.check_in_time, recordData.check_out_time);
          } else if (recordData.working_hours) {
            hoursWorked = recordData.working_hours;
          } else if (recordData.status === 'present') {
            hoursWorked = 8;
          }
          
          totalHours += hoursWorked;
          
          const breakHours = recordData.break_time || 0;
          totalBreakHours += breakHours;
          
          const effectiveHours = Math.max(0, hoursWorked - breakHours);
          const dailyEarnings = (effectiveHours * dailyWage) / 8;
          totalEarned += dailyEarnings;
        }

        const effectiveHours = Math.max(0, totalHours - totalBreakHours);
        let calculatedAmount = 0;
        
        if (type === 'wage') {
          calculatedAmount = (effectiveHours * dailyWage) / 8;
        } else {
          // Bonus calculation
          const bonusRate = bonusResults.find(r => r.employeeId === (employeeData.employee_id || employeeData._id))?.bonusRate || 8.33;
          calculatedAmount = (totalEarned * bonusRate) / 100;
        }

        // Get existing payouts for this employee in this period
        const allPayouts = await databaseService.getAllPayouts();
        const existingPayouts = allPayouts.filter((payout: any) => 
          payout.employeeId === employeeData._id &&
          payout.payout_type === type &&
          payout.payout_date >= startDate &&
          payout.payout_date <= endDate
        );
        
        // Calculate paid amount
        const paidAmount = existingPayouts.reduce((sum: number, payout: any) => 
          sum + (payout.actual_amount || 0), 0
        );
        
        const remainingAmount = Math.max(0, calculatedAmount - paidAmount);

        payoutData.push({
          employeeId: employeeData._id,
          employeeIdNumber: employeeData.employee_id,
          employeeName: employeeData.name,
          totalHours,
          exceptionHours: totalBreakHours,
          effectiveHours,
          dailyWage,
          calculatedAmount,
          paidAmount,
          remainingAmount,
          payoutAmount: remainingAmount,
          selected: false
        });
      }

      setPayoutEmployees(payoutData);
    } catch (error) {
      console.error('Error loading payout employees:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Handle payout period change
  const handlePayoutPeriodChange = async (field: 'startDate' | 'endDate', value: string) => {
    const newPeriod = { ...payoutPeriod, [field]: value };
    setPayoutPeriod(newPeriod);
    await loadPayoutEmployees(payoutType, newPeriod.startDate, newPeriod.endDate);
  };

  // Toggle employee selection
  const toggleEmployeeSelection = (employeeId: string) => {
    setPayoutEmployees(prev => prev.map(emp => 
      emp.employeeId === employeeId ? { ...emp, selected: !emp.selected } : emp
    ));
  };

  // Toggle all employees
  const toggleAllEmployees = () => {
    const allSelected = payoutEmployees.every(emp => emp.selected);
    setPayoutEmployees(prev => prev.map(emp => ({ ...emp, selected: !allSelected })));
  };

  // Update payout amount
  const updatePayoutAmount = (employeeId: string, amount: number) => {
    setPayoutEmployees(prev => prev.map(emp => 
      emp.employeeId === employeeId ? { ...emp, payoutAmount: amount } : emp
    ));
  };

  // Save payouts
  const savePayouts = async () => {
    try {
      setSavingPayout(true);
      const selectedEmployees = payoutEmployees.filter(emp => emp.selected);
      
      if (selectedEmployees.length === 0) {
        setSnackbarMessage('Please select at least one employee');
        setSnackbarOpen(true);
        return;
      }

      for (const emp of selectedEmployees) {
        const payoutRecord: Omit<PayoutRecord, '_id'> = {
          employeeId: emp.employeeId,
          employee_id: emp.employeeIdNumber,
          employee_name: emp.employeeName,
          payout_type: payoutType,
          period_start: payoutPeriod.startDate,
          period_end: payoutPeriod.endDate,
          payout_date: payoutDate,
          total_hours: emp.totalHours,
          exception_hours: emp.exceptionHours,
          effective_hours: emp.effectiveHours,
          daily_wage: emp.dailyWage,
          calculated_amount: emp.calculatedAmount,
          actual_amount: emp.payoutAmount
        };

        await databaseService.addPayoutRecord(payoutRecord);
      }

      setSnackbarMessage(`Successfully saved payouts for ${selectedEmployees.length} employee(s)`);
      setSnackbarOpen(true);
      setPayoutDialogOpen(false);
      
      // Reset selections
      setPayoutEmployees(prev => prev.map(emp => ({ ...emp, selected: false })));
      
      // Reload wage calculations and payout history if on wage tab
      if (payoutType === 'wage' && wageResults.length > 0) {
        await calculateWages();
      }
    } catch (error) {
      console.error('Error saving payouts:', error);
      setSnackbarMessage('Error saving payouts. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setSavingPayout(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
<Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon color="primary" />
        Wage & Bonus Management
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Calculate employee wages and bonuses based on attendance data and configured rates
      </Typography>

      {/* Employee Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <FormControl fullWidth>
              <InputLabel>Select Employee</InputLabel>
              <Select
                value={selectedEmployee}
                label="Select Employee"
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <MenuItem value="">All Employees</MenuItem>
                {employees.map((employee) => {
                  const empData = employee as any;
                  return (
                    <MenuItem key={employee._id} value={employee._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {empData.name} ({empData.employee_id})
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Alert severity="info" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">
                Select an employee for individual calculations or leave blank for all employees
              </Typography>
            </Alert>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="wage management tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          <Tab 
            icon={<CalculateIcon />} 
            label="Daily Wage Calculation" 
            iconPosition="start"
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            icon={<AccountBalanceIcon />} 
            label="Bonus Calculation" 
            iconPosition="start"
            sx={{ textTransform: 'none' }}
          />
        </Tabs>

        {/* Wage Calculation Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Calculation Parameters */}
            <Box sx={{ flex: '0 0 350px', minWidth: '300px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon sx={{ mr: 1 }} />
                    Calculation Period
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Start Date"
                      value={wageCalculationPeriod.startDate}
                      onChange={(e) => setWageCalculationPeriod(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date"
                      value={wageCalculationPeriod.endDate}
                      onChange={(e) => setWageCalculationPeriod(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                      sx={{ mb: 3 }}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: wageCalculationPeriod.startDate }}
                      error={wageCalculationPeriod.endDate < wageCalculationPeriod.startDate}
                      helperText={wageCalculationPeriod.endDate < wageCalculationPeriod.startDate ? 'End date must be after start date' : ''}
                    />
                    
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={calculateWages}
                      disabled={calculating || wageCalculationPeriod.endDate < wageCalculationPeriod.startDate}
                      startIcon={calculating ? <CircularProgress size={20} /> : <CalculateIcon />}
                      sx={{ py: 1.5, mb: 2 }}
                    >
                      {calculating ? 'Calculating...' : 'Calculate Wages'}
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => openPayoutDialog('wage')}
                      disabled={wageResults.length === 0}
                      startIcon={<PaymentIcon />}
                      sx={{ py: 1.5 }}
                    >
                      Record Wage Payout
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Formula:</strong> [(Total Hours - Exception Hours) × Daily Wage] ÷ 8
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Exception hours: 1 hour per day worked
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Wage Results */}
            <Box sx={{ flex: '1 1 600px', minWidth: '500px' }}>
              {wageResults.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <PaymentIcon sx={{ mr: 1 }} />
                      Wage Calculation Results
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell align="right">Total Hours</TableCell>
                            <TableCell align="right">Exception Hours</TableCell>
                            <TableCell align="right">Effective Hours</TableCell>
                            <TableCell align="right">Daily Wage</TableCell>
                            <TableCell align="right">Calculated Wage</TableCell>
                            <TableCell align="right">Paid Wage</TableCell>
                            <TableCell align="right">Remaining</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {wageResults.map((result, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {result.employeeName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {result.employeeId} • {result.attendanceRecords} days
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">{result.totalHours.toFixed(2)}</TableCell>
                              <TableCell align="right">{result.exceptionHours.toFixed(2)}</TableCell>
                              <TableCell align="right">{result.effectiveHours.toFixed(2)}</TableCell>
                              <TableCell align="right">{formatCurrency(result.dailyWage)}</TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold" color="primary">
                                  {formatCurrency(result.calculatedWage)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="medium" color={result.paidWage > 0 ? "success.main" : "text.secondary"}>
                                  {formatCurrency(result.paidWage)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={formatCurrency(result.remainingWage)}
                                  size="small"
                                  color={result.remainingWage > 0 ? "warning" : "success"}
                                  sx={{ fontWeight: 'bold', minWidth: 100 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>

          {/* Payout History Section */}
          {wagePayoutHistory.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <VisibilityIcon sx={{ mr: 1 }} />
                    Recorded Wage Payouts
                    <Chip 
                      label={`${wagePayoutHistory.length} transaction${wagePayoutHistory.length !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      sx={{ ml: 2 }}
                    />
                  </Typography>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Payout Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Paid Amount</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {wagePayoutHistory.map((payout, index) => (
                          <TableRow 
                            key={index}
                            sx={{ 
                              '&:hover': { bgcolor: 'action.hover' },
                              borderLeft: 3,
                              borderColor: 'success.main'
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                                <Typography variant="body2" fontWeight="medium">
                                  {new Date(payout.payout_date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {payout.employee_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {payout.employee_id}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(payout.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {' - '}
                                {new Date(payout.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {formatCurrency(payout.actual_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Delete transaction">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => deletePayoutRecord(payout._id!)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Summary Card */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Period Total:</strong> {wageCalculationPeriod.startDate} to {wageCalculationPeriod.endDate}
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      Total Paid: {formatCurrency(
                        wagePayoutHistory.reduce((sum, p) => sum + p.actual_amount, 0)
                      )}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </TabPanel>

        {/* Bonus Calculation Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Bonus Parameters */}
            <Box sx={{ flex: '0 0 350px', minWidth: '300px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon sx={{ mr: 1 }} />
                    Bonus Period
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Start Date"
                      value={bonusCalculationPeriod.startDate}
                      onChange={(e) => setBonusCalculationPeriod(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date"
                      value={bonusCalculationPeriod.endDate}
                      onChange={(e) => setBonusCalculationPeriod(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: bonusCalculationPeriod.startDate }}
                      error={bonusCalculationPeriod.endDate < bonusCalculationPeriod.startDate}
                      helperText={bonusCalculationPeriod.endDate < bonusCalculationPeriod.startDate ? 'End date must be after start date' : ''}
                    />
                    
                    <TextField
                      fullWidth
                      type="number"
                      label="Bonus Rate (%)"
                      value={bonusRate}
                      onChange={(e) => setBonusRate(parseFloat(e.target.value) || 8.33)}
                      sx={{ mb: 3 }}
                      inputProps={{ step: 0.01, min: 0, max: 100 }}
                    />
                    
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={calculateBonus}
                      disabled={calculating || bonusCalculationPeriod.endDate < bonusCalculationPeriod.startDate}
                      startIcon={calculating ? <CircularProgress size={20} /> : <AccountBalanceIcon />}
                      sx={{ py: 1.5, mb: 2 }}
                    >
                      {calculating ? 'Calculating...' : 'Calculate Bonus'}
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => openPayoutDialog('bonus')}
                      disabled={bonusResults.length === 0}
                      startIcon={<PaymentIcon />}
                      sx={{ py: 1.5 }}
                    >
                      Record Bonus Payment
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Formula:</strong> Total Earned Amount × Bonus Rate
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Default rate: 8.33% (annual)
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Bonus Results */}
            <Box sx={{ flex: '1 1 600px', minWidth: '500px' }}>
              {bonusResults.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccountBalanceIcon sx={{ mr: 1 }} />
                      Bonus Calculation Results
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell align="right">Total Earned</TableCell>
                            <TableCell align="right">Bonus Rate</TableCell>
                            <TableCell align="right">Bonus Amount</TableCell>
                            <TableCell align="right">Last Bonus</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bonusResults.map((result, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {result.employeeName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {result.employeeId}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">{formatCurrency(result.totalEarned)}</TableCell>
                              <TableCell align="right">{result.bonusRate.toFixed(2)}%</TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  {formatCurrency(result.bonusAmount)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" color="text.secondary">
                                  {result.lastBonusPaid}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Payout Dialog */}
      <Dialog 
        open={payoutDialogOpen} 
        onClose={() => setPayoutDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {payoutType === 'wage' ? '💵 Record Wage Payout' : '🎁 Record Bonus Payment'}
            </Typography>
            <IconButton onClick={() => setPayoutDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {/* Period Selection */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Calculation Period
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <TextField
                type="date"
                label="Start Date"
                value={payoutPeriod.startDate}
                onChange={(e) => handlePayoutPeriodChange('startDate', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                type="date"
                label="End Date"
                value={payoutPeriod.endDate}
                onChange={(e) => handlePayoutPeriodChange('endDate', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: payoutPeriod.startDate }}
                error={payoutPeriod.endDate < payoutPeriod.startDate}
                helperText={payoutPeriod.endDate < payoutPeriod.startDate ? 'End date must be after start date' : ''}
                sx={{ flex: 1 }}
              />
              <TextField
                type="date"
                label="Payout Date"
                value={payoutDate}
                onChange={(e) => setPayoutDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Paper>

          {calculating ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={payoutEmployees.length > 0 && payoutEmployees.every(emp => emp.selected)}
                        indeterminate={payoutEmployees.some(emp => emp.selected) && !payoutEmployees.every(emp => emp.selected)}
                        onChange={toggleAllEmployees}
                        sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employee</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Total Hours</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Exception Hrs</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Daily Wage</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Calculated</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Paid</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Remaining</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Payout Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutEmployees.map((emp) => (
                    <TableRow 
                      key={emp.employeeId}
                      sx={{ 
                        bgcolor: emp.selected ? 'action.selected' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={emp.selected}
                          onChange={() => toggleEmployeeSelection(emp.employeeId)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {emp.employeeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {emp.employeeIdNumber}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={emp.totalHours.toFixed(1)} 
                          size="small" 
                          sx={{ minWidth: 60 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={emp.exceptionHours.toFixed(1)} 
                          size="small" 
                          color="warning"
                          sx={{ minWidth: 60 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(emp.dailyWage)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(emp.calculatedAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" color={emp.paidAmount > 0 ? "success.main" : "text.secondary"}>
                          {formatCurrency(emp.paidAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={formatCurrency(emp.remainingAmount)}
                          size="small"
                          color={emp.remainingAmount > 0 ? "warning" : "success"}
                          sx={{ fontWeight: 'bold', minWidth: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={emp.payoutAmount}
                          onChange={(e) => updatePayoutAmount(emp.employeeId, parseFloat(e.target.value) || 0)}
                          size="small"
                          sx={{ width: 140 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          inputProps={{ step: 0.01, min: 0 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {payoutEmployees.length === 0 && !calculating && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No employee data available for the selected period. Please calculate {payoutType === 'wage' ? 'wages' : 'bonuses'} first.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setPayoutDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={savePayouts}
            variant="contained"
            disabled={savingPayout || payoutEmployees.filter(e => e.selected).length === 0}
            startIcon={savingPayout ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {savingPayout ? 'Saving...' : `Save Payout (${payoutEmployees.filter(e => e.selected).length} selected)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default WageManagement;
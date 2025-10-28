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
  Divider
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { Employee } from '../types/Employee';
import databaseService from '../services/DatabaseService';

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
  
  // Bonus calculation state
  const [bonusCalculationPeriod, setBonusCalculationPeriod] = useState({
    startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [bonusResults, setBonusResults] = useState<BonusCalculationResult[]>([]);
  const [bonusRate, setBonusRate] = useState(8.33);

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
      
      const employeesToCalculate = selectedEmployee 
        ? employees.filter(emp => emp._id === selectedEmployee)
        : employees;

      for (const employee of employeesToCalculate) {
        const employeeData = employee as any;
        
        // Get attendance records for the period
        const attendanceRecords = await databaseService.getAttendanceByEmployeeAndDateRange(
          employeeData.employee_id || employeeData.emp_id,
          wageCalculationPeriod.startDate,
          wageCalculationPeriod.endDate
        );

        let totalHours = 0;
        let exceptionHours = 1.0; // Hardcoded exception hours as per Python logic
        
        // Calculate total hours from attendance records
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
        }

        // Calculate effective hours and wage
        const effectiveHours = Math.max(0, totalHours - (exceptionHours * attendanceRecords.length));
        const dailyWage = employeeData.daily_wage || employeeData.salary || 0;
        const calculatedWage = (effectiveHours * dailyWage) / 8;

        results.push({
          employeeId: employeeData.employee_id || employeeData.emp_id || employeeData._id,
          employeeName: employeeData.name || 'Unknown',
          totalHours,
          exceptionHours: exceptionHours * attendanceRecords.length,
          effectiveHours,
          dailyWage,
          calculatedWage,
          periodStart: wageCalculationPeriod.startDate,
          periodEnd: wageCalculationPeriod.endDate,
          attendanceRecords: attendanceRecords.length
        });
      }

      setWageResults(results);
    } catch (error) {
      console.error('Error calculating wages:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Calculate bonus for selected employee(s)
  const calculateBonus = async () => {
    try {
      setCalculating(true);
      const results: BonusCalculationResult[] = [];
      
      const employeesToCalculate = selectedEmployee 
        ? employees.filter(emp => emp._id === selectedEmployee)
        : employees;

      for (const employee of employeesToCalculate) {
        const employeeData = employee as any;
        
        // Get attendance records for the bonus period
        const attendanceRecords = await databaseService.getAttendanceByEmployeeAndDateRange(
          employeeData.employee_id || employeeData.emp_id,
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
          
          // Calculate daily earnings with exception hours
          const effectiveHours = Math.max(0, hoursWorked - 1); // 1 hour exception
          const dailyEarnings = (effectiveHours * dailyWage) / 8;
          totalEarned += dailyEarnings;
        }

        // Calculate bonus
        const bonusAmount = (totalEarned * bonusRate) / 100;

        results.push({
          employeeId: employeeData.employee_id || employeeData.emp_id || employeeData._id,
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        fontWeight: 600,
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        mb: 3
      }}>
        💰 Wage & Bonus Management
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
                        {empData.name} ({empData.employee_id || empData.emp_id})
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
                    />
                    
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={calculateWages}
                      disabled={calculating}
                      startIcon={calculating ? <CircularProgress size={20} /> : <CalculateIcon />}
                      sx={{ py: 1.5 }}
                    >
                      {calculating ? 'Calculating...' : 'Calculate Wages'}
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
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  {formatCurrency(result.calculatedWage)}
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
                      disabled={calculating}
                      startIcon={calculating ? <CircularProgress size={20} /> : <AccountBalanceIcon />}
                      sx={{ py: 1.5 }}
                    >
                      {calculating ? 'Calculating...' : 'Calculate Bonus'}
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
    </Box>
  );
};

export default WageManagement;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  AccessTime,
  Person,
  Refresh,
  Save,
  CalendarMonth,
  ArrowBack,
  ArrowForward,
  Add,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Employee } from '../types/Employee';
import databaseService from '../services/DatabaseService';

interface AttendanceRecord {
  _id?: string;
  employeeId: string;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in_time: string;
  check_out_time: string;
  break_time: number; // in hours
  working_hours: number;
  overtime_hours: number;
  status: 'Present' | 'Absent' | 'Leave';
  notes?: string;
}

interface DayStatus {
  date: Date;
  status: 'Present' | 'Absent' | 'Leave' | 'None';
  working_hours?: number;
  overtime_hours?: number;
}

const AttendanceManagement: React.FC = () => {
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  // Initialize calendar to show last 3 months (2 months ago + current)
  const getDefaultCalendarStart = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    date.setDate(1);
    return date;
  };
  const [calendarStartMonth, setCalendarStartMonth] = useState<Date>(getDefaultCalendarStart());
  
  // Form data for daily attendance entry
  const [dailyAttendance, setDailyAttendance] = useState<Map<string, {
    status: 'Present' | 'Absent' | 'Leave';
    check_in_time: string;
    check_out_time: string;
    break_time: number;
    notes: string;
  }>>(new Map());

  // UI States
  const [loading, setLoading] = useState(false);
  const [openAttendanceDialog, setOpenAttendanceDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [activeTab, setActiveTab] = useState(0);
  const [dailySummaryDate, setDailySummaryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailySummaryRecords, setDailySummaryRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeAttendance();
    }
  }, [selectedEmployee, calendarStartMonth]);

  useEffect(() => {
    loadDailyAttendance();
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 1) {
      loadDailySummary();
    }
  }, [dailySummaryDate, activeTab]);

  const loadEmployees = async () => {
    try {
      const allEmployees = await databaseService.getAllEmployees();
      // Keep all employees for filtering, not just currently active ones
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
      showSnackbar('Failed to load employees', 'error');
    }
  };

  const loadEmployeeAttendance = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(true);
      // Get attendance for the selected employee for 3 months
      const startDate = new Date(calendarStartMonth);
      startDate.setDate(1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
      
      const result = await databaseService.getAttendanceByEmployeeAndDateRange(
        selectedEmployee,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      setAttendanceRecords(result);
    } catch (error) {
      console.error('Error loading attendance:', error);
      showSnackbar('Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyAttendance = async () => {
    try {
      // Load all attendance records for the selected date
      const result = await databaseService.getAllAttendance();
      const dateRecords = result.filter((r: any) => {
        // Normalize the record date string (handle both string and Date types)
        const recordDate = typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0];
        return recordDate === selectedDate;
      });
      
      // Populate the daily attendance map
      const attendanceMap = new Map();
      dateRecords.forEach((record: any) => {
        attendanceMap.set(record.employeeId, {
          status: record.status || 'Present',
          check_in_time: record.check_in_time || '',
          check_out_time: record.check_out_time || '',
          break_time: record.break_time || 0,
          notes: record.notes || ''
        });
      });
      
      setDailyAttendance(attendanceMap);
    } catch (error) {
      console.error('Error loading daily attendance:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadDailySummary = async () => {
    try {
      setLoading(true);
      const result = await databaseService.getAllAttendance();
      const dateRecords = result.filter((r: any) => {
        const recordDate = typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0];
        return recordDate === dailySummaryDate;
      });
      setDailySummaryRecords(dateRecords);
    } catch (error) {
      console.error('Error loading daily summary:', error);
      showSnackbar('Failed to load daily summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string, breakTime: number): { 
    working: number; 
    overtime: number; 
    isHalfDay: boolean 
  } => {
    if (!checkIn || !checkOut) return { working: 0, overtime: 0, isHalfDay: false };
    
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    
    const totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    const totalHours = totalMinutes / 60;
    const workingHours = Math.max(0, totalHours - breakTime);
    
    const standardHours = 8;
    const overtime = Math.max(0, workingHours - standardHours);
    const isHalfDay = workingHours < 4;
    
    return {
      working: Math.round(workingHours * 100) / 100,
      overtime: Math.round(overtime * 100) / 100,
      isHalfDay
    };
  };

  const handleStatusChange = (employeeId: string, field: string, value: any) => {
    const current = dailyAttendance.get(employeeId) || {
      status: 'Present' as 'Present' | 'Absent' | 'Leave',
      check_in_time: '08:00',
      check_out_time: '17:00',
      break_time: 1,
      notes: ''
    };
    
    setDailyAttendance(new Map(dailyAttendance.set(employeeId, {
      ...current,
      [field]: value
    })));
  };

  const saveDailyAttendance = async () => {
    try {
      setLoading(true);
      let savedCount = 0;
      
      console.log('Saving attendance for date:', selectedDate);
      
      // Get all active employees for the selected date
      const activeEmployees = getActiveEmployeesOnDate(selectedDate);
      
      for (const employee of activeEmployees) {
        const employeeId = employee._id!;
        
        // Get attendance data or use defaults
        const data = dailyAttendance.get(employeeId) || {
          status: 'Present' as 'Present' | 'Absent' | 'Leave',
          check_in_time: '08:00',
          check_out_time: '17:00',
          break_time: 1,
          notes: ''
        };
        
        // Calculate working hours and overtime
        const calculation = calculateWorkingHours(
          data.check_in_time,
          data.check_out_time,
          data.break_time
        );
        
        // Use the selected status as final status
        const finalStatus = data.status;
        
        const attendanceRecord = {
          employeeId: employeeId,
          employee_id: employee.employee_id,
          employee_name: employee.name,
          date: selectedDate,
          check_in_time: data.check_in_time,
          check_out_time: data.check_out_time,
          break_time: data.break_time,
          working_hours: calculation.working,
          overtime_hours: calculation.overtime,
          status: finalStatus,
          notes: data.notes
        };
        
        console.log('Attendance record to save:', attendanceRecord);
        
        // Check if record exists for this date
        const existingRecord = await databaseService.getAllAttendance().then((records: any[]) => {
          const found = records.find((r: any) => {
            // Normalize both dates for comparison
            const recordDate = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0];
            const matches = r.employeeId === employeeId && recordDate === selectedDate;
            if (matches) {
              console.log('Found existing record:', r._id, 'for date:', recordDate);
            }
            return matches;
          });
          return found;
        });
        
        if (existingRecord) {
          console.log('Updating existing record:', existingRecord._id);
          await databaseService.updateAttendanceRecord(existingRecord._id, attendanceRecord);
        } else {
          console.log('Adding new attendance record');
          await databaseService.addAttendanceRecord(attendanceRecord);
        }
        
        savedCount++;
      }
      
      showSnackbar(`Saved attendance for ${savedCount} employee(s)`, 'success');
      loadDailyAttendance();
      if (selectedEmployee) {
        loadEmployeeAttendance();
      }
      setOpenAttendanceDialog(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      showSnackbar('Failed to save attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMonthDays = (monthIndex: number): DayStatus[] => {
    const month = new Date(calendarStartMonth);
    month.setMonth(month.getMonth() + monthIndex);
    month.setDate(1);
    
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
    
    const days: DayStatus[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);
      // Create date string without timezone conversion
      const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Find attendance record for this date
      const record = attendanceRecords.find((r: any) => {
        // Normalize the record date string (handle both string and Date types)
        const recordDate = typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0];
        return recordDate === dateStr;
      });
      
      days.push({
        date,
        status: record ? (record.status as any) : 'None',
        working_hours: record?.working_hours,
        overtime_hours: record?.overtime_hours
      });
    }
    
    return days;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'success';  // Green
      case 'Leave': return 'warning';     // Orange
      case 'Absent': return 'error';      // Deep Red
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present': return <CheckCircle fontSize="small" />;
      case 'Absent': return <Cancel fontSize="small" />;
      case 'Leave': return <AccessTime fontSize="small" />;
      default: return null;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarStartMonth);
    newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    setCalendarStartMonth(newDate);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isPastDate = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(dateStr);
    return selected < today;
  };

  // Filter employees who were active on a specific date
  const getActiveEmployeesOnDate = (dateStr: string): Employee[] => {
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);

    return employees.filter(emp => {
      const hireDate = new Date(emp.hire_date);
      hireDate.setHours(0, 0, 0, 0);
      
      // Employee must have been hired on or before the selected date
      if (hireDate > selectedDate) return false;
      
      // Check if employee was still active on that date
      if (emp.employment_status === 'active') return true;
      
      // If not currently active, check termination date
      if (emp.termination_date) {
        const terminationDate = new Date(emp.termination_date);
        terminationDate.setHours(0, 0, 0, 0);
        // Employee is included if termination was after the selected date
        return terminationDate > selectedDate;
      }
      
      return false;
    });
  };

  // Calculate calendar start month based on employee hire date
  const getCalendarStartMonth = (employeeId: string): Date => {
    const employee = employees.find(e => e._id === employeeId);
    if (!employee) return getDefaultCalendarStart();
    
    const today = new Date();
    const hireDate = new Date(employee.hire_date);
    
    // Calculate 2 months ago from today (to show last 3 months including current)
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    twoMonthsAgo.setDate(1); // Start of month
    
    // If hired within last 3 months, start from hire month
    if (hireDate > twoMonthsAgo) {
      const hireDateMonth = new Date(hireDate);
      hireDateMonth.setDate(1); // Start of hire month
      return hireDateMonth;
    }
    
    // Otherwise, show last 3 months including current
    return twoMonthsAgo;
  };

  // Handle employee selection and update calendar start month
  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      const startMonth = getCalendarStartMonth(employeeId);
      setCalendarStartMonth(startMonth);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarMonth color="primary" />
        Attendance Management
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenAttendanceDialog(true)}
          color="primary"
        >
          Add Attendance
        </Button>
      </Box>

      {/* View Tabs */}
      <Card sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="fullWidth">
          <Tab label="Employee Calendar" />
          <Tab label="Daily Summary" />
        </Tabs>
      </Card>

      {/* Employee Calendar View */}
      {activeTab === 0 && (
      <Card>
        <CardContent>
          <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Employee Attendance Calendar
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => navigateMonth('prev')}>
                      <ArrowBack />
                    </IconButton>
                    <IconButton size="small" onClick={() => navigateMonth('next')}>
                      <ArrowForward />
                    </IconButton>
                  </Box>
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Select Employee</InputLabel>
                  <Select
                    value={selectedEmployee}
                    label="Select Employee"
                    onChange={(e) => handleEmployeeSelection(e.target.value)}
                  >
                    <MenuItem value="">None Selected</MenuItem>
                    {employees.filter(emp => emp.employment_status === 'active').map((emp) => (
                      <MenuItem key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employee_id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedEmployee ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" color="text.secondary">
                        {calendarStartMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - {
                          new Date(calendarStartMonth.getFullYear(), calendarStartMonth.getMonth() + 2, 0).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        }
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      {[0, 1, 2].map((monthIndex) => {
                        const monthDays = getMonthDays(monthIndex);
                        const monthDate = new Date(calendarStartMonth);
                        monthDate.setMonth(monthDate.getMonth() + monthIndex);
                        
                        return (
                          <Box key={monthIndex} sx={{ flex: 1 }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Typography variant="subtitle2" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                                {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {/* Day headers */}
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                    <Box key={i} sx={{ 
                                      flex: 1,
                                      textAlign: 'center', 
                                      fontSize: '0.7rem', 
                                      fontWeight: 600,
                                      color: 'text.secondary'
                                    }}>
                                      {day}
                                    </Box>
                                  ))}
                                </Box>
                                
                                {/* Calendar grid */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                                  {/* Empty cells for first week */}
                                  {Array.from({ length: monthDays[0].date.getDay() }).map((_, i) => (
                                    <Box key={`empty-${i}`} sx={{ height: 32 }} />
                                  ))}
                                  
                                  {/* Day cells */}
                                  {monthDays.map((day, i) => (
                                    <Tooltip 
                                      key={i}
                                      title={day.status !== 'None' ? 
                                        `${day.status} - ${day.working_hours || 0}hrs${day.overtime_hours ? `, OT: ${day.overtime_hours}hrs` : ''}` 
                                        : 'No record'
                                      }
                                    >
                                      <Box sx={{
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        bgcolor: day.status !== 'None' ? 
                                          (day.status === 'Present' ? 'success.main' :
                                           day.status === 'Leave' ? 'warning.main' :
                                           day.status === 'Absent' ? 'error.dark' : 'transparent') : 
                                          'transparent',
                                        color: day.status !== 'None' ? 'white' : 'text.primary',
                                        border: isToday(day.date) ? '2px solid #1976d2' : 'none',
                                        '&:hover': {
                                          bgcolor: day.status !== 'None' ? undefined : 'action.hover'
                                        }
                                      }}>
                                        {day.date.getDate()}
                                      </Box>
                                    </Tooltip>
                                  ))}
                                </Box>
                              </Box>
                            </Paper>
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Legend */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Chip label="Present" size="small" color="success" />
                      <Chip label="Leave" size="small" color="warning" />
                      <Chip label="Absent" size="small" color="error" />
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">
                    Select an employee to view their attendance calendar
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
      )}

      {/* Daily Summary View */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6">
                  Daily Attendance Summary
                </Typography>
                <TextField
                  type="date"
                  label="Select Date"
                  value={dailySummaryDate}
                  onChange={(e) => setDailySummaryDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ width: 200 }}
                />
                <IconButton size="small" onClick={loadDailySummary}>
                  <Refresh />
                </IconButton>
              </Box>

              <Divider />

              <Typography variant="subtitle2" color="text.secondary">
                Attendance for {new Date(dailySummaryDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>

              {loading ? (
                <Alert severity="info">Loading attendance records...</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Employee</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Check In</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Check Out</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Break (hrs)</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Working Hours</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Overtime</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getActiveEmployeesOnDate(dailySummaryDate).map((employee) => {
                        const record = dailySummaryRecords.find(r => r.employeeId === employee._id);
                        
                        return (
                          <TableRow key={employee._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" color="action" />
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>{employee.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {employee.employee_id}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {record ? (
                                <Chip 
                                  label={record.status} 
                                  size="small" 
                                  color={getStatusColor(record.status)}
                                  icon={getStatusIcon(record.status) || undefined}
                                />
                              ) : (
                                <Chip label="No Record" size="small" color="default" />
                              )}
                            </TableCell>
                            <TableCell>
                              {record?.status === 'Present' ? (
                                <Typography variant="body2">{record.check_in_time || '-'}</Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {record?.status === 'Present' ? (
                                <Typography variant="body2">{record.check_out_time || '-'}</Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {record?.status === 'Present' ? (
                                <Typography variant="body2">{record.break_time || 0}</Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {record?.status === 'Present' && record.working_hours ? (
                                <Chip 
                                  label={`${record.working_hours}h`} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {record?.status === 'Present' && record.overtime_hours > 0 ? (
                                <Chip 
                                  label={`+${record.overtime_hours}h`} 
                                  size="small" 
                                  color="success"
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {!loading && getActiveEmployeesOnDate(dailySummaryDate).length === 0 && (
                <Alert severity="info">No employees were active on this date</Alert>
              )}

              {/* Summary Statistics */}
              {!loading && dailySummaryRecords.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Present</Typography>
                      <Typography variant="h4" color="success.main">
                        {dailySummaryRecords.filter(r => r.status === 'Present').length}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">On Leave</Typography>
                      <Typography variant="h4" color="warning.main">
                        {dailySummaryRecords.filter(r => r.status === 'Leave').length}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Absent</Typography>
                      <Typography variant="h4" color="error.main">
                        {dailySummaryRecords.filter(r => r.status === 'Absent').length}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">No Record</Typography>
                      <Typography variant="h4">
                        {getActiveEmployeesOnDate(dailySummaryDate).length - dailySummaryRecords.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Daily Attendance Recording Dialog */}
      <Dialog
        open={openAttendanceDialog}
        onClose={() => setOpenAttendanceDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Daily Attendance Recording
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              type="date"
              label="Select Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            {isPastDate(selectedDate) && (
              <Alert severity="warning">
                Viewing/Editing past attendance record
              </Alert>
            )}

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">
              Active Employees - {new Date(selectedDate).toLocaleDateString()}
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Check In</TableCell>
                    <TableCell>Check Out</TableCell>
                    <TableCell>Break (hrs)</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>OT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getActiveEmployeesOnDate(selectedDate).map((employee) => {
                    const attendance = dailyAttendance.get(employee._id!) || {
                      status: 'Present' as 'Present' | 'Absent' | 'Leave',
                      check_in_time: '08:00',
                      check_out_time: '17:00',
                      break_time: 1,
                      notes: ''
                    };
                    
                    const calculation = calculateWorkingHours(
                      attendance.check_in_time,
                      attendance.check_out_time,
                      attendance.break_time
                    );

                    return (
                      <TableRow key={employee._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person fontSize="small" color="action" />
                            <Box>
                              <Typography variant="body2">{employee.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {employee.employee_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={attendance.status}
                            onChange={(e) => handleStatusChange(employee._id!, 'status', e.target.value)}
                            sx={{ minWidth: 100 }}
                          >
                            <MenuItem value="Present">Present</MenuItem>
                            <MenuItem value="Absent">Absent</MenuItem>
                            <MenuItem value="Leave">Leave</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {attendance.status === 'Present' && (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <TimePicker
                                value={attendance.check_in_time ? dayjs(`2000-01-01T${attendance.check_in_time}`) : null}
                                onChange={(newValue: Dayjs | null) => {
                                  const timeStr = newValue ? newValue.format('HH:mm') : '';
                                  handleStatusChange(employee._id!, 'check_in_time', timeStr);
                                }}
                                slotProps={{
                                  textField: {
                                    size: 'small',
                                    sx: { width: 140 }
                                  }
                                }}
                              />
                            </LocalizationProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.status === 'Present' && (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <TimePicker
                                value={attendance.check_out_time ? dayjs(`2000-01-01T${attendance.check_out_time}`) : null}
                                onChange={(newValue: Dayjs | null) => {
                                  const timeStr = newValue ? newValue.format('HH:mm') : '';
                                  handleStatusChange(employee._id!, 'check_out_time', timeStr);
                                }}
                                slotProps={{
                                  textField: {
                                    size: 'small',
                                    sx: { width: 140 }
                                  }
                                }}
                              />
                            </LocalizationProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.status === 'Present' && (
                            <TextField
                              type="number"
                              size="small"
                              value={attendance.break_time}
                              onChange={(e) => handleStatusChange(employee._id!, 'break_time', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, max: 4, step: 0.5 }}
                              sx={{ width: 80 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.status === 'Present' && attendance.check_in_time && attendance.check_out_time && (
                            <Chip 
                              label={`${calculation.working}h`} 
                              size="small"
                              color="default"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.status === 'Present' && calculation.overtime > 0 && (
                            <Chip 
                              label={`+${calculation.overtime}h`} 
                              size="small"
                              color="success"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDailyAttendance}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setOpenAttendanceDialog(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={saveDailyAttendance}
            disabled={loading}
          >
            Save Attendance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceManagement;

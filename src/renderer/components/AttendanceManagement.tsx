import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Avatar,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Cancel,
  AccessTime,
  Person,
  Search,
  Refresh,
  Timer,
  TimerOff,
} from '@mui/icons-material';
import { Attendance, AttendanceFormData } from '../types/Attendance';
import { Employee } from '../types/Employee';
import databaseService from '../services/DatabaseService';

const AttendanceManagement: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [formData, setFormData] = useState<AttendanceFormData>({
    employee_id: '',
    check_in_time: '',
    check_out_time: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    overtime_hours: 0,
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Snackbar states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Quick check-in/out states
  const [quickCheckEmployee, setQuickCheckEmployee] = useState<string>('');

  useEffect(() => {
    loadAttendanceData();
    loadEmployees();
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const result = await databaseService.getAllAttendance();
      // Convert AttendanceRecord[] to Attendance[] format
      const attendanceRecords: Attendance[] = result.map((record: any) => ({
        _id: record._id,
        attendance_id: record._id || `ATT${Date.now()}`,
        employee_id: record.employeeId,
        employee_name: employees.find(emp => emp._id === record.employeeId)?.name || 'Unknown',
        date: new Date(record.date),
        check_in_time: record.checkIn,
        check_out_time: record.checkOut,
        working_hours: record.hoursWorked || 0,
        overtime_hours: 0,
        status: record.status as any,
        notes: record.notes,
        created_date: record.createdAt || new Date(),
        last_modified: record.updatedAt || new Date()
      }));
      setAttendanceRecords(attendanceRecords);
      showSnackbar(`Loaded ${attendanceRecords.length} attendance records`, 'success');
    } catch (error) {
      console.error('Error loading attendance data:', error);
      showSnackbar('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const allEmployees = await databaseService.getAllEmployees();
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]); // Set empty array on error
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.employee_id) {
      errors.employee_id = 'Employee is required';
    }

    if (!formData.check_in_time) {
      errors.check_in_time = 'Check-in time is required';
    }

    if (formData.check_out_time && formData.check_in_time) {
      const checkIn = new Date(`${formData.date}T${formData.check_in_time}`);
      const checkOut = new Date(`${formData.date}T${formData.check_out_time}`);
      
      if (checkOut <= checkIn) {
        errors.check_out_time = 'Check-out time must be after check-in time';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    
    const checkInTime = new Date(`${formData.date}T${checkIn}`);
    const checkOutTime = new Date(`${formData.date}T${checkOut}`);
    
    const diff = checkOutTime.getTime() - checkInTime.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const employee = employees.find(emp => emp._id === formData.employee_id);
      if (!employee) {
        showSnackbar('Employee not found', 'error');
        return;
      }

      const workingHours = calculateWorkingHours(formData.check_in_time, formData.check_out_time || '');

      // Convert to the format expected by DatabaseService
      const attendanceRecord = {
        employeeId: formData.employee_id,
        date: formData.date,
        checkIn: formData.check_in_time,
        checkOut: formData.check_out_time || '',
        hoursWorked: workingHours,
        status: formData.status,
        notes: formData.notes || ''
      };

      if (editingAttendance) {
        await databaseService.updateAttendanceRecord(editingAttendance._id!, attendanceRecord);
        showSnackbar('Attendance record updated successfully', 'success');
      } else {
        await databaseService.addAttendanceRecord(attendanceRecord);
        showSnackbar('Attendance record created successfully', 'success');
      }

      handleCloseDialog();
      loadAttendanceData();
    } catch (error) {
      console.error('Error saving attendance:', error);
      showSnackbar('Failed to save attendance record', 'error');
    }
  };

  const handleQuickCheckIn = async () => {
    if (!quickCheckEmployee) {
      showSnackbar('Please select an employee', 'error');
      return;
    }

    try {
      const employee = employees.find(emp => emp._id === quickCheckEmployee);
      if (!employee) {
        showSnackbar('Employee not found', 'error');
        return;
      }

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const today = now.toISOString().split('T')[0];

      const attendanceRecord = {
        employeeId: quickCheckEmployee,
        date: today,
        checkIn: currentTime,
        checkOut: '',
        hoursWorked: 0,
        status: 'Present',
        notes: ''
      };

      await databaseService.addAttendanceRecord(attendanceRecord);
      showSnackbar(`${employee.name} checked in successfully at ${currentTime}`, 'success');
      setQuickCheckEmployee('');
      loadAttendanceData();
    } catch (error) {
      console.error('Error during quick check-in:', error);
      showSnackbar('Failed to check in employee', 'error');
    }
  };

  const handleQuickCheckOut = async (attendanceId: string) => {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      const attendance = attendanceRecords.find(record => record._id === attendanceId);
      if (!attendance || !attendance.check_in_time) {
        showSnackbar('Invalid attendance record', 'error');
        return;
      }

      const workingHours = calculateWorkingHours(attendance.check_in_time, currentTime);

      const updateData = {
        checkOut: currentTime,
        hoursWorked: workingHours
      };

      await databaseService.updateAttendanceRecord(attendanceId, updateData);
      showSnackbar(`Employee checked out successfully at ${currentTime}`, 'success');
      loadAttendanceData();
    } catch (error) {
      console.error('Error during quick check-out:', error);
      showSnackbar('Failed to check out employee', 'error');
    }
  };

  const handleEdit = (attendance: Attendance) => {
    setEditingAttendance(attendance);
    setFormData({
      employee_id: attendance.employee_id,
      check_in_time: attendance.check_in_time,
      check_out_time: attendance.check_out_time || '',
      date: new Date(attendance.date).toISOString().split('T')[0],
      status: attendance.status,
      overtime_hours: attendance.overtime_hours || 0,
      notes: attendance.notes || ''
    });
    setOpenDialog(true);
  };

  const handleDelete = async (attendanceId: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;

    try {
      await databaseService.deleteAttendanceRecord(attendanceId);
      showSnackbar('Attendance record deleted successfully', 'success');
      loadAttendanceData();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      showSnackbar('Failed to delete attendance record', 'error');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAttendance(null);
    setFormData({
      employee_id: '',
      check_in_time: '',
      check_out_time: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Present',
      overtime_hours: 0,
      notes: ''
    });
    setFormErrors({});
  };

  const handleFormChange = (field: keyof AttendanceFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'error';
      case 'Late': return 'warning';
      case 'Half Day': return 'info';
      default: return 'default';
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.attendance_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalRecords = filteredRecords.length;
  const presentCount = filteredRecords.filter(r => r.status === 'Present').length;
  const absentCount = filteredRecords.filter(r => r.status === 'Absent').length;
  const averageWorkingHours = totalRecords > 0 
    ? (filteredRecords.reduce((sum, r) => sum + (r.working_hours || 0), 0) / totalRecords).toFixed(2)
    : '0';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        fontWeight: 'bold',
        mb: 3
      }}>
        ⏰ Attendance Management
      </Typography>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ 
              mx: 'auto', 
              mb: 1, 
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' 
            }}>
              <Person />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{totalRecords}</Typography>
            <Typography variant="body2" color="text.secondary">Total Records</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'success.main' }}>
              <CheckCircle />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{presentCount}</Typography>
            <Typography variant="body2" color="text.secondary">Present</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'error.main' }}>
              <Cancel />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{absentCount}</Typography>
            <Typography variant="body2" color="text.secondary">Absent</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'info.main' }}>
              <AccessTime />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{averageWorkingHours}h</Typography>
            <Typography variant="body2" color="text.secondary">Avg. Working Hours</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Attendance Records" />
          <Tab label="Quick Check-In/Out" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <>
          {/* Filters and Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.disabled' }} />
                }}
                sx={{ minWidth: 250 }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                  <MenuItem value="Half Day">Half Day</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'
                  }
                }}
              >
                Add Record
              </Button>
              <Tooltip title="Refresh">
                <IconButton onClick={loadAttendanceData}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          {/* Attendance Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Check In</TableCell>
                    <TableCell>Check Out</TableCell>
                    <TableCell>Working Hours</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        Loading attendance records...
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {record.employee_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {record.employee_id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.check_in_time || 'N/A'}</TableCell>
                        <TableCell>
                          {record.check_out_time ? (
                            record.check_out_time
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<TimerOff />}
                              onClick={() => handleQuickCheckOut(record._id!)}
                            >
                              Check Out
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{record.working_hours?.toFixed(2) || '0.00'} hrs</TableCell>
                        <TableCell>
                          <Chip 
                            label={record.status} 
                            color={getStatusColor(record.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" onClick={() => handleEdit(record)}>
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={() => handleDelete(record._id!)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Quick Check-In/Out</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Select Employee</InputLabel>
              <Select
                value={quickCheckEmployee}
                onChange={(e) => setQuickCheckEmployee(e.target.value)}
                label="Select Employee"
              >
                {employees.map((employee) => (
                  <MenuItem key={employee._id} value={employee._id}>
                    {employee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="large"
              startIcon={<Timer />}
              onClick={handleQuickCheckIn}
              sx={{
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'
                }
              }}
            >
              Quick Check-In
            </Button>
          </Box>

          {/* Today's Check-ins */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Today's Check-ins</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {attendanceRecords
                .filter(record => {
                  const today = new Date();
                  const recordDate = new Date(record.date);
                  return recordDate.toDateString() === today.toDateString();
                })
                .map((record) => (
                  <Card key={record._id}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {record.employee_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Check-in: {record.check_in_time}
                      </Typography>
                      {record.check_out_time ? (
                        <Typography variant="body2" color="text.secondary">
                          Check-out: {record.check_out_time}
                        </Typography>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<TimerOff />}
                          onClick={() => handleQuickCheckOut(record._id!)}
                          sx={{ mt: 1 }}
                        >
                          Check Out
                        </Button>
                      )}
                      <Chip 
                        label={record.status} 
                        color={getStatusColor(record.status) as any}
                        size="small"
                        sx={{ mt: 1, display: 'block', width: 'fit-content' }}
                      />
                    </CardContent>
                  </Card>
                ))}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAttendance ? 'Edit Attendance Record' : 'Add New Attendance Record'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mt: 1 }}>
            <FormControl fullWidth error={!!formErrors.employee_id}>
              <InputLabel>Employee</InputLabel>
              <Select
                value={formData.employee_id}
                onChange={handleFormChange('employee_id')}
                label="Employee"
              >
                {employees.map((employee) => (
                  <MenuItem key={employee._id} value={employee._id}>
                    {employee.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.employee_id && (
                <Typography variant="caption" color="error">{formErrors.employee_id}</Typography>
              )}
            </FormControl>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={formData.date}
              onChange={handleFormChange('date')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="time"
              label="Check-in Time"
              value={formData.check_in_time}
              onChange={handleFormChange('check_in_time')}
              error={!!formErrors.check_in_time}
              helperText={formErrors.check_in_time}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="time"
              label="Check-out Time"
              value={formData.check_out_time}
              onChange={handleFormChange('check_out_time')}
              error={!!formErrors.check_out_time}
              helperText={formErrors.check_out_time}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleFormChange('status')}
                label="Status"
              >
                <MenuItem value="Present">Present</MenuItem>
                <MenuItem value="Absent">Absent</MenuItem>
                <MenuItem value="Late">Late</MenuItem>
                <MenuItem value="Half Day">Half Day</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Overtime Hours"
              value={formData.overtime_hours}
              onChange={handleFormChange('overtime_hours')}
              inputProps={{ min: 0, step: 0.5 }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={formData.notes}
              onChange={handleFormChange('notes')}
              placeholder="Any additional notes or comments..."
              sx={{ gridColumn: 'span 2' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'
              }
            }}
          >
            {editingAttendance ? 'Update' : 'Create'}
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

export default AttendanceManagement;
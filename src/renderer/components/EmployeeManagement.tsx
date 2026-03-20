import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  Fab,
  Card,
  CardContent,
  Tooltip,
  TablePagination,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  PersonOff as PersonOffIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { Employee } from '../types/Employee';
import databaseService from '../services/DatabaseService';
import { validateEmployee } from '../utils/validation';
import SalaryChangeDialog from './SalaryChangeDialog';
import EmploymentStatusDialog from './EmploymentStatusDialog';
import SalaryHistoryDialog from './SalaryHistoryDialog';
import EmploymentHistoryDialog from './EmploymentHistoryDialog';

interface EmployeeManagementProps {
  // Props can be added here if needed
}

// Helper function to extract MongoDB ObjectId as hex string
const extractObjectId = (id: any): string => {
  if (!id) throw new Error('ID is required');
  
  if (typeof id === 'string') {
    return id;
  } else if (id.$oid) {
    // MongoDB Extended JSON format { $oid: "..." }
    return id.$oid;
  } else if (id.buffer) {
    // BSON ObjectId with buffer property (Uint8Array of 12 bytes)
    const buffer = id.buffer;
    const bytes = Object.values(buffer) as number[];
    return bytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
  } else if (id.toHexString) {
    // BSON ObjectId with toHexString method
    return id.toHexString();
  } else {
    throw new Error('Invalid ID format');
  }
};

const EmployeeManagement: React.FC<EmployeeManagementProps> = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // New dialog states
  const [salaryChangeDialog, setSalaryChangeDialog] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });
  const [statusChangeDialog, setStatusChangeDialog] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });
  const [salaryHistoryDialog, setSalaryHistoryDialog] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });
  const [employmentHistoryDialog, setEmploymentHistoryDialog] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });

  const dbService = databaseService;

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const employeeList = await dbService.getEmployees();
      setEmployees(employeeList);
      showSnackbar(`Loaded ${employeeList.length} employees successfully`, 'success');
    } catch (error) {
      console.error('Error loading employees:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load employees';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateForm = (): boolean => {
    const errors = validateEmployee(formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEmployee = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const employeeData: Employee = {
        ...formData,
        hire_date: formData.hire_date || new Date(),
        daily_wage: formData.daily_wage || 0,
        employment_status: formData.employment_status || 'active',
        created_at: new Date(),
        updated_at: new Date()
      } as Employee;

      if (editingEmployee) {
        // Update existing employee
        try {
          const employeeId = extractObjectId(editingEmployee._id);
          await dbService.updateEmployee(employeeId, employeeData);
          showSnackbar('Employee updated successfully', 'success');
          handleCloseDialog();
          loadEmployees();
        } catch (error) {
          showSnackbar(error instanceof Error ? error.message : 'Failed to update employee', 'error');
        }
      } else {
        // Add new employee
        try {
          await dbService.addEmployee(employeeData);
          showSnackbar('Employee added successfully', 'success');
          handleCloseDialog();
          loadEmployees();
        } catch (error) {
          showSnackbar(error instanceof Error ? error.message : 'Failed to add employee', 'error');
        }
      }
    } catch (error) {
      showSnackbar('An error occurred while saving employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteEmployee?._id) return;

    setLoading(true);
    try {
      const employeeId = extractObjectId(deleteEmployee._id);
      console.log('Deleting employee with ID:', employeeId);
      
      await dbService.deleteEmployee(employeeId);
      showSnackbar('Employee deleted successfully', 'success');
      setDeleteEmployee(null);
      loadEmployees();
    } catch (error) {
      console.error('Delete error:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to delete employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setFormData({
      employee_id: '',
      name: '',
      position: '',
      phone: '',
      daily_wage: 0,
      employment_status: 'active'
    });
    setFormErrors({});
    setEditingEmployee(null);
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (employee: Employee) => {
    setFormData({ ...employee });
    setFormErrors({});
    setEditingEmployee(employee);
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingEmployee(null);
    setFormData({});
    setFormErrors({});
  };

  const handleFormChange = (field: keyof Employee) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchTerm || 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPosition = !positionFilter || employee.position === positionFilter;
    const matchesStatus = statusFilter === 'all' || employee.employment_status === statusFilter;
    
    return matchesSearch && matchesPosition && matchesStatus;
  });

  // Get unique positions for filters
  const positions = Array.from(new Set(employees.map(emp => emp.position).filter(Boolean)));

  const paginatedEmployees = filteredEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Employee Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage employee records, track information, and maintain organizational structure.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Employees
            </Typography>
            <Typography variant="h4" color="primary">
              {employees.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Employees
            </Typography>
            <Typography variant="h4" color="success.main">
              {employees.filter(emp => emp.employment_status === 'active').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Salary
            </Typography>
            <Typography variant="h4" color="info.main">
              ₹{employees.length > 0 ? Math.round(employees.reduce((sum, emp) => sum + (emp.daily_wage || 0), 0) / employees.length).toLocaleString() : 0}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Position</InputLabel>
            <Select
              value={positionFilter}
              label="Position"
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <MenuItem value="">All Positions</MenuItem>
              {positions.map(pos => (
                <MenuItem key={pos} value={pos}>{pos}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Employment Status</InputLabel>
            <Select
              value={statusFilter}
              label="Employment Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="resigned">Resigned</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
              <MenuItem value="retired">Retired</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadEmployees} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import">
              <IconButton>
                <UploadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
      </Paper>

      {/* Employee Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Current Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((employee, index) => {
                const employeeData = employee as any; // Type assertion for flexibility
                // Handle ObjectId properly - convert to string
                const employeeKey = employeeData._id ? 
                  (typeof employeeData._id === 'object' ? JSON.stringify(employeeData._id) : employeeData._id.toString()) 
                  : (employeeData.employee_id || `employee-${index}`);
                
                return (
                <TableRow key={employeeKey} hover>
                  <TableCell>{employeeData.employee_id || 'N/A'}</TableCell>
                  <TableCell>{employeeData.name || 'N/A'}</TableCell>
                  <TableCell>{employeeData.position || 'N/A'}</TableCell>
                  <TableCell>{employeeData.phone || 'N/A'}</TableCell>
                  <TableCell>₹{(employeeData.daily_wage || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={(employeeData.employment_status || 'active').toUpperCase()}
                      color={
                        employeeData.employment_status === 'active' ? 'success' : 
                        employeeData.employment_status === 'resigned' ? 'warning' :
                        employeeData.employment_status === 'terminated' ? 'error' :
                        employeeData.employment_status === 'retired' ? 'info' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(employee)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Salary Change">
                        <IconButton
                          size="small"
                          onClick={() => setSalaryChangeDialog({ open: true, employee })}
                          color="primary"
                        >
                          <TrendingUpIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Change Status">
                        <IconButton
                          size="small"
                          onClick={() => setStatusChangeDialog({ open: true, employee })}
                          color="warning"
                        >
                          <PersonOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Salary History">
                        <IconButton
                          size="small"
                          onClick={() => setSalaryHistoryDialog({ open: true, employee })}
                          color="info"
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Employment History">
                        <IconButton
                          size="small"
                          onClick={() => setEmploymentHistoryDialog({ open: true, employee })}
                          color="secondary"
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteEmployee(employee)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={filteredEmployees.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Add/Edit Employee Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <TextField
                label="Employee ID"
                value={formData.employee_id || ''}
                onChange={handleFormChange('employee_id')}
                error={!!formErrors.employee_id}
                helperText={formErrors.employee_id}
                required
              />
              <TextField
                label="Full Name"
                value={formData.name || ''}
                onChange={handleFormChange('name')}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <TextField
                label="Position"
                value={formData.position || ''}
                onChange={handleFormChange('position')}
                error={!!formErrors.position}
                helperText={formErrors.position}
                required
              />
              <TextField
                label="Phone"
                value={formData.phone || ''}
                onChange={handleFormChange('phone')}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                required
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              {!editingEmployee && (
                <TextField
                  label="Daily Wage"
                  type="number"
                  value={formData.daily_wage || ''}
                  onChange={handleFormChange('daily_wage')}
                  error={!!formErrors.daily_wage}
                  helperText={editingEmployee ? 'Use Salary Change action to modify wage' : formErrors.daily_wage}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              )}
              <TextField
                label="Hire Date"
                type="date"
                value={formData.hire_date ? new Date(formData.hire_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hire_date: new Date(e.target.value) }))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
            
            {editingEmployee && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> To change salary, use the "Salary Change" action button in the employee table.
                </Typography>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveEmployee}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : (editingEmployee ? 'Update' : 'Add')} Employee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteEmployee}
        onClose={() => setDeleteEmployee(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete employee "{deleteEmployee?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteEmployee(null)}>Cancel</Button>
          <Button
            onClick={handleDeleteEmployee}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Employee FAB */}
      <Fab
        color="primary"
        aria-label="add employee"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleOpenAddDialog}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Salary Change Dialog */}
      <SalaryChangeDialog
        open={salaryChangeDialog.open}
        employee={salaryChangeDialog.employee}
        onClose={() => setSalaryChangeDialog({ open: false, employee: null })}
        onSuccess={() => {
          loadEmployees();
          setSalaryChangeDialog({ open: false, employee: null });
          showSnackbar('Salary updated successfully', 'success');
        }}
      />

      {/* Employment Status Change Dialog */}
      <EmploymentStatusDialog
        open={statusChangeDialog.open}
        employee={statusChangeDialog.employee}
        onClose={() => setStatusChangeDialog({ open: false, employee: null })}
        onSuccess={() => {
          loadEmployees();
          setStatusChangeDialog({ open: false, employee: null });
          showSnackbar('Employment status updated successfully', 'success');
        }}
      />

      {/* Salary History Dialog */}
      <SalaryHistoryDialog
        open={salaryHistoryDialog.open}
        employee={salaryHistoryDialog.employee}
        onClose={() => setSalaryHistoryDialog({ open: false, employee: null })}
      />

      {/* Employment History Dialog */}
      <EmploymentHistoryDialog
        open={employmentHistoryDialog.open}
        employee={employmentHistoryDialog.employee}
        onClose={() => setEmploymentHistoryDialog({ open: false, employee: null })}
      />
    </Box>
  );
};

export default EmployeeManagement;
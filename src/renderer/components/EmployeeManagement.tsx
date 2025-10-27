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
  Person as PersonIcon
} from '@mui/icons-material';
import { Employee } from '../types/Employee';
import databaseService from '../services/DatabaseService';

interface EmployeeManagementProps {
  // Props can be added here if needed
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const dbService = databaseService;

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      console.log('Loading employees...');
      const employeeList = await dbService.getEmployees();
      console.log('Loaded employees:', employeeList);
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
    const errors: Record<string, string> = {};
    
    if (!formData.emp_id?.trim()) {
      errors.emp_id = 'Employee ID is required';
    }
    
    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.department?.trim()) {
      errors.department = 'Department is required';
    }
    
    if (!formData.position?.trim()) {
      errors.position = 'Position is required';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.phone?.trim()) {
      errors.phone = 'Phone is required';
    }
    
    if (formData.salary !== undefined && formData.salary <= 0) {
      errors.salary = 'Salary must be greater than 0';
    }

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
        salary: formData.salary || 0,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        created_date: new Date(),
        last_modified: new Date()
      } as Employee;

      if (editingEmployee) {
        // Update existing employee
        try {
          await dbService.updateEmployee(editingEmployee._id!, employeeData);
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
      await dbService.deleteEmployee(deleteEmployee._id);
      showSnackbar('Employee deleted successfully', 'success');
      setDeleteEmployee(null);
      loadEmployees();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : 'Failed to delete employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setFormData({
      emp_id: '',
      name: '',
      department: '',
      position: '',
      email: '',
      phone: '',
      salary: 0,
      is_active: true
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
      employee.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
    const matchesPosition = !positionFilter || employee.position === positionFilter;
    
    return matchesSearch && matchesDepartment && matchesPosition;
  });

  // Get unique departments and positions for filters
  const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean)));
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
              {employees.filter(emp => emp.is_active).length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Departments
            </Typography>
            <Typography variant="h4" color="warning.main">
              {departments.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Salary
            </Typography>
            <Typography variant="h4" color="info.main">
              ₹{employees.length > 0 ? Math.round(employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / employees.length) : 0}
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
            }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentFilter}
              label="Department"
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
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
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((employee) => (
                <TableRow key={employee._id || employee.emp_id} hover>
                  <TableCell>{employee.emp_id || 'N/A'}</TableCell>
                  <TableCell>{employee.name || 'N/A'}</TableCell>
                  <TableCell>{employee.department || 'N/A'}</TableCell>
                  <TableCell>{employee.position || 'N/A'}</TableCell>
                  <TableCell>{employee.email || 'N/A'}</TableCell>
                  <TableCell>{employee.phone || 'N/A'}</TableCell>
                  <TableCell>₹{(employee.salary || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.is_active ? 'Active' : 'Inactive'}
                      color={employee.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(employee)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteEmployee(employee)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
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
                value={formData.emp_id || ''}
                onChange={handleFormChange('emp_id')}
                error={!!formErrors.emp_id}
                helperText={formErrors.emp_id}
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
                label="Department"
                value={formData.department || ''}
                onChange={handleFormChange('department')}
                error={!!formErrors.department}
                helperText={formErrors.department}
                required
              />
              <TextField
                label="Position"
                value={formData.position || ''}
                onChange={handleFormChange('position')}
                error={!!formErrors.position}
                helperText={formErrors.position}
                required
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={handleFormChange('email')}
                error={!!formErrors.email}
                helperText={formErrors.email}
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
              <TextField
                label="Salary"
                type="number"
                value={formData.salary || ''}
                onChange={handleFormChange('salary')}
                error={!!formErrors.salary}
                helperText={formErrors.salary}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
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
    </Box>
  );
};

export default EmployeeManagement;
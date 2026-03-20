import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney
} from '@mui/icons-material';
import { Employee } from '../types/Employee';
import { SalaryHistoryFormData, SALARY_CHANGE_REASONS } from '../types/SalaryHistory';
import { validateSalaryChange } from '../utils/validation';
import databaseService from '../services/DatabaseService';

interface SalaryChangeDialogProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SalaryChangeDialog: React.FC<SalaryChangeDialogProps> = ({
  open,
  employee,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SalaryHistoryFormData>({
    employee_id: '',
    new_salary: 0,
    effective_date: new Date().toISOString().split('T')[0],
    reason: '',
    approved_by: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (employee && open) {
      setFormData({
        employee_id: employee._id || '',
        new_salary: 0,
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
        approved_by: '',
        notes: ''
      });
      setFormErrors({});
      setSuccess(false);
    }
  }, [employee, open]);

  const currentSalary = employee?.daily_wage || 0;
  const changeAmount = formData.new_salary - currentSalary;
  const changePercentage = currentSalary > 0 ? ((changeAmount / currentSalary) * 100) : 0;
  const isIncrease = changeAmount > 0;
  const isDecrease = changeAmount < 0;

  const validateForm = (): boolean => {
    const errors = validateSalaryChange(formData, currentSalary);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (field: keyof SalaryHistoryFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm() || !employee) return;

    setLoading(true);
    try {
      await databaseService.changeSalary(
        employee._id || '',
        Number(formData.new_salary),
        new Date(formData.effective_date),
        formData.reason,
        formData.approved_by,
        formData.notes
      );

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error changing salary:', error);
      setFormErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to change salary' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!employee) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoney color="primary" />
          Change Salary - {employee.name}
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Salary changed successfully!
          </Alert>
        ) : (
          <>
            {formErrors.submit && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formErrors.submit}
              </Alert>
            )}

            {/* Current Salary Display */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current Salary
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    ₹{currentSalary.toLocaleString()}
                  </Typography>
                </Box>

                {formData.new_salary > 0 && formData.new_salary !== currentSalary && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Change
                    </Typography>
                    <Chip
                      icon={isIncrease ? <TrendingUp /> : <TrendingDown />}
                      label={`${isIncrease ? '+' : ''}₹${Math.abs(changeAmount).toLocaleString()} (${isIncrease ? '+' : ''}${changePercentage.toFixed(2)}%)`}
                      color={isIncrease ? 'success' : 'error'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                )}
              </Box>

              {formData.new_salary > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      New Salary
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: isIncrease ? 'success.main' : 'error.main' }}>
                      ₹{formData.new_salary.toLocaleString()}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* New Salary Input */}
              <TextField
                fullWidth
                type="number"
                label="New Salary"
                value={formData.new_salary || ''}
                onChange={handleFormChange('new_salary')}
                error={!!formErrors.new_salary}
                helperText={formErrors.new_salary || 'Enter the new salary amount'}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 1000 }
                }}
              />

              {/* Effective Date */}
              <TextField
                fullWidth
                type="date"
                label="Effective Date"
                value={formData.effective_date}
                onChange={handleFormChange('effective_date')}
                error={!!formErrors.effective_date}
                helperText={formErrors.effective_date || 'When this change becomes effective'}
                required
                InputLabelProps={{ shrink: true }}
              />

              {/* Reason Dropdown */}
              <FormControl fullWidth error={!!formErrors.reason} required>
                <InputLabel>Reason</InputLabel>
                <Select
                  value={formData.reason}
                  onChange={handleFormChange('reason')}
                  label="Reason"
                >
                  {SALARY_CHANGE_REASONS.map((reason) => (
                    <MenuItem key={reason} value={reason}>
                      {reason}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.reason && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {formErrors.reason}
                  </Typography>
                )}
              </FormControl>

              {/* Approved By */}
              <TextField
                fullWidth
                label="Approved By"
                value={formData.approved_by}
                onChange={handleFormChange('approved_by')}
                error={!!formErrors.approved_by}
                helperText={formErrors.approved_by || 'Name of approver (Manager/HR)'}
                required
                placeholder="e.g., John Doe (HR Manager)"
              />

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={handleFormChange('notes')}
                error={!!formErrors.notes}
                helperText={formErrors.notes || 'Additional details or justification (optional)'}
                placeholder="Enter any additional information..."
              />

              {/* Warning for salary decrease */}
              {isDecrease && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    You are decreasing the salary. Please provide a detailed explanation in the notes field.
                  </Typography>
                </Alert>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || success || formData.new_salary === currentSalary}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'
            }
          }}
        >
          {loading ? 'Saving...' : 'Change Salary'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalaryChangeDialog;

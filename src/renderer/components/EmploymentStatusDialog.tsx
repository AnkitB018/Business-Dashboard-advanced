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
  FormControlLabel,
  Checkbox,
  Chip
} from '@mui/material';
import {
  PersonOff,
  Warning
} from '@mui/icons-material';
import { Employee } from '../types/Employee';
import { EmploymentHistoryFormData, EMPLOYMENT_STATUSES, TERMINATION_REASONS } from '../types/EmploymentHistory';
import { validateEmploymentStatusChange } from '../utils/validation';
import databaseService from '../services/DatabaseService';

interface EmploymentStatusDialogProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EmploymentStatusDialog: React.FC<EmploymentStatusDialogProps> = ({
  open,
  employee,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmploymentHistoryFormData>({
    employee_id: '',
    event_type: 'resigned',
    new_status: 'resigned',
    event_date: new Date().toISOString().split('T')[0],
    reason: '',
    last_working_day: new Date().toISOString().split('T')[0],
    notes: '',
    processed_by: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (employee && open) {
      setFormData({
        employee_id: employee._id || '',
        event_type: 'resigned',
        new_status: 'resigned',
        event_date: new Date().toISOString().split('T')[0],
        reason: '',
        last_working_day: new Date().toISOString().split('T')[0],
        notes: '',
        processed_by: ''
      });
      setFormErrors({});
      setSuccess(false);
    }
  }, [employee, open]);

  const currentStatus = employee?.employment_status || 'inactive';

  const validateForm = (): boolean => {
    const errors = validateEmploymentStatusChange(formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (field: keyof EmploymentHistoryFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStatusChange = (event: { target: { value: unknown } }) => {
    const newStatus = event.target.value as string;
    setFormData(prev => ({
      ...prev,
      new_status: newStatus,
      event_type: newStatus as any
    }));
    if (formErrors.new_status) {
      setFormErrors(prev => ({ ...prev, new_status: '' }));
    }
  };

  const handleCheckboxChange = (field: keyof EmploymentHistoryFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.checked }));
  };

  const handleSubmit = async () => {
    if (!validateForm() || !employee) return;

    setLoading(true);
    try {
      await databaseService.changeEmploymentStatus(
        employee._id || '',
        formData.new_status as any,
        new Date(formData.event_date),
        formData.reason,
        formData.processed_by,
        formData.last_working_day ? new Date(formData.last_working_day) : undefined,
        formData.notes
      );

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error changing employment status:', error);
      setFormErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to change status' 
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

  const showLastWorkingDay = ['resigned', 'terminated'].includes(formData.new_status);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonOff color="error" />
          Change Employment Status - {employee.name}
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Employment status changed successfully!
          </Alert>
        ) : (
          <>
            {formErrors.submit && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formErrors.submit}
              </Alert>
            )}

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Warning:</strong> Changing employment status will update the employee's record. 
                This action should only be performed by authorized HR personnel.
              </Typography>
            </Alert>

            {/* Current Status Display */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Current Status
              </Typography>
              <Chip
                label={currentStatus.toUpperCase()}
                color={currentStatus === 'active' ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* New Status */}
              <FormControl fullWidth error={!!formErrors.new_status} required>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={formData.new_status}
                  onChange={handleStatusChange}
                  label="New Status"
                >
                  <MenuItem value="resigned">Resigned</MenuItem>
                  <MenuItem value="terminated">Terminated</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
                {formErrors.new_status && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {formErrors.new_status}
                  </Typography>
                )}
              </FormControl>

              {/* Event Date */}
              <TextField
                fullWidth
                type="date"
                label="Event Date"
                value={formData.event_date}
                onChange={handleFormChange('event_date')}
                error={!!formErrors.event_date}
                helperText={formErrors.event_date || 'When the decision was made'}
                required
                InputLabelProps={{ shrink: true }}
              />

              {/* Last Working Day */}
              {showLastWorkingDay && (
                <TextField
                  fullWidth
                  type="date"
                  label="Last Working Day"
                  value={formData.last_working_day}
                  onChange={handleFormChange('last_working_day')}
                  error={!!formErrors.last_working_day}
                  helperText={formErrors.last_working_day || 'Employee\'s final day at work'}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              )}

              {/* Reason */}
              <FormControl fullWidth error={!!formErrors.reason} required>
                <InputLabel>Reason</InputLabel>
                <Select
                  value={formData.reason}
                  onChange={handleFormChange('reason')}
                  label="Reason"
                >
                  {TERMINATION_REASONS.map((reason) => (
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

              {/* Processed By */}
              <TextField
                fullWidth
                label="Processed By"
                value={formData.processed_by}
                onChange={handleFormChange('processed_by')}
                error={!!formErrors.processed_by}
                helperText={formErrors.processed_by || 'Name of HR/Manager processing this change'}
                required
                placeholder="e.g., Jane Smith (HR Manager)"
              />

              {/* Additional Notes */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes"
                value={formData.notes}
                onChange={handleFormChange('notes')}
                error={!!formErrors.notes}
                helperText={formErrors.notes || 'Any additional information'}
                placeholder="Enter any additional details..."
              />
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
          color="error"
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={20} /> : <Warning />}
        >
          {loading ? 'Processing...' : 'Change Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmploymentStatusDialog;

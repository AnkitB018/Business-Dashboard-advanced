import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack
} from '@mui/material';
import {
  History,
  PersonAdd,
  ExitToApp,
  Block,
  BeachAccess,
  Close,
  CheckCircle,
  FiberManualRecord
} from '@mui/icons-material';
import { Employee } from '../types/Employee';
import { EmploymentHistory, TERMINATION_REASONS } from '../types/EmploymentHistory';
import databaseService from '../services/DatabaseService';

interface EmploymentHistoryDialogProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
}

const EmploymentHistoryDialog: React.FC<EmploymentHistoryDialogProps> = ({
  open,
  employee,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<EmploymentHistory[]>([]);
  const [error, setError] = useState<string>('');
  const [filterEventType, setFilterEventType] = useState<string>('all');

  useEffect(() => {
    if (employee && open) {
      loadEmploymentHistory();
    }
  }, [employee, open]);

  const loadEmploymentHistory = async () => {
    if (!employee?._id) return;

    setLoading(true);
    setError('');
    try {
      const data = await databaseService.getEmploymentHistory(employee._id);
      setHistory(data);
    } catch (err) {
      console.error('Error loading employment history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load employment history');
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  // Filter history by event type
  const filteredHistory = filterEventType === 'all'
    ? history
    : history.filter(h => h.event_type === filterEventType);

  // Get icon and color for event type
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'hired':
        return <PersonAdd />;
      case 'resigned':
        return <ExitToApp />;
      case 'terminated':
        return <Block />;
      case 'retired':
        return <BeachAccess />;
      default:
        return <CheckCircle />;
    }
  };

  const getEventColor = (eventType: string): 'primary' | 'success' | 'error' | 'warning' | 'info' => {
    switch (eventType) {
      case 'hired':
        return 'success';
      case 'resigned':
        return 'warning';
      case 'terminated':
        return 'error';
      case 'retired':
        return 'info';
      default:
        return 'primary';
    }
  };

  // Calculate statistics
  const totalEvents = history.length;
  const firstEvent = history.length > 0 ? history[history.length - 1] : null;
  const lastEvent = history.length > 0 ? history[0] : null;
  const tenure = firstEvent && employee.hire_date
    ? Math.floor((Date.now() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History color="primary" />
            <Box>
              <Typography variant="h6">Employment History</Typography>
              <Typography variant="body2" color="text.secondary">
                {employee.name} ({employee.employee_id})
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={onClose}
            startIcon={<Close />}
            variant="outlined"
            size="small"
          >
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {/* Summary Statistics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Status
                </Typography>
                <Chip
                  label={employee.employment_status.toUpperCase()}
                  color={getEventColor(employee.employment_status)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Events
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {totalEvents}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tenure (Years)
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {tenure}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Joined On
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}
                </Typography>
              </Paper>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Filter */}
            <Box sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Event</InputLabel>
                <Select
                  value={filterEventType}
                  onChange={(e) => setFilterEventType(e.target.value)}
                  label="Filter by Event"
                >
                  <MenuItem value="all">All Events</MenuItem>
                  <MenuItem value="hired">Hired</MenuItem>
                  <MenuItem value="resigned">Resigned</MenuItem>
                  <MenuItem value="terminated">Terminated</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Event Cards */}
            {filteredHistory.length === 0 ? (
              <Alert severity="info">
                No employment history events found for this employee.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {filteredHistory.map((record, index) => {
                  return (
                    <Paper key={record._id || index} elevation={3} sx={{ p: 2, borderLeft: 4, borderColor: `${getEventColor(record.event_type)}.main` }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {/* Icon */}
                        <Box sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: `${getEventColor(record.event_type)}.main`,
                          color: 'white',
                          flexShrink: 0
                        }}>
                          {getEventIcon(record.event_type)}
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h6" component="span">
                              {record.event_type.charAt(0).toUpperCase() + record.event_type.slice(1)}
                            </Typography>
                            <Chip
                              label={record.new_status.toUpperCase()}
                              color={getEventColor(record.new_status)}
                              size="small"
                            />
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Date:</strong> {new Date(record.event_date).toLocaleDateString()}
                          </Typography>

                          {record.previous_status && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Status Change:</strong> {record.previous_status} → {record.new_status}
                            </Typography>
                          )}

                          {record.reason && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Reason:
                              </Typography>
                              <Typography variant="body2">
                                {record.reason}
                              </Typography>
                            </Box>
                          )}

                          {record.last_working_day && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Last Working Day:</strong> {new Date(record.last_working_day).toLocaleDateString()}
                            </Typography>
                          )}

                          {record.notes && (
                            <Box sx={{ mb: 1, p: 1, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Notes:
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {record.notes}
                              </Typography>
                            </Box>
                          )}

                          {record.processed_by && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Processed by: {record.processed_by}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}

            {/* Current Status Info */}
            {employee.employment_status !== 'active' && (
              <Paper sx={{ p: 2, mt: 3, backgroundColor: '#fff3e0', borderLeft: 4, borderColor: 'warning.main' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Employment Status Information
                </Typography>
                {employee.termination_date && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Termination Date:</strong> {new Date(employee.termination_date).toLocaleDateString()}
                  </Typography>
                )}
                {employee.termination_reason && (
                  <Typography variant="body2">
                    <strong>Termination Reason:</strong> {employee.termination_reason}
                  </Typography>
                )}
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmploymentHistoryDialog;

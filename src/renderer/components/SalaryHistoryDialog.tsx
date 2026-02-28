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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import {
  History,
  TrendingUp,
  TrendingDown,
  Close
} from '@mui/icons-material';
import { Employee } from '../types/Employee';
import { SalaryHistory } from '../types/SalaryHistory';
import databaseService from '../services/DatabaseService';

interface SalaryHistoryDialogProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
}

const SalaryHistoryDialog: React.FC<SalaryHistoryDialogProps> = ({
  open,
  employee,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SalaryHistory[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (employee && open) {
      loadSalaryHistory();
    }
  }, [employee, open]);

  const loadSalaryHistory = async () => {
    if (!employee?._id) return;

    setLoading(true);
    setError('');
    try {
      const data = await databaseService.getSalaryHistory(employee._id);
      setHistory(data);
    } catch (err) {
      console.error('Error loading salary history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load salary history');
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  // Calculate statistics
  const totalIncreases = history.filter(h => h.change_amount > 0).length;
  const totalDecreases = history.filter(h => h.change_amount < 0).length;
  const averageIncrease = history.length > 0
    ? history.reduce((sum, h) => sum + h.change_percentage, 0) / history.length
    : 0;
  const highestIncrease = history.length > 0
    ? Math.max(...history.map(h => h.change_percentage))
    : 0;
  const lastChange = history.length > 0 ? history[0] : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History color="primary" />
            <Box>
              <Typography variant="h6">Salary History</Typography>
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
        ) : history.length === 0 ? (
          <Alert severity="info">
            No salary history found for this employee. This may be their initial salary.
          </Alert>
        ) : (
          <>
            {/* Summary Statistics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Changes
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {history.length}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Average Increase
                </Typography>
                <Typography variant="h6" sx={{ mt: 1, color: 'success.main' }}>
                  {averageIncrease.toFixed(2)}%
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Highest Increase
                </Typography>
                <Typography variant="h6" sx={{ mt: 1, color: 'success.main' }}>
                  {highestIncrease.toFixed(2)}%
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Change
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {lastChange ? new Date(lastChange.effective_date).toLocaleDateString() : 'N/A'}
                </Typography>
              </Paper>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* History Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Effective Date</strong></TableCell>
                    <TableCell align="right"><strong>Previous</strong></TableCell>
                    <TableCell align="center"><strong>Change</strong></TableCell>
                    <TableCell align="right"><strong>New Salary</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                    <TableCell><strong>Approved By</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((record, index) => {
                    const isIncrease = record.change_amount > 0;
                    const isDecrease = record.change_amount < 0;

                    return (
                      <TableRow key={record._id || index} hover>
                        <TableCell>
                          {new Date(record.effective_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          ₹{record.previous_salary.toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {isIncrease ? (
                              <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                            ) : isDecrease ? (
                              <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
                            ) : null}
                            <Chip
                              label={`${isIncrease ? '+' : ''}${record.change_percentage.toFixed(2)}%`}
                              size="small"
                              color={isIncrease ? 'success' : isDecrease ? 'error' : 'default'}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 600, color: isIncrease ? 'success.main' : isDecrease ? 'error.main' : 'inherit' }}>
                            ₹{record.new_salary.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{record.reason}</Typography>
                          {record.notes && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {record.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{record.approved_by}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Salary Progression Summary */}
            {history.length > 1 && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Salary Progression Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Initial Salary
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      ₹{history[history.length - 1].previous_salary.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Increase
                    </Typography>
                    <Chip
                      icon={<TrendingUp />}
                      label={`${((history[0].new_salary - history[history.length - 1].previous_salary) / history[history.length - 1].previous_salary * 100).toFixed(2)}%`}
                      color="success"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Current Salary
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ₹{history[0].new_salary.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
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

export default SalaryHistoryDialog;

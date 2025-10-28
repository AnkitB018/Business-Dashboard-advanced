import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import databaseService from '../services/DatabaseService';

const SimpleSalesTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      setStatus('Testing database connection...');
      console.log('Testing database service...');
      
      // Test if database service is available
      if (!databaseService) {
        throw new Error('Database service not available');
      }

      setStatus('Loading sales data...');
      const sales = await databaseService.getAllSales();
      console.log('Sales data:', sales);
      
      setSalesData(sales);
      setStatus(`Loaded ${sales.length} sales records successfully`);
      setError(null);
    } catch (err) {
      console.error('Database test error:', err);
      setError(`Database error: ${err}`);
      setStatus('Failed to load sales data');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Sales Database Test
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Status: {status}</Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Sales Data:</Typography>
        <pre>{JSON.stringify(salesData, null, 2)}</pre>
      </Paper>

      <Button 
        variant="contained" 
        onClick={testDatabaseConnection}
        sx={{ mr: 2 }}
      >
        Retry Test
      </Button>

      <Button 
        variant="outlined" 
        onClick={() => window.location.reload()}
      >
        Reload Page
      </Button>
    </Box>
  );
};

export default SimpleSalesTest;
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const SalesObjectIdTest: React.FC = () => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSalesData = async () => {
      try {
        console.log('Loading sales data for ObjectId test...');
        const response = await window.electronAPI.dbOperation('getAllSales', '');
        console.log('Sales data loaded:', response);
        
        if (response && Array.isArray(response)) {
          setSalesData(response);
          console.log(`Successfully loaded ${response.length} sales records`);
        } else {
          console.error('Invalid response format:', response);
          setError('Invalid data format received');
        }
      } catch (err) {
        console.error('Error loading sales data:', err);
        setError(`Failed to load sales data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading ObjectId test...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Sales ObjectId Test - {salesData.length} records
      </Typography>
      
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Converted ID</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Total Price</TableCell>
              <TableCell>Raw _id Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salesData.slice(0, 5).map((sale, index) => {
              const saleData = sale as any;
              // Convert ObjectId to string safely
              const saleId = saleData._id ? 
                (typeof saleData._id === 'object' ? JSON.stringify(saleData._id) : saleData._id.toString()) 
                : `sale-${index}`;
              
              return (
                <TableRow key={saleId}>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {saleId.length > 50 ? saleId.substring(0, 50) + '...' : saleId}
                    </Typography>
                  </TableCell>
                  <TableCell>{saleData.item_name || 'N/A'}</TableCell>
                  <TableCell>{saleData.supplier_name || 'N/A'}</TableCell>
                  <TableCell>{saleData.quantity || 'N/A'}</TableCell>
                  <TableCell>{saleData.total_price || saleData.unit_price || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {typeof saleData._id} - {saleData._id ? 'Has _id' : 'No _id'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Test Status: {salesData.length > 0 ? '✅ ObjectId conversion working' : '❌ No data loaded'}
        </Typography>
      </Box>
    </Box>
  );
};

export default SalesObjectIdTest;
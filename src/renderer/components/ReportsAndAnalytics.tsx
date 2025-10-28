import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  ShoppingCart,
  Assignment,
  CalendarToday,
  Business,
  Assessment,
  FileDownload,
  DateRange,
  Analytics,
  BarChart,
  PieChart,
  Timeline,
} from '@mui/icons-material';
import { formatCurrency } from '../utils/formatters';
import databaseService from '../services/DatabaseService';

interface ReportFilters {
  dateRange: string;
  startDate: string;
  endDate: string;
  reportType: string;
  department: string;
}

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  monthlySales: Array<{ month: string; revenue: number; orders: number }>;
}

interface AttendanceMetrics {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateArrivals: number;
  averageWorkingHours: number;
  departmentAttendance: Array<{ department: string; present: number; total: number }>;
}

interface PurchaseMetrics {
  totalSpent: number;
  totalOrders: number;
  topSuppliers: Array<{ name: string; amount: number; orders: number }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  outstandingPayments: number;
}

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: Array<{ month: string; income: number; expenses: number; profit: number }>;
}

const ReportsAndAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'thisMonth',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reportType: 'all',
    department: 'all'
  });

  // Mock data - replace with real data from your database
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    totalRevenue: 125000,
    totalOrders: 342,
    averageOrderValue: 365.50,
    topProducts: [
      { name: 'Premium Package', sales: 45, revenue: 22500 },
      { name: 'Standard Service', sales: 78, revenue: 18200 },
      { name: 'Consulting Hours', sales: 32, revenue: 16000 },
      { name: 'Software License', sales: 25, revenue: 12500 }
    ],
    monthlySales: [
      { month: 'Jan', revenue: 18000, orders: 45 },
      { month: 'Feb', revenue: 22000, orders: 58 },
      { month: 'Mar', revenue: 25000, orders: 63 },
      { month: 'Apr', revenue: 28000, orders: 72 },
      { month: 'May', revenue: 32000, orders: 84 }
    ]
  });

  const [attendanceMetrics, setAttendanceMetrics] = useState<AttendanceMetrics>({
    totalEmployees: 125,
    presentToday: 118,
    absentToday: 7,
    lateArrivals: 12,
    averageWorkingHours: 8.2,
    departmentAttendance: [
      { department: 'Sales', present: 28, total: 30 },
      { department: 'Development', present: 35, total: 38 },
      { department: 'Marketing', present: 18, total: 20 },
      { department: 'HR', present: 8, total: 8 },
      { department: 'Finance', present: 12, total: 12 },
      { department: 'Operations', present: 17, total: 17 }
    ]
  });

  const [purchaseMetrics, setPurchaseMetrics] = useState<PurchaseMetrics>({
    totalSpent: 85000,
    totalOrders: 156,
    topSuppliers: [
      { name: 'TechCorp Solutions', amount: 25000, orders: 15 },
      { name: 'Office Supplies Co', amount: 18000, orders: 32 },
      { name: 'MetalWorks Industries', amount: 15000, orders: 8 },
      { name: 'Software Licensing Inc', amount: 12000, orders: 6 }
    ],
    categoryBreakdown: [
      { category: 'Technology', amount: 35000, percentage: 41.2 },
      { category: 'Office Supplies', amount: 20000, percentage: 23.5 },
      { category: 'Raw Materials', amount: 18000, percentage: 21.2 },
      { category: 'Services', amount: 12000, percentage: 14.1 }
    ],
    outstandingPayments: 15000
  });

  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    totalRevenue: 125000,
    totalExpenses: 85000,
    netProfit: 40000,
    profitMargin: 32.0,
    cashFlow: [
      { month: 'Jan', income: 18000, expenses: 12000, profit: 6000 },
      { month: 'Feb', income: 22000, expenses: 15000, profit: 7000 },
      { month: 'Mar', income: 25000, expenses: 18000, profit: 7000 },
      { month: 'Apr', income: 28000, expenses: 19000, profit: 9000 },
      { month: 'May', income: 32000, expenses: 21000, profit: 11000 }
    ]
  });

  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    loadReportsData();
  }, [filters]);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      // Load real data from database
      const [salesData, attendanceData, purchaseData, employeeData] = await Promise.all([
        databaseService.getAllSales(),
        databaseService.getAllAttendance(),
        databaseService.getAllPurchases(),
        databaseService.getAllEmployees()
      ]);

      // Calculate sales metrics from real data
      const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const totalOrders = salesData.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setSalesMetrics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topProducts: [], // Calculate from sales items if needed
        monthlySales: [] // Calculate from sales data if needed
      });

      // Calculate attendance metrics from real data
      const today = new Date().toDateString();
      const todaysAttendance = attendanceData.filter(record => 
        new Date(record.date).toDateString() === today
      );
      const presentToday = todaysAttendance.filter(record => record.status === 'Present').length;
      const totalEmployees = employeeData.length;

      setAttendanceMetrics({
        totalEmployees,
        presentToday,
        absentToday: totalEmployees - presentToday,
        lateArrivals: 0, // Calculate if you have late arrival data
        averageWorkingHours: 8.0,
        departmentAttendance: [] // Group by department if you have department data
      });

      // Calculate purchase metrics from real data
      const totalSpent = purchaseData.reduce((sum, purchase) => sum + (purchase.total_price || 0), 0);
      const totalPurchaseOrders = purchaseData.length;

      setPurchaseMetrics({
        totalSpent,
        totalOrders: totalPurchaseOrders,
        topSuppliers: [], // Calculate from supplier data
        categoryBreakdown: [], // Group by category
        outstandingPayments: purchaseData.reduce((sum, purchase) => sum + (purchase.due_amount || 0), 0)
      });

      // Calculate financial metrics
      const totalExpenses = totalSpent;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setFinancialMetrics({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        cashFlow: [] // Calculate monthly cash flow if needed
      });

      showSnackbar('Reports data loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading reports data:', error);
      showSnackbar('Failed to load reports data', 'error');
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (field: keyof ReportFilters) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value as string;
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'thisWeek':
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        endDate = new Date();
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date();
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date();
        break;
      case 'custom':
        return; // Don't auto-set dates for custom range
    }

    setFilters(prev => ({
      ...prev,
      dateRange: range,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // Mock export functionality
    showSnackbar(`Exporting report as ${format.toUpperCase()}...`, 'success');
    // Implement actual export logic here
  };

  const getAttendanceRate = (present: number, total: number): number => {
    return total > 0 ? (present / total) * 100 : 0;
  };

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
        📊 Reports & Analytics
      </Typography>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Report Filters</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, alignItems: 'center' }}>
          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={filters.dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="thisWeek">This Week</MenuItem>
              <MenuItem value="thisMonth">This Month</MenuItem>
              <MenuItem value="thisYear">This Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          {filters.dateRange === 'custom' && (
            <>
              <TextField
                type="date"
                label="Start Date"
                value={filters.startDate}
                onChange={handleFilterChange('startDate')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                label="End Date"
                value={filters.endDate}
                onChange={handleFilterChange('endDate')}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={filters.reportType}
              onChange={handleFilterChange('reportType')}
              label="Report Type"
            >
              <MenuItem value="all">All Reports</MenuItem>
              <MenuItem value="sales">Sales Only</MenuItem>
              <MenuItem value="attendance">Attendance Only</MenuItem>
              <MenuItem value="financial">Financial Only</MenuItem>
              <MenuItem value="purchases">Purchases Only</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={filters.department}
              onChange={handleFilterChange('department')}
              label="Department"
            >
              <MenuItem value="all">All Departments</MenuItem>
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="hr">HR</MenuItem>
              <MenuItem value="finance">Finance</MenuItem>
              <MenuItem value="operations">Operations</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<FileDownload />}
              onClick={() => exportReport('pdf')}
            >
              Export PDF
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FileDownload />}
              onClick={() => exportReport('excel')}
            >
              Export Excel
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Report Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Dashboard Overview" />
          <Tab label="Sales Analytics" />
          <Tab label="Attendance Reports" />
          <Tab label="Purchase Analytics" />
          <Tab label="Financial Summary" />
        </Tabs>
      </Paper>

      {/* Dashboard Overview Tab */}
      {tabValue === 0 && (
        <Box>
          {/* Key Metrics Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ 
                  mx: 'auto', 
                  mb: 1, 
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' 
                }}>
                  <AttachMoney />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">{formatCurrency(financialMetrics.totalRevenue)}</Typography>
                <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                <Chip 
                  label={`+${financialMetrics.profitMargin}% profit margin`} 
                  color="success" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'success.main' }}>
                  <People />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">
                  {attendanceMetrics.presentToday}/{attendanceMetrics.totalEmployees}
                </Typography>
                <Typography variant="body2" color="text.secondary">Attendance Today</Typography>
                <Chip 
                  label={`${((attendanceMetrics.presentToday / attendanceMetrics.totalEmployees) * 100).toFixed(1)}% present`} 
                  color="success" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'primary.main' }}>
                  <ShoppingCart />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">{salesMetrics.totalOrders}</Typography>
                <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                <Chip 
                  label={`${formatCurrency(salesMetrics.averageOrderValue)} avg`} 
                  color="primary" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'warning.main' }}>
                  <TrendingDown />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">{formatCurrency(purchaseMetrics.totalSpent)}</Typography>
                <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                <Chip 
                  label={`${formatCurrency(purchaseMetrics.outstandingPayments)} pending`} 
                  color="warning" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Box>

          {/* Quick Insights */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
            {/* Sales Trend */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Monthly Sales Trend</Typography>
              <Box sx={{ height: 200, display: 'flex', alignItems: 'end', gap: 1, mt: 2 }}>
                {salesMetrics.monthlySales.map((data, index) => (
                  <Box key={data.month} sx={{ flex: 1, textAlign: 'center' }}>
                    <Box
                      sx={{
                        height: `${(data.revenue / 35000) * 150}px`,
                        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                        borderRadius: 1,
                        mb: 1,
                        minHeight: 20
                      }}
                    />
                    <Typography variant="caption">{data.month}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      ${(data.revenue / 1000).toFixed(0)}k
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Department Attendance */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Department Attendance</Typography>
              <Box sx={{ mt: 2 }}>
                {attendanceMetrics.departmentAttendance.map((dept) => (
                  <Box key={dept.department} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{dept.department}</Typography>
                      <Typography variant="body2">{dept.present}/{dept.total}</Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        backgroundColor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${getAttendanceRate(dept.present, dept.total)}%`,
                          background: getAttendanceRate(dept.present, dept.total) >= 90 
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : getAttendanceRate(dept.present, dept.total) >= 70
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {getAttendanceRate(dept.present, dept.total).toFixed(1)}% attendance
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Sales Analytics Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Sales Summary */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Sales Summary</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total Revenue:</Typography>
                  <Typography fontWeight="bold">{formatCurrency(salesMetrics.totalRevenue)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total Orders:</Typography>
                  <Typography fontWeight="bold">{salesMetrics.totalOrders}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Average Order Value:</Typography>
                  <Typography fontWeight="bold">{formatCurrency(salesMetrics.averageOrderValue)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="success.main">Growth Rate:</Typography>
                  <Typography fontWeight="bold" color="success.main">+15.2%</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Top Products */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Top Performing Products</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Sales</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesMetrics.topProducts.map((product) => (
                      <TableRow key={product.name}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell align="right">{product.sales}</TableCell>
                        <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Attendance Reports Tab */}
      {tabValue === 2 && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Attendance Overview */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Attendance Overview</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {attendanceMetrics.presentToday}
                  </Typography>
                  <Typography variant="body2">Present Today</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {attendanceMetrics.absentToday}
                  </Typography>
                  <Typography variant="body2">Absent Today</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {attendanceMetrics.lateArrivals}
                  </Typography>
                  <Typography variant="body2">Late Arrivals</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {attendanceMetrics.averageWorkingHours}h
                  </Typography>
                  <Typography variant="body2">Avg Working Hours</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Department-wise Attendance */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Department-wise Attendance</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell align="center">Present</TableCell>
                      <TableCell align="center">Total</TableCell>
                      <TableCell align="center">Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceMetrics.departmentAttendance.map((dept) => (
                      <TableRow key={dept.department}>
                        <TableCell>{dept.department}</TableCell>
                        <TableCell align="center">{dept.present}</TableCell>
                        <TableCell align="center">{dept.total}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${getAttendanceRate(dept.present, dept.total).toFixed(1)}%`}
                            color={getAttendanceRate(dept.present, dept.total) >= 90 ? 'success' : 
                                   getAttendanceRate(dept.present, dept.total) >= 70 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Purchase Analytics Tab */}
      {tabValue === 3 && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Purchase Summary */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Purchase Summary</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total Spent:</Typography>
                  <Typography fontWeight="bold">{formatCurrency(purchaseMetrics.totalSpent)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total Orders:</Typography>
                  <Typography fontWeight="bold">{purchaseMetrics.totalOrders}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Average Order:</Typography>
                  <Typography fontWeight="bold">${(purchaseMetrics.totalSpent / purchaseMetrics.totalOrders).toFixed(2)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="warning.main">Outstanding Payments:</Typography>
                  <Typography fontWeight="bold" color="warning.main">{formatCurrency(purchaseMetrics.outstandingPayments)}</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Top Suppliers */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Top Suppliers</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Supplier</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Orders</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchaseMetrics.topSuppliers.map((supplier) => (
                      <TableRow key={supplier.name}>
                        <TableCell>{supplier.name}</TableCell>
                        <TableCell align="right">{formatCurrency(supplier.amount)}</TableCell>
                        <TableCell align="right">{supplier.orders}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Category Breakdown */}
            <Paper sx={{ p: 3, gridColumn: 'span 2' }}>
              <Typography variant="h6" gutterBottom>Purchase Category Breakdown</Typography>
              <Box sx={{ mt: 2 }}>
                {purchaseMetrics.categoryBreakdown.map((category) => (
                  <Box key={category.category} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{category.category}</Typography>
                      <Typography variant="body2">{formatCurrency(category.amount)} ({category.percentage}%)</Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        backgroundColor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${category.percentage}%`,
                          background: 'linear-gradient(90deg, #dc2626, #991b1b)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Financial Summary Tab */}
      {tabValue === 4 && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Financial Overview */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Financial Overview</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total Revenue:</Typography>
                  <Typography fontWeight="bold" color="success.main">{formatCurrency(financialMetrics.totalRevenue)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total Expenses:</Typography>
                  <Typography fontWeight="bold" color="error.main">{formatCurrency(financialMetrics.totalExpenses)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Net Profit:</Typography>
                  <Typography fontWeight="bold" color="primary.main">{formatCurrency(financialMetrics.netProfit)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Profit Margin:</Typography>
                  <Typography fontWeight="bold" color="primary.main">{financialMetrics.profitMargin}%</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Cash Flow Trend */}
            <Paper sx={{ p: 3, gridColumn: 'span 2' }}>
              <Typography variant="h6" gutterBottom>Monthly Cash Flow</Typography>
              <Box sx={{ height: 250, display: 'flex', alignItems: 'end', gap: 2, mt: 2 }}>
                {financialMetrics.cashFlow.map((data, index) => (
                  <Box key={data.month} sx={{ flex: 1, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'end', height: 200 }}>
                      {/* Income Bar */}
                      <Box
                        sx={{
                          flex: 1,
                          height: `${(data.income / 35000) * 150}px`,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          borderRadius: 1,
                          minHeight: 10
                        }}
                      />
                      {/* Expenses Bar */}
                      <Box
                        sx={{
                          flex: 1,
                          height: `${(data.expenses / 35000) * 150}px`,
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          borderRadius: 1,
                          minHeight: 10
                        }}
                      />
                      {/* Profit Bar */}
                      <Box
                        sx={{
                          flex: 1,
                          height: `${(data.profit / 35000) * 150}px`,
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          borderRadius: 1,
                          minHeight: 10
                        }}
                      />
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {data.month}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      P: ${(data.profit / 1000).toFixed(0)}k
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 1 }} />
                  <Typography variant="caption">Income</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: 1 }} />
                  <Typography variant="caption">Expenses</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: 1 }} />
                  <Typography variant="caption">Profit</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

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

export default ReportsAndAnalytics;
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
  Divider,
  TablePagination,
} from '@mui/material';
import {
  Add,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Search,
  Refresh,
  Edit,
  Delete,
  Visibility,
  AttachMoney,
  AddShoppingCart,
  RemoveShoppingCart,
} from '@mui/icons-material';
import { Sale, SalesItem, Product, SalesFormData } from '../types/Sales';
import { Customer } from '../types/Customer';
import { formatCurrency, formatNumber, generateIndianBusinessData, convertToIndianPrice } from '../utils/formatters';
import databaseService from '../services/DatabaseService';

const SalesManagement: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [products] = useState<Product[]>([
    { 
      _id: '1', 
      productId: 'PROD001',
      name: 'Dell Laptop Inspiron 15', 
      description: 'Intel i5, 8GB RAM, 512GB SSD - Business laptop',
      category: 'Electronics',
      sku: 'DELL-INS15-001',
      price: 65000, 
      costPrice: 55000,
      stock: 25, 
      minStock: 5,
      unit: 'pcs',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      _id: '2', 
      productId: 'PROD002',
      name: 'Ergonomic Office Chair', 
      description: 'Premium ergonomic chair with lumbar support',
      category: 'Furniture',
      sku: 'ERGO-CHAIR-001',
      price: 15000, 
      costPrice: 10000,
      stock: 15, 
      minStock: 3,
      unit: 'pcs',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      _id: '3', 
      productId: 'PROD003',
      name: 'Software Development License', 
      description: 'Annual enterprise software development license',
      category: 'Software',
      sku: 'SOFT-DEV-LIC',
      price: 120000, 
      costPrice: 100000,
      stock: 10, 
      minStock: 2,
      unit: 'license',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      _id: '4', 
      productId: 'PROD004',
      name: 'Wireless Mouse Logitech', 
      description: 'Bluetooth wireless mouse with precision tracking',
      category: 'Electronics',
      sku: 'LOGI-MOUSE-001',
      price: 2500, 
      costPrice: 1800,
      stock: 50, 
      minStock: 10,
      unit: 'pcs',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<SalesFormData>({
    customerId: '',
    items: [],
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    status: 'draft',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Cart state for new sales
  const [cart, setCart] = useState<SalesItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Snackbar states
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadSalesData();
    loadCustomers();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading sales data...');
      const salesData = await databaseService.getAllSales();
      console.log('Sales data loaded:', salesData);
      console.log('First sale object structure:', salesData[0]);
      setSales(salesData);
      showSnackbar(`Loaded ${salesData.length} sales records`, 'success');
    } catch (error) {
      console.error('Error loading sales data:', error);
      setError(`Failed to load sales data: ${error}`);
      showSnackbar('Failed to load sales data', 'error');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const customersData = await databaseService.getAllCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const seedSampleData = async () => {
    try {
      setLoading(true);
      await databaseService.seedSampleData();
      await loadSalesData();
      await loadCustomers();
      showSnackbar('Sample data added successfully!', 'success');
    } catch (error) {
      console.error('Error seeding sample data:', error);
      showSnackbar('Failed to add sample data', 'error');
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

  const addToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      showSnackbar('Please select a valid product and quantity', 'error');
      return;
    }

    const product = products.find(p => p._id === selectedProduct);
    if (!product) {
      showSnackbar('Product not found', 'error');
      return;
    }

    const existingItem = cart.find(item => item.productId === selectedProduct);
    
    const itemPrice = product.price;
    const itemDiscount = (itemPrice * discountPercent) / 100;
    const itemTax = ((itemPrice - itemDiscount) * 7.5) / 100; // 7.5% tax
    const itemTotal = (itemPrice - itemDiscount + itemTax) * quantity;

    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === selectedProduct 
          ? { 
              ...item, 
              quantity: item.quantity + quantity,
              total: ((itemPrice - itemDiscount + itemTax) * (item.quantity + quantity))
            }
          : item
      ));
    } else {
      const newItem: SalesItem = {
        productId: selectedProduct,
        productName: product.name,
        quantity,
        price: itemPrice,
        discount: itemDiscount * quantity,
        tax: itemTax * quantity,
        total: itemTotal
      };
      setCart([...cart, newItem]);
    }

    setSelectedProduct('');
    setQuantity(1);
    setDiscountPercent(0);
    showSnackbar('Item added to cart', 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
    showSnackbar('Item removed from cart', 'success');
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p._id === productId);
    if (!product) return;

    setCart(cart.map(item => 
      item.productId === productId 
        ? { 
            ...item, 
            quantity: newQuantity,
            total: ((item.price - (item.discount / item.quantity) + (item.tax / item.quantity)) * newQuantity)
          }
        : item
    ));
  };

  const calculateCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
    const totalTax = cart.reduce((sum, item) => sum + item.tax, 0);
    const total = cart.reduce((sum, item) => sum + item.total, 0);

    return { subtotal, totalDiscount, totalTax, total };
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.customerId) {
      errors.customerId = 'Customer is required';
    }

    if (cart.length === 0) {
      errors.cart = 'At least one item is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const customer = customers.find(c => c._id === formData.customerId);
      if (!customer) {
        showSnackbar('Customer not found', 'error');
        return;
      }

      const { subtotal, totalDiscount, totalTax, total } = calculateCartTotals();

      const saleData: Sale = {
        saleId: editingSale?.saleId || `SAL${Date.now()}`,
        customerId: formData.customerId,
        customerName: customer.name,
        items: cart,
        subtotal,
        totalDiscount,
        totalTax,
        totalAmount: total,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        status: formData.status,
        orderDate: new Date(),
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
        notes: formData.notes,
        createdBy: 'current_user', // In real app, get from auth
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingSale) {
        setSales(sales.map(sale => 
          sale._id === editingSale._id 
            ? { ...saleData, _id: editingSale._id }
            : sale
        ));
        showSnackbar('Sale updated successfully', 'success');
      } else {
        const newSale = { ...saleData, _id: Date.now().toString() };
        setSales([newSale, ...sales]);
        showSnackbar('Sale created successfully', 'success');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving sale:', error);
      showSnackbar('Failed to save sale', 'error');
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      customerId: sale.customerId,
      items: sale.items,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      status: sale.status,
      deliveryDate: sale.deliveryDate?.toISOString().split('T')[0],
      notes: sale.notes || ''
    });
    setCart([...sale.items]);
    setOpenDialog(true);
  };

  const handleDelete = async (saleId: string) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;

    try {
      setSales(sales.filter(sale => {
        const currentSaleId = (sale as any)._id ? 
          (typeof (sale as any)._id === 'object' ? JSON.stringify((sale as any)._id) : (sale as any)._id.toString()) 
          : '';
        return currentSaleId !== saleId;
      }));
      showSnackbar('Sale deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting sale:', error);
      showSnackbar('Failed to delete sale', 'error');
    }
  };

  const handleView = (sale: Sale) => {
    setViewingSale(sale);
    setOpenViewDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSale(null);
    setFormData({
      customerId: '',
      items: [],
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      status: 'draft',
      notes: ''
    });
    setCart([]);
    setFormErrors({});
  };

  const handleFormChange = (field: keyof SalesFormData) => (
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
      case 'delivered': return 'success';
      case 'confirmed': return 'info';
      case 'shipped': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'info';
      case 'refunded': return 'error';
      default: return 'default';
    }
  };

  const filteredSales = sales.filter(sale => {
    try {
      const saleData = sale as any; // Type assertion for database flexibility
      const customerName = saleData.customerName || saleData.customer_name || '';
      const saleId = saleData.saleId || saleData.sale_id || saleData._id || '';
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           saleId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
      return matchesSearch && matchesStatus;
    } catch (error) {
      console.error('Error filtering sale:', sale, error);
      return true; // Include the sale if there's an error
    }
  });

  const paginatedSales = filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Calculate statistics
  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, sale) => {
    const saleData = sale as any;
    return sum + (saleData.total_price || saleData.totalAmount || saleData.total_amount || saleData.unit_price || 0);
  }, 0);
  const completedSales = filteredSales.filter(sale => {
    const saleData = sale as any;
    return (saleData.status === 'delivered' || saleData.status === 'completed' || 
            saleData.payment_status === 'paid' || saleData.payment_status === 'completed');
  }).length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

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
        💰 Sales Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ 
              mx: 'auto', 
              mb: 1, 
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' 
            }}>
              <ShoppingCart />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{totalSales}</Typography>
            <Typography variant="body2" color="text.secondary">Total Sales</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'success.main' }}>
              <AttachMoney />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{formatCurrency(totalRevenue)}</Typography>
            <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'info.main' }}>
              <Receipt />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{completedSales}</Typography>
            <Typography variant="body2" color="text.secondary">Completed Sales</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'warning.main' }}>
              <TrendingUp />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{formatCurrency(averageOrderValue)}</Typography>
            <Typography variant="body2" color="text.secondary">Avg. Order Value</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Sales Records" />
          <Tab label="Quick Sale" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <>
          {/* Filters and Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search by customer name or sale ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.disabled' }} />
                }}
                sx={{ minWidth: 300 }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
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
                New Sale
              </Button>
              {sales.length === 0 && !loading && (
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={seedSampleData}
                  color="primary"
                >
                  Add Sample Data
                </Button>
              )}
              <Tooltip title="Refresh">
                <IconButton onClick={loadSalesData}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          {/* Sales Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Total Price</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        Loading sales records...
                      </TableCell>
                    </TableRow>
                  ) : paginatedSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        No sales records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSales.map((sale, index) => {
                      const saleData = sale as any; // Type assertion for flexibility
                      // Handle ObjectId properly - convert to string
                      const saleId = saleData._id ? 
                        (typeof saleData._id === 'object' ? JSON.stringify(saleData._id) : saleData._id.toString()) 
                        : `sale-${index}`;
                      
                      return (
                      <TableRow key={saleId}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {saleData.item_name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {saleData.customer_name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Contact: {saleData.customer_phone || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{new Date(saleData.date || Date.now()).toLocaleDateString()}</TableCell>
                        <TableCell>{saleData.quantity || 'N/A'} pcs</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(saleData.total_price || (saleData.quantity * saleData.unit_price) || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="caption">Cash</Typography><br />
                            <Chip 
                              label="Completed" 
                              color="success"
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={saleData.category || 'General'} 
                            color="info"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => handleView(sale)}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEdit(sale)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(saleId)}>
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredSales.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </Paper>
        </>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Quick Sale</Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>Add Products</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Select Product</InputLabel>
                  <Select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    label="Select Product"
                  >
                    {products.map((product) => (
                      <MenuItem key={product._id} value={product._id}>
                        {product.name} - {formatCurrency(product.price)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="number"
                  label="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                  sx={{ width: 100 }}
                />
                <TextField
                  type="number"
                  label="Discount %"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{ width: 120 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddShoppingCart />}
                  onClick={addToCart}
                >
                  Add to Cart
                </Button>
              </Box>

              {/* Cart */}
              <Typography variant="subtitle1" gutterBottom>Shopping Cart</Typography>
              {cart.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Cart is empty</Typography>
              ) : (
                <Box>
                  {cart.map((item) => (
                    <Card key={item.productId} sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(item.price)} × {item.quantity} - {formatCurrency(item.discount)} + {formatCurrency(item.tax)} = {formatCurrency(item.total)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.productId, parseInt(e.target.value) || 0)}
                              inputProps={{ min: 0 }}
                              sx={{ width: 80 }}
                            />
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <RemoveShoppingCart />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>Sale Details</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={formData.customerId}
                    onChange={handleFormChange('customerId')}
                    label="Customer"
                    error={!!formErrors.customerId}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.customerId && (
                    <Typography variant="caption" color="error">{formErrors.customerId}</Typography>
                  )}
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={formData.paymentMethod}
                    onChange={handleFormChange('paymentMethod')}
                    label="Payment Method"
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="credit">Credit</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={formData.paymentStatus}
                    onChange={handleFormChange('paymentStatus')}
                    label="Payment Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Order Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={handleFormChange('status')}
                    label="Order Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  type="date"
                  label="Delivery Date"
                  value={formData.deliveryDate || ''}
                  onChange={handleFormChange('deliveryDate')}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={formData.notes}
                  onChange={handleFormChange('notes')}
                  placeholder="Any additional notes..."
                />

                {/* Order Summary */}
                {cart.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Order Summary</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Subtotal:</Typography>
                        <Typography variant="body2">{formatCurrency(calculateCartTotals().subtotal)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Discount:</Typography>
                        <Typography variant="body2">-{formatCurrency(calculateCartTotals().totalDiscount)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Tax:</Typography>
                        <Typography variant="body2">{formatCurrency(calculateCartTotals().totalTax)}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {formatCurrency(calculateCartTotals().total)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={cart.length === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'
                    }
                  }}
                >
                  Complete Sale
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Sale Details</DialogTitle>
        <DialogContent>
          {viewingSale && (
            <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
              <Box>
                  <Typography variant="subtitle2" gutterBottom>Sale Information</Typography>
                  <Typography variant="body2"><strong>Sale ID:</strong> {viewingSale.saleId}</Typography>
                  <Typography variant="body2"><strong>Customer:</strong> {viewingSale.customerName}</Typography>
                  <Typography variant="body2"><strong>Order Date:</strong> {new Date(viewingSale.orderDate).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Payment Method:</strong> {viewingSale.paymentMethod}</Typography>
                  <Typography variant="body2"><strong>Payment Status:</strong> {viewingSale.paymentStatus}</Typography>
                  <Typography variant="body2"><strong>Order Status:</strong> {viewingSale.status}</Typography>
                  {viewingSale.deliveryDate && (
                    <Typography variant="body2"><strong>Delivery Date:</strong> {new Date(viewingSale.deliveryDate).toLocaleDateString()}</Typography>
                  )}
                  {viewingSale.notes && (
                    <Typography variant="body2"><strong>Notes:</strong> {viewingSale.notes}</Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Items</Typography>
                  {viewingSale.items.map((item, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2"><strong>{item.productName}</strong></Typography>
                      <Typography variant="caption">
                        {formatCurrency(item.price)} × {item.quantity} - {formatCurrency(item.discount)} + {formatCurrency(item.tax)} = {formatCurrency(item.total)}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2"><strong>Subtotal:</strong> {formatCurrency(viewingSale.subtotal)}</Typography>
                  <Typography variant="body2"><strong>Total Discount:</strong> -{formatCurrency(viewingSale.totalDiscount)}</Typography>
                  <Typography variant="body2"><strong>Total Tax:</strong> {formatCurrency(viewingSale.totalTax)}</Typography>
                  <Typography variant="h6"><strong>Total:</strong> {formatCurrency(viewingSale.totalAmount)}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
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

export default SalesManagement;
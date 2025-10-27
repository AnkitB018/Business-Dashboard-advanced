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

const SalesManagement: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products] = useState<Product[]>([
    { 
      _id: '1', 
      productId: 'PROD001',
      name: 'Laptop Computer', 
      description: 'High-performance laptop for business use',
      category: 'Electronics',
      sku: 'SKU001',
      price: 999.99, 
      costPrice: 750.00,
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
      name: 'Office Chair', 
      description: 'Ergonomic office chair with lumbar support',
      category: 'Furniture',
      sku: 'SKU002',
      price: 299.99, 
      costPrice: 200.00,
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
      name: 'Wireless Mouse', 
      description: 'Bluetooth wireless mouse with precision tracking',
      category: 'Electronics',
      sku: 'SKU003',
      price: 49.99, 
      costPrice: 30.00,
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
      // Mock sales data that matches the type definitions
      const mockSales: Sale[] = [
        {
          _id: '1',
          saleId: 'SAL001',
          customerId: '1',
          customerName: 'John Doe',
          items: [
            { 
              productId: '1', 
              productName: 'Laptop Computer', 
              quantity: 1, 
              price: 999.99, 
              discount: 0, 
              tax: 75.00, 
              total: 1074.99 
            }
          ],
          subtotal: 999.99,
          totalDiscount: 0,
          totalTax: 75.00,
          totalAmount: 1074.99,
          paymentMethod: 'card',
          paymentStatus: 'paid',
          status: 'delivered',
          orderDate: new Date(),
          deliveryDate: new Date(),
          notes: 'Priority delivery',
          createdBy: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          saleId: 'SAL002',
          customerId: '2',
          customerName: 'Jane Smith',
          items: [
            { 
              productId: '2', 
              productName: 'Office Chair', 
              quantity: 2, 
              price: 299.99, 
              discount: 30.00, 
              tax: 42.75, 
              total: 612.73 
            }
          ],
          subtotal: 599.98,
          totalDiscount: 30.00,
          totalTax: 42.75,
          totalAmount: 612.73,
          paymentMethod: 'cash',
          paymentStatus: 'pending',
          status: 'confirmed',
          orderDate: new Date(),
          notes: '',
          createdBy: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setSales(mockSales);
      showSnackbar(`Loaded ${mockSales.length} sales records`, 'success');
    } catch (error) {
      console.error('Error loading sales data:', error);
      showSnackbar('Failed to load sales data', 'error');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      // Mock customers data
      const mockCustomers: Customer[] = [
        {
          _id: '1',
          customerId: 'CUST001',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          },
          company: 'Tech Corp',
          gstNumber: 'GST001',
          creditLimit: 50000,
          outstandingBalance: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          customerId: 'CUST002',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '098-765-4321',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          },
          company: 'Design Studio',
          gstNumber: 'GST002',
          creditLimit: 30000,
          outstandingBalance: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
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
      setSales(sales.filter(sale => sale._id !== saleId));
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
    const matchesSearch = sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.saleId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedSales = filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Calculate statistics
  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const completedSales = filteredSales.filter(s => s.status === 'delivered').length;
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
            <Typography variant="h6" fontWeight="bold">${totalRevenue.toFixed(2)}</Typography>
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
            <Typography variant="h6" fontWeight="bold">${averageOrderValue.toFixed(2)}</Typography>
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
                    <TableCell>Sale ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Status</TableCell>
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
                    paginatedSales.map((sale) => (
                      <TableRow key={sale._id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {sale.saleId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {sale.customerName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {sale.customerId}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{new Date(sale.orderDate).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.items.length} items</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ${sale.totalAmount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="caption">{sale.paymentMethod}</Typography><br />
                            <Chip 
                              label={sale.paymentStatus} 
                              color={getPaymentStatusColor(sale.paymentStatus) as any}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={sale.status} 
                            color={getStatusColor(sale.status) as any}
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
                              <IconButton size="small" color="error" onClick={() => handleDelete(sale._id!)}>
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
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
                        {product.name} - ${product.price}
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
                              ${item.price} × {item.quantity} - ${item.discount.toFixed(2)} + ${item.tax.toFixed(2)} = ${item.total.toFixed(2)}
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
                        <Typography variant="body2">${calculateCartTotals().subtotal.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Discount:</Typography>
                        <Typography variant="body2">-${calculateCartTotals().totalDiscount.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Tax:</Typography>
                        <Typography variant="body2">${calculateCartTotals().totalTax.toFixed(2)}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          ${calculateCartTotals().total.toFixed(2)}
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
                        ${item.price} × {item.quantity} - ${item.discount.toFixed(2)} + ${item.tax.toFixed(2)} = ${item.total.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2"><strong>Subtotal:</strong> ${viewingSale.subtotal.toFixed(2)}</Typography>
                  <Typography variant="body2"><strong>Total Discount:</strong> -${viewingSale.totalDiscount.toFixed(2)}</Typography>
                  <Typography variant="body2"><strong>Total Tax:</strong> ${viewingSale.totalTax.toFixed(2)}</Typography>
                  <Typography variant="h6"><strong>Total:</strong> ${viewingSale.totalAmount.toFixed(2)}</Typography>
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
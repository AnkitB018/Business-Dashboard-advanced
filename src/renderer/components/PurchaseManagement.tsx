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
  ShoppingBag,
  Receipt,
  TrendingDown,
  Search,
  Refresh,
  Edit,
  Delete,
  Visibility,
  AttachMoney,
  LocalShipping,
  Business,
  Inventory,
  Payment,
} from '@mui/icons-material';
import { Purchase, PurchaseFormData, Supplier } from '../types/Purchase';

const PurchaseManagement: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openSupplierDialog, setOpenSupplierDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<PurchaseFormData>({
    item_name: '',
    quantity: 1,
    unit_price: 0,
    supplier_name: '',
    supplier_contact: '',
    supplier_address: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    payment_status: 'Outstanding',
    paid_amount: 0,
    invoice_number: '',
    delivery_date: '',
    category: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Supplier form data
  const [supplierData, setSupplierData] = useState({
    name: '',
    contact_number: '',
    email: '',
    address: '',
    gst_number: '',
    payment_terms: '',
    category: ''
  });

  // Snackbar states
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Categories for filtering
  const categories = ['Raw Materials', 'Office Supplies', 'Equipment', 'Services', 'Utilities', 'Other'];

  useEffect(() => {
    loadPurchasesData();
    loadSuppliersData();
  }, []);

  const loadPurchasesData = async () => {
    try {
      setLoading(true);
      // Mock purchases data
      const mockPurchases: Purchase[] = [
        {
          _id: '1',
          purchase_id: 'PUR001',
          item_name: 'Office Laptops',
          quantity: 5,
          unit_price: 1200.00,
          total_price: 6000.00,
          supplier_name: 'TechCorp Solutions',
          supplier_contact: '123-456-7890',
          supplier_address: '123 Tech Street, Silicon Valley',
          date: new Date('2024-01-15'),
          payment_method: 'Bank Transfer',
          payment_status: 'Paid',
          paid_amount: 6000.00,
          due_amount: 0,
          invoice_number: 'INV-TC-001',
          delivery_date: new Date('2024-01-20'),
          category: 'Equipment',
          notes: 'Bulk order for new employees',
          created_date: new Date('2024-01-15'),
          last_modified: new Date('2024-01-15')
        },
        {
          _id: '2',
          purchase_id: 'PUR002',
          item_name: 'Office Furniture',
          quantity: 10,
          unit_price: 450.00,
          total_price: 4500.00,
          supplier_name: 'FurnishPro Ltd',
          supplier_contact: '098-765-4321',
          supplier_address: '456 Furniture Ave, Downtown',
          date: new Date('2024-01-18'),
          payment_method: 'Cheque',
          payment_status: 'Partial',
          paid_amount: 2250.00,
          due_amount: 2250.00,
          invoice_number: 'INV-FP-002',
          delivery_date: new Date('2024-01-25'),
          category: 'Office Supplies',
          notes: 'Ergonomic chairs and desks',
          created_date: new Date('2024-01-18'),
          last_modified: new Date('2024-01-20')
        },
        {
          _id: '3',
          purchase_id: 'PUR003',
          item_name: 'Raw Materials - Steel',
          quantity: 500,
          unit_price: 15.50,
          total_price: 7750.00,
          supplier_name: 'MetalWorks Industries',
          supplier_contact: '555-123-4567',
          supplier_address: '789 Industrial Blvd, Manufacturing District',
          date: new Date('2024-01-20'),
          payment_method: 'UPI',
          payment_status: 'Outstanding',
          paid_amount: 0,
          due_amount: 7750.00,
          invoice_number: 'INV-MW-003',
          delivery_date: new Date('2024-01-30'),
          category: 'Raw Materials',
          notes: 'High-grade steel for production',
          created_date: new Date('2024-01-20'),
          last_modified: new Date('2024-01-20')
        }
      ];
      setPurchases(mockPurchases);
      showSnackbar(`Loaded ${mockPurchases.length} purchase records`, 'success');
    } catch (error) {
      console.error('Error loading purchases data:', error);
      showSnackbar('Failed to load purchases data', 'error');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliersData = async () => {
    try {
      // Mock suppliers data
      const mockSuppliers: Supplier[] = [
        {
          _id: '1',
          name: 'TechCorp Solutions',
          contact_number: '123-456-7890',
          email: 'contact@techcorp.com',
          address: '123 Tech Street, Silicon Valley',
          gst_number: 'GST123456789',
          payment_terms: 'Net 30',
          category: 'Technology',
          total_purchases: 15000.00,
          outstanding_amount: 0,
          created_date: new Date('2024-01-01'),
          last_modified: new Date('2024-01-15')
        },
        {
          _id: '2',
          name: 'FurnishPro Ltd',
          contact_number: '098-765-4321',
          email: 'sales@furnishpro.com',
          address: '456 Furniture Ave, Downtown',
          gst_number: 'GST987654321',
          payment_terms: 'Net 15',
          category: 'Furniture',
          total_purchases: 8500.00,
          outstanding_amount: 2250.00,
          created_date: new Date('2024-01-01'),
          last_modified: new Date('2024-01-20')
        },
        {
          _id: '3',
          name: 'MetalWorks Industries',
          contact_number: '555-123-4567',
          email: 'orders@metalworks.com',
          address: '789 Industrial Blvd, Manufacturing District',
          gst_number: 'GST456789123',
          payment_terms: 'Net 45',
          category: 'Raw Materials',
          total_purchases: 25000.00,
          outstanding_amount: 7750.00,
          created_date: new Date('2024-01-01'),
          last_modified: new Date('2024-01-20')
        }
      ];
      setSuppliers(mockSuppliers);
    } catch (error) {
      console.error('Error loading suppliers data:', error);
      setSuppliers([]);
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

  const calculateTotalPrice = (): number => {
    return formData.quantity * formData.unit_price;
  };

  const calculateDueAmount = (): number => {
    const total = calculateTotalPrice();
    const paid = formData.paid_amount || 0;
    return Math.max(0, total - paid);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.item_name.trim()) {
      errors.item_name = 'Item name is required';
    }

    if (!formData.supplier_name.trim()) {
      errors.supplier_name = 'Supplier name is required';
    }

    if (formData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.unit_price <= 0) {
      errors.unit_price = 'Unit price must be greater than 0';
    }

    if (formData.paid_amount && formData.paid_amount > calculateTotalPrice()) {
      errors.paid_amount = 'Paid amount cannot exceed total price';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const totalPrice = calculateTotalPrice();
      const paidAmount = formData.paid_amount || 0;
      const dueAmount = totalPrice - paidAmount;

      const purchaseData: Purchase = {
        purchase_id: editingPurchase?.purchase_id || `PUR${Date.now()}`,
        item_name: formData.item_name,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_price: totalPrice,
        supplier_name: formData.supplier_name,
        supplier_contact: formData.supplier_contact,
        supplier_address: formData.supplier_address,
        date: new Date(formData.date),
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        invoice_number: formData.invoice_number,
        delivery_date: formData.delivery_date ? new Date(formData.delivery_date) : undefined,
        category: formData.category,
        notes: formData.notes,
        created_date: new Date(),
        last_modified: new Date()
      };

      if (editingPurchase) {
        setPurchases(purchases.map(purchase => 
          purchase._id === editingPurchase._id 
            ? { ...purchaseData, _id: editingPurchase._id }
            : purchase
        ));
        showSnackbar('Purchase updated successfully', 'success');
      } else {
        const newPurchase = { ...purchaseData, _id: Date.now().toString() };
        setPurchases([newPurchase, ...purchases]);
        showSnackbar('Purchase created successfully', 'success');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving purchase:', error);
      showSnackbar('Failed to save purchase', 'error');
    }
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      item_name: purchase.item_name,
      quantity: purchase.quantity,
      unit_price: purchase.unit_price,
      supplier_name: purchase.supplier_name,
      supplier_contact: purchase.supplier_contact || '',
      supplier_address: purchase.supplier_address || '',
      date: new Date(purchase.date).toISOString().split('T')[0],
      payment_method: purchase.payment_method || 'Cash',
      payment_status: purchase.payment_status,
      paid_amount: purchase.paid_amount || 0,
      invoice_number: purchase.invoice_number || '',
      delivery_date: purchase.delivery_date ? new Date(purchase.delivery_date).toISOString().split('T')[0] : '',
      category: purchase.category || '',
      notes: purchase.notes || ''
    });
    setOpenDialog(true);
  };

  const handleDelete = async (purchaseId: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) return;

    try {
      setPurchases(purchases.filter(purchase => purchase._id !== purchaseId));
      showSnackbar('Purchase deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      showSnackbar('Failed to delete purchase', 'error');
    }
  };

  const handleView = (purchase: Purchase) => {
    setViewingPurchase(purchase);
    setOpenViewDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPurchase(null);
    setFormData({
      item_name: '',
      quantity: 1,
      unit_price: 0,
      supplier_name: '',
      supplier_contact: '',
      supplier_address: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      payment_status: 'Outstanding',
      paid_amount: 0,
      invoice_number: '',
      delivery_date: '',
      category: '',
      notes: ''
    });
    setFormErrors({});
  };

  const handleFormChange = (field: keyof PurchaseFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSupplierSubmit = () => {
    try {
      const newSupplier: Supplier = {
        _id: Date.now().toString(),
        ...supplierData,
        total_purchases: 0,
        outstanding_amount: 0,
        created_date: new Date(),
        last_modified: new Date()
      };
      setSuppliers([newSupplier, ...suppliers]);
      setFormData(prev => ({ ...prev, supplier_name: supplierData.name }));
      setSupplierData({
        name: '',
        contact_number: '',
        email: '',
        address: '',
        gst_number: '',
        payment_terms: '',
        category: ''
      });
      setOpenSupplierDialog(false);
      showSnackbar('Supplier added successfully', 'success');
    } catch (error) {
      console.error('Error adding supplier:', error);
      showSnackbar('Failed to add supplier', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Partial': return 'warning';
      case 'Outstanding': return 'error';
      default: return 'default';
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.purchase_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.payment_status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || purchase.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const paginatedPurchases = filteredPurchases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Calculate statistics
  const totalPurchases = filteredPurchases.length;
  const totalSpent = filteredPurchases.reduce((sum, purchase) => sum + purchase.total_price, 0);
  const totalOutstanding = filteredPurchases.reduce((sum, purchase) => sum + (purchase.due_amount || 0), 0);
  const paidPurchases = filteredPurchases.filter(p => p.payment_status === 'Paid').length;

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
        📦 Purchase Management
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
              <ShoppingBag />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{totalPurchases}</Typography>
            <Typography variant="body2" color="text.secondary">Total Purchases</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'warning.main' }}>
              <TrendingDown />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">${totalSpent.toFixed(2)}</Typography>
            <Typography variant="body2" color="text.secondary">Total Spent</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'error.main' }}>
              <Payment />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">${totalOutstanding.toFixed(2)}</Typography>
            <Typography variant="body2" color="text.secondary">Outstanding Amount</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'success.main' }}>
              <Receipt />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{paidPurchases}</Typography>
            <Typography variant="body2" color="text.secondary">Paid Orders</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Purchase Records" />
          <Tab label="Suppliers" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <>
          {/* Filters and Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search by item, supplier, or purchase ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.disabled' }} />
                }}
                sx={{ minWidth: 300 }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Payment Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Payment Status">
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Partial">Partial</MenuItem>
                  <MenuItem value="Outstanding">Outstanding</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} label="Category">
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
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
                New Purchase
              </Button>
              <Tooltip title="Refresh">
                <IconButton onClick={loadPurchasesData}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          {/* Purchases Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Purchase ID</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        Loading purchase records...
                      </TableCell>
                    </TableRow>
                  ) : paginatedPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        No purchase records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPurchases.map((purchase) => (
                      <TableRow key={purchase._id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {purchase.purchase_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(purchase.date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {purchase.item_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {purchase.supplier_name}
                          </Typography>
                        </TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ${purchase.total_price.toFixed(2)}
                          </Typography>
                          {purchase.due_amount && purchase.due_amount > 0 && (
                            <Typography variant="caption" color="error.main" display="block">
                              Due: ${purchase.due_amount.toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={purchase.payment_status} 
                            color={getStatusColor(purchase.payment_status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {purchase.category || 'Uncategorized'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => handleView(purchase)}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEdit(purchase)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(purchase._id!)}>
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
              count={filteredPurchases.length}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Suppliers</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenSupplierDialog(true)}
              sx={{
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'
                }
              }}
            >
              Add Supplier
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 3 }}>
            {suppliers.map((supplier) => (
              <Card key={supplier._id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {supplier.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {supplier.category}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Contact:</strong> {supplier.contact_number}
                  </Typography>
                  {supplier.email && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {supplier.email}
                    </Typography>
                  )}
                  {supplier.address && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Address:</strong> {supplier.address}
                    </Typography>
                  )}
                  {supplier.payment_terms && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Payment Terms:</strong> {supplier.payment_terms}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Purchases</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${supplier.total_purchases.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Outstanding</Typography>
                      <Typography variant="body2" fontWeight="bold" color={supplier.outstanding_amount > 0 ? 'error.main' : 'success.main'}>
                        ${supplier.outstanding_amount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Add/Edit Purchase Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPurchase ? 'Edit Purchase' : 'New Purchase'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mt: 1 }}>
            <TextField
              fullWidth
              label="Item Name"
              value={formData.item_name}
              onChange={handleFormChange('item_name')}
              error={!!formErrors.item_name}
              helperText={formErrors.item_name}
            />
            
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={formData.supplier_name}
                onChange={handleFormChange('supplier_name')}
                label="Supplier"
                error={!!formErrors.supplier_name}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier.name}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Quantity"
              value={formData.quantity}
              onChange={handleFormChange('quantity')}
              error={!!formErrors.quantity}
              helperText={formErrors.quantity}
              inputProps={{ min: 1 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Unit Price"
              value={formData.unit_price}
              onChange={handleFormChange('unit_price')}
              error={!!formErrors.unit_price}
              helperText={formErrors.unit_price}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <TextField
              fullWidth
              label="Total Price"
              value={calculateTotalPrice().toFixed(2)}
              InputProps={{ readOnly: true }}
              variant="filled"
            />

            <TextField
              fullWidth
              type="date"
              label="Purchase Date"
              value={formData.date}
              onChange={handleFormChange('date')}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formData.payment_method}
                onChange={handleFormChange('payment_method')}
                label="Payment Method"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={formData.payment_status}
                onChange={handleFormChange('payment_status')}
                label="Payment Status"
              >
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Partial">Partial</MenuItem>
                <MenuItem value="Outstanding">Outstanding</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Paid Amount"
              value={formData.paid_amount}
              onChange={handleFormChange('paid_amount')}
              error={!!formErrors.paid_amount}
              helperText={formErrors.paid_amount}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <TextField
              fullWidth
              label="Due Amount"
              value={calculateDueAmount().toFixed(2)}
              InputProps={{ readOnly: true }}
              variant="filled"
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={handleFormChange('category')}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Invoice Number"
              value={formData.invoice_number}
              onChange={handleFormChange('invoice_number')}
            />

            <TextField
              fullWidth
              type="date"
              label="Delivery Date"
              value={formData.delivery_date}
              onChange={handleFormChange('delivery_date')}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={formData.notes}
              onChange={handleFormChange('notes')}
              sx={{ gridColumn: 'span 2' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'
              }
            }}
          >
            {editingPurchase ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={openSupplierDialog} onClose={() => setOpenSupplierDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Supplier Name"
              value={supplierData.name}
              onChange={(e) => setSupplierData(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Contact Number"
              value={supplierData.contact_number}
              onChange={(e) => setSupplierData(prev => ({ ...prev, contact_number: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={supplierData.email}
              onChange={(e) => setSupplierData(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Address"
              value={supplierData.address}
              onChange={(e) => setSupplierData(prev => ({ ...prev, address: e.target.value }))}
            />
            <TextField
              fullWidth
              label="GST Number"
              value={supplierData.gst_number}
              onChange={(e) => setSupplierData(prev => ({ ...prev, gst_number: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Payment Terms"
              value={supplierData.payment_terms}
              onChange={(e) => setSupplierData(prev => ({ ...prev, payment_terms: e.target.value }))}
              placeholder="e.g., Net 30, Net 15"
            />
            <TextField
              fullWidth
              label="Category"
              value={supplierData.category}
              onChange={(e) => setSupplierData(prev => ({ ...prev, category: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSupplierDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSupplierSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'
              }
            }}
          >
            Add Supplier
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Purchase Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Purchase Details</DialogTitle>
        <DialogContent>
          {viewingPurchase && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Purchase Information</Typography>
                <Typography variant="body2"><strong>Purchase ID:</strong> {viewingPurchase.purchase_id}</Typography>
                <Typography variant="body2"><strong>Item:</strong> {viewingPurchase.item_name}</Typography>
                <Typography variant="body2"><strong>Quantity:</strong> {viewingPurchase.quantity}</Typography>
                <Typography variant="body2"><strong>Unit Price:</strong> ${viewingPurchase.unit_price.toFixed(2)}</Typography>
                <Typography variant="body2"><strong>Total Price:</strong> ${viewingPurchase.total_price.toFixed(2)}</Typography>
                <Typography variant="body2"><strong>Purchase Date:</strong> {new Date(viewingPurchase.date).toLocaleDateString()}</Typography>
                <Typography variant="body2"><strong>Category:</strong> {viewingPurchase.category || 'Uncategorized'}</Typography>
                {viewingPurchase.delivery_date && (
                  <Typography variant="body2"><strong>Delivery Date:</strong> {new Date(viewingPurchase.delivery_date).toLocaleDateString()}</Typography>
                )}
                {viewingPurchase.invoice_number && (
                  <Typography variant="body2"><strong>Invoice Number:</strong> {viewingPurchase.invoice_number}</Typography>
                )}
                {viewingPurchase.notes && (
                  <Typography variant="body2"><strong>Notes:</strong> {viewingPurchase.notes}</Typography>
                )}
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>Supplier Information</Typography>
                <Typography variant="body2"><strong>Name:</strong> {viewingPurchase.supplier_name}</Typography>
                {viewingPurchase.supplier_contact && (
                  <Typography variant="body2"><strong>Contact:</strong> {viewingPurchase.supplier_contact}</Typography>
                )}
                {viewingPurchase.supplier_address && (
                  <Typography variant="body2"><strong>Address:</strong> {viewingPurchase.supplier_address}</Typography>
                )}
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Payment Information</Typography>
                <Typography variant="body2"><strong>Payment Method:</strong> {viewingPurchase.payment_method}</Typography>
                <Typography variant="body2"><strong>Payment Status:</strong> {viewingPurchase.payment_status}</Typography>
                {viewingPurchase.paid_amount !== undefined && (
                  <Typography variant="body2"><strong>Paid Amount:</strong> ${viewingPurchase.paid_amount.toFixed(2)}</Typography>
                )}
                {viewingPurchase.due_amount !== undefined && viewingPurchase.due_amount > 0 && (
                  <Typography variant="body2" color="error.main"><strong>Due Amount:</strong> ${viewingPurchase.due_amount.toFixed(2)}</Typography>
                )}
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

export default PurchaseManagement;
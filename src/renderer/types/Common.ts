// Database configuration interface
export interface DatabaseConfig {
  connectionString: string;
  databaseName: string;
}

// API response interface for database operations
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Employee statistics interface
export interface EmployeeStatistics {
  totalEmployees: number;
  averageSalary: number;
  departmentDistribution: Record<string, number>;
  highestPaidEmployee?: {
    name: string;
    salary: number;
  };
  attendanceStats?: {
    totalPresentDays: number;
    totalAbsentDays: number;
    attendanceRate: number;
  };
}

// Business metrics interface
export interface BusinessMetrics {
  employees: EmployeeStatistics;
  sales: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    totalDueAmount: number;
  };
  purchases: {
    totalPurchases: number;
    totalExpense: number;
    outstandingPayments: number;
  };
}

// Filter interfaces for database queries
export interface EmployeeFilter {
  department?: string;
  position?: string;
  isActive?: boolean;
  hireDateFrom?: Date;
  hireDateTo?: Date;
}

export interface AttendanceFilter {
  empId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
}

export interface SalesFilter {
  customerName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  orderStatus?: string;
  paymentMethod?: string;
}

export interface PurchaseFilter {
  supplierName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  paymentStatus?: string;
  category?: string;
}

// Application settings interface
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: string;
  currencySymbol: string;
  backupSettings: {
    autoBackup: boolean;
    backupInterval: number; // in hours
    backupLocation: string;
  };
  notifications: {
    enabled: boolean;
    dueDateAlerts: boolean;
    lowStockAlerts: boolean;
  };
}

// Navigation item interface for sidebar/menu
export interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  component?: string;
  children?: NavigationItem[];
  permission?: string;
}

// Form validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string>;
}

// Table column configuration
export interface TableColumn {
  key: string;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency' | 'status';
  render?: (value: any, record: any) => React.ReactNode;
}

// Pagination interface
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
}

// Sort configuration
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Export/Import configuration
export interface ExportConfig {
  format: 'excel' | 'csv' | 'pdf';
  fileName: string;
  includeHeaders: boolean;
  selectedColumns?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Notification interface
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Database connection status
export interface ConnectionStatus {
  isConnected: boolean;
  lastConnected?: Date;
  error?: string;
  latency?: number;
}

// Application state interface
export interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  currentUser?: any;
  settings: AppSettings;
  connectionStatus: ConnectionStatus;
  notifications: Notification[];
}
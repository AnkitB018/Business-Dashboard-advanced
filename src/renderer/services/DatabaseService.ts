import { Employee } from '../types/Employee';
import { Attendance } from '../types/Attendance';

export interface DatabaseConfig {
  connectionString: string;
  databaseName: string;
}

// Simplified interface for UI compatibility
interface AttendanceRecord {
  _id?: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: number;
  status: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class DatabaseService {
  private isConnected = false;

  // Connect to database
  async connect(config: DatabaseConfig): Promise<{ success: boolean; message: string }> {
    try {
      const result = await window.electronAPI.connectDatabase(config);
      this.isConnected = result.success;
      return result;
    } catch (error) {
      console.error('Database connection error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  // Employee operations
  async getAllEmployees(): Promise<Employee[]> {
    // Try to ensure connection before operation
    if (!this.isConnected) {
      const config = await this.getConfig();
      if (config) {
        const connected = await this.testConnection(config);
        if (!connected) {
          throw new Error('Database not connected and failed to reconnect');
        }
      } else {
        throw new Error('Database not configured');
      }
    }
    
    const result = await window.electronAPI.dbOperation('find', 'employees');
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch employees');
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('findOne', 'employees', { query: { _id: id } });
    if (result.success) {
      return result.data;
    }
    throw new Error(result.message || 'Failed to fetch employee');
  }

  async addEmployee(employee: Omit<Employee, '_id'>): Promise<Employee> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const newEmployee = {
      ...employee,
      _id: new Date().getTime().toString(), // Simple ID generation
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await window.electronAPI.dbOperation('insertOne', 'employees', newEmployee);
    if (result.success) {
      return newEmployee as Employee;
    }
    throw new Error(result.message || 'Failed to add employee');
  }

  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const updateData = {
      ...employee,
      updatedAt: new Date()
    };

    const result = await window.electronAPI.dbOperation('updateOne', 'employees', {
      filter: { _id: id },
      update: updateData
    });

    if (result.success) {
      return { ...employee, _id: id } as Employee;
    }
    throw new Error(result.message || 'Failed to update employee');
  }

  async deleteEmployee(id: string): Promise<void> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('deleteOne', 'employees', { _id: id });
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete employee');
    }
  }

  // Attendance operations
  async getAllAttendance(): Promise<AttendanceRecord[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'attendance');
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch attendance records');
  }

  async getAttendanceByEmployeeId(employeeId: string): Promise<AttendanceRecord[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'attendance', { 
      query: { employeeId } 
    });
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch employee attendance');
  }

  async addAttendanceRecord(record: Omit<AttendanceRecord, '_id'>): Promise<AttendanceRecord> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const newRecord = {
      ...record,
      _id: new Date().getTime().toString(), // Simple ID generation
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await window.electronAPI.dbOperation('insertOne', 'attendance', newRecord);
    if (result.success) {
      return newRecord as AttendanceRecord;
    }
    throw new Error(result.message || 'Failed to add attendance record');
  }

  async updateAttendanceRecord(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const updateData = {
      ...record,
      updatedAt: new Date()
    };

    const result = await window.electronAPI.dbOperation('updateOne', 'attendance', {
      filter: { _id: id },
      update: updateData
    });

    if (result.success) {
      return { ...record, _id: id } as AttendanceRecord;
    }
    throw new Error(result.message || 'Failed to update attendance record');
  }

  async deleteAttendanceRecord(id: string): Promise<void> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('deleteOne', 'attendance', { _id: id });
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete attendance record');
    }
  }

  // Utility methods
  async getEmployeeCount(): Promise<number> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('count', 'employees');
    if (result.success) {
      return result.data || 0;
    }
    throw new Error(result.message || 'Failed to count employees');
  }

  async getAttendanceCount(): Promise<number> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('count', 'attendance');
    if (result.success) {
      return result.data || 0;
    }
    throw new Error(result.message || 'Failed to count attendance records');
  }

  // Check if database is connected
  get connected(): boolean {
    return this.isConnected;
  }

  // Additional methods needed by App.tsx
  async getConfig(): Promise<DatabaseConfig | null> {
    try {
      const configStr = localStorage.getItem('database-config');
      console.log('Getting database config from localStorage:', configStr);
      if (configStr) {
        const config = JSON.parse(configStr);
        console.log('Parsed config:', config);
        return config;
      }
      console.log('No database config found in localStorage');
      return null;
    } catch (error) {
      console.error('Error reading database config:', error);
      return null;
    }
  }

  async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      const result = await this.connect(config);
      if (result.success) {
        this.isConnected = true;
        console.log('Database service connected successfully');
      }
      return result.success;
    } catch (error) {
      console.error('Test connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async saveConfig(config: DatabaseConfig): Promise<boolean> {
    try {
      console.log('Saving database config:', config);
      localStorage.setItem('database-config', JSON.stringify(config));
      console.log('Database config saved successfully');
      // Verify it was saved
      const saved = localStorage.getItem('database-config');
      console.log('Verification - saved config:', saved);
      return true;
    } catch (error) {
      console.error('Error saving database config:', error);
      return false;
    }
  }

  // Alias methods for compatibility
  async getEmployees(): Promise<Employee[]> {
    return this.getAllEmployees();
  }

  // Sales operations
  async getAllSales(): Promise<any[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'sales');
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch sales records');
  }

  async addSale(sale: any): Promise<any> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const newSale = {
      ...sale,
      _id: new Date().getTime().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await window.electronAPI.dbOperation('insertOne', 'sales', newSale);
    if (result.success) {
      return newSale;
    }
    throw new Error(result.message || 'Failed to add sale');
  }

  async updateSale(id: string, sale: any): Promise<any> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const updateData = {
      ...sale,
      updatedAt: new Date()
    };

    const result = await window.electronAPI.dbOperation('updateOne', 'sales', {
      filter: { _id: id },
      update: updateData
    });

    if (result.success) {
      return { ...sale, _id: id };
    }
    throw new Error(result.message || 'Failed to update sale');
  }

  async deleteSale(id: string): Promise<void> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('deleteOne', 'sales', { _id: id });
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete sale');
    }
  }

  // Customer operations
  async getAllCustomers(): Promise<any[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'customers');
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch customers');
  }

  async addCustomer(customer: any): Promise<any> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const newCustomer = {
      ...customer,
      _id: new Date().getTime().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await window.electronAPI.dbOperation('insertOne', 'customers', newCustomer);
    if (result.success) {
      return newCustomer;
    }
    throw new Error(result.message || 'Failed to add customer');
  }

  // Purchase operations
  async getAllPurchases(): Promise<any[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'purchases');
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch purchases');
  }

  async addPurchase(purchase: any): Promise<any> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const newPurchase = {
      ...purchase,
      _id: new Date().getTime().toString(),
      created_date: new Date(),
      last_modified: new Date()
    };

    const result = await window.electronAPI.dbOperation('insertOne', 'purchases', newPurchase);
    if (result.success) {
      return newPurchase;
    }
    throw new Error(result.message || 'Failed to add purchase');
  }

  async updatePurchase(id: string, purchase: any): Promise<any> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const updateData = {
      ...purchase,
      last_modified: new Date()
    };

    const result = await window.electronAPI.dbOperation('updateOne', 'purchases', {
      filter: { _id: id },
      update: updateData
    });

    if (result.success) {
      return { ...purchase, _id: id };
    }
    throw new Error(result.message || 'Failed to update purchase');
  }

  async deletePurchase(id: string): Promise<void> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('deleteOne', 'purchases', { _id: id });
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete purchase');
    }
  }

  // Supplier operations
  async getAllSuppliers(): Promise<any[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'suppliers');
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch suppliers');
  }

  async addSupplier(supplier: any): Promise<any> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const newSupplier = {
      ...supplier,
      _id: new Date().getTime().toString(),
      created_date: new Date(),
      last_modified: new Date()
    };

    const result = await window.electronAPI.dbOperation('insertOne', 'suppliers', newSupplier);
    if (result.success) {
      return newSupplier;
    }
    throw new Error(result.message || 'Failed to add supplier');
  }

  // Sample data seeding functions
  async seedSampleData(): Promise<void> {
    try {
      // Seed sample customers
      const sampleCustomers = [
        {
          customerId: 'CUST001',
          name: 'Rajesh Kumar',
          email: 'rajesh.kumar@techsolutions.in',
          phone: '+91-9876543210',
          address: {
            street: 'A-204, Cyber City',
            city: 'Gurgaon',
            state: 'Haryana',
            zipCode: '122002',
            country: 'India'
          },
          company: 'Tech Solutions Pvt Ltd',
          gstNumber: '07AABCT1234N1Z5',
          creditLimit: 500000,
          outstandingBalance: 0,
          status: 'active'
        },
        {
          customerId: 'CUST002',
          name: 'Priya Sharma',
          email: 'priya@innovatedesign.co.in',
          phone: '+91-8765432109',
          address: {
            street: 'B-301, IT Park',
            city: 'Pune',
            state: 'Maharashtra',
            zipCode: '411001',
            country: 'India'
          },
          company: 'Innovate Design Studio',
          gstNumber: '27AABCI9999M1Z2',
          creditLimit: 300000,
          outstandingBalance: 33040,
          status: 'active'
        }
      ];

      // Seed sample suppliers
      const sampleSuppliers = [
        {
          name: 'Tech Solutions India Pvt Ltd',
          contact_number: '+91-9876543210',
          email: 'contact@techsolutions.in',
          address: 'A-204, Cyber City, Gurgaon, Haryana 122002',
          gst_number: '07AABCT1234N1Z5',
          payment_terms: 'Net 30 days',
          category: 'Technology',
          total_purchases: 500000,
          outstanding_amount: 0
        },
        {
          name: 'FurnishCorp India Ltd',
          contact_number: '+91-8765432109',
          email: 'sales@furnishcorp.in',
          address: 'B-301, Industrial Area, Pune, Maharashtra 411001',
          gst_number: '27AABCF9876Q1Z2',
          payment_terms: 'Net 15 days',
          category: 'Furniture & Fixtures',
          total_purchases: 350000,
          outstanding_amount: 90000
        }
      ];

      // Seed sample sales
      const sampleSales = [
        {
          saleId: 'SAL001',
          customerId: 'CUST001',
          customerName: 'Rajesh Kumar',
          items: [
            { 
              productId: '1', 
              productName: 'Dell Laptop Inspiron 15', 
              quantity: 1, 
              price: 65000, 
              discount: 5000, 
              tax: 10800, 
              total: 70800 
            }
          ],
          subtotal: 65000,
          totalDiscount: 5000,
          totalTax: 10800,
          totalAmount: 70800,
          paymentMethod: 'upi',
          paymentStatus: 'paid',
          status: 'delivered',
          orderDate: new Date('2024-01-15'),
          deliveryDate: new Date('2024-01-18'),
          notes: 'Corporate bulk order',
          createdBy: 'admin'
        },
        {
          saleId: 'SAL002',
          customerId: 'CUST002',
          customerName: 'Priya Sharma',
          items: [
            { 
              productId: '2', 
              productName: 'Ergonomic Office Chair', 
              quantity: 2, 
              price: 15000, 
              discount: 2000, 
              tax: 5040, 
              total: 33040 
            }
          ],
          subtotal: 30000,
          totalDiscount: 2000,
          totalTax: 5040,
          totalAmount: 33040,
          paymentMethod: 'bank_transfer',
          paymentStatus: 'pending',
          status: 'confirmed',
          orderDate: new Date('2024-01-20'),
          notes: 'Office furniture for startup',
          createdBy: 'admin'
        }
      ];

      // Seed sample purchases
      const samplePurchases = [
        {
          purchase_id: 'PUR001',
          item_name: 'Dell Laptops - Inspiron 15',
          quantity: 5,
          unit_price: 65000,
          total_price: 325000,
          supplier_name: 'Tech Solutions India Pvt Ltd',
          supplier_contact: '+91-9876543210',
          supplier_address: 'A-204, Cyber City, Gurgaon, Haryana 122002',
          date: new Date('2024-01-15'),
          payment_method: 'Bank Transfer',
          payment_status: 'Paid',
          paid_amount: 325000,
          due_amount: 0,
          invoice_number: 'INV-TSI-001',
          delivery_date: new Date('2024-01-20'),
          category: 'Technology',
          notes: 'Bulk corporate order for new employees'
        },
        {
          purchase_id: 'PUR002',
          item_name: 'Ergonomic Office Furniture',
          quantity: 15,
          unit_price: 12000,
          total_price: 180000,
          supplier_name: 'FurnishCorp India Ltd',
          supplier_contact: '+91-8765432109',
          supplier_address: 'B-301, Industrial Area, Pune, Maharashtra 411001',
          date: new Date('2024-01-18'),
          payment_method: 'UPI',
          payment_status: 'Partial',
          paid_amount: 90000,
          due_amount: 90000,
          invoice_number: 'INV-FCI-002',
          delivery_date: new Date('2024-01-25'),
          category: 'Office Supplies',
          notes: 'Ergonomic chairs and height-adjustable desks'
        }
      ];

      // Insert sample data
      for (const customer of sampleCustomers) {
        await this.addCustomer(customer);
      }

      for (const supplier of sampleSuppliers) {
        await this.addSupplier(supplier);
      }

      for (const sale of sampleSales) {
        await this.addSale(sale);
      }

      for (const purchase of samplePurchases) {
        await this.addPurchase(purchase);
      }

      console.log('Sample data seeded successfully');
    } catch (error) {
      console.error('Error seeding sample data:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
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
}

export const databaseService = new DatabaseService();
export default databaseService;
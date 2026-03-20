import { Employee } from '../types/Employee';
import { Attendance } from '../types/Attendance';
import { DatabaseConfig } from '../types/Common';
import { SalaryHistory } from '../types/SalaryHistory';
import { EmploymentHistory } from '../types/EmploymentHistory';

// Simplified interface for UI compatibility
interface AttendanceRecord {
  _id?: string;
  employeeId: string;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in_time: string;
  check_out_time: string;
  break_time: number;
  working_hours: number;
  overtime_hours: number;
  status: 'Present' | 'Absent' | 'Leave';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PayoutRecord {
  _id?: string;
  employeeId: string;
  employee_id: string;
  employee_name: string;
  payout_type: 'wage' | 'bonus';
  period_start: string;
  period_end: string;
  payout_date: string;
  total_hours?: number;
  exception_hours?: number;
  effective_hours?: number;
  daily_wage?: number;
  calculated_amount: number;
  actual_amount: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class DatabaseService {
  private isConnected = false;

  // Connect to database
  async connect(config: DatabaseConfig): Promise<{ success: boolean; message: string }> {
    try {
      // Generate connection string from individual fields if not provided
      const connectionString = config.connectionString || 
        `mongodb+srv://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.clusterUrl}`;
      
      const result = await window.electronAPI.connectDatabase({
        connectionString,
        databaseName: config.databaseName
      });
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

  async getAttendanceByEmployeeAndDateRange(employeeId: string, startDate: string, endDate: string): Promise<any[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'attendance', { 
      query: { 
        employeeId: employeeId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      } 
    });
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch employee attendance for date range');
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

  // Payout operations
  async getAllPayouts(): Promise<PayoutRecord[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'payouts');
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch payouts');
  }

  async getPayoutsByEmployee(employeeId: string): Promise<PayoutRecord[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'payouts', { 
      query: { employeeId: employeeId } 
    });
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch employee payouts');
  }

  async getPayoutsByDateRange(startDate: string, endDate: string): Promise<PayoutRecord[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'payouts', { 
      query: { 
        payout_date: {
          $gte: startDate,
          $lte: endDate
        }
      } 
    });
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.message || 'Failed to fetch payouts for date range');
  }

  async addPayoutRecord(record: Omit<PayoutRecord, '_id'>): Promise<PayoutRecord> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const newRecord = {
      ...record,
      _id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await window.electronAPI.dbOperation('insertOne', 'payouts', newRecord);
    if (result.success) {
      return newRecord as PayoutRecord;
    }
    throw new Error(result.message || 'Failed to add payout record');
  }

  async updatePayoutRecord(id: string, record: Partial<PayoutRecord>): Promise<PayoutRecord> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const updateData = {
      ...record,
      updatedAt: new Date()
    };

    const result = await window.electronAPI.dbOperation('updateOne', 'payouts', {
      filter: { _id: id },
      update: updateData
    });

    if (result.success) {
      return { ...record, _id: id } as PayoutRecord;
    }
    throw new Error(result.message || 'Failed to update payout record');
  }

  async deletePayoutRecord(id: string): Promise<void> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('deleteOne', 'payouts', { _id: id });
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete payout record');
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
      if (configStr) {
        const config = JSON.parse(configStr);
        
        // Handle backward compatibility - if old format, convert it
        if (config.connectionString && !config.username) {
          try {
            const url = new URL(config.connectionString);
            return {
              username: decodeURIComponent(url.username || ''),
              password: decodeURIComponent(url.password || ''),
              clusterUrl: url.hostname + (url.port ? `:${url.port}` : ''),
              databaseName: config.databaseName || '',
              connectionString: config.connectionString
            };
          } catch (error) {
            console.error('Error parsing legacy connection string:', error);
            // Return default config if parsing fails
            return {
              username: '',
              password: '',
              clusterUrl: '',
              databaseName: config.databaseName || '',
              connectionString: config.connectionString
            };
          }
        }
        
        // Ensure all required fields are present
        return {
          username: config.username || '',
          password: config.password || '',
          clusterUrl: config.clusterUrl || '',
          databaseName: config.databaseName || '',
          connectionString: config.connectionString || ''
        };
      }
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
      }
      return result.success;
    } catch (error) {
      console.error('Test connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async updateConfig(config: DatabaseConfig): Promise<void> {
    try {
      // Generate connection string from individual fields
      const configWithConnectionString = {
        ...config,
        connectionString: config.connectionString || 
          `mongodb+srv://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.clusterUrl}`
      };
      
      localStorage.setItem('database-config', JSON.stringify(configWithConnectionString));
      
      // Test the new configuration
      const result = await this.connect(configWithConnectionString);
      if (result.success) {
        this.isConnected = true;
      } else {
        throw new Error('Failed to connect with new configuration: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating database config:', error);
      throw error;
    }
  }

  async saveConfig(config: DatabaseConfig): Promise<boolean> {
    try {
      // Generate connection string from individual fields if not provided
      const configWithConnectionString = {
        ...config,
        connectionString: config.connectionString || 
          `mongodb+srv://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.clusterUrl}`
      };
      
      localStorage.setItem('database-config', JSON.stringify(configWithConnectionString));
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

  // Sample data seeding functions
  async seedSampleData(): Promise<void> {
    try {
      // Sample data seeding removed - only employees and attendance data remain
      // Sales, purchases, customers, and suppliers have been removed from the application
    } catch (error) {
      console.error('Error seeding sample data:', error);
      throw error;
    }
  }

  // ==================== SALARY HISTORY OPERATIONS ====================
  
  async getSalaryHistory(employeeId: string): Promise<SalaryHistory[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'salary_history', { 
      query: { employee_id: employeeId } 
    });
    if (result.success) {
      // Sort by effective_date descending (newest first)
      const history = result.data || [];
      return history.sort((a: any, b: any) => 
        new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
      );
    }
    throw new Error(result.message || 'Failed to fetch salary history');
  }

  async getAllSalaryHistory(): Promise<SalaryHistory[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'salary_history');
    if (result.success) {
      const history = result.data || [];
      return history.sort((a: any, b: any) => 
        new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
      );
    }
    throw new Error(result.message || 'Failed to fetch salary history');
  }

  async addSalaryHistory(salaryHistory: Omit<SalaryHistory, '_id'>): Promise<SalaryHistory> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const newSalaryHistory = {
      ...salaryHistory,
      _id: new Date().getTime().toString(),
      created_date: new Date()
    };

    const result = await window.electronAPI.dbOperation('insertOne', 'salary_history', newSalaryHistory);
    if (result.success) {
      return newSalaryHistory as SalaryHistory;
    }
    throw new Error(result.message || 'Failed to add salary history');
  }

  async changeSalary(
    employeeId: string, 
    newSalary: number, 
    effectiveDate: Date,
    reason: string,
    approvedBy: string,
    notes?: string
  ): Promise<{ success: boolean; salaryHistory: SalaryHistory; updatedEmployee: Employee }> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    try {
      // Get current employee data
      const employee = await this.getEmployeeById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const currentSalary = employee.current_salary || employee.salary || 0;

      // Calculate changes
      const changeAmount = newSalary - currentSalary;
      const changePercentage = currentSalary > 0 ? ((changeAmount / currentSalary) * 100) : 0;

      // Create salary history entry
      const salaryHistory: Omit<SalaryHistory, '_id'> = {
        employee_id: employeeId,
        emp_id: employee.employee_id,
        employee_name: employee.name,
        previous_salary: currentSalary,
        new_salary: newSalary,
        change_amount: changeAmount,
        change_percentage: changePercentage,
        effective_date: effectiveDate,
        reason,
        approved_by: approvedBy,
        notes,
        created_date: new Date()
      };

      // Add salary history record
      const savedHistory = await this.addSalaryHistory(salaryHistory);

      // Update employee's current salary and last review date
      const updatedEmployee = await this.updateEmployee(employeeId, {
        current_salary: newSalary,
        salary: newSalary, // For backward compatibility
        last_salary_review_date: effectiveDate,
        last_modified: new Date()
      });

      return {
        success: true,
        salaryHistory: savedHistory,
        updatedEmployee
      };
    } catch (error) {
      console.error('Error changing salary:', error);
      throw error;
    }
  }

  // ==================== EMPLOYMENT HISTORY OPERATIONS ====================
  
  async getEmploymentHistory(employeeId: string): Promise<EmploymentHistory[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'employment_history', { 
      query: { employee_id: employeeId } 
    });
    if (result.success) {
      // Sort by event_date descending (newest first)
      const history = result.data || [];
      return history.sort((a: any, b: any) => 
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      );
    }
    throw new Error(result.message || 'Failed to fetch employment history');
  }

  async getAllEmploymentHistory(): Promise<EmploymentHistory[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const result = await window.electronAPI.dbOperation('find', 'employment_history');
    if (result.success) {
      const history = result.data || [];
      return history.sort((a: any, b: any) => 
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      );
    }
    throw new Error(result.message || 'Failed to fetch employment history');
  }

  async addEmploymentHistory(employmentHistory: Omit<EmploymentHistory, '_id'>): Promise<EmploymentHistory> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const newEmploymentHistory = {
      ...employmentHistory,
      _id: new Date().getTime().toString(),
      created_date: new Date()
    };

    const result = await window.electronAPI.dbOperation('insertOne', 'employment_history', newEmploymentHistory);
    if (result.success) {
      return newEmploymentHistory as EmploymentHistory;
    }
    throw new Error(result.message || 'Failed to add employment history');
  }

  async changeEmploymentStatus(
    employeeId: string,
    newStatus: 'active' | 'resigned' | 'terminated' | 'retired' | 'on_leave',
    eventDate: Date,
    effectiveDate: Date,
    reason: string,
    processedBy: string,
    lastWorkingDay?: Date,
    noticePeriodServed?: boolean,
    exitInterviewNotes?: string,
    notes?: string
  ): Promise<{ success: boolean; employmentHistory: EmploymentHistory; updatedEmployee: Employee }> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    try {
      // Get current employee data
      const employee = await this.getEmployeeById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const previousStatus = employee.employment_status || (employee.is_active ? 'active' : 'inactive');
      
      // Determine event type based on new status
      let eventType: 'hired' | 'resigned' | 'terminated' | 'retired' | 'status_change' = 'status_change';
      if (newStatus === 'resigned') eventType = 'resigned';
      else if (newStatus === 'terminated') eventType = 'terminated';
      else if (newStatus === 'retired') eventType = 'retired';

      // Create employment history entry
      const employmentHistory: Omit<EmploymentHistory, '_id'> = {
        employee_id: employeeId,
        emp_id: employee.employee_id,
        employee_name: employee.name,
        event_type: eventType,
        previous_status: previousStatus,
        new_status: newStatus,
        event_date: eventDate,
        effective_date: effectiveDate,
        reason,
        last_working_day: lastWorkingDay,
        notice_period_served: noticePeriodServed,
        exit_interview_notes: exitInterviewNotes,
        notes,
        processed_by: processedBy,
        created_date: new Date()
      };

      // Add employment history record
      const savedHistory = await this.addEmploymentHistory(employmentHistory);

      // Update employee's status
      const updateData: Partial<Employee> = {
        employment_status: newStatus,
        is_active: newStatus === 'active', // For backward compatibility
        last_modified: new Date()
      };

      // If employee is leaving, set termination details
      if (newStatus !== 'active') {
        updateData.termination_date = lastWorkingDay || effectiveDate;
        updateData.termination_reason = reason;
      }

      const updatedEmployee = await this.updateEmployee(employeeId, updateData);

      return {
        success: true,
        employmentHistory: savedHistory,
        updatedEmployee
      };
    } catch (error) {
      console.error('Error changing employment status:', error);
      throw error;
    }
  }

  // Helper method to get employees needing salary review (> 12 months since last review)
  async getEmployeesNeedingSalaryReview(): Promise<Employee[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const employees = await this.getAllEmployees();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    return employees.filter(emp => {
      // Only active employees need reviews
      if (emp.employment_status !== 'active' && !emp.is_active) return false;
      
      // If never reviewed, or last review was > 12 months ago
      if (!emp.last_salary_review_date) return true;
      
      const lastReview = new Date(emp.last_salary_review_date);
      return lastReview < twelveMonthsAgo;
    });
  }

  // Helper method to get attrition statistics
  async getAttritionStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    resigned: number;
    terminated: number;
    retired: number;
    averageTenure: number;
  }> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const allHistory = await this.getAllEmploymentHistory();
    
    // Filter by date range if provided
    let filteredHistory = allHistory;
    if (startDate || endDate) {
      filteredHistory = allHistory.filter(record => {
        const eventDate = new Date(record.event_date);
        if (startDate && eventDate < startDate) return false;
        if (endDate && eventDate > endDate) return false;
        return true;
      });
    }

    // Count by type
    const resigned = filteredHistory.filter(r => r.event_type === 'resigned').length;
    const terminated = filteredHistory.filter(r => r.event_type === 'terminated').length;
    const retired = filteredHistory.filter(r => r.event_type === 'retired').length;

    // Calculate average tenure for departed employees
    let totalTenure = 0;
    let count = 0;
    
    for (const record of filteredHistory) {
      if (record.event_type !== 'hired') {
        // Get employee to calculate tenure
        try {
          const emp = await this.getEmployeeById(record.employee_id);
          if (emp && emp.hire_date) {
            const tenure = (new Date(record.event_date).getTime() - new Date(emp.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
            totalTenure += tenure;
            count++;
          }
        } catch (error) {
          console.warn('Could not calculate tenure for employee:', record.employee_id);
        }
      }
    }

    return {
      total: resigned + terminated + retired,
      resigned,
      terminated,
      retired,
      averageTenure: count > 0 ? totalTenure / count : 0
    };
  }
}

// Utility functions for database configuration
export const generateConnectionString = (config: DatabaseConfig): string => {
  const { username, password, clusterUrl } = config;
  if (!username || !password || !clusterUrl) {
    throw new Error('Missing required connection parameters');
  }
  return `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${clusterUrl}`;
};

export const parseConnectionString = (connectionString: string): Partial<DatabaseConfig> => {
  try {
    const url = new URL(connectionString);
    return {
      username: decodeURIComponent(url.username || ''),
      password: decodeURIComponent(url.password || ''),
      clusterUrl: url.hostname + (url.port ? `:${url.port}` : ''),
      connectionString
    };
  } catch (error) {
    console.error('Error parsing connection string:', error);
    return {};
  }
};

export const prepareConfigForConnection = (config: DatabaseConfig): DatabaseConfig => {
  const connectionString = config.connectionString || generateConnectionString(config);
  return {
    ...config,
    connectionString
  };
};

export type { PayoutRecord };
export const databaseService = new DatabaseService();
export default databaseService;
// Employee data model matching Python Employee class
import { FormValidator } from '../utils/validation';

export interface Employee {
  _id?: string;
  employee_id: string;
  name: string;
  position: string;
  phone: string;
  hire_date: Date;
  daily_wage: number;               // Daily wage for the employee
  employment_status: 'active' | 'resigned' | 'terminated' | 'retired' | 'on_leave';
  termination_date?: Date;          // Date when employment ended
  termination_reason?: string;      // Reason for leaving
  last_salary_review_date?: Date;   // Last time salary was reviewed/changed
  created_at: Date;
  updated_at: Date;
}

export class EmployeeModel implements Employee {
  _id?: string;
  employee_id: string;
  name: string;
  position: string;
  phone: string;
  hire_date: Date;
  daily_wage: number;
  employment_status: 'active' | 'resigned' | 'terminated' | 'retired' | 'on_leave';
  termination_date?: Date;
  termination_reason?: string;
  last_salary_review_date?: Date;
  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<Employee> = {}) {
    this._id = data._id;
    this.employee_id = data.employee_id || '';
    this.name = data.name || '';
    this.position = data.position || '';
    this.phone = data.phone || '';
    this.hire_date = data.hire_date || new Date();
    this.daily_wage = data.daily_wage || 0;
    this.employment_status = data.employment_status || 'active';
    this.termination_date = data.termination_date;
    this.termination_reason = data.termination_reason;
    this.last_salary_review_date = data.last_salary_review_date;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Convert to MongoDB document
  toDocument(): any {
    return {
      ...this,
      hire_date: this.hire_date.toISOString(),
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString(),
    };
  }

  // Create from MongoDB document
  static fromDocument(doc: any): EmployeeModel {
    return new EmployeeModel({
      ...doc,
      hire_date: new Date(doc.hire_date),
      created_at: new Date(doc.created_at),
      updated_at: new Date(doc.updated_at),
    });
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const validator = new FormValidator();
    
    validator
      .required(this.employee_id, 'employee_id', 'Employee ID is required')
      .required(this.name, 'name', 'Name is required')
      .required(this.position, 'position', 'Position is required')
      .min(this.daily_wage, 0, 'daily_wage', 'Daily wage cannot be negative');

    const validationErrors = validator.getErrors();
    return {
      isValid: Object.keys(validationErrors).length === 0,
      errors: Object.values(validationErrors)
    };
  }
}

// Salary History data model
import { FormValidator } from '../utils/validation';

export interface SalaryHistory {
  _id?: string;
  employee_id: string;              // Reference to employee._id
  emp_id: string;                   // Employee ID for easy lookup
  employee_name: string;            // Denormalized for reports
  previous_salary: number;
  new_salary: number;
  change_amount: number;            // Calculated: new - previous
  change_percentage: number;        // Calculated: (change/previous) * 100
  effective_date: Date;             // When change takes effect
  reason: string;                   // "Annual Increment", "Promotion", "Performance Bonus", etc.
  approved_by: string;              // Manager/HR name
  notes?: string;
  created_date: Date;
}

export interface SalaryHistoryFormData {
  employee_id: string;
  new_salary: number;
  effective_date: string;
  reason: string;
  approved_by: string;
  notes?: string;
}

export class SalaryHistoryModel implements SalaryHistory {
  _id?: string;
  employee_id: string;
  emp_id: string;
  employee_name: string;
  previous_salary: number;
  new_salary: number;
  change_amount: number;
  change_percentage: number;
  effective_date: Date;
  reason: string;
  approved_by: string;
  notes?: string;
  created_date: Date;

  constructor(data: Partial<SalaryHistory> = {}) {
    this._id = data._id;
    this.employee_id = data.employee_id || '';
    this.emp_id = data.emp_id || '';
    this.employee_name = data.employee_name || '';
    this.previous_salary = data.previous_salary || 0;
    this.new_salary = data.new_salary || 0;
    this.change_amount = data.change_amount || (this.new_salary - this.previous_salary);
    this.change_percentage = data.change_percentage || 
      (this.previous_salary > 0 ? ((this.new_salary - this.previous_salary) / this.previous_salary) * 100 : 0);
    this.effective_date = data.effective_date || new Date();
    this.reason = data.reason || '';
    this.approved_by = data.approved_by || '';
    this.notes = data.notes;
    this.created_date = data.created_date || new Date();
  }

  // Calculate change values
  calculateChanges() {
    this.change_amount = this.new_salary - this.previous_salary;
    this.change_percentage = this.previous_salary > 0 
      ? ((this.new_salary - this.previous_salary) / this.previous_salary) * 100 
      : 0;
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const validator = new FormValidator();
    
    validator
      .required(this.employee_id, 'employee_id', 'Employee is required')
      .required(this.emp_id, 'emp_id', 'Employee ID is required')
      .required(this.employee_name, 'employee_name', 'Employee name is required')
      .min(this.new_salary, 0.01, 'new_salary', 'New salary must be greater than 0')
      .required(this.reason, 'reason', 'Reason is required')
      .required(this.approved_by, 'approved_by', 'Approver name is required');

    const validationErrors = validator.getErrors();
    return {
      isValid: Object.keys(validationErrors).length === 0,
      errors: Object.values(validationErrors)
    };
  }

  // Convert to MongoDB document
  toDocument(): any {
    return {
      ...this,
      effective_date: this.effective_date.toISOString(),
      created_date: this.created_date.toISOString()
    };
  }

  // Create from MongoDB document
  static fromDocument(doc: any): SalaryHistoryModel {
    return new SalaryHistoryModel({
      ...doc,
      _id: doc._id?.toString(),
      effective_date: new Date(doc.effective_date),
      created_date: new Date(doc.created_date)
    });
  }
}

// Salary change reasons (for dropdown)
export const SALARY_CHANGE_REASONS = [
  'Annual Increment',
  'Promotion',
  'Performance Bonus',
  'Market Adjustment',
  'Cost of Living Adjustment',
  'Special Recognition',
  'Contract Renewal',
  'Other'
] as const;

export type SalaryChangeReason = typeof SALARY_CHANGE_REASONS[number];

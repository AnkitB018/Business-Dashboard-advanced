// Employment History data model
import { FormValidator } from '../utils/validation';

export interface EmploymentHistory {
  _id?: string;
  employee_id: string;              // Reference to employee._id
  emp_id: string;                   // Employee ID for easy lookup
  employee_name: string;            // Denormalized for reports
  event_type: 'hired' | 'resigned' | 'terminated' | 'retired' | 'status_change';
  previous_status?: string;
  new_status: string;
  event_date: Date;                 // When the event occurred
  reason?: string;                  // Reason for the change
  last_working_day?: Date;          // For resignations/terminations
  notes?: string;                   // Additional notes
  processed_by: string;             // HR/Manager who processed
  created_date: Date;
}

export interface EmploymentHistoryFormData {
  employee_id: string;
  event_type: 'resigned' | 'terminated' | 'retired';
  new_status: string;
  event_date: string;
  reason: string;
  last_working_day?: string;
  notes?: string;
  processed_by: string;
}

export class EmploymentHistoryModel implements EmploymentHistory {
  _id?: string;
  employee_id: string;
  emp_id: string;
  employee_name: string;
  event_type: 'hired' | 'resigned' | 'terminated' | 'retired' | 'status_change';
  previous_status?: string;
  new_status: string;
  event_date: Date;
  reason?: string;
  last_working_day?: Date;
  notes?: string;
  processed_by: string;
  created_date: Date;

  constructor(data: Partial<EmploymentHistory> = {}) {
    this._id = data._id;
    this.employee_id = data.employee_id || '';
    this.emp_id = data.emp_id || '';
    this.employee_name = data.employee_name || '';
    this.event_type = data.event_type || 'status_change';
    this.previous_status = data.previous_status;
    this.new_status = data.new_status || '';
    this.event_date = data.event_date || new Date();
    this.reason = data.reason;
    this.last_working_day = data.last_working_day;
    this.notes = data.notes;
    this.processed_by = data.processed_by || '';
    this.created_date = data.created_date || new Date();
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const validator = new FormValidator();
    
    validator
      .required(this.employee_id, 'employee_id', 'Employee is required')
      .required(this.emp_id, 'emp_id', 'Employee ID is required')
      .required(this.employee_name, 'employee_name', 'Employee name is required')
      .required(this.new_status, 'new_status', 'New status is required')
      .required(this.processed_by, 'processed_by', 'Processor name is required');

    // Require reason for terminations and resignations
    if ((this.event_type === 'resigned' || this.event_type === 'terminated') && !this.reason) {
      validator.custom(true, 'reason', 'Reason is required for resignation/termination');
    }

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
      event_date: this.event_date.toISOString(),
      last_working_day: this.last_working_day?.toISOString(),
      created_date: this.created_date.toISOString()
    };
  }

  // Create from MongoDB document
  static fromDocument(doc: any): EmploymentHistoryModel {
    return new EmploymentHistoryModel({
      ...doc,
      _id: doc._id?.toString(),
      event_date: new Date(doc.event_date),
      last_working_day: doc.last_working_day ? new Date(doc.last_working_day) : undefined,
      created_date: new Date(doc.created_date)
    });
  }
}

// Employment event types (for UI)
export const EMPLOYMENT_EVENT_TYPES = {
  hired: { label: 'Hired', color: 'success', icon: '👋' },
  resigned: { label: 'Resigned', color: 'warning', icon: '👋' },
  terminated: { label: 'Terminated', color: 'error', icon: '🚫' },
  retired: { label: 'Retired', color: 'info', icon: '🎉' },
  status_change: { label: 'Status Change', color: 'default', icon: '🔄' }
} as const;

// Employment statuses (for dropdown)
export const EMPLOYMENT_STATUSES = [
  'active',
  'resigned',
  'terminated',
  'retired',
  'on_leave'
] as const;

export type EmploymentStatus = typeof EMPLOYMENT_STATUSES[number];

// Termination reasons (for dropdown)
export const TERMINATION_REASONS = [
  'Better Opportunity',
  'Performance Issues',
  'Personal Reasons',
  'Health Issues',
  'Retirement',
  'Other'
] as const;

export type TerminationReason = typeof TERMINATION_REASONS[number];

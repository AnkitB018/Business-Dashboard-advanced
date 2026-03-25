/**
 * Shared validation utilities for form validation across the application
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (supports international formats)
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

// Validation error type
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Base validator class for common validation operations
 */
export class FormValidator {
  private errors: ValidationErrors = {};

  /**
   * Validate required field
   */
  required(value: any, fieldName: string, customMessage?: string): this {
    if (value === undefined || value === null || value === '') {
      this.errors[fieldName] = customMessage || `${fieldName} is required`;
    } else if (typeof value === 'string' && !value.trim()) {
      this.errors[fieldName] = customMessage || `${fieldName} is required`;
    }
    return this;
  }

  /**
   * Validate email format
   */
  email(value: string, fieldName: string = 'email', customMessage?: string): this {
    if (value && !EMAIL_REGEX.test(value)) {
      this.errors[fieldName] = customMessage || 'Invalid email format';
    }
    return this;
  }

  /**
   * Validate phone number format
   */
  phone(value: string, fieldName: string = 'phone', customMessage?: string): this {
    if (value) {
      const cleanedPhone = value.replace(/[\s\-\(\)]/g, '');
      if (!PHONE_REGEX.test(cleanedPhone)) {
        this.errors[fieldName] = customMessage || 'Invalid phone number format';
      }
    }
    return this;
  }

  /**
   * Validate minimum value for numbers
   */
  min(value: number, minValue: number, fieldName: string, customMessage?: string): this {
    if (value !== undefined && value < minValue) {
      this.errors[fieldName] = customMessage || `${fieldName} must be at least ${minValue}`;
    }
    return this;
  }

  /**
   * Validate maximum value for numbers
   */
  max(value: number, maxValue: number, fieldName: string, customMessage?: string): this {
    if (value !== undefined && value > maxValue) {
      this.errors[fieldName] = customMessage || `${fieldName} must be at most ${maxValue}`;
    }
    return this;
  }

  /**
   * Validate minimum length for strings
   */
  minLength(value: string, minLength: number, fieldName: string, customMessage?: string): this {
    if (value && value.length < minLength) {
      this.errors[fieldName] = customMessage || `${fieldName} must be at least ${minLength} characters`;
    }
    return this;
  }

  /**
   * Validate maximum length for strings
   */
  maxLength(value: string, maxLength: number, fieldName: string, customMessage?: string): this {
    if (value && value.length > maxLength) {
      this.errors[fieldName] = customMessage || `${fieldName} must be at most ${maxLength} characters`;
    }
    return this;
  }

  /**
   * Custom validation rule
   */
  custom(condition: boolean, fieldName: string, message: string): this {
    if (condition) {
      this.errors[fieldName] = message;
    }
    return this;
  }

  /**
   * Validate that a value matches another value
   */
  matches(value: any, matchValue: any, fieldName: string, customMessage?: string): this {
    if (value !== matchValue) {
      this.errors[fieldName] = customMessage || `${fieldName} does not match`;
    }
    return this;
  }

  /**
   * Check if form is valid
   */
  isValid(): boolean {
    return Object.keys(this.errors).length === 0;
  }

  /**
   * Get all errors
   */
  getErrors(): ValidationErrors {
    return this.errors;
  }

  /**
   * Clear all errors
   */
  clear(): this {
    this.errors = {};
    return this;
  }

  /**
   * Clear specific field error
   */
  clearField(fieldName: string): this {
    delete this.errors[fieldName];
    return this;
  }
}

/**
 * Standalone validation functions
 */

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  if (typeof value === 'string' && !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return null;
  return EMAIL_REGEX.test(email) ? null : 'Invalid email format';
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return null;
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  return PHONE_REGEX.test(cleanedPhone) ? null : 'Invalid phone number format';
};

export const validateMinValue = (value: number, min: number, fieldName: string): string | null => {
  if (value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  return null;
};

export const validateMaxValue = (value: number, max: number, fieldName: string): string | null => {
  if (value > max) {
    return `${fieldName} must be at most ${max}`;
  }
  return null;
};

export const validateRange = (value: number, min: number, max: number, fieldName: string): string | null => {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};

/**
 * Date validation utilities
 */

export const validateDateAfter = (date: Date, afterDate: Date, fieldName: string): string | null => {
  if (date <= afterDate) {
    return `${fieldName} must be after ${afterDate.toLocaleDateString()}`;
  }
  return null;
};

export const validateDateBefore = (date: Date, beforeDate: Date, fieldName: string): string | null => {
  if (date >= beforeDate) {
    return `${fieldName} must be before ${beforeDate.toLocaleDateString()}`;
  }
  return null;
};

export const validateTimeAfter = (time: string, afterTime: string, date: string, fieldName: string): string | null => {
  const timeDate = new Date(`${date}T${time}`);
  const afterTimeDate = new Date(`${date}T${afterTime}`);
  
  if (timeDate <= afterTimeDate) {
    return `${fieldName} must be after ${afterTime}`;
  }
  return null;
};

/**
 * Helper hook for form validation state management
 */
export const useFormErrors = () => {
  const [errors, setErrors] = React.useState<ValidationErrors>({});

  const setError = (fieldName: string, message: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: message }));
  };

  const clearError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const hasErrors = () => {
    return Object.keys(errors).length > 0;
  };

  return {
    errors,
    setErrors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors
  };
};

// Note: React import needed for useFormErrors hook
import React from 'react';

/**
 * Batch validation helper
 * Validates multiple fields at once and returns all errors
 */
export const validateFields = (validations: Array<{ 
  field: string; 
  validate: () => string | null 
}>): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  validations.forEach(({ field, validate }) => {
    const error = validate();
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
};

/**
 * Employee-specific validators
 */
export const validateEmployee = (data: any): ValidationErrors => {
  const validator = new FormValidator();
  
  validator
    .required(data.employee_id, 'employee_id', 'Employee ID is required')
    .required(data.name, 'name', 'Name is required')
    .required(data.position, 'position', 'Position is required')
    .required(data.phone, 'phone', 'Phone is required')
    .phone(data.phone, 'phone');
  
  if (data.daily_wage !== undefined && data.daily_wage <= 0) {
    validator.custom(true, 'daily_wage', 'Daily wage must be greater than 0');
  }
  
  return validator.getErrors();
};

/**
 * Attendance-specific validators
 */
export const validateAttendance = (data: any): ValidationErrors => {
  const validator = new FormValidator();
  
  validator
    .required(data.employee_id, 'employee_id', 'Employee is required')
    .required(data.time_in, 'time_in', 'Check-in time is required');
  
  if (data.time_out && data.time_in) {
    const checkIn = new Date(`${data.date}T${data.time_in}`);
    const checkOut = new Date(`${data.date}T${data.time_out}`);
    
    if (checkOut <= checkIn) {
      validator.custom(true, 'time_out', 'Check-out time must be after check-in time');
    }
  }
  
  return validator.getErrors();
};

/**
 * Database config validators
 */
export const validateDatabaseConfig = (data: any): ValidationErrors => {
  const validator = new FormValidator();
  
  validator
    .required(data.host, 'host', 'Host is required')
    .required(data.database, 'database', 'Database name is required')
    .required(data.username, 'username', 'Username is required')
    .required(data.password, 'password', 'Password is required');
  
  if (data.host && !data.host.includes('mongodb.net') && !data.host.includes('localhost')) {
    validator.custom(true, 'host', 'Please enter a valid MongoDB Atlas host or localhost');
  }
  
  return validator.getErrors();
};

/**
 * Salary change validators
 */
export const validateSalaryChange = (data: any, currentSalary: number): ValidationErrors => {
  const validator = new FormValidator();
  
  validator
    .required(data.new_salary, 'new_salary', 'New salary is required')
    .min(data.new_salary, 0.01, 'new_salary', 'New salary must be greater than 0')
    .required(data.reason, 'reason', 'Reason for salary change is required')
    .required(data.approved_by, 'approved_by', 'Approver name is required');

  // Warn if salary is decreasing
  if (data.new_salary && currentSalary && data.new_salary < currentSalary) {
    validator.custom(
      !data.reason || data.reason.trim().length < 10,
      'reason',
      'Salary decrease requires detailed explanation (min 10 characters)'
    );
  }

  return validator.getErrors();
};

/**
 * Employment status change validators
 */
export const validateEmploymentStatusChange = (data: any): ValidationErrors => {
  const validator = new FormValidator();
  
  validator
    .required(data.new_status, 'new_status', 'New status is required')
    .required(data.event_date, 'event_date', 'Event date is required')
    .required(data.processed_by, 'processed_by', 'Processor name is required');

  // Require reason for resignations, terminations, and retirements
  if (['resigned', 'terminated', 'retired'].includes(data.new_status)) {
    validator.required(data.reason, 'reason', 'Reason is required for this status change');
  }

  // For resignations and terminations, require last working day
  if (['resigned', 'terminated'].includes(data.new_status)) {
    validator.required(data.last_working_day, 'last_working_day', 'Last working day is required');
  }

  return validator.getErrors();
};

export default FormValidator;

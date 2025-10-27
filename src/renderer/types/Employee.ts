// Employee data model matching Python Employee class
export interface Employee {
  _id?: string;
  emp_id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  hire_date: Date;
  salary: number;
  is_active: boolean;
  created_date: Date;
  last_modified: Date;
}

export class EmployeeModel implements Employee {
  _id?: string;
  emp_id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  hire_date: Date;
  salary: number;
  is_active: boolean;
  created_date: Date;
  last_modified: Date;

  constructor(data: Partial<Employee> = {}) {
    this._id = data._id;
    this.emp_id = data.emp_id || '';
    this.name = data.name || '';
    this.position = data.position || '';
    this.department = data.department || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.hire_date = data.hire_date || new Date();
    this.salary = data.salary || 0;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_date = data.created_date || new Date();
    this.last_modified = data.last_modified || new Date();
  }

  // Convert to MongoDB document
  toDocument(): any {
    return {
      ...this,
      hire_date: this.hire_date.toISOString(),
      created_date: this.created_date.toISOString(),
      last_modified: this.last_modified.toISOString(),
    };
  }

  // Create from MongoDB document
  static fromDocument(doc: any): EmployeeModel {
    return new EmployeeModel({
      ...doc,
      hire_date: new Date(doc.hire_date),
      created_date: new Date(doc.created_date),
      last_modified: new Date(doc.last_modified),
    });
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.emp_id.trim()) errors.push('Employee ID is required');
    if (!this.name.trim()) errors.push('Name is required');
    if (!this.position.trim()) errors.push('Position is required');
    if (!this.department.trim()) errors.push('Department is required');
    if (this.email && !this.isValidEmail(this.email)) errors.push('Invalid email format');
    if (this.salary < 0) errors.push('Salary cannot be negative');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

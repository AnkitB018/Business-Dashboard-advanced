// Sales data model matching Python Sales class
export interface Sale {
  _id?: string;
  order_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  date: Date;
  payment_method?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  advance_payment?: number;
  due_amount?: number;
  order_status?: 'Complete' | 'Incomplete' | 'Pending';
  due_date?: Date;
  notes?: string;
  created_date: Date;
  last_modified: Date;
}

export class SaleModel implements Sale {
  _id?: string;
  order_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  date: Date;
  payment_method?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  advance_payment?: number;
  due_amount?: number;
  order_status?: 'Complete' | 'Incomplete' | 'Pending';
  due_date?: Date;
  notes?: string;
  created_date: Date;
  last_modified: Date;

  constructor(data: Partial<Sale> = {}) {
    this._id = data._id;
    this.order_id = data.order_id || this.generateOrderId();
    this.item_name = data.item_name || '';
    this.quantity = data.quantity || 0;
    this.unit_price = data.unit_price || 0;
    this.total_price = data.total_price || (this.quantity * this.unit_price);
    this.customer_name = data.customer_name || '';
    this.customer_phone = data.customer_phone;
    this.customer_address = data.customer_address;
    this.date = data.date || new Date();
    this.payment_method = data.payment_method || 'Cash';
    this.advance_payment = data.advance_payment || 0;
    this.due_amount = data.due_amount || (this.total_price - (this.advance_payment || 0));
    this.order_status = this.calculateOrderStatus();
    this.due_date = data.due_date;
    this.notes = data.notes || '';
    this.created_date = data.created_date || new Date();
    this.last_modified = data.last_modified || new Date();
  }

  private generateOrderId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `ORD${timestamp}${random}`;
  }

  private calculateOrderStatus(): 'Complete' | 'Incomplete' | 'Pending' {
    if (this.due_amount === 0) return 'Complete';
    if (this.advance_payment && this.advance_payment > 0) return 'Incomplete';
    return 'Pending';
  }

  calculateTotals() {
    this.total_price = this.quantity * this.unit_price;
    this.due_amount = this.total_price - (this.advance_payment || 0);
    this.order_status = this.calculateOrderStatus();
    this.last_modified = new Date();
  }

  // Convert to MongoDB document
  toDocument(): any {
    return {
      ...this,
      date: this.date.toISOString(),
      due_date: this.due_date?.toISOString(),
      created_date: this.created_date.toISOString(),
      last_modified: this.last_modified.toISOString()
    };
  }

  // Create from MongoDB document
  static fromDocument(doc: any): SaleModel {
    return new SaleModel({
      ...doc,
      _id: doc._id?.toString(),
      date: new Date(doc.date),
      due_date: doc.due_date ? new Date(doc.due_date) : undefined,
      created_date: new Date(doc.created_date),
      last_modified: new Date(doc.last_modified)
    });
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.item_name.trim()) {
      errors.push('Item name is required');
    }

    if (this.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (this.unit_price <= 0) {
      errors.push('Unit price must be greater than 0');
    }

    if (!this.customer_name.trim()) {
      errors.push('Customer name is required');
    }

    if (this.advance_payment && this.advance_payment < 0) {
      errors.push('Advance payment cannot be negative');
    }

    if (this.advance_payment && this.advance_payment > this.total_price) {
      errors.push('Advance payment cannot exceed total price');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Customer data model for sales management
export interface Customer {
  _id?: string;
  name: string;
  contact_number: string;
  email?: string;
  address?: string;
  gst_number?: string;
  due_payment: number;
  total_orders: number;
  created_date: Date;
  last_modified: Date;
}

export class CustomerModel implements Customer {
  _id?: string;
  name: string;
  contact_number: string;
  email?: string;
  address?: string;
  gst_number?: string;
  due_payment: number;
  total_orders: number;
  created_date: Date;
  last_modified: Date;

  constructor(data: Partial<Customer> = {}) {
    this._id = data._id;
    this.name = data.name || '';
    this.contact_number = data.contact_number || '';
    this.email = data.email;
    this.address = data.address;
    this.gst_number = data.gst_number;
    this.due_payment = data.due_payment || 0;
    this.total_orders = data.total_orders || 0;
    this.created_date = data.created_date || new Date();
    this.last_modified = data.last_modified || new Date();
  }

  // Convert to MongoDB document
  toDocument(): any {
    return {
      ...this,
      created_date: this.created_date.toISOString(),
      last_modified: this.last_modified.toISOString()
    };
  }

  // Create from MongoDB document
  static fromDocument(doc: any): CustomerModel {
    return new CustomerModel({
      ...doc,
      _id: doc._id?.toString(),
      created_date: new Date(doc.created_date),
      last_modified: new Date(doc.last_modified)
    });
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name.trim()) {
      errors.push('Customer name is required');
    }

    if (!this.contact_number.trim()) {
      errors.push('Contact number is required');
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (this.contact_number && !phoneRegex.test(this.contact_number.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Invalid contact number format');
    }

    // Basic email validation if provided
    if (this.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        errors.push('Invalid email format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Transaction data model for payment tracking
export interface Transaction {
  _id?: string;
  transaction_id: string;
  order_id: string;
  customer_name: string;
  amount: number;
  payment_method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  transaction_date: Date;
  notes?: string;
  created_date: Date;
}

export class TransactionModel implements Transaction {
  _id?: string;
  transaction_id: string;
  order_id: string;
  customer_name: string;
  amount: number;
  payment_method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  transaction_date: Date;
  notes?: string;
  created_date: Date;

  constructor(data: Partial<Transaction> = {}) {
    this._id = data._id;
    this.transaction_id = data.transaction_id || this.generateTransactionId();
    this.order_id = data.order_id || '';
    this.customer_name = data.customer_name || '';
    this.amount = data.amount || 0;
    this.payment_method = data.payment_method || 'Cash';
    this.transaction_date = data.transaction_date || new Date();
    this.notes = data.notes;
    this.created_date = data.created_date || new Date();
  }

  private generateTransactionId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `TXN${timestamp}${random}`;
  }

  // Convert to MongoDB document
  toDocument(): any {
    return {
      ...this,
      transaction_date: this.transaction_date.toISOString(),
      created_date: this.created_date.toISOString()
    };
  }

  // Create from MongoDB document
  static fromDocument(doc: any): TransactionModel {
    return new TransactionModel({
      ...doc,
      _id: doc._id?.toString(),
      transaction_date: new Date(doc.transaction_date),
      created_date: new Date(doc.created_date)
    });
  }
}
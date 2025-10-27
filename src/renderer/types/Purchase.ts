// Purchase data model matching Python Purchase class
export interface Purchase {
  _id?: string;
  purchase_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier_name: string;
  supplier_contact?: string;
  supplier_address?: string;
  date: Date;
  payment_method?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  payment_status: 'Paid' | 'Outstanding' | 'Partial';
  paid_amount?: number;
  due_amount?: number;
  invoice_number?: string;
  delivery_date?: Date;
  category?: string;
  notes?: string;
  created_date: Date;
  last_modified: Date;
}

export interface PurchaseFormData {
  item_name: string;
  quantity: number;
  unit_price: number;
  supplier_name: string;
  supplier_contact?: string;
  supplier_address?: string;
  date: string;
  payment_method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  payment_status: 'Paid' | 'Outstanding' | 'Partial';
  paid_amount?: number;
  invoice_number?: string;
  delivery_date?: string;
  category?: string;
  notes?: string;
}

export class PurchaseModel implements Purchase {
  _id?: string;
  purchase_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier_name: string;
  supplier_contact?: string;
  supplier_address?: string;
  date: Date;
  payment_method?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque';
  payment_status: 'Paid' | 'Outstanding' | 'Partial';
  paid_amount?: number;
  due_amount?: number;
  invoice_number?: string;
  delivery_date?: Date;
  category?: string;
  notes?: string;
  created_date: Date;
  last_modified: Date;

  constructor(data: Partial<Purchase> = {}) {
    this._id = data._id;
    this.purchase_id = data.purchase_id || this.generatePurchaseId();
    this.item_name = data.item_name || '';
    this.quantity = data.quantity || 0;
    this.unit_price = data.unit_price || 0;
    this.total_price = data.total_price || (this.quantity * this.unit_price);
    this.supplier_name = data.supplier_name || '';
    this.supplier_contact = data.supplier_contact;
    this.supplier_address = data.supplier_address;
    this.date = data.date || new Date();
    this.payment_method = data.payment_method || 'Cash';
    this.paid_amount = data.paid_amount || 0;
    this.due_amount = data.due_amount || (this.total_price - (this.paid_amount || 0));
    this.payment_status = this.calculatePaymentStatus();
    this.invoice_number = data.invoice_number;
    this.delivery_date = data.delivery_date;
    this.category = data.category;
    this.notes = data.notes || '';
    this.created_date = data.created_date || new Date();
    this.last_modified = data.last_modified || new Date();
  }

  private generatePurchaseId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `PUR${timestamp}${random}`;
  }

  private calculatePaymentStatus(): 'Paid' | 'Outstanding' | 'Partial' {
    if (this.due_amount === 0) return 'Paid';
    if (this.paid_amount && this.paid_amount > 0) return 'Partial';
    return 'Outstanding';
  }

  calculateTotals() {
    this.total_price = this.quantity * this.unit_price;
    this.due_amount = this.total_price - (this.paid_amount || 0);
    this.payment_status = this.calculatePaymentStatus();
    this.last_modified = new Date();
  }

  // Convert to MongoDB document
  toDocument(): any {
    return {
      ...this,
      date: this.date.toISOString(),
      delivery_date: this.delivery_date?.toISOString(),
      created_date: this.created_date.toISOString(),
      last_modified: this.last_modified.toISOString()
    };
  }

  // Create from MongoDB document
  static fromDocument(doc: any): PurchaseModel {
    return new PurchaseModel({
      ...doc,
      _id: doc._id?.toString(),
      date: new Date(doc.date),
      delivery_date: doc.delivery_date ? new Date(doc.delivery_date) : undefined,
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

    if (!this.supplier_name.trim()) {
      errors.push('Supplier name is required');
    }

    if (this.paid_amount && this.paid_amount < 0) {
      errors.push('Paid amount cannot be negative');
    }

    if (this.paid_amount && this.paid_amount > this.total_price) {
      errors.push('Paid amount cannot exceed total price');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Supplier data model for purchase management
export interface Supplier {
  _id?: string;
  name: string;
  contact_number: string;
  email?: string;
  address?: string;
  gst_number?: string;
  payment_terms?: string;
  category?: string;
  total_purchases: number;
  outstanding_amount: number;
  created_date: Date;
  last_modified: Date;
}

export class SupplierModel implements Supplier {
  _id?: string;
  name: string;
  contact_number: string;
  email?: string;
  address?: string;
  gst_number?: string;
  payment_terms?: string;
  category?: string;
  total_purchases: number;
  outstanding_amount: number;
  created_date: Date;
  last_modified: Date;

  constructor(data: Partial<Supplier> = {}) {
    this._id = data._id;
    this.name = data.name || '';
    this.contact_number = data.contact_number || '';
    this.email = data.email;
    this.address = data.address;
    this.gst_number = data.gst_number;
    this.payment_terms = data.payment_terms;
    this.category = data.category;
    this.total_purchases = data.total_purchases || 0;
    this.outstanding_amount = data.outstanding_amount || 0;
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
  static fromDocument(doc: any): SupplierModel {
    return new SupplierModel({
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
      errors.push('Supplier name is required');
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

// Purchase category enum for better type safety
export enum PurchaseCategory {
  RAW_MATERIALS = 'Raw Materials',
  OFFICE_SUPPLIES = 'Office Supplies',
  EQUIPMENT = 'Equipment',
  SERVICES = 'Services',
  UTILITIES = 'Utilities',
  INVENTORY = 'Inventory',
  OTHER = 'Other'
}

// Payment terms enum
export enum PaymentTerms {
  IMMEDIATE = 'Immediate',
  NET_15 = 'Net 15',
  NET_30 = 'Net 30',
  NET_45 = 'Net 45',
  NET_60 = 'Net 60',
  COD = 'Cash on Delivery',
  ADVANCE = 'Advance Payment'
}
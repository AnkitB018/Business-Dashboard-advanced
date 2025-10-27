export interface Product {
  _id?: string;
  productId: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Sale {
  _id?: string;
  saleId: string;
  customerId: string;
  customerName: string;
  items: SalesItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'credit';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  deliveryDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesFormData {
  customerId: string;
  items: SalesItem[];
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'credit';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryDate?: string;
  discount?: number; // Added discount field
  notes?: string;
}
export interface Customer {
  _id?: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  company?: string;
  gstNumber?: string;
  creditLimit: number;
  outstandingBalance: number;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface CustomerFormData {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  company?: string;
  gstNumber?: string;
  creditLimit: number;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
}
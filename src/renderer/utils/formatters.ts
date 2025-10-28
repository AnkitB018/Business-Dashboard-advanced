// Currency and formatting utilities for Indian business context

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('en-IN').format(number);
};

export const formatCompactCurrency = (amount: number): string => {
  if (amount >= 10000000) { // 1 crore
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) { // 1 thousand
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
};

// Indian business context data generators
export const generateIndianBusinessData = () => {
  const indianCompanyNames = [
    'Tata Consultancy Services',
    'Reliance Industries',
    'Infosys Limited',
    'HDFC Bank',
    'Wipro Technologies',
    'HCL Technologies',
    'Tech Mahindra',
    'Bharti Airtel',
    'Asian Paints',
    'Maruti Suzuki'
  ];

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 
    'Pune', 'Kolkata', 'Ahmedabad', 'Gurgaon', 'Noida'
  ];

  const indianProductCategories = [
    'Software Development', 'IT Services', 'Mobile Accessories', 
    'Electronics', 'Textiles', 'Pharmaceuticals', 'Automotive Parts',
    'Food & Beverages', 'Office Supplies', 'Industrial Equipment'
  ];

  const indianSupplierCategories = [
    'Technology Solutions', 'Raw Materials', 'Office Equipment',
    'Industrial Machinery', 'Software Licensing', 'Consulting Services',
    'Transportation', 'Manufacturing', 'Telecommunications', 'Healthcare'
  ];

  return {
    companies: indianCompanyNames,
    cities: indianCities,
    productCategories: indianProductCategories,
    supplierCategories: indianSupplierCategories
  };
};

export const convertToIndianPrice = (dollarAmount: number): number => {
  // Approximate conversion: 1 USD = 83 INR (as of 2024)
  return Math.round(dollarAmount * 83);
};
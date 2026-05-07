// Sales type definitions matching backend API responses

export interface Sale {
  id: string;
  business_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  invoice_number: string;
  sale_date: string;
  due_date?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount?: number;
  total: number;
  amount_paid?: number;
  paid_date?: string;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  items?: SaleItem[];
  receipt?: Receipt;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id?: string;
  product_name: string;
  qty: number;
  unit_price: number;
  discount: number;
  total?: number;
}

export interface Receipt {
  id: string;
  business_id: string;
  sale_id: string;
  receipt_number: string;
  customer_name?: string;
  customer_phone?: string;
  items: SaleItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  receipt_html: string;
  created_at: string;
}

export interface SaleInput {
  customer_id?: string;
  sale_date?: string;
  due_date?: string;
  items: Array<{
    product_id?: string;
    product_name: string;
    qty: number;
    unit_price: number;
    discount?: number;
  }>;
  notes?: string;
  discount_amount?: number;
  status?: 'draft' | 'pending' | 'paid';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock_qty: number;
  category?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

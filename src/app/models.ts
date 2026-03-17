export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  image_url?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  cpf_cnpj: string;
  phone: string;
  email: string;
  address: string;
  image_url?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category_id: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  supplier_id: string;
  image_url?: string;
  created_at: string;
  category?: Category;
  supplier?: Supplier;
}

export interface CashierSession {
  id: string;
  user_id: string;
  opened_at: string;
  closed_at?: string;
  opening_balance: number;
  closing_balance?: number;
  status: 'open' | 'closed';
}

export interface Sale {
  id: string;
  cashier_session_id: string;
  customer_id?: string;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'pix';
  created_at: string;
  user_id: string;
  items?: SaleItem[];
  customer?: Customer;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid';
  category: string;
  created_at: string;
}

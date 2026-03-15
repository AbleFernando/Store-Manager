import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { Product, Category, Supplier, Customer, CashierSession, Sale, FinancialTransaction, SaleItem } from './models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private supabase = inject(SupabaseService);

  // Mock Data Storage
  private mockCategories: Category[] = [
    { id: 'cat1', name: 'Capas', created_at: new Date().toISOString() },
    { id: 'cat2', name: 'Películas', created_at: new Date().toISOString() },
    { id: 'cat3', name: 'Carregadores', created_at: new Date().toISOString() },
    { id: 'cat4', name: 'Fones de Ouvido', created_at: new Date().toISOString() },
  ];

  private mockSuppliers: Supplier[] = [
    { id: 'sup1', name: 'Distribuidora Tech', cnpj: '12.345.678/0001-90', phone: '(11) 99999-9999', email: 'contato@tech.com', address: 'Rua A, 123', created_at: new Date().toISOString() },
  ];

  private mockCustomers: Customer[] = [
    { id: 'cus1', name: 'Cliente Avulso', cpf_cnpj: '000.000.000-00', phone: '', email: '', address: '', created_at: new Date().toISOString() },
  ];

  private mockProducts: Product[] = [
    { id: 'p1', name: 'Capa Silicone iPhone 13 - Preta', barcode: '7890001', category_id: 'cat1', cost_price: 15.00, sale_price: 45.00, stock_quantity: 20, min_stock: 5, supplier_id: 'sup1', created_at: new Date().toISOString() },
    { id: 'p2', name: 'Película de Vidro 3D iPhone 13', barcode: '7890002', category_id: 'cat2', cost_price: 5.00, sale_price: 25.00, stock_quantity: 50, min_stock: 10, supplier_id: 'sup1', created_at: new Date().toISOString() },
    { id: 'p3', name: 'Carregador Rápido 20W USB-C', barcode: '7890003', category_id: 'cat3', cost_price: 35.00, sale_price: 89.90, stock_quantity: 15, min_stock: 3, supplier_id: 'sup1', created_at: new Date().toISOString() },
    { id: 'p4', name: 'Fone Bluetooth Air Pro', barcode: '7890004', category_id: 'cat4', cost_price: 80.00, sale_price: 199.00, stock_quantity: 8, min_stock: 2, supplier_id: 'sup1', created_at: new Date().toISOString() },
  ];

  private mockSessions: CashierSession[] = [];
  private mockSales: Sale[] = [];
  private mockTransactions: FinancialTransaction[] = [
    { id: 't1', type: 'expense', description: 'Aluguel Março', amount: 1200.00, category: 'Aluguel', created_at: new Date().toISOString(), due_date: new Date().toISOString(), status: 'paid' },
    { id: 't2', type: 'income', description: 'Venda de Acessórios', amount: 450.00, category: 'Vendas', created_at: new Date().toISOString(), due_date: new Date().toISOString(), status: 'paid' },
  ];

  constructor() {
    // Load from localStorage if available to persist during dev
    const savedProducts = localStorage.getItem('mock_products');
    if (savedProducts) this.mockProducts = JSON.parse(savedProducts);
    
    const savedSessions = localStorage.getItem('mock_sessions');
    if (savedSessions) this.mockSessions = JSON.parse(savedSessions);

    const savedSales = localStorage.getItem('mock_sales');
    if (savedSales) this.mockSales = JSON.parse(savedSales);

    const savedTransactions = localStorage.getItem('mock_transactions');
    if (savedTransactions) this.mockTransactions = JSON.parse(savedTransactions);

    const savedCustomers = localStorage.getItem('mock_customers');
    if (savedCustomers) this.mockCustomers = JSON.parse(savedCustomers);

    const savedSuppliers = localStorage.getItem('mock_suppliers');
    if (savedSuppliers) this.mockSuppliers = JSON.parse(savedSuppliers);
  }

  private persist() {
    localStorage.setItem('mock_products', JSON.stringify(this.mockProducts));
    localStorage.setItem('mock_sessions', JSON.stringify(this.mockSessions));
    localStorage.setItem('mock_sales', JSON.stringify(this.mockSales));
    localStorage.setItem('mock_transactions', JSON.stringify(this.mockTransactions));
    localStorage.setItem('mock_customers', JSON.stringify(this.mockCustomers));
    localStorage.setItem('mock_suppliers', JSON.stringify(this.mockSuppliers));
  }

  // Products
  async getProducts() {
    return this.mockProducts.map(p => ({
      ...p,
      category: this.mockCategories.find(c => c.id === p.category_id),
      supplier: this.mockSuppliers.find(s => s.id === p.supplier_id)
    }));
  }

  async saveProduct(product: Partial<Product>) {
    if (product.id) {
      const index = this.mockProducts.findIndex(p => p.id === product.id);
      if (index !== -1) {
        this.mockProducts[index] = { ...this.mockProducts[index], ...product } as Product;
      }
    } else {
      const newProduct = {
        ...product,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      } as Product;
      this.mockProducts.push(newProduct);
    }
    this.persist();
    return product as Product;
  }

  // Categories
  async getCategories() {
    return this.mockCategories;
  }

  // Suppliers
  async getSuppliers() {
    return this.mockSuppliers;
  }

  async saveSupplier(supplier: Partial<Supplier>) {
    if (supplier.id) {
      const index = this.mockSuppliers.findIndex(s => s.id === supplier.id);
      if (index !== -1) {
        this.mockSuppliers[index] = { ...this.mockSuppliers[index], ...supplier } as Supplier;
      }
    } else {
      const newSupplier = {
        ...supplier,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      } as Supplier;
      this.mockSuppliers.push(newSupplier);
    }
    this.persist();
    return supplier as Supplier;
  }

  // Customers
  async getCustomers() {
    return this.mockCustomers;
  }

  async saveCustomer(customer: Partial<Customer>) {
    if (customer.id) {
      const index = this.mockCustomers.findIndex(c => c.id === customer.id);
      if (index !== -1) {
        this.mockCustomers[index] = { ...this.mockCustomers[index], ...customer } as Customer;
      }
    } else {
      const newCustomer = {
        ...customer,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      } as Customer;
      this.mockCustomers.push(newCustomer);
    }
    this.persist();
    return customer as Customer;
  }

  // Cashier
  async getSessions() {
    return this.mockSessions;
  }

  async getCurrentSession() {
    return this.mockSessions.find(s => s.status === 'open') || null;
  }

  async openCashier(openingBalance: number) {
    const newSession: CashierSession = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: 'mock-user',
      opened_at: new Date().toISOString(),
      opening_balance: openingBalance,
      status: 'open'
    };
    this.mockSessions.push(newSession);
    this.persist();
    return newSession;
  }

  async closeCashier(sessionId: string, closingBalance: number) {
    const session = this.mockSessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'closed';
      session.closing_balance = closingBalance;
      session.closed_at = new Date().toISOString();
      this.persist();
    }
    return session as CashierSession;
  }

  // Sales
  async createSale(sale: Partial<Sale>, items: Partial<SaleItem>[]) {
    const newSale: Sale = {
      ...sale,
      id: Math.random().toString(36).substr(2, 9),
      user_id: 'mock-user',
      created_at: new Date().toISOString()
    } as Sale;
    
    this.mockSales.push(newSale);

    // Update Stock
    for (const item of items) {
      const product = this.mockProducts.find(p => p.id === item.product_id);
      if (product && item.quantity !== undefined) {
        product.stock_quantity -= item.quantity;
      }
    }

    this.persist();
    return newSale;
  }

  async getSalesBySession(sessionId: string) {
    return this.mockSales.filter(s => s.cashier_session_id === sessionId);
  }

  // Financial
  async getTransactions() {
    return this.mockTransactions;
  }

  async saveTransaction(transaction: Partial<FinancialTransaction>) {
    const newTransaction: FinancialTransaction = {
      status: 'paid',
      due_date: new Date().toISOString(),
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    } as FinancialTransaction;
    this.mockTransactions.unshift(newTransaction);
    this.persist();
    return newTransaction;
  }
}

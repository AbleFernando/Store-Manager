import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { Product, Category, Supplier, Customer, CashierSession, Sale, FinancialTransaction, SaleItem, User, SystemConfig, UserRole } from './models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private supabase = inject(SupabaseService);

  // Auth State
  currentUser = signal<User | null>(null);
  currentSessionSignal = signal<CashierSession | null>(null);

  // Mock Data Storage
  private mockUsers: User[] = [
    { id: 'u1', name: 'Super Admin', email: 'super@admin.com', role: 'super_admin', created_at: new Date().toISOString() },
    { id: 'u2', name: 'Admin User', email: 'admin@test.com', role: 'admin', created_at: new Date().toISOString() },
    { id: 'u3', name: 'Supervisor User', email: 'supervisor@test.com', role: 'supervisor', created_at: new Date().toISOString() },
    { id: 'u4', name: 'Seller User', email: 'seller@test.com', role: 'seller', created_at: new Date().toISOString() },
  ];

  private mockConfig: SystemConfig = {
    system_name: 'ABLE Store Manager',
    system_logo_url: '',
    supabase_url: '',
    supabase_anon_key: ''
  };
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

    const savedUsers = localStorage.getItem('mock_users');
    if (savedUsers) this.mockUsers = JSON.parse(savedUsers);

    const savedConfig = localStorage.getItem('mock_config');
    if (savedConfig) this.mockConfig = JSON.parse(savedConfig);

    this.init();
  }

  async init() {
    if (this.supabase.isConfigured) {
      const session = await this.getCurrentSession();
      this.currentSessionSignal.set(session);
      
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        const { data: profile } = await this.supabase.client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) {
          this.currentUser.set(profile);
        }
      }
    } else {
      // Initial session state
      const openSession = this.mockSessions.find(s => s.status === 'open') || null;
      this.currentSessionSignal.set(openSession);

      // Default current user for dev
      this.currentUser.set(this.mockUsers[0]);
    }
  }

  private persist() {
    localStorage.setItem('mock_products', JSON.stringify(this.mockProducts));
    localStorage.setItem('mock_sessions', JSON.stringify(this.mockSessions));
    localStorage.setItem('mock_sales', JSON.stringify(this.mockSales));
    localStorage.setItem('mock_transactions', JSON.stringify(this.mockTransactions));
    localStorage.setItem('mock_customers', JSON.stringify(this.mockCustomers));
    localStorage.setItem('mock_suppliers', JSON.stringify(this.mockSuppliers));
    localStorage.setItem('mock_users', JSON.stringify(this.mockUsers));
    localStorage.setItem('mock_config', JSON.stringify(this.mockConfig));
  }

  // Products
  async getProducts() {
    if (this.supabase.isConfigured) {
      try {
        const { data, error } = await this.supabase.client
          .from('products')
          .select('*, categories(id, name), suppliers(id, name)');
        if (error) {
          console.error('Supabase error fetching products:', error);
          return this.getMockProducts();
        }
        return data.map(p => ({
          ...p,
          category: p.categories,
          supplier: p.suppliers
        }));
      } catch (e) {
        console.error('Failed to fetch products from Supabase:', e);
        return this.getMockProducts();
      }
    }
    return this.getMockProducts();
  }

  private getMockProducts() {
    return this.mockProducts.map(p => ({
      ...p,
      category: this.mockCategories.find(c => c.id === p.category_id),
      supplier: this.mockSuppliers.find(s => s.id === p.supplier_id)
    }));
  }

  async saveProduct(product: Partial<Product>) {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('products')
        .upsert({
          ...product,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
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
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('categories')
        .select('*');
      if (error) return [];
      return data;
    }
    return this.mockCategories;
  }

  // Suppliers
  async getSuppliers() {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('suppliers')
        .select('*');
      if (error) return [];
      return data;
    }
    return this.mockSuppliers;
  }

  async saveSupplier(supplier: Partial<Supplier>) {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('suppliers')
        .upsert(supplier)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
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
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('customers')
        .select('*');
      if (error) return [];
      return data;
    }
    return this.mockCustomers;
  }

  async saveCustomer(customer: Partial<Customer>) {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('customers')
        .upsert(customer)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
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
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('cashier_sessions')
        .select('*')
        .order('opened_at', { ascending: false });
      if (error) return [];
      return data;
    }
    return this.mockSessions;
  }

  async getCurrentSession() {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('cashier_sessions')
        .select('*')
        .eq('status', 'open')
        .single();
      if (error) return null;
      return data;
    }
    return this.mockSessions.find(s => s.status === 'open') || null;
  }

  async openCashier(openingBalance: number) {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('cashier_sessions')
        .insert({
          user_id: this.currentUser()?.id,
          opening_balance: openingBalance,
          status: 'open'
        })
        .select()
        .single();
      if (error) throw error;
      this.currentSessionSignal.set(data);
      return data;
    }
    const newSession: CashierSession = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: this.currentUser()?.id || 'mock-user',
      opened_at: new Date().toISOString(),
      opening_balance: openingBalance,
      status: 'open'
    };
    this.mockSessions.push(newSession);
    this.currentSessionSignal.set(newSession);
    this.persist();
    return newSession;
  }

  async closeCashier(sessionId: string, closingBalance: number) {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('cashier_sessions')
        .update({
          closing_balance: closingBalance,
          closed_at: new Date().toISOString(),
          status: 'closed'
        })
        .eq('id', sessionId)
        .select()
        .single();
      if (error) throw error;

      // Create income transaction for the sales in this session
      const sales = await this.getSalesBySession(sessionId);
      const totalSales = sales.reduce((acc, s) => acc + s.total_amount, 0);
      
      if (totalSales > 0) {
        await this.saveTransaction({
          type: 'income',
          description: `Fechamento de Caixa - Sessão ${sessionId.slice(0, 8)}`,
          amount: totalSales,
          category: 'Vendas'
        });
      }

      this.currentSessionSignal.set(null);
      return data;
    }
    const session = this.mockSessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'closed';
      session.closing_balance = closingBalance;
      session.closed_at = new Date().toISOString();
      
      // Create income transaction for the sales in this session
      const sales = await this.getSalesBySession(sessionId);
      const totalSales = sales.reduce((acc, s) => acc + s.total_amount, 0);
      
      if (totalSales > 0) {
        await this.saveTransaction({
          type: 'income',
          description: `Fechamento de Caixa - Sessão ${sessionId.slice(0, 8)}`,
          amount: totalSales,
          category: 'Vendas'
        });
      }
      
      this.currentSessionSignal.set(null);
      this.persist();
    }
    return session as CashierSession;
  }

  // Sales
  async createSale(sale: Partial<Sale>, items: Partial<SaleItem>[]) {
    if (this.supabase.isConfigured) {
      const { data: saleData, error: saleError } = await this.supabase.client
        .from('sales')
        .insert({
          ...sale,
          user_id: this.currentUser()?.id
        })
        .select()
        .single();
      if (saleError) throw saleError;

      const itemsWithSaleId = items.map(item => ({
        ...item,
        sale_id: saleData.id
      }));

      const { error: itemsError } = await this.supabase.client
        .from('sale_items')
        .insert(itemsWithSaleId);
      if (itemsError) throw itemsError;

      // Update Stock
      for (const item of items) {
        if (item.product_id && item.quantity) {
          await this.supabase.client.rpc('decrement_stock', { 
            p_id: item.product_id, 
            p_qty: item.quantity 
          });
        }
      }

      return saleData;
    }
    const newSale: Sale = {
      ...sale,
      id: Math.random().toString(36).substr(2, 9),
      user_id: this.currentUser()?.id || 'mock-user',
      created_at: new Date().toISOString(),
      items: items as SaleItem[]
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
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('sales')
        .select('*')
        .eq('cashier_session_id', sessionId);
      if (error) return [];
      return data;
    }
    return this.mockSales.filter(s => s.cashier_session_id === sessionId);
  }

  async getAllSales() {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('sales')
        .select('*, customers(*), sale_items(*, products(*))')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data.map(s => ({
        ...s,
        customer: s.customers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: s.sale_items?.map((item: any) => ({
          ...item,
          product: item.products
        }))
      }));
    }
    return this.mockSales.map(s => ({
      ...s,
      customer: this.mockCustomers.find(c => c.id === s.customer_id),
      items: s.items?.map(item => ({
        ...item,
        product: this.mockProducts.find(p => p.id === item.product_id)
      }))
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Financial
  async getTransactions() {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('financial_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data;
    }
    return [...this.mockTransactions];
  }

  async saveTransaction(transaction: Partial<FinancialTransaction>) {
    if (this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client
        .from('financial_transactions')
        .insert(transaction)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
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


  // Users
  async getUsers() {
    return this.mockUsers;
  }

  async saveUser(user: Partial<User>) {
    if (user.id) {
      const index = this.mockUsers.findIndex(u => u.id === user.id);
      if (index !== -1) {
        this.mockUsers[index] = { ...this.mockUsers[index], ...user } as User;
      }
    } else {
      const newUser = {
        ...user,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      } as User;
      this.mockUsers.push(newUser);
    }
    this.persist();
    return user as User;
  }

  // Config
  async getConfig() {
    return this.mockConfig;
  }

  async saveConfig(config: SystemConfig) {
    this.mockConfig = { ...config };
    this.persist();
    return this.mockConfig;
  }

  // Role Hierarchy
  canManageRole(targetRole: UserRole): boolean {
    const currentRole = this.currentUser()?.role;
    if (currentRole === 'super_admin') return true;
    if (currentRole === 'admin') return targetRole === 'supervisor' || targetRole === 'seller';
    if (currentRole === 'supervisor') return targetRole === 'seller';
    return false;
  }

  getAllowedRolesToAssign(): UserRole[] {
    const currentRole = this.currentUser()?.role;
    if (currentRole === 'super_admin') return ['super_admin', 'admin', 'supervisor', 'seller'];
    if (currentRole === 'admin') return ['supervisor', 'seller'];
    if (currentRole === 'supervisor') return ['seller'];
    return [];
  }
}

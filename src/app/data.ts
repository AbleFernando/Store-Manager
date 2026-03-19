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

  constructor() {
    this.init();
  }

  async init() {
    if (this.supabase.isConfigured) {
      try {
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
      } catch (e) {
        console.error('DataService: Error during initialization:', e);
      }
    }
  }

  // Products
  async getProducts() {
    if (!this.supabase.isConfigured) return [];
    
    try {
      const { data, error } = await this.supabase.client
        .from('products')
        .select('*, categories(id, name), suppliers(id, name)')
        .order('name');
      
      if (error) throw error;
      
      return data.map(p => ({
        ...p,
        category: p.categories,
        supplier: p.suppliers
      }));
    } catch (e) {
      console.error('Supabase error fetching products:', e);
      return [];
    }
  }

  async saveProduct(product: Partial<Product>) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    
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

  async deleteProduct(id: string) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { error } = await this.supabase.client
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Categories
  async getCategories() {
    if (!this.supabase.isConfigured) return [];
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .order('name');
    if (error) return [];
    return data;
  }

  async saveCategory(category: Partial<Category>) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { data, error } = await this.supabase.client
      .from('categories')
      .upsert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { error } = await this.supabase.client
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Suppliers
  async getSuppliers() {
    if (!this.supabase.isConfigured) return [];
    const { data, error } = await this.supabase.client
      .from('suppliers')
      .select('*')
      .order('name');
    if (error) return [];
    return data;
  }

  async saveSupplier(supplier: Partial<Supplier>) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { data, error } = await this.supabase.client
      .from('suppliers')
      .upsert(supplier)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteSupplier(id: string) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { error } = await this.supabase.client
      .from('suppliers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Customers
  async getCustomers() {
    if (!this.supabase.isConfigured) return [];
    const { data, error } = await this.supabase.client
      .from('customers')
      .select('*')
      .order('name');
    if (error) return [];
    return data;
  }

  async saveCustomer(customer: Partial<Customer>) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { data, error } = await this.supabase.client
      .from('customers')
      .upsert(customer)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCustomer(id: string) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { error } = await this.supabase.client
      .from('customers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Cashier
  async getSessions() {
    if (!this.supabase.isConfigured) return [];
    const { data, error } = await this.supabase.client
      .from('cashier_sessions')
      .select('*, profiles(name)')
      .order('opened_at', { ascending: false });
    if (error) return [];
    return data.map(s => ({
      ...s,
      user_name: s.profiles?.name
    }));
  }

  async getCurrentSession() {
    if (!this.supabase.isConfigured) return null;
    const { data, error } = await this.supabase.client
      .from('cashier_sessions')
      .select('*')
      .eq('status', 'open')
      .maybeSingle();
    if (error) return null;
    return data;
  }

  async openCashier(openingBalance: number) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
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

  async closeCashier(sessionId: string, closingBalance: number) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
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

  // Sales
  async createSale(sale: Partial<Sale>, items: Partial<SaleItem>[]) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    
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

  async getSalesBySession(sessionId: string) {
    if (!this.supabase.isConfigured) return [];
    const { data, error } = await this.supabase.client
      .from('sales')
      .select('*')
      .eq('cashier_session_id', sessionId);
    if (error) return [];
    return data;
  }

  async getAllSales() {
    if (!this.supabase.isConfigured) return [];
    const { data, error } = await this.supabase.client
      .from('sales')
      .select('*, customers(*), sale_items(*, products(*))')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data.map(s => ({
      ...s,
      customer: s.customers,
      items: s.sale_items?.map((item: { products: unknown }) => ({
        ...item,
        product: item.products
      }))
    }));
  }

  // Financial
  async getTransactions() {
    if (!this.supabase.isConfigured) return [];
    const { data, error } = await this.supabase.client
      .from('financial_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  }

  async saveTransaction(transaction: Partial<FinancialTransaction>) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { data, error } = await this.supabase.client
      .from('financial_transactions')
      .insert(transaction)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Users
  async getUsers() {
    if (!this.supabase.isConfigured) return [];
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('name');
    if (error) return [];
    return data;
  }

  async saveUser(user: Partial<User>) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { data, error } = await this.supabase.client
      .from('profiles')
      .upsert(user)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Config
  async getConfig() {
    if (!this.supabase.isConfigured) return { system_name: 'ABLE Store Manager', system_logo_url: '' };
    const { data, error } = await this.supabase.client
      .from('system_config')
      .select('*')
      .maybeSingle();
    if (error || !data) return { system_name: 'ABLE Store Manager', system_logo_url: '' };
    return data;
  }

  async saveConfig(config: SystemConfig) {
    if (!this.supabase.isConfigured) throw new Error('Supabase not configured');
    const { data, error } = await this.supabase.client
      .from('system_config')
      .upsert({ ...config, id: 1, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
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

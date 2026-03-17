import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../data';
import { Product, Sale } from '../models';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-end justify-between">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Olá, {{ currentUser()?.name }}</h2>
          <p class="text-black/50">Você está acessando como <span class="font-bold text-black">{{ currentUser()?.role }}</span></p>
        </div>
        <div class="text-right">
          <p class="text-xs font-bold uppercase tracking-widest text-black/30">Data Atual</p>
          <p class="font-medium">{{ today | date:'dd/MM/yyyy' }}</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                <lucide-icon [name]="stat.icon" class="w-5 h-5 opacity-70"></lucide-icon>
              </div>
              <span class="text-xs font-bold px-2 py-1 rounded-full" [class]="stat.trendClass">
                {{ stat.trend }}
              </span>
            </div>
            <p class="text-xs font-bold uppercase tracking-wider text-black/40">{{ stat.label }}</p>
            <p class="text-2xl font-bold mt-1">{{ stat.value }}</p>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Recent Sales -->
        <div class="lg:col-span-2 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-black/5 flex items-center justify-between">
            <h3 class="font-bold">Vendas Recentes</h3>
            <button class="text-xs font-bold uppercase tracking-wider text-black/40 hover:text-black transition-colors">Ver Todas</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-bold uppercase tracking-widest text-black/30 border-b border-black/5">
                  <th class="px-6 py-4">ID</th>
                  <th class="px-6 py-4">Data</th>
                  <th class="px-6 py-4">Pagamento</th>
                  <th class="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/5">
                @for (sale of recentSales(); track sale.id) {
                  <tr class="hover:bg-black/[0.02] transition-colors cursor-pointer group">
                    <td class="px-6 py-4 text-xs font-mono text-black/50">#{{ sale.id.slice(0,8) }}</td>
                    <td class="px-6 py-4 text-sm font-medium">{{ sale.created_at | date:'HH:mm' }}</td>
                    <td class="px-6 py-4">
                      <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-black/5">
                        {{ sale.payment_method }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm font-bold text-right">R$ {{ sale.total_amount | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Low Stock Alerts -->
        <div class="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-black/5">
            <h3 class="font-bold">Alertas de Estoque</h3>
          </div>
          <div class="p-4 space-y-3">
            @for (product of lowStockProducts(); track product.id) {
              <div class="flex items-center gap-4 p-3 rounded-2xl hover:bg-red-50 transition-colors group">
                <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <lucide-icon name="package" class="w-5 h-5 text-red-600"></lucide-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold truncate">{{ product.name }}</p>
                  <p class="text-xs text-red-600 font-medium">{{ product.stock_quantity }} unidades restantes</p>
                </div>
                <lucide-icon name="chevron-right" class="w-4 h-4 opacity-0 group-hover:opacity-30 transition-opacity"></lucide-icon>
              </div>
            }
            @if (lowStockProducts().length === 0) {
              <div class="text-center py-8">
                <lucide-icon name="check-circle" class="w-12 h-12 text-green-500/20 mx-auto mb-3"></lucide-icon>
                <p class="text-sm text-black/40 font-medium">Estoque em dia</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class Dashboard implements OnInit {
  private dataService = inject(DataService);
  today = new Date();
  currentUser = this.dataService.currentUser;

  stats = signal([
    { label: 'Vendas Hoje', value: 'R$ 0,00', icon: 'shopping-cart', trend: '+12%', trendClass: 'bg-green-100 text-green-600' },
    { label: 'Produtos', value: '0', icon: 'package', trend: 'Estável', trendClass: 'bg-black/5 text-black/50' },
    { label: 'Clientes', value: '0', icon: 'users', trend: '+5', trendClass: 'bg-green-100 text-green-600' },
    { label: 'Saldo Caixa', value: 'R$ 0,00', icon: 'wallet', trend: 'Aberto', trendClass: 'bg-blue-100 text-blue-600' },
  ]);

  recentSales = signal<Sale[]>([]);
  lowStockProducts = signal<Product[]>([]);

  async ngOnInit() {
    try {
      const products = await this.dataService.getProducts();
      this.lowStockProducts.set(products.filter(p => p.stock_quantity <= p.min_stock).slice(0, 5));
      
      // Update stats with real data
      this.stats.update(s => {
        s[1].value = products.length.toString();
        return [...s];
      });

      const customers = await this.dataService.getCustomers();
      this.stats.update(s => {
        s[2].value = customers.length.toString();
        return [...s];
      });

    } catch (err) {
      console.error('Error loading dashboard data', err);
    }
  }
}

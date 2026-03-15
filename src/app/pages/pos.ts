import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../data';
import { Product, CashierSession } from '../models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pos',
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-120px)] flex gap-8">
      <!-- Left: Product Selection -->
      <div class="flex-1 flex flex-col gap-6 min-w-0">
        <!-- Search -->
        <div class="bg-white p-4 rounded-3xl border border-black/5 shadow-sm shrink-0">
          <div class="relative">
            <lucide-icon name="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30"></lucide-icon>
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
              placeholder="F1: Buscar produto por nome ou código..."
              class="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F9F9F9] border border-black/5 focus:border-black focus:ring-0 transition-all outline-none text-lg font-medium"
            >
          </div>
        </div>

        <!-- Product Grid -->
        <div class="flex-1 overflow-y-auto pr-2">
          <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (product of filteredProducts(); track product.id) {
              <button 
                (click)="addToCart(product)"
                class="bg-white p-4 rounded-3xl border border-black/5 shadow-sm hover:shadow-md hover:border-black/20 transition-all text-left group flex flex-col h-full"
              >
                <div class="w-full aspect-square rounded-2xl bg-black/5 mb-4 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <lucide-icon name="package" class="w-8 h-8 opacity-20"></lucide-icon>
                </div>
                <p class="text-sm font-bold line-clamp-2 flex-1">{{ product.name }}</p>
                <div class="mt-4 flex items-center justify-between">
                  <p class="text-lg font-black">R$ {{ product.sale_price | number:'1.2-2' }}</p>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-black/30">{{ product.stock_quantity }} un</span>
                </div>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Right: Cart & Checkout -->
      <div class="w-96 flex flex-col gap-6 shrink-0">
        <!-- Cart -->
        <div class="flex-1 bg-white rounded-3xl border border-black/5 shadow-sm flex flex-col overflow-hidden">
          <div class="p-6 border-b border-black/5 flex items-center justify-between">
            <h3 class="font-bold flex items-center gap-2">
              <lucide-icon name="shopping-cart" class="w-5 h-5"></lucide-icon>
              Carrinho
            </h3>
            <span class="text-xs font-bold px-2 py-1 rounded-full bg-black text-white">{{ cart().length }} itens</span>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @for (item of cart(); track item.product.id) {
              <div class="flex items-center gap-3 p-3 rounded-2xl bg-[#F9F9F9] group">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold truncate">{{ item.product.name }}</p>
                  <p class="text-xs text-black/40 font-medium">{{ item.quantity }}x R$ {{ item.product.sale_price | number:'1.2-2' }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="updateQuantity(item, -1)" class="w-6 h-6 rounded-lg bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-colors">-</button>
                  <span class="text-sm font-bold w-4 text-center">{{ item.quantity }}</span>
                  <button (click)="updateQuantity(item, 1)" class="w-6 h-6 rounded-lg bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-colors">+</button>
                </div>
                <button (click)="removeFromCart(item)" class="p-2 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                  <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            }
            @if (cart().length === 0) {
              <div class="h-full flex flex-col items-center justify-center text-center p-8">
                <lucide-icon name="shopping-bag" class="w-12 h-12 text-black/10 mb-4"></lucide-icon>
                <p class="text-sm text-black/30 font-medium">Carrinho vazio</p>
              </div>
            }
          </div>

          <!-- Total -->
          <div class="p-6 bg-black text-white">
            <div class="flex justify-between items-end mb-4">
              <p class="text-xs font-bold uppercase tracking-widest opacity-50">Total a Pagar</p>
              <p class="text-3xl font-black">R$ {{ cartTotal() | number:'1.2-2' }}</p>
            </div>
            <button 
              (click)="showCheckout = true"
              [disabled]="cart().length === 0"
              class="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 transition-all disabled:opacity-50"
            >
              Finalizar Venda (F2)
            </button>
          </div>
        </div>
      </div>

      <!-- Checkout Modal -->
      @if (showCheckout) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-6 border-b border-black/5 flex items-center justify-between">
              <h3 class="text-xl font-bold">Finalizar Venda</h3>
              <button (click)="showCheckout = false" class="p-2 hover:bg-black/5 rounded-full transition-colors">
                <lucide-icon name="x" class="w-6 h-6"></lucide-icon>
              </button>
            </div>
            
            <div class="p-6 space-y-6">
              <div>
                <p class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-3">Forma de Pagamento</p>
                <div class="grid grid-cols-3 gap-3">
                  @for (method of ['Dinheiro', 'Cartão', 'PIX']; track method) {
                    <button 
                      (click)="paymentMethod = method"
                      [class.bg-black]="paymentMethod === method"
                      [class.text-white]="paymentMethod === method"
                      [class.border-black]="paymentMethod === method"
                      class="py-3 rounded-xl border border-black/5 font-bold text-sm transition-all"
                    >
                      {{ method }}
                    </button>
                  }
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-[#F9F9F9] border border-black/5">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-black/50">Subtotal</span>
                  <span class="font-bold">R$ {{ cartTotal() | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-lg font-black pt-2 border-t border-black/5">
                  <span>Total</span>
                  <span>R$ {{ cartTotal() | number:'1.2-2' }}</span>
                </div>
              </div>

              <button 
                (click)="finishSale()"
                class="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-black/90 transition-all shadow-lg shadow-black/10"
              >
                Confirmar e Emitir Nota
              </button>
            </div>
          </div>
        </div>
      }
      <!-- Notification -->
      @if (notification()) {
        <div class="fixed top-6 right-6 z-[200] bg-black text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300">
          <p class="font-bold">{{ notification() }}</p>
        </div>
      }
    </div>
  `
})
export class POS implements OnInit {
  private dataService = inject(DataService);

  searchQuery = '';
  products = signal<Product[]>([]);
  cart = signal<{ product: Product, quantity: number }[]>([]);
  showCheckout = false;
  paymentMethod = 'Dinheiro';
  currentSession = signal<CashierSession | null>(null);
  notification = signal<string | null>(null);

  filteredProducts = signal<Product[]>([]);

  async ngOnInit() {
    this.loadData();
    this.currentSession.set(await this.dataService.getCurrentSession());
  }

  private showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(null), 3000);
  }

  async loadData() {
    const p = await this.dataService.getProducts();
    this.products.set(p);
    this.filteredProducts.set(p);
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase();
    this.filteredProducts.set(
      this.products().filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.barcode.includes(query)
      )
    );
  }

  addToCart(product: Product) {
    this.cart.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;

      if (currentQty + 1 > product.stock_quantity) {
        this.showNotification(`Estoque insuficiente! Disponível: ${product.stock_quantity}`);
        return items;
      }

      if (existing) {
        existing.quantity += 1;
        return [...items];
      }
      return [...items, { product, quantity: 1 }];
    });
  }

  updateQuantity(item: { product: Product, quantity: number }, delta: number) {
    this.cart.update(items => {
      const i = items.find(x => x.product.id === item.product.id);
      if (i) {
        const newQty = i.quantity + delta;
        if (newQty > i.product.stock_quantity) {
          this.showNotification(`Estoque insuficiente! Disponível: ${i.product.stock_quantity}`);
          return items;
        }
        i.quantity = Math.max(1, newQty);
      }
      return [...items];
    });
  }

  removeFromCart(item: { product: Product, quantity: number }) {
    this.cart.update(items => items.filter(x => x.product.id !== item.product.id));
  }

  cartTotal() {
    return this.cart().reduce((acc, item) => acc + (item.product.sale_price * item.quantity), 0);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'F1') {
      event.preventDefault();
      // Focus search input
    }
    if (event.key === 'F2' && this.cart().length > 0) {
      event.preventDefault();
      this.showCheckout = true;
    }
  }

  async finishSale() {
    const session = this.currentSession();
    if (!session) {
      this.showNotification('Abra o caixa antes de realizar vendas!');
      return;
    }

    try {
      const methodMap: Record<string, 'cash' | 'card' | 'pix'> = {
        'dinheiro': 'cash',
        'cartão': 'card',
        'pix': 'pix'
      };

      const sale = {
        cashier_session_id: session.id,
        total_amount: this.cartTotal(),
        payment_method: methodMap[this.paymentMethod.toLowerCase()] || 'cash',
        created_at: new Date().toISOString()
      };

      const items = this.cart().map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price: i.product.sale_price
      }));

      await this.dataService.createSale(sale, items);
      
      this.showNotification('Venda finalizada com sucesso!');
      this.cart.set([]);
      this.showCheckout = false;
      this.loadData(); // Refresh stock
    } catch (err) {
      console.error('Error finishing sale', err);
      this.showNotification('Erro ao finalizar venda');
    }
  }
}

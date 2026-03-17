import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../data';
import { FinancialTransaction, CashierSession, Sale } from '../models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p class="text-black/50">Controle de entradas e saídas do seu negócio</p>
        </div>
        <button 
          (click)="showAddModal = true"
          class="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black/90 transition-all shadow-lg shadow-black/10"
        >
          <lucide-icon name="plus" class="w-5 h-5"></lucide-icon>
          Nova Transação
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <lucide-icon name="trending-up" class="w-5 h-5"></lucide-icon>
            </div>
            <p class="text-xs font-bold uppercase tracking-wider text-black/40">Entradas</p>
          </div>
          <p class="text-2xl font-black text-green-600">R$ {{ totalIncome() | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
              <lucide-icon name="trending-down" class="w-5 h-5"></lucide-icon>
            </div>
            <p class="text-xs font-bold uppercase tracking-wider text-black/40">Saídas</p>
          </div>
          <p class="text-2xl font-black text-red-600">R$ {{ totalExpense() | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center">
              <lucide-icon name="wallet" class="w-5 h-5"></lucide-icon>
            </div>
            <p class="text-xs font-bold uppercase tracking-wider text-black/40">Saldo Geral</p>
          </div>
          <p class="text-2xl font-black" [class.text-red-600]="balance() < 0" [class.text-green-600]="balance() > 0">
            R$ {{ balance() | number:'1.2-2' }}
          </p>
        </div>
      </div>

      <!-- Transactions List -->
      <div class="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-black/5 flex justify-between items-center">
          <h3 class="font-bold">
            @switch (view()) {
              @case ('transactions') { Últimas Transações }
              @case ('sessions') { Sessões de Caixa }
              @case ('sales') { Fluxo de Vendas }
            }
          </h3>
          <div class="flex gap-2">
            <button (click)="view.set('transactions')" [class.bg-black]="view() === 'transactions'" [class.text-white]="view() === 'transactions'" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border border-black/5">Transações</button>
            <button (click)="view.set('sales')" [class.bg-black]="view() === 'sales'" [class.text-white]="view() === 'sales'" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border border-black/5">Vendas</button>
            <button (click)="view.set('sessions')" [class.bg-black]="view() === 'sessions'" [class.text-white]="view() === 'sessions'" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border border-black/5">Sessões</button>
          </div>
        </div>

        @if (view() === 'transactions') {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#F9F9F9] text-[10px] font-bold uppercase tracking-widest text-black/40">
                  <th class="px-6 py-4">Data</th>
                  <th class="px-6 py-4">Descrição</th>
                  <th class="px-6 py-4">Categoria</th>
                  <th class="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/5">
                @for (t of transactions(); track t.id) {
                  <tr class="hover:bg-black/[0.02] transition-colors">
                    <td class="px-6 py-4 text-sm font-medium">{{ t.created_at | date:'dd/MM/yyyy' }}</td>
                    <td class="px-6 py-4 text-sm font-bold">{{ t.description }}</td>
                    <td class="px-6 py-4">
                      <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-black/5 text-black/50">
                        {{ t.category }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span class="text-sm font-black" [class.text-green-600]="t.type === 'income'" [class.text-red-600]="t.type === 'expense'">
                        {{ t.type === 'income' ? '+' : '-' }} R$ {{ t.amount | number:'1.2-2' }}
                      </span>
                    </td>
                  </tr>
                }
                @if (transactions().length === 0) {
                  <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-black/30 font-medium">Nenhuma transação registrada</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else if (view() === 'sales') {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#F9F9F9] text-[10px] font-bold uppercase tracking-widest text-black/40">
                  <th class="px-6 py-4">Data/Hora</th>
                  <th class="px-6 py-4">Cliente</th>
                  <th class="px-6 py-4">Pagamento</th>
                  <th class="px-6 py-4">Itens</th>
                  <th class="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/5">
                @for (s of sales(); track s.id) {
                  <tr class="hover:bg-black/[0.02] transition-colors">
                    <td class="px-6 py-4 text-sm font-medium">{{ s.created_at | date:'dd/MM HH:mm' }}</td>
                    <td class="px-6 py-4 text-sm font-bold">{{ s.customer?.name || 'Consumidor' }}</td>
                    <td class="px-6 py-4">
                      <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-black/5 text-black/50">
                        {{ s.payment_method }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-col gap-1">
                        @for (item of s.items; track item.id) {
                          <span class="text-[10px] text-black/60">{{ item.quantity }}x {{ item.product?.name }}</span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right font-black text-sm">
                      R$ {{ s.total_amount | number:'1.2-2' }}
                    </td>
                  </tr>
                }
                @if (sales().length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-black/30 font-medium">Nenhuma venda registrada</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#F9F9F9] text-[10px] font-bold uppercase tracking-widest text-black/40">
                  <th class="px-6 py-4">Abertura</th>
                  <th class="px-6 py-4">Fechamento</th>
                  <th class="px-6 py-4">Saldo Inicial</th>
                  <th class="px-6 py-4">Saldo Final</th>
                  <th class="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/5">
                @for (s of sessions(); track s.id) {
                  <tr class="hover:bg-black/[0.02] transition-colors">
                    <td class="px-6 py-4 text-sm font-medium">{{ s.opened_at | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-6 py-4 text-sm font-medium">{{ s.closed_at ? (s.closed_at | date:'dd/MM/yyyy HH:mm') : '-' }}</td>
                    <td class="px-6 py-4 text-sm font-bold">R$ {{ s.opening_balance | number:'1.2-2' }}</td>
                    <td class="px-6 py-4 text-sm font-bold">R$ {{ s.closing_balance ? (s.closing_balance | number:'1.2-2') : '-' }}</td>
                    <td class="px-6 py-4">
                      <span 
                        class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                        [class.bg-green-100]="s.status === 'open'"
                        [class.text-green-700]="s.status === 'open'"
                        [class.bg-black/5]="s.status === 'closed'"
                        [class.text-black/50]="s.status === 'closed'"
                      >
                        {{ s.status === 'open' ? 'Aberto' : 'Fechado' }}
                      </span>
                    </td>
                  </tr>
                }
                @if (sessions().length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-black/30 font-medium">Nenhuma sessão de caixa registrada</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Add Modal -->
      @if (showAddModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-6 border-b border-black/5 flex items-center justify-between">
              <h3 class="text-xl font-bold">Nova Transação</h3>
              <button (click)="showAddModal = false" class="p-2 hover:bg-black/5 rounded-full transition-colors">
                <lucide-icon name="x" class="w-6 h-6"></lucide-icon>
              </button>
            </div>
            
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <button 
                  (click)="newTransaction.type = 'income'"
                  [class.bg-green-600]="newTransaction.type === 'income'"
                  [class.text-white]="newTransaction.type === 'income'"
                  class="py-3 rounded-xl border border-black/5 font-bold text-sm transition-all"
                >
                  Entrada
                </button>
                <button 
                  (click)="newTransaction.type = 'expense'"
                  [class.bg-red-600]="newTransaction.type === 'expense'"
                  [class.text-white]="newTransaction.type === 'expense'"
                  class="py-3 rounded-xl border border-black/5 font-bold text-sm transition-all"
                >
                  Saída
                </button>
              </div>

              <div>
                <label for="desc" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Descrição</label>
                <input id="desc" type="text" [(ngModel)]="newTransaction.description" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
              </div>

              <div>
                <label for="amount" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Valor (R$)</label>
                <input id="amount" type="number" [(ngModel)]="newTransaction.amount" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
              </div>

              <div>
                <label for="cat" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Categoria</label>
                <select id="cat" [(ngModel)]="newTransaction.category" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
                  <option value="Vendas">Vendas</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Salários">Salários</option>
                  <option value="Fornecedores">Fornecedores</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <button 
                (click)="saveTransaction()"
                class="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-black/90 transition-all shadow-lg shadow-black/10 mt-4"
              >
                Salvar Transação
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class Financial implements OnInit {
  private dataService = inject(DataService);

  transactions = signal<FinancialTransaction[]>([]);
  sessions = signal<CashierSession[]>([]);
  sales = signal<Sale[]>([]);
  view = signal<'transactions' | 'sessions' | 'sales'>('transactions');
  showAddModal = false;

  newTransaction: Partial<FinancialTransaction> = {
    type: 'income',
    description: '',
    amount: 0,
    category: 'Outros'
  };

  async ngOnInit() {
    this.loadTransactions();
    this.loadSessions();
    this.loadSales();
  }

  async loadTransactions() {
    const t = await this.dataService.getTransactions();
    this.transactions.set(t);
  }

  async loadSessions() {
    const s = await this.dataService.getSessions();
    this.sessions.set(s.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()));
  }

  async loadSales() {
    const s = await this.dataService.getAllSales();
    this.sales.set(s);
  }

  totalIncome() {
    return this.transactions().filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  }

  totalExpense() {
    return this.transactions().filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  }

  balance() {
    return this.totalIncome() - this.totalExpense();
  }

  async saveTransaction() {
    if (!this.newTransaction.description || !this.newTransaction.amount) return;
    
    try {
      const t = await this.dataService.saveTransaction(this.newTransaction);
      this.transactions.update(items => [t, ...items]);
      this.showAddModal = false;
      this.newTransaction = { type: 'income', description: '', amount: 0, category: 'Outros' };
    } catch (err) {
      console.error('Error saving transaction', err);
    }
  }
}

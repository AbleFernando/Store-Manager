import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../data';
import { CashierSession, Sale } from '../models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cashier',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Controle de Caixa</h2>
        <p class="text-black/50">Gerencie a abertura e fechamento do seu caixa</p>
      </div>

      @if (!currentSession()) {
        <!-- Open Cashier -->
        <div class="bg-white rounded-3xl border border-black/5 shadow-xl p-8 text-center">
          <div class="w-20 h-20 bg-black/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <lucide-icon name="wallet" class="w-10 h-10 opacity-20"></lucide-icon>
          </div>
          <h3 class="text-xl font-bold mb-2">Caixa Fechado</h3>
          <p class="text-black/50 mb-8 max-w-sm mx-auto">Informe o valor inicial em dinheiro para abrir o caixa e começar as vendas do dia.</p>
          
          <div class="max-w-xs mx-auto space-y-4">
            <div>
              <label for="opening-balance" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 text-left ml-1">Valor Inicial (R$)</label>
              <input 
                id="opening-balance"
                type="number" 
                [(ngModel)]="openingBalance"
                class="w-full px-4 py-4 rounded-2xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none text-2xl font-black text-center"
              >
            </div>
            <button 
              (click)="openCashier()"
              class="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-black/90 transition-all shadow-lg shadow-black/10"
            >
              Abrir Caixa
            </button>
          </div>
        </div>
      } @else {
        <!-- Cashier Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
            <p class="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Aberto em</p>
            <p class="text-lg font-bold">{{ currentSession()?.opened_at | date:'dd/MM HH:mm' }}</p>
          </div>
          <div class="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
            <p class="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Valor Inicial</p>
            <p class="text-lg font-bold">R$ {{ currentSession()?.opening_balance | number:'1.2-2' }}</p>
          </div>
          <div class="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
            <p class="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Status</p>
            <span class="inline-flex items-center gap-2 text-green-600 font-bold text-sm">
              <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Operacional
            </span>
          </div>
        </div>

        <!-- Close Cashier -->
        <div class="bg-white rounded-3xl border border-black/5 shadow-sm p-8">
          <h3 class="text-xl font-bold mb-6">Fechar Caixa</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
              <p class="text-sm text-black/60">Confirme o valor total em dinheiro no caixa para realizar o fechamento.</p>
              <div>
                <label for="closing-balance" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5">Valor Final em Dinheiro (R$)</label>
                <input 
                  id="closing-balance"
                  type="number" 
                  [(ngModel)]="closingBalance"
                  class="w-full px-4 py-4 rounded-2xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none text-2xl font-black"
                >
              </div>
              <button 
                (click)="closeCashier()"
                class="w-full bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/10"
              >
                Encerrar Expediente
              </button>
            </div>
            
            <div class="bg-[#F9F9F9] rounded-2xl p-6 border border-black/5 space-y-4">
              <h4 class="font-bold text-sm uppercase tracking-wider">Resumo Esperado</h4>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-black/50">Vendas em Dinheiro</span>
                  <span class="font-medium">R$ {{ summary().cash | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-black/50">Vendas em Cartão</span>
                  <span class="font-medium">R$ {{ summary().card | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-black/50">Vendas em PIX</span>
                  <span class="font-medium">R$ {{ summary().pix | number:'1.2-2' }}</span>
                </div>
                <div class="pt-2 border-t border-black/5 flex justify-between font-bold">
                  <span>Total Vendido</span>
                  <span>R$ {{ summary().total | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class Cashier implements OnInit {
  private dataService = inject(DataService);

  currentSession = signal<CashierSession | null>(null);
  sessionSales = signal<Sale[]>([]);
  openingBalance = 0;
  closingBalance = 0;

  summary = computed(() => {
    const sales = this.sessionSales();
    const cash = sales.filter(s => s.payment_method === 'cash').reduce((acc, s) => acc + s.total_amount, 0);
    const card = sales.filter(s => s.payment_method === 'card').reduce((acc, s) => acc + s.total_amount, 0);
    const pix = sales.filter(s => s.payment_method === 'pix').reduce((acc, s) => acc + s.total_amount, 0);
    return {
      cash,
      card,
      pix,
      total: cash + card + pix
    };
  });

  async ngOnInit() {
    await this.loadSession();
  }

  async loadSession() {
    const session = await this.dataService.getCurrentSession();
    this.currentSession.set(session);
    if (session) {
      const sales = await this.dataService.getSalesBySession(session.id);
      this.sessionSales.set(sales);
    }
  }

  async openCashier() {
    try {
      const session = await this.dataService.openCashier(this.openingBalance);
      this.currentSession.set(session);
      this.sessionSales.set([]);
    } catch (err) {
      console.error('Error opening cashier', err);
    }
  }

  async closeCashier() {
    if (!this.currentSession()) return;
    
    try {
      await this.dataService.closeCashier(this.currentSession()!.id, this.closingBalance);
      this.currentSession.set(null);
      this.sessionSales.set([]);
      this.openingBalance = 0;
      this.closingBalance = 0;
    } catch (err) {
      console.error('Error closing cashier', err);
    }
  }
}

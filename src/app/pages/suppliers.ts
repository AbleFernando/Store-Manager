import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../data';
import { Supplier } from '../models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Fornecedores</h2>
          <p class="text-black/50">Gerencie seus parceiros de suprimentos</p>
        </div>
        <button 
          (click)="showAddModal = true"
          class="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black/90 transition-all shadow-lg shadow-black/10"
        >
          <lucide-icon name="truck" class="w-5 h-5"></lucide-icon>
          Novo Fornecedor
        </button>
      </div>

      <!-- Search -->
      <div class="bg-white p-4 rounded-3xl border border-black/5 shadow-sm shrink-0">
        <div class="relative">
          <lucide-icon name="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30"></lucide-icon>
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Buscar por nome, CNPJ ou contato..."
            class="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none transition-all"
          >
        </div>
      </div>

      <!-- Suppliers Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (s of filteredSuppliers(); track s.id) {
          <div class="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group relative">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center overflow-hidden">
                @if (s.image_url) {
                  <img [src]="s.image_url" [alt]="s.name" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                } @else {
                  <lucide-icon name="building-2" class="w-6 h-6 opacity-30"></lucide-icon>
                }
              </div>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button (click)="editSupplier(s)" class="p-2 hover:bg-black/5 rounded-xl transition-colors text-black/50">
                  <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            </div>
            
            <h3 class="font-bold text-lg mb-1">{{ s.name }}</h3>
            <p class="text-xs font-bold text-black/30 uppercase tracking-widest mb-4">{{ s.cnpj }}</p>
            
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-black/60">
                <lucide-icon name="phone" class="w-4 h-4 opacity-40"></lucide-icon>
                {{ s.phone || 'Não informado' }}
              </div>
              <div class="flex items-center gap-2 text-sm text-black/60">
                <lucide-icon name="mail" class="w-4 h-4 opacity-40"></lucide-icon>
                {{ s.email || 'Não informado' }}
              </div>
              <div class="flex items-center gap-2 text-sm text-black/60">
                <lucide-icon name="map-pin" class="w-4 h-4 opacity-40"></lucide-icon>
                <span class="truncate">{{ s.address || 'Não informado' }}</span>
              </div>
            </div>
          </div>
        }
        @if (filteredSuppliers().length === 0) {
          <div class="col-span-full py-20 text-center bg-white rounded-3xl border border-black/5">
            <lucide-icon name="truck" class="w-12 h-12 text-black/10 mx-auto mb-4"></lucide-icon>
            <p class="text-black/30 font-medium">Nenhum fornecedor encontrado</p>
          </div>
        }
      </div>

      <!-- Add Modal -->
      @if (showAddModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-6 border-b border-black/5 flex items-center justify-between">
              <h3 class="text-xl font-bold">{{ newSupplier.id ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h3>
              <button (click)="closeModal()" class="p-2 hover:bg-black/5 rounded-full transition-colors">
                <lucide-icon name="x" class="w-6 h-6"></lucide-icon>
              </button>
            </div>
            
            <div class="p-6 space-y-4">
              <!-- Image Upload -->
              <div class="flex justify-center mb-4">
                <div class="relative group">
                  <button 
                    type="button"
                    (click)="fileInput.click()"
                    class="w-24 h-24 rounded-3xl bg-black/5 border-2 border-dashed border-black/10 hover:border-black/20 transition-all overflow-hidden flex flex-col items-center justify-center group"
                  >
                    @if (newSupplier.image_url) {
                      <img [src]="newSupplier.image_url" alt="Preview do fornecedor" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <lucide-icon name="camera" class="text-white w-5 h-5"></lucide-icon>
                      </div>
                    } @else {
                      <lucide-icon name="camera" class="w-6 h-6 text-black/20 mb-1"></lucide-icon>
                      <span class="text-[8px] font-bold text-black/40 uppercase tracking-wider">Logo</span>
                    }
                  </button>
                  @if (newSupplier.image_url) {
                    <button 
                      type="button" 
                      (click)="newSupplier.image_url = ''"
                      class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <lucide-icon name="x" class="w-3 h-3"></lucide-icon>
                    </button>
                  }
                  <input #fileInput type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)">
                </div>
              </div>

              <div>
                <label for="sup-name" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Razão Social / Nome</label>
                <input id="sup-name" type="text" [(ngModel)]="newSupplier.name" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
              </div>

              <div>
                <label for="sup-cnpj" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">CNPJ</label>
                <input id="sup-cnpj" type="text" [(ngModel)]="newSupplier.cnpj" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="sup-phone" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Telefone</label>
                  <input id="sup-phone" type="text" [(ngModel)]="newSupplier.phone" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
                </div>
                <div>
                  <label for="sup-email" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">E-mail</label>
                  <input id="sup-email" type="email" [(ngModel)]="newSupplier.email" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
                </div>
              </div>

              <div>
                <label for="sup-addr" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Endereço</label>
                <input id="sup-addr" type="text" [(ngModel)]="newSupplier.address" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
              </div>

              <button 
                (click)="saveSupplier()"
                class="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-black/90 transition-all shadow-lg shadow-black/10 mt-4"
              >
                {{ newSupplier.id ? 'Salvar Alterações' : 'Cadastrar Fornecedor' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class Suppliers implements OnInit {
  private dataService = inject(DataService);

  suppliers = signal<Supplier[]>([]);
  filteredSuppliers = signal<Supplier[]>([]);
  searchQuery = '';
  showAddModal = false;

  newSupplier: Partial<Supplier> = {
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: ''
  };

  async ngOnInit() {
    this.loadSuppliers();
  }

  async loadSuppliers() {
    const s = await this.dataService.getSuppliers();
    this.suppliers.set(s);
    this.filteredSuppliers.set(s);
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase();
    this.filteredSuppliers.set(
      this.suppliers().filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.cnpj.includes(query) || 
        s.phone.includes(query)
      )
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.newSupplier.image_url = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  editSupplier(supplier: Supplier) {
    this.newSupplier = { ...supplier };
    this.showAddModal = true;
  }

  closeModal() {
    this.showAddModal = false;
    this.newSupplier = { name: '', cnpj: '', phone: '', email: '', address: '' };
  }

  async saveSupplier() {
    if (!this.newSupplier.name) return;
    
    await this.dataService.saveSupplier(this.newSupplier);
    await this.loadSuppliers();
    this.closeModal();
  }
}

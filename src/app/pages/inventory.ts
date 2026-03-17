import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../data';
import { Product, Category, Supplier } from '../models';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-end justify-between">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Estoque</h2>
          <p class="text-black/50">Gerencie seus produtos e categorias</p>
        </div>
        <button 
          (click)="showForm = true"
          class="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black/90 transition-all shadow-lg shadow-black/10"
        >
          <lucide-icon name="plus" class="w-5 h-5"></lucide-icon>
          Novo Produto
        </button>
      </div>

      <!-- Filters & Search -->
      <div class="bg-white p-4 rounded-3xl border border-black/5 shadow-sm flex flex-wrap gap-4 items-center">
        <div class="flex-1 min-w-[300px] relative">
          <lucide-icon name="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30"></lucide-icon>
          <input 
            type="text" 
            placeholder="Buscar por nome ou código de barras..."
            class="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black focus:ring-0 transition-all outline-none"
          >
        </div>
        <select class="px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none font-medium text-sm">
          <option value="">Todas Categorias</option>
          @for (cat of categories(); track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
        </select>
      </div>

      <!-- Products Table -->
      <div class="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] font-bold uppercase tracking-widest text-black/30 border-b border-black/5">
                <th class="px-6 py-4">Produto</th>
                <th class="px-6 py-4">Categoria</th>
                <th class="px-6 py-4">Preço Venda</th>
                <th class="px-6 py-4">Estoque</th>
                <th class="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/5">
              @for (product of products(); track product.id) {
                <tr class="hover:bg-black/[0.02] transition-colors group">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0 overflow-hidden">
                        @if (product.image_url) {
                          <img [src]="product.image_url" [alt]="product.name" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                        } @else {
                          <lucide-icon name="package" class="w-5 h-5 opacity-40"></lucide-icon>
                        }
                      </div>
                      <div>
                        <p class="text-sm font-bold">{{ product.name }}</p>
                        <p class="text-[10px] font-mono text-black/40">{{ product.barcode }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-xs font-medium text-black/60">{{ product.category?.name || 'Sem Categoria' }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-sm font-bold">R$ {{ product.sale_price | number:'1.2-2' }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <span 
                        class="w-2 h-2 rounded-full"
                        [class.bg-green-500]="product.stock_quantity > product.min_stock"
                        [class.bg-red-500]="product.stock_quantity <= product.min_stock"
                      ></span>
                      <span class="text-sm font-bold">{{ product.stock_quantity }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button (click)="editProduct(product)" class="p-2 hover:bg-black/5 rounded-lg text-black/60 hover:text-black transition-colors">
                        <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
                      </button>
                      <button class="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                        <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Product Form Modal -->
      @if (showForm) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-6 border-b border-black/5 flex items-center justify-between">
              <h3 class="text-xl font-bold">{{ editingId ? 'Editar Produto' : 'Novo Produto' }}</h3>
              <button (click)="closeForm()" class="p-2 hover:bg-black/5 rounded-full transition-colors">
                <lucide-icon name="x" class="w-6 h-6"></lucide-icon>
              </button>
            </div>
            
            <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="p-6 space-y-6">
              <div class="grid grid-cols-3 gap-6">
                <!-- Image Upload -->
                <div class="col-span-1">
                  <span class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5">Foto do Produto</span>
                  <button 
                    type="button"
                    (click)="fileInput.click()"
                    class="w-full aspect-square rounded-2xl border-2 border-dashed border-black/10 hover:border-black/20 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center bg-[#F9F9F9] relative group"
                  >
                    @if (productForm.value.image_url) {
                      <img [src]="productForm.value.image_url" alt="Preview do produto" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <lucide-icon name="camera" class="text-white w-6 h-6"></lucide-icon>
                      </div>
                    } @else {
                      <lucide-icon name="camera" class="w-8 h-8 text-black/20 mb-2"></lucide-icon>
                      <span class="text-[10px] font-bold text-black/40 uppercase tracking-wider">Upload</span>
                    }
                    <input #fileInput type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)">
                  </button>
                  @if (productForm.value.image_url) {
                    <button 
                      type="button" 
                      (click)="productForm.patchValue({image_url: ''})"
                      class="w-full mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wider hover:text-red-600 transition-colors"
                    >
                      Remover Foto
                    </button>
                  }
                </div>

                <!-- Form Fields -->
                <div class="col-span-2 grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label for="prod-name" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5">Nome do Produto</label>
                    <input id="prod-name" type="text" formControlName="name" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none">
                  </div>
                  <div>
                    <label for="prod-barcode" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5">Código de Barras</label>
                    <input id="prod-barcode" type="text" formControlName="barcode" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none">
                  </div>
                  <div>
                    <label for="prod-category" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5">Categoria</label>
                    <select id="prod-category" formControlName="category_id" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none">
                      <option value="">Selecione...</option>
                      @for (cat of categories(); track cat.id) {
                        <option [value]="cat.id">{{ cat.name }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label for="prod-cost" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5">Preço Custo</label>
                    <input id="prod-cost" type="number" formControlName="cost_price" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none">
                  </div>
                  <div>
                    <label for="prod-sale" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5">Preço Venda</label>
                    <input id="prod-sale" type="number" formControlName="sale_price" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none">
                  </div>
                  <div>
                    <label for="prod-stock" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5">Qtd. Estoque</label>
                    <input id="prod-stock" type="number" formControlName="stock_quantity" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none">
                  </div>
                  <div>
                    <label for="prod-min" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5">Estoque Mínimo</label>
                    <input id="prod-min" type="number" formControlName="min_stock" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black outline-none">
                  </div>
                </div>
              </div>

              <div class="flex gap-3 pt-4">
                <button type="button" (click)="closeForm()" class="flex-1 px-6 py-4 rounded-xl font-bold border border-black/5 hover:bg-black/5 transition-colors">Cancelar</button>
                <button type="submit" class="flex-1 px-6 py-4 rounded-xl font-bold bg-black text-white hover:bg-black/90 transition-all shadow-lg shadow-black/10">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class Inventory implements OnInit {
  private dataService = inject(DataService);
  private fb = inject(FormBuilder);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  suppliers = signal<Supplier[]>([]);
  showForm = false;
  editingId: string | null = null;

  productForm = this.fb.group({
    name: ['', Validators.required],
    barcode: ['', Validators.required],
    category_id: [''],
    cost_price: [0, Validators.required],
    sale_price: [0, Validators.required],
    stock_quantity: [0, Validators.required],
    min_stock: [5, Validators.required],
    supplier_id: [''],
    image_url: ['']
  });

  async ngOnInit() {
    this.loadData();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.productForm.patchValue({ image_url: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  async loadData() {
    try {
      const [p, c, s] = await Promise.all([
        this.dataService.getProducts(),
        this.dataService.getCategories(),
        this.dataService.getSuppliers()
      ]);
      this.products.set(p);
      this.categories.set(c);
      this.suppliers.set(s);
    } catch (err) {
      console.error('Error loading inventory data', err);
    }
  }

  editProduct(product: Product) {
    this.editingId = product.id;
    this.productForm.patchValue(product as Partial<Product> as Record<string, unknown>);
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.productForm.reset({ cost_price: 0, sale_price: 0, stock_quantity: 0, min_stock: 5 });
  }

  async saveProduct() {
    if (this.productForm.invalid) return;

    try {
      const productData = {
        ...this.productForm.value,
        id: this.editingId || undefined
      };
      await this.dataService.saveProduct(productData as Partial<Product>);
      this.loadData();
      this.closeForm();
    } catch (err) {
      console.error('Error saving product', err);
    }
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../data';
import { User, SystemConfig } from '../models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Configurações</h2>
          <p class="text-black/50">Gerencie o sistema e controle de acesso</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 border-b border-black/5 pb-px">
        @if (isSuperAdmin()) {
          <button 
            (click)="activeTab.set('system')"
            [class.border-black]="activeTab() === 'system'"
            [class.text-black]="activeTab() === 'system'"
            class="px-4 py-2 text-sm font-bold border-b-2 border-transparent transition-all text-black/40"
          >
            Sistema
          </button>
        }
        @if (canManageUsers()) {
          <button 
            (click)="activeTab.set('users')"
            [class.border-black]="activeTab() === 'users'"
            [class.text-black]="activeTab() === 'users'"
            class="px-4 py-2 text-sm font-bold border-b-2 border-transparent transition-all text-black/40"
          >
            Usuários
          </button>
        }
        <button 
          (click)="activeTab.set('profile')"
          [class.border-black]="activeTab() === 'profile'"
          [class.text-black]="activeTab() === 'profile'"
          class="px-4 py-2 text-sm font-bold border-b-2 border-transparent transition-all text-black/40"
        >
          Meu Perfil
        </button>
      </div>

      <!-- System Config Tab -->
      @if (activeTab() === 'system' && isSuperAdmin()) {
        <div class="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6 max-w-2xl">
          <h3 class="text-xl font-bold">Identidade Visual</h3>
          
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label for="sysName" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-2">Nome do Sistema</label>
              <input id="sysName" type="text" [(ngModel)]="config().system_name" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
            </div>
            
            <div>
              <label for="sysLogo" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-2">URL da Logo</label>
              <input id="sysLogo" type="text" [(ngModel)]="config().system_logo_url" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black" placeholder="https://exemplo.com/logo.png">
            </div>
          </div>

          <h3 class="text-xl font-bold pt-4">Integração Supabase</h3>
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label for="sbUrl" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-2">Supabase URL</label>
              <input id="sbUrl" type="text" [(ngModel)]="config().supabase_url" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
            </div>
            
            <div>
              <label for="sbKey" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-2">Supabase Anon Key</label>
              <input id="sbKey" type="password" [(ngModel)]="config().supabase_anon_key" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
            </div>
          </div>

          <button (click)="saveConfig()" class="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-black/90 transition-all shadow-lg shadow-black/10">
            Salvar Configurações
          </button>
        </div>
      }

      <!-- Users Tab -->
      @if (activeTab() === 'users' && canManageUsers()) {
        <div class="space-y-6">
          <div class="flex justify-end">
            <button (click)="openUserModal()" class="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2">
              <lucide-icon name="plus" class="w-5 h-5"></lucide-icon>
              Novo Usuário
            </button>
          </div>

          <div class="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#F9F9F9] text-[10px] font-bold uppercase tracking-widest text-black/40">
                  <th class="px-6 py-4">Nome</th>
                  <th class="px-6 py-4">E-mail</th>
                  <th class="px-6 py-4">Perfil</th>
                  <th class="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/5">
                @for (user of users(); track user.id) {
                  <tr class="hover:bg-black/[0.02] transition-colors">
                    <td class="px-6 py-4 text-sm font-bold">{{ user.name }}</td>
                    <td class="px-6 py-4 text-sm text-black/60">{{ user.email }}</td>
                    <td class="px-6 py-4">
                      <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-black/5 text-black/50">
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      @if (canEditUser(user)) {
                        <button (click)="openUserModal(user)" class="p-2 hover:bg-black/5 rounded-xl transition-colors text-black/50">
                          <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Profile Tab -->
      @if (activeTab() === 'profile') {
        <div class="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6 max-w-md">
          <h3 class="text-xl font-bold">Meus Dados</h3>
          
          <div class="space-y-4">
            <div>
              <span class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1">Nome</span>
              <p class="font-bold text-lg">{{ currentUser()?.name }}</p>
            </div>
            <div>
              <span class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1">E-mail</span>
              <p class="text-black/60">{{ currentUser()?.email }}</p>
            </div>
            <div>
              <span class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1">Perfil</span>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-black text-white">
                {{ currentUser()?.role }}
              </span>
            </div>
          </div>

          <div class="pt-6 border-t border-black/5 space-y-4">
            <h4 class="font-bold">Alterar Senha</h4>
            <div>
              <label for="newPass" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-2">Nova Senha</label>
              <input id="newPass" type="password" [(ngModel)]="newPassword" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
            </div>
            <button (click)="updatePassword()" class="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-black/90 transition-all">
              Atualizar Senha
            </button>
          </div>
        </div>
      }

      <!-- User Modal -->
      @if (showUserModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-6 border-b border-black/5 flex items-center justify-between">
              <h3 class="text-xl font-bold">{{ editingUser.id ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
              <button (click)="showUserModal = false" class="p-2 hover:bg-black/5 rounded-full transition-colors">
                <lucide-icon name="x" class="w-6 h-6"></lucide-icon>
              </button>
            </div>
            
            <div class="p-6 space-y-4">
              <div>
                <label for="userName" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Nome</label>
                <input id="userName" type="text" [(ngModel)]="editingUser.name" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
              </div>

              <div>
                <label for="userEmail" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">E-mail</label>
                <input id="userEmail" type="email" [(ngModel)]="editingUser.email" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
              </div>

              <div>
                <label for="userRole" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Perfil</label>
                <select id="userRole" [(ngModel)]="editingUser.role" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
                  @for (role of allowedRoles(); track role) {
                    <option [value]="role">{{ role }}</option>
                  }
                </select>
              </div>

              @if (!editingUser.id) {
                <div>
                  <label for="userPass" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Senha Inicial</label>
                  <input id="userPass" type="password" [(ngModel)]="editingUser.password" class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 outline-none focus:border-black">
                </div>
              }

              <button 
                (click)="saveUser()"
                class="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-black/90 transition-all shadow-lg shadow-black/10 mt-4"
              >
                {{ editingUser.id ? 'Salvar Alterações' : 'Criar Usuário' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class Settings implements OnInit {
  private dataService = inject(DataService);

  activeTab = signal<'system' | 'users' | 'profile'>('profile');
  config = signal<SystemConfig>({ system_name: '' });
  users = signal<User[]>([]);
  currentUser = this.dataService.currentUser;
  
  showUserModal = false;
  editingUser: Partial<User> = {};
  newPassword = '';

  async ngOnInit() {
    this.loadConfig();
    this.loadUsers();
    
    // Set default tab based on role
    if (this.isSuperAdmin()) {
      this.activeTab.set('system');
    } else if (this.canManageUsers()) {
      this.activeTab.set('users');
    } else {
      this.activeTab.set('profile');
    }
  }

  async loadConfig() {
    const c = await this.dataService.getConfig();
    this.config.set({ ...c });
  }

  async loadUsers() {
    const u = await this.dataService.getUsers();
    this.users.set(u);
  }

  async saveConfig() {
    await this.dataService.saveConfig(this.config());
    alert('Configurações salvas!');
  }

  isSuperAdmin() {
    return this.currentUser()?.role === 'super_admin';
  }

  canManageUsers() {
    return this.currentUser()?.role !== 'seller';
  }

  canEditUser(user: User) {
    return this.dataService.canManageRole(user.role);
  }

  allowedRoles() {
    return this.dataService.getAllowedRolesToAssign();
  }

  openUserModal(user?: User) {
    if (user) {
      this.editingUser = { ...user };
    } else {
      this.editingUser = { role: this.allowedRoles()[0] };
    }
    this.showUserModal = true;
  }

  async saveUser() {
    if (!this.editingUser.name || !this.editingUser.email) return;
    await this.dataService.saveUser(this.editingUser);
    await this.loadUsers();
    this.showUserModal = false;
  }

  async updatePassword() {
    if (!this.newPassword) return;
    const user = this.currentUser();
    if (user) {
      await this.dataService.saveUser({ ...user, password: this.newPassword });
      this.newPassword = '';
      alert('Senha atualizada com sucesso!');
    }
  }
}

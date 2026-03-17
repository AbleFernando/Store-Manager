import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SupabaseService } from '../supabase';
import { Router } from '@angular/router';
import { DataService } from '../data';
import { SystemConfig } from '../models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="flex h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A]">
      <!-- Sidebar -->
      <aside 
        [class.translate-x-0]="isSidebarOpen"
        [class.-translate-x-full]="!isSidebarOpen"
        class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-black/5 transition-transform duration-300 lg:relative lg:translate-x-0"
      >
        <div class="flex flex-col h-full">
          <!-- Logo -->
          <div class="p-6 border-b border-black/5">
            <h1 class="text-xl font-bold tracking-tight flex items-center gap-2">
              <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                @if (config()?.system_logo_url) {
                  <img [src]="config()?.system_logo_url" alt="Logo" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                } @else {
                  <lucide-icon name="shopping-cart" class="text-white w-5 h-5"></lucide-icon>
                }
              </div>
              <span class="truncate">{{ config()?.system_name || 'Store Manager' }}</span>
            </h1>
          </div>

          <!-- Nav -->
          <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
            @for (item of filteredNavItems(); track item.path) {
              <a 
                [routerLink]="item.path"
                routerLinkActive="bg-black text-white shadow-md"
                [routerLinkActiveOptions]="{exact: item.path === '/'}"
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-black/5 group"
              >
                <lucide-icon [name]="item.icon" class="w-5 h-5 opacity-70 group-hover:opacity-100"></lucide-icon>
                <span class="font-medium text-sm">{{ item.label }}</span>
              </a>
            }
          </nav>

          <!-- User -->
          <div class="p-4 border-t border-black/5">
            <button 
              (click)="logout()"
              class="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <lucide-icon name="log-out" class="w-5 h-5"></lucide-icon>
              <span class="font-medium text-sm">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Header -->
        <header class="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 shrink-0">
          <button 
            (click)="isSidebarOpen = !isSidebarOpen"
            class="lg:hidden p-2 hover:bg-black/5 rounded-lg"
          >
            <lucide-icon [name]="isSidebarOpen ? 'x' : 'menu'" class="w-6 h-6"></lucide-icon>
          </button>
          
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-xs text-black/50 font-medium uppercase tracking-wider">Caixa Aberto</p>
              <p class="text-sm font-bold">R$ 1.250,00</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-black/5 border border-black/5 flex items-center justify-center">
              <lucide-icon name="users" class="w-5 h-5 opacity-50"></lucide-icon>
            </div>
          </div>
        </header>

        <!-- Viewport -->
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
  `]
})
export class Layout implements OnInit {
  isSidebarOpen = false;
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private dataService = inject(DataService);

  config = signal<SystemConfig | null>(null);

  navItems = [
    { path: '/dashboard', icon: 'layout-dashboard', label: 'Dashboard', roles: ['super_admin', 'admin', 'supervisor'] },
    { path: '/pos', icon: 'shopping-cart', label: 'Frente de Caixa', roles: ['super_admin', 'admin', 'supervisor', 'seller'] },
    { path: '/inventory', icon: 'package', label: 'Estoque', roles: ['super_admin', 'admin', 'supervisor'] },
    { path: '/cashier', icon: 'wallet', label: 'Caixa', roles: ['super_admin', 'admin', 'supervisor'] },
    { path: '/financial', icon: 'dollar-sign', label: 'Financeiro', roles: ['super_admin', 'admin'] },
    { path: '/customers', icon: 'users', label: 'Clientes', roles: ['super_admin', 'admin', 'supervisor', 'seller'] },
    { path: '/suppliers', icon: 'truck', label: 'Fornecedores', roles: ['super_admin', 'admin', 'supervisor'] },
    { path: '/settings', icon: 'settings', label: 'Configurações', roles: ['super_admin', 'admin', 'supervisor', 'seller'] },
  ];

  async ngOnInit() {
    const c = await this.dataService.getConfig();
    this.config.set(c);
  }

  filteredNavItems() {
    const user = this.dataService.currentUser();
    if (!user) return [];
    return this.navItems.filter(item => item.roles.includes(user.role));
  }

  async logout() {
    localStorage.removeItem('mock_user');
    try {
      await this.supabase.auth.signOut();
    } catch (err: unknown) {
      console.error('Logout error', err);
    }
    this.router.navigate(['/login']);
  }
}

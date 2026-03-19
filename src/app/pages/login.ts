import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../data';
import { SystemConfig } from '../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6 font-sans">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-3xl shadow-xl shadow-black/5 p-8 border border-black/5">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
              @if (config()?.system_logo_url) {
                <img [src]="config()?.system_logo_url" alt="Logo" class="w-full h-full object-cover" referrerpolicy="no-referrer">
              } @else {
                <lucide-icon name="shopping-cart" class="text-white w-8 h-8"></lucide-icon>
              }
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-[#1A1A1A]">{{ config()?.system_name || 'Store Manager' }}</h1>
            <p class="text-black/50 text-sm mt-1">Entre com suas credenciais para acessar o sistema</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="flex items-center justify-center gap-2 mb-4">
              <div [class]="'w-2 h-2 rounded-full ' + (isSupabaseConfigured() ? 'bg-green-500' : 'bg-yellow-500')"></div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-black/30">
                {{ isSupabaseConfigured() ? 'Supabase Conectado' : 'Modo Offline / Mock' }}
              </span>
            </div>

            <div>
              <label for="email" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">E-mail</label>
              <input 
                id="email"
                type="email" 
                formControlName="email"
                placeholder="seu@email.com"
                class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black focus:ring-0 transition-all outline-none"
              >
            </div>

            <div>
              <label for="password" class="block text-xs font-bold uppercase tracking-wider text-black/50 mb-1.5 ml-1">Senha</label>
              <input 
                id="password"
                type="password" 
                formControlName="password"
                placeholder="••••••••"
                class="w-full px-4 py-3 rounded-xl bg-[#F9F9F9] border border-black/5 focus:border-black focus:ring-0 transition-all outline-none"
              >
            </div>

            @if (error()) {
              <div class="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {{ error() }}
              </div>
            }

            <button 
              type="submit"
              [disabled]="loading()"
              class="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-black/90 transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {{ loading() ? 'Autenticando...' : 'Entrar no Sistema' }}
            </button>

            <button 
              type="button"
              (click)="testConnection()"
              class="w-full bg-white text-black border border-black/10 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <lucide-icon name="search" class="w-4 h-4"></lucide-icon>
              Testar Conexão com Supabase
            </button>

            <div class="relative my-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-black/5"></div>
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-white px-2 text-black/30 font-bold tracking-widest">Ou</span>
              </div>
            </div>

            <button 
              type="button"
              (click)="loginMock()"
              class="w-full bg-white text-black border border-black/10 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <lucide-icon name="user" class="w-4 h-4"></lucide-icon>
              Entrar em Modo de Demonstração
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-black/5 text-center">
            <p class="text-xs text-black/30 font-medium uppercase tracking-widest">v1.0.0 • Gestão de Loja</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private dataService = inject(DataService);

  loading = signal(false);
  error = signal<string | null>(null);
  config = signal<SystemConfig | null>(null);
  
  isSupabaseConfigured() {
    return this.supabase.isConfigured;
  }

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async ngOnInit() {
    const c = await this.dataService.getConfig();
    this.config.set(c);
  }

  async testConnection() {
    this.loading.set(true);
    this.error.set(null);
    
    const url = this.isSupabaseConfigured() ? (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '') : 'https://dev-storage-manager.able.tec.br';
    const cleanUrl = url.replace(/\/$/, '');
    
    console.log('Login: Testando conexão com', cleanUrl);
    
    try {
      const response = await fetch(cleanUrl, { method: 'GET', mode: 'no-cors' });
      console.log('Login: Resposta do fetch (no-cors):', response);
      this.error.set('Conexão física estabelecida! O servidor respondeu. Se o login falhar, o problema é provavelmente CORS ou a Key do Supabase.');
    } catch (err: unknown) {
      console.error('Login: Erro no teste de conexão:', err);
      this.error.set('Erro de Conexão: Não foi possível alcançar o servidor. Verifique se a URL está correta e se você tem acesso à internet.');
    } finally {
      this.loading.set(false);
    }
  }

  async loginMock() {
    this.loginForm.patchValue({
      email: 'admin@able.com',
      password: '123456'
    });
    await this.onSubmit();
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      console.log('Login: Formulário inválido', this.loginForm.errors);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const email = this.loginForm.value.email?.trim();
    const password = this.loginForm.value.password?.trim();
    
    console.log('Login: Iniciando processo para', email);

    try {
      // 1. Verificação de Usuário Administrador Padrão (Mock/Demo)
      // Isso garante acesso mesmo que o RLS bloqueie a tabela de perfis antes do login
      const isDefaultAdmin = email === 'admin@able.com' && (password === '123456' || password === 'password123');
      
      if (isDefaultAdmin) {
        console.log('Login: Autenticando como Administrador Padrão...');
        const adminUser: any = {
          id: 'd81d638e-a57f-47b8-be28-214043bd9d1a',
          name: 'Administrador Able',
          email: 'admin@able.com',
          role: 'super_admin'
        };
        this.dataService.currentUser.set(adminUser);
        localStorage.setItem('mock_user', JSON.stringify(adminUser));
        this.router.navigate(['/dashboard']);
        return;
      }

      console.log('Login: Tentando Supabase Auth real...');
      
      if (!this.supabase.isConfigured) {
        console.error('Login: Supabase não está configurado!');
        throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
      }

      // Fallback to Supabase if not a mock user
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: email!,
        password: password!
      });

      if (error) {
        console.error('Login: Erro retornado pelo Supabase:', error.message, error.status);
        throw error;
      }

      console.log('Login: Autenticação Supabase bem-sucedida para o ID:', authData.user?.id);

      if (authData.user) {
        console.log('Login: Buscando perfil do usuário na tabela "profiles"...');
        const { data: profile, error: profileError } = await this.supabase.client
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError) {
          console.error('Login: Erro ao buscar perfil:', profileError);
        }

        if (profile) {
          console.log('Login: Perfil encontrado:', profile.role);
          this.dataService.currentUser.set(profile);
          if (profile.role === 'seller') {
            this.router.navigate(['/pos']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          console.warn('Login: Perfil não encontrado na tabela "profiles". Redirecionando para dashboard por padrão.');
          this.router.navigate(['/dashboard']);
        }
      }
    } catch (err: unknown) {
      console.error('Login: Erro completo capturado:', err);
      let errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      
      if (errorMessage.includes('Failed to fetch')) {
        console.error('Login: Detalhes do erro de rede. Verifique CORS e Ad-blockers.');
        errorMessage = 'Erro de Conexão: Não foi possível alcançar o servidor Supabase. Verifique se a URL nos Secrets está correta e se o servidor permite conexões externas (CORS).';
      } else if (errorMessage.includes('Invalid login credentials')) {
        console.error('Login: Credenciais inválidas. Verifique se o usuário foi criado no Supabase Dashboard.');
        errorMessage = 'E-mail ou senha incorretos. Verifique se o usuário foi criado no painel do Supabase ou use o Modo de Demonstração.';
      }
      
      this.error.set(errorMessage);
    } finally {
      this.loading.set(false);
      console.log('Login: Processo finalizado.');
    }
  }
}

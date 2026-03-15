import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6 font-sans">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-3xl shadow-xl shadow-black/5 p-8 border border-black/5">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <lucide-icon name="shopping-cart" class="text-white w-8 h-8"></lucide-icon>
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-[#1A1A1A]">CellStore Manager</h1>
            <p class="text-black/50 text-sm mt-1">Entre com suas credenciais para acessar o sistema</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
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
          </form>

          <div class="mt-8 pt-6 border-t border-black/5 text-center">
            <p class="text-xs text-black/30 font-medium uppercase tracking-widest">v1.0.0 • Gestão de Loja</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Login {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.value;

    try {
      // Mock login for development
      if (email === 'admin@cellstore.com' && password === '123456') {
        localStorage.setItem('mock_user', JSON.stringify({ email, id: 'mock-user', role: 'admin' }));
        this.router.navigate(['/dashboard']);
        return;
      }

      if (email === 'vendedor@cellstore.com' && password === '123456') {
        localStorage.setItem('mock_user', JSON.stringify({ email, id: 'mock-seller', role: 'seller' }));
        this.router.navigate(['/pos']);
        return;
      }

      if (email === 'supervisor@cellstore.com' && password === '123456') {
        localStorage.setItem('mock_user', JSON.stringify({ email, id: 'mock-supervisor', role: 'supervisor' }));
        this.router.navigate(['/dashboard']);
        return;
      }

      const { error } = await this.supabase.auth.signInWithPassword({
        email: email!,
        password: password!
      });

      if (error) throw error;

      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      // If Supabase fails (e.g. invalid URL), we can still allow mock login
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      if (email === 'admin@cellstore.com' && password === '123456') {
        localStorage.setItem('mock_user', JSON.stringify({ email, id: 'mock-user' }));
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set(errorMessage);
      }
    } finally {
      this.loading.set(false);
    }
  }
}

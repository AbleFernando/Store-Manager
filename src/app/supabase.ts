import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These will be injected by the environment or provided by the user
declare const SUPABASE_URL: string;
declare const SUPABASE_KEY: string;

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const url = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '';
    const key = typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : '';
    
    console.log('SupabaseService: Inicializando...');
    console.log('SupabaseService: URL detectada:', url || 'NENHUMA (Usando fallback)');
    console.log('SupabaseService: Key detectada:', key ? 'SIM (presente)' : 'NÃO (vazia)');
    
    if (!url || !key || url.includes('YOUR_SUPABASE_URL')) {
      console.warn('Supabase não configurado corretamente nos Secrets do AI Studio. O login real irá falhar.');
    }

    // Clean URL to avoid double slashes or trailing slashes issues
    const cleanUrl = url ? url.replace(/\/$/, '') : 'https://dev-storage-manager.able.tec.br';
    console.log('SupabaseService: Usando URL final:', cleanUrl);
    
    this.supabase = createClient(cleanUrl, key || 'placeholder');
  }

  get isConfigured() {
    const key = typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : '';
    // We always have a URL (either from Secret or fallback), so we just need the key
    return key !== '' && key !== 'placeholder';
  }

  get client() {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }
}

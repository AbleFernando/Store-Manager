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
    
    if (!url || !key || url.includes('YOUR_SUPABASE_URL')) {
      console.warn('Supabase não configurado. Verifique os Secrets SUPABASE_URL e SUPABASE_KEY.');
    }

    this.supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder');
  }

  get isConfigured() {
    const url = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '';
    const key = typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : '';
    return url !== '' && !url.includes('YOUR_SUPABASE_URL') && key !== '';
  }

  get client() {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }
}

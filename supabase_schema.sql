-- Limpeza total para recriação (CUIDADO: Isso apaga todos os dados existentes)
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.financial_transactions CASCADE;
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.cashier_sessions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. Tabelas do Sistema
-- ==========================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cashier_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(10,2),
  status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open'
);

CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_session_id UUID REFERENCES public.cashier_sessions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'pix')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID
);

CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'paid')) DEFAULT 'paid',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.system_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  system_name TEXT DEFAULT 'ABLE Store Manager',
  system_logo_url TEXT,
  supabase_url TEXT,
  supabase_anon_key TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'supervisor', 'seller')) DEFAULT 'seller',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. Segurança (RLS) - Liberando para Dev
-- ==========================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cria políticas de "Acesso Total para Autenticados" (Ideal para ambiente de DEV)
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
  LOOP
    EXECUTE format('CREATE POLICY "Allow all for authenticated" ON public.%I FOR ALL TO authenticated USING (true);', t);
  END LOOP;
END $$;

-- ==========================================
-- 3. Funções e Dados Iniciais
-- ==========================================

CREATE OR REPLACE FUNCTION public.decrement_stock(p_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_qty
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

INSERT INTO public.categories (name) VALUES ('Capas'), ('Películas'), ('Carregadores'), ('Fones de Ouvido');
INSERT INTO public.system_config (id, system_name) VALUES (1, 'ABLE Store Manager') ON CONFLICT (id) DO NOTHING;

-- 4. Usuário Administrador (Auth)
-- Limpeza profunda para garantir recriação correta
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@able.com');
DELETE FROM auth.users WHERE email = 'admin@able.com';
DELETE FROM public.profiles WHERE email = 'admin@able.com';

-- Insere no Auth com senha 'password123'
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    is_sso_user
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'd81d638e-a57f-47b8-be28-214043bd9d1a',
    'authenticated',
    'authenticated',
    'admin@able.com',
    crypt('password123', gen_salt('bf', 10)), -- Lógica de criptografia confirmada
    now(),
    DEFAULT, -- Deixa o banco preencher a coluna gerada
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Administrador Able"}',
    false,
    now(),
    now(),
    false
);

-- Identidade (Obrigatório para login e aparecer no Dashboard)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'd81d638e-a57f-47b8-be28-214043bd9d1a',
    jsonb_build_object('sub', 'd81d638e-a57f-47b8-be28-214043bd9d1a', 'email', 'admin@able.com'),
    'email',
    'admin@able.com',
    now(),
    now(),
    now()
);

-- Perfil Público
INSERT INTO public.profiles (id, name, email, role)
VALUES ('d81d638e-a57f-47b8-be28-214043bd9d1a', 'Administrador Able', 'admin@able.com', 'super_admin');


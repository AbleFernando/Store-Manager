-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES categories(id),
  cost_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessões de Caixa
CREATE TABLE cashier_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Referência ao auth.users do Supabase
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_balance DECIMAL(10,2) NOT NULL,
  closing_balance DECIMAL(10,2),
  status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open'
);

-- Vendas
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_session_id UUID REFERENCES cashier_sessions(id),
  customer_id UUID REFERENCES customers(id),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'pix')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID
);

-- Itens da Venda
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

-- Transações Financeiras
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'paid')) DEFAULT 'paid',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do Sistema
CREATE TABLE system_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  system_name TEXT DEFAULT 'Store Manager',
  system_logo_url TEXT,
  supabase_url TEXT,
  supabase_anon_key TEXT,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Perfis de Usuário (Extensão do auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'supervisor', 'seller')) DEFAULT 'seller',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados Iniciais para Teste
INSERT INTO categories (name) VALUES ('Capas'), ('Películas'), ('Carregadores'), ('Fones de Ouvido');

INSERT INTO system_config (system_name) VALUES ('ABLE Store Manager');

-- Criar um usuário padrão no Auth (Senha: password123)
-- Nota: O ID do usuário deve ser o mesmo na tabela profiles
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@able.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador"}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Criar o perfil correspondente
INSERT INTO public.profiles (id, name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'Administrador Able', 'super_admin')
ON CONFLICT (id) DO NOTHING;

-- Função para decrementar o estoque (RPC)
CREATE OR REPLACE FUNCTION decrement_stock(p_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - p_qty
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;


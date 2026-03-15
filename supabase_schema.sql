# Database Schema for CellStore Manager (Supabase)

## Tables

### categories
- id: uuid (primary key)
- name: text
- created_at: timestamp

### suppliers
- id: uuid (primary key)
- name: text
- cnpj: text
- phone: text
- email: text
- address: text
- created_at: timestamp

### customers
- id: uuid (primary key)
- name: text
- cpf_cnpj: text
- phone: text
- email: text
- address: text
- created_at: timestamp

### products
- id: uuid (primary key)
- name: text
- barcode: text
- category_id: uuid (references categories)
- cost_price: numeric
- sale_price: numeric
- stock_quantity: integer
- min_stock: integer
- supplier_id: uuid (references suppliers)
- created_at: timestamp

### cashier_sessions
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- opened_at: timestamp
- closed_at: timestamp
- opening_balance: numeric
- closing_balance: numeric
- status: text (open, closed)

### sales
- id: uuid (primary key)
- cashier_session_id: uuid (references cashier_sessions)
- customer_id: uuid (references customers)
- total_amount: numeric
- payment_method: text (cash, card, pix)
- created_at: timestamp
- user_id: uuid (references auth.users)

### sale_items
- id: uuid (primary key)
- sale_id: uuid (references sales)
- product_id: uuid (references products)
- quantity: integer
- unit_price: numeric

### financial_transactions
- id: uuid (primary key)
- type: text (income, expense)
- description: text
- amount: numeric
- due_date: date
- status: text (pending, paid)
- category: text
- created_at: timestamp

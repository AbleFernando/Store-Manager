import { Routes } from '@angular/router';
import { Login } from './pages/login';
import { Layout } from './layout/layout';
import { Dashboard } from './pages/dashboard';
import { POS } from './pages/pos';
import { Inventory } from './pages/inventory';
import { Cashier } from './pages/cashier';
import { Financial } from './pages/financial';
import { Customers } from './pages/customers';
import { Suppliers } from './pages/suppliers';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'pos', component: POS },
      { path: 'inventory', component: Inventory },
      { path: 'cashier', component: Cashier },
      { path: 'financial', component: Financial },
      { path: 'customers', component: Customers },
      { path: 'suppliers', component: Suppliers },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

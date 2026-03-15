import {
  ApplicationConfig,
  importProvidersFrom
} from '@angular/core';
import {provideRouter} from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import {routes} from './app.routes';

import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Wallet, 
  DollarSign, 
  Users, 
  Truck,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Edit2,
  Trash2,
  ShoppingBag,
  ChevronRight,
  Settings,
  CheckCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  UserPlus,
  User,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(LucideAngularModule.pick({
      LayoutDashboard, 
      ShoppingCart, 
      Package, 
      Wallet, 
      DollarSign, 
      Users, 
      Truck,
      LogOut,
      Menu,
      X,
      Search,
      Plus,
      Edit2,
      Trash2,
      ShoppingBag,
      ChevronRight,
      Settings,
      CheckCircle,
      Building2,
      Phone,
      Mail,
      MapPin,
      UserPlus,
      User,
      TrendingUp,
      TrendingDown,
      Minus
    }))
  ],
};

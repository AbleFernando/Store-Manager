import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { DataService } from './data';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const dataService = inject(DataService);
  
  // Try to restore from localStorage if signal is empty
  if (!dataService.currentUser()) {
    const userStr = localStorage.getItem('mock_user');
    if (userStr) {
      dataService.currentUser.set(JSON.parse(userStr));
    }
  }

  const user = dataService.currentUser();
  
  if (user) {
    const path = route.routeConfig?.path;

    // Super Admin has access to everything
    if (user.role === 'super_admin') return true;

    // Admin restrictions
    if (user.role === 'admin') {
      // Admin can access everything except maybe specific super admin features
      // which are handled inside the components (like System Config tab)
      return true;
    }

    // Supervisor restrictions
    const supervisorRestrictedPaths = ['financial'];
    if (user.role === 'supervisor' && path && supervisorRestrictedPaths.includes(path)) {
      return router.createUrlTree(['/dashboard']);
    }

    // Seller restrictions
    const sellerAllowedPaths = ['pos', 'customers', 'settings'];
    if (user.role === 'seller' && path && !sellerAllowedPaths.includes(path)) {
      return router.createUrlTree(['/pos']);
    }

    return true;
  }

  return router.createUrlTree(['/login']);
};

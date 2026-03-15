import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const userStr = localStorage.getItem('mock_user');
  
  if (userStr) {
    const user = JSON.parse(userStr);
    const path = route.routeConfig?.path;

    // Admin has access to everything
    if (user.role === 'admin') return true;

    // Supervisor restrictions
    const supervisorRestrictedPaths = ['financial'];
    if (user.role === 'supervisor' && path && supervisorRestrictedPaths.includes(path)) {
      return router.createUrlTree(['/dashboard']);
    }

    // Seller restrictions
    const sellerAllowedPaths = ['pos', 'customers'];
    if (user.role === 'seller' && path && !sellerAllowedPaths.includes(path)) {
      return router.createUrlTree(['/pos']);
    }

    return true;
  }

  return router.createUrlTree(['/login']);
};

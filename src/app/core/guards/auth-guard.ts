import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const requiredRoles = route.data['roles'];

  if (!(requiredRoles instanceof Array) || requiredRoles.length === 0) {
    return true;
  }

  const userRoles = authService.getUserRoles();

  const hasRequiredRole = requiredRoles.some((role) => 
    userRoles.map(r => r.toUpperCase()).includes(role.toUpperCase())
  );

  if (!hasRequiredRole) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

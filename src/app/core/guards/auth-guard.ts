import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService, KeycloakAngularModule } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);
  
  const isLoggedIn = keycloak.isLoggedIn();

  if (!isLoggedIn) {
    await keycloak.login({
      redirectUri: window.location.origin + state.url
    });
    return false;
  }

  const requiredRoles = route.data['roles'];

  if (!(requiredRoles instanceof Array) || requiredRoles.length === 0) {
    return true;
  }

  const userRoles = keycloak.getUserRoles();

  const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

  if (!hasRequiredRole) {
    router.navigate(['/']);
    return false;
  }

  return true;
}

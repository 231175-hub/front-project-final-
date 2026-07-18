import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { enviroments } from './enviroments/envitoments';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideApiConfiguration } from './api/api-configuration';

import { KeycloakAngularModule, KeycloakBearerInterceptor, KeycloakService } from 'keycloak-angular';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: enviroments.URL_KEYCLOAK,
        realm: 'ProjectFinalKeyCloak',
        clientId: 'backend-project-final'
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false
      }
    })
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptor,
      multi: true,
    },
		provideApiConfiguration(enviroments.URL_BASE),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
					darkModeSelector: '.my-app-dark'
				}
      }
    }),

    importProvidersFrom(KeycloakAngularModule),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    }
  ]
};

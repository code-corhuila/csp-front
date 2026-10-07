import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  Injector,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { loadAuthPortalSession } from './core/auth/auth-portal-session';
import { SessionService } from './core/auth/session.service';
import { RuntimeConfig } from './core/config/runtime-config';
import { RUNTIME_CONFIG } from './core/config/runtime-config.token';
import { apiInterceptor } from './core/http/api.interceptor';

/**
 * Contains the ONLY provideHttpClient() of the whole application. Portals loaded as routes
 * inherit this client and its interceptor; they must never provide their own.
 */
export function buildAppConfig(config: RuntimeConfig): ApplicationConfig {
  return {
    providers: [
      { provide: RUNTIME_CONFIG, useValue: config },
      provideZonelessChangeDetection(),
      provideRouter(routes, withComponentInputBinding()),
      provideHttpClient(withInterceptors([apiInterceptor])),
      provideAppInitializer(() =>
        inject(SessionService).connect(loadAuthPortalSession(inject(Injector))),
      ),
    ],
  };
}

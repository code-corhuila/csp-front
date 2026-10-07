import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { RUNTIME_CONFIG, RuntimeConfig } from './core/config/runtime-config';
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
    ],
  };
}

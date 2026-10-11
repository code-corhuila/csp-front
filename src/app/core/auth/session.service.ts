import { computed, inject, Injectable, InjectionToken, isDevMode, signal } from '@angular/core';

const KEY = 'csp.session.token';

/**
 * Whether the development token is accepted. It is only in development builds (ADR-022): a production
 * build ignores the stored key, so nobody opens the protected routes by writing it in the browser.
 */
export const DEV_TOKEN_ALLOWED = new InjectionToken<boolean>('csp.devTokenAllowed', {
  providedIn: 'root',
  factory: () => isDevMode(),
});

/** What the shell needs from the session the auth portal keeps in memory. */
export interface PortalSession {
  isAuthenticated(): boolean;
  hasRole(role: string): boolean;
  end(): void;
}

/**
 * The session, held once for the whole application: the development token or the
 * session of the auth portal. While portals show synthetic data this only opens the
 * protected routes; it is not security yet.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly devTokenAllowed = inject(DEV_TOKEN_ALLOWED);
  private readonly tokenSignal = signal<string | null>(this.devTokenAllowed ? sessionStorage.getItem(KEY) : null);
  private readonly portalSession = signal<PortalSession | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(
    () => this.tokenSignal() !== null || (this.portalSession()?.isAuthenticated() ?? false),
  );

  /**
   * The roles come from the auth portal session. The development token carries no claims, so it
   * counts as every role: that is a development convenience, not authorization.
   */
  hasRole(role: string): boolean {
    return this.tokenSignal() !== null || (this.portalSession()?.hasRole(role) ?? false);
  }

  /** A portal that cannot be reached must not stop the shell: it keeps the token alone. */
  async connect(load: () => Promise<PortalSession>): Promise<void> {
    try {
      this.portalSession.set(await load());
    } catch (err) {
      console.error('The session of the auth portal could not be connected', err);
    }
  }

  set(token: string): void {
    if (!this.devTokenAllowed) {
      return;
    }
    sessionStorage.setItem(KEY, token);
    this.tokenSignal.set(token);
  }

  clear(): void {
    sessionStorage.removeItem(KEY);
    this.tokenSignal.set(null);
    this.portalSession()?.end();
  }
}

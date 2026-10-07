import { computed, Injectable, signal } from '@angular/core';

const KEY = 'csp.session.token';

/** What the shell needs from the session the auth portal keeps in memory. */
export interface PortalSession {
  isAuthenticated(): boolean;
  end(): void;
}

/**
 * The session, held once for the whole application: the development token or the
 * session of the auth portal. While portals show synthetic data this only opens the
 * protected routes; it is not security yet.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenSignal = signal<string | null>(sessionStorage.getItem(KEY));
  private readonly portalSession = signal<PortalSession | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(
    () => this.tokenSignal() !== null || (this.portalSession()?.isAuthenticated() ?? false),
  );

  /** A portal that cannot be reached must not stop the shell: it keeps the token alone. */
  async connect(load: () => Promise<PortalSession>): Promise<void> {
    try {
      this.portalSession.set(await load());
    } catch (err) {
      console.error('The session of the auth portal could not be connected', err);
    }
  }

  set(token: string): void {
    sessionStorage.setItem(KEY, token);
    this.tokenSignal.set(token);
  }

  clear(): void {
    sessionStorage.removeItem(KEY);
    this.tokenSignal.set(null);
    this.portalSession()?.end();
  }
}

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
  /** Optional: a portal that predates the access token still connects, and the shell sends no token for it. */
  accessToken?(): string | null;
  /**
   * Optional: gets the session back after a reload (the portal keeps its refresh token for that). It resolves
   * when the attempt finished, whatever the outcome; a portal that predates it simply starts without session.
   */
  restore?(): Promise<void>;
  /**
   * Optional: closes the session on the server (it needs the access token still set) and then ends it locally,
   * even if the server call fails. Only an explicit sign out uses it; a rejected token goes through `end()`.
   */
  signOut?(): Promise<void>;
}

/** How long the shell waits for the portal to restore the session before it starts without one. */
export const RESTORE_TIMEOUT_MS = 10_000;

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

  readonly isAuthenticated = computed(
    () => this.tokenSignal() !== null || (this.portalSession()?.isAuthenticated() ?? false),
  );

  /**
   * The credential for the gateway: the development token (development builds only), otherwise the
   * access token of the auth portal session. It is read on every call, so a token the portal renews
   * or drops is never served stale.
   */
  token(): string | null {
    return this.tokenSignal() ?? this.portalSession()?.accessToken?.() ?? null;
  }

  /**
   * The roles come from the auth portal session. The development token carries no claims, so it
   * counts as every role: that is a development convenience, not authorization.
   */
  hasRole(role: string): boolean {
    return this.tokenSignal() !== null || (this.portalSession()?.hasRole(role) ?? false);
  }

  /**
   * Connects the session of the auth portal and waits until it has tried to restore the session of a
   * reloaded page, so nothing that reads the session (the route guards) runs before. A portal that cannot
   * be reached, fails to restore or takes too long must not stop the shell: it starts without that session.
   */
  async connect(load: () => Promise<PortalSession>): Promise<void> {
    try {
      const portal = await load();
      this.portalSession.set(portal);
      await this.restoreWithin(portal);
    } catch (err) {
      console.error('The session of the auth portal could not be connected', err);
    }
  }

  private async restoreWithin(portal: PortalSession): Promise<void> {
    if (!portal.restore) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('The session restore timed out')), RESTORE_TIMEOUT_MS);
    });
    try {
      await Promise.race([portal.restore(), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  set(token: string): void {
    if (!this.devTokenAllowed) {
      return;
    }
    sessionStorage.setItem(KEY, token);
    this.tokenSignal.set(token);
  }

  /**
   * The explicit sign out of the person: the portal closes the session on the server first, and then
   * everything is cleared, even if that call fails. Without portal `signOut()` it is just `clear()`.
   */
  async signOut(): Promise<void> {
    const portal = this.portalSession();
    if (portal?.signOut) {
      try {
        await portal.signOut();
      } catch (err) {
        console.error('The session could not be closed on the server', err);
      }
    }
    this.clear();
  }

  clear(): void {
    sessionStorage.removeItem(KEY);
    this.tokenSignal.set(null);
    this.portalSession()?.end();
  }
}

import { Injectable, signal } from '@angular/core';

const KEY = 'csp.session.token';

/** The session, held once for the whole application. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenSignal = signal<string | null>(sessionStorage.getItem(KEY));
  readonly token = this.tokenSignal.asReadonly();

  set(token: string): void {
    sessionStorage.setItem(KEY, token);
    this.tokenSignal.set(token);
  }

  clear(): void {
    sessionStorage.removeItem(KEY);
    this.tokenSignal.set(null);
  }
}

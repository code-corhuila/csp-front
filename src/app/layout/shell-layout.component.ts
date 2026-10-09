import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../core/auth/session.service';

@Component({
  selector: 'app-shell-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="navbar">
      <a routerLink="/" class="brand">
        <img src="assets/logos/icon-csp.svg" alt="" width="38" height="38" />
        <span>Cine<strong>Sync</strong></span>
      </a>
      <nav aria-label="Main">
        <a routerLink="/" routerLinkActive="active" ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }">Movies</a>
        <a routerLink="/auth" routerLinkActive="active" ariaCurrentWhenActive="page">Account</a>
        <a routerLink="/booking" routerLinkActive="active" ariaCurrentWhenActive="page">Booking</a>
        <a routerLink="/dashboard" routerLinkActive="active" ariaCurrentWhenActive="page">My tickets</a>
        @if (session.isAuthenticated()) {
          <a routerLink="/booking/snack-selection" routerLinkActive="active" ariaCurrentWhenActive="page">Snacks</a>
        }
        @if (session.hasRole('ADMIN')) {
          <a routerLink="/admin/concessions" routerLinkActive="active" ariaCurrentWhenActive="page">Concessions</a>
          <a routerLink="/admin/reservations" routerLinkActive="active" ariaCurrentWhenActive="page">Reservations</a>
          <a routerLink="/admin/billboard" routerLinkActive="active" ariaCurrentWhenActive="page">Billboard</a>
          <a routerLink="/admin/movies" routerLinkActive="active" ariaCurrentWhenActive="page">Admin movies</a>
          <a routerLink="/admin/rooms" routerLinkActive="active" ariaCurrentWhenActive="page">Rooms</a>
        }
      </nav>
      <div class="actions">
        @if (session.isAuthenticated()) {
          <button type="button" class="btn-secondary" (click)="session.clear()">Sign out</button>
        } @else {
          <a routerLink="/auth/login" class="btn-secondary">Iniciar sesión</a>
          <a routerLink="/auth/register" class="btn-primary">Registrarse</a>
        }
      </div>
    </header>
    <main><router-outlet /></main>
    <footer>
      <p>Cine<strong>Sync</strong> Platform</p>
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 24px;
      padding: 12px 6%;
      background: rgba(11, 13, 23, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--color-border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: var(--font-size-lg);
      font-weight: 800;
      color: var(--color-text-primary);
    }
    .brand:hover {
      text-decoration: none;
    }
    .brand strong {
      color: var(--color-brand-primary);
    }
    .brand img {
      object-fit: contain;
    }
    nav {
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      gap: 4px 8px;
    }
    nav a {
      padding: 8px 12px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: var(--color-text-secondary);
    }
    nav a:hover {
      background: var(--color-bg-surface-hover);
      color: var(--color-text-primary);
      text-decoration: none;
    }
    nav a.active {
      background: rgba(139, 92, 246, 0.12);
      color: var(--color-brand-primary-hover);
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .actions a:hover {
      text-decoration: none;
    }
    main {
      flex: 1;
      padding: 32px 6%;
    }
    footer {
      padding: 24px 6%;
      border-top: 1px solid var(--color-border);
      background: #080A12;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }
    footer strong {
      color: var(--color-brand-primary);
    }
    @media (max-width: 640px) {
      .actions {
        order: 1;
        margin-left: auto;
      }
      nav {
        order: 2;
        flex: 1 1 100%;
        flex-wrap: nowrap;
        overflow-x: auto;
      }
      nav a {
        flex: none;
        white-space: nowrap;
      }
    }
  `,
})
export class ShellLayoutComponent {
  readonly session = inject(SessionService);
}

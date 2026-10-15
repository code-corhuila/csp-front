import { Component, input } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-remote-unavailable',
  template: `
    <section role="alert">
      <h1>{{ portal() }} no está disponible en este momento</h1>
      <p>El resto de la aplicación sigue funcionando.</p>
      <button type="button" class="btn-secondary" (click)="retry()">Intentar de nuevo</button>
    </section>
  `,
  styles: `
    section {
      display: grid;
      justify-items: start;
      gap: 12px;
      max-width: 560px;
      padding: 24px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-left: 4px solid var(--color-error);
      border-radius: var(--radius-lg);
    }
    h1 {
      font-size: var(--font-size-lg);
    }
    p {
      color: var(--color-text-secondary);
    }
  `,
})
export class RemoteUnavailableComponent {
  readonly portal = input.required<string>();

  retry(): void {
    window.location.reload();
  }
}

/**
 * The routes a portal is replaced with when its remoteEntry cannot be loaded.
 * A portal mounted at the root passes '' so that only its start address shows
 * the notice and the other addresses keep resolving.
 */
export function remoteUnavailable(portal: string, err: unknown, path = '**'): Routes {
  console.error(`portal "${portal}" failed to load`, err);
  return [{ path, pathMatch: path === '' ? 'full' : undefined, component: RemoteUnavailableComponent, data: { portal } }];
}

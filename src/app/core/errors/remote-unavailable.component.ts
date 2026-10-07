import { Component, input } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-remote-unavailable',
  template: `
    <section role="alert">
      <h1>{{ portal() }} is not available right now</h1>
      <p>The rest of the application still works.</p>
      <button type="button" class="btn-secondary" (click)="retry()">Try again</button>
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

/** The routes a portal is replaced with when its remoteEntry cannot be loaded. */
export function remoteUnavailable(portal: string, err: unknown): Routes {
  console.error(`portal "${portal}" failed to load`, err);
  return [{ path: '**', component: RemoteUnavailableComponent, data: { portal } }];
}

import { Component, input } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-remote-unavailable',
  template: `
    <section role="alert">
      <h1>{{ portal() }} is not available right now</h1>
      <p>The rest of the application still works.</p>
      <button type="button" (click)="retry()">Try again</button>
    </section>
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

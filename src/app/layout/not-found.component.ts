import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section>
      <h1>Page not found</h1>
      <p>The address does not exist. <a routerLink="/">Go to the start</a>.</p>
    </section>
  `,
  styles: `
    h1 {
      margin-bottom: 12px;
      font-size: var(--font-size-xl);
    }
    p {
      color: var(--color-text-secondary);
    }
  `,
})
export class NotFoundComponent {}

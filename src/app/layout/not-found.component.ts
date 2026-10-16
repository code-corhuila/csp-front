import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section>
      <h1>Página no encontrada</h1>
      <p>La dirección no existe. <a routerLink="/">Ir al inicio</a>.</p>
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

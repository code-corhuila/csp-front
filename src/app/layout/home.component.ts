import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <section class="hero">
      <h1>Cinesync <span>Platform</span></h1>
      <p>Welcome. Pick a movie, choose your seats and get your digital ticket.</p>
    </section>
  `,
  styles: `
    .hero {
      max-width: 650px;
      padding: 40px 0;
    }
    h1 {
      margin-bottom: 18px;
      font-size: clamp(2.2rem, 5vw, 3.5rem);
      line-height: 1.05;
    }
    h1 span {
      color: var(--color-brand-primary);
      text-shadow: 0 0 25px rgba(139, 92, 246, 0.5);
    }
    p {
      color: var(--color-text-secondary);
      line-height: 1.6;
    }
  `,
})
export class HomeComponent {}

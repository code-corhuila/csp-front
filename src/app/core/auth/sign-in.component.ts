import { Component, inject, input } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from './session.service';

/**
 * DEVELOPMENT ONLY. Until the identity domain exists, a token minted with
 * a token from the development environment is pasted here. Replace this component with the
 * real sign-in of the identity portal.
 */
@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" aria-labelledby="signin-title">
      <h1 id="signin-title">Sign in</h1>
      <label for="dev-token">Access token (development)</label>
      <textarea id="dev-token" rows="4" formControlName="token"></textarea>
      <button type="submit" class="btn-primary" [disabled]="form.invalid">Sign in</button>
    </form>
  `,
  styles: `
    form {
      display: grid;
      gap: 12px;
      max-width: 480px;
      margin: 0 auto;
      padding: 24px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }
    label {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }
    textarea {
      padding: 10px 12px;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      resize: vertical;
    }
    textarea:focus {
      border-color: var(--color-brand-primary);
      box-shadow: 0 0 0 3px var(--color-border-glow);
      outline: none;
    }
  `,
})
export class SignInComponent {
  readonly returnUrl = input('/');
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  readonly form = inject(NonNullableFormBuilder).group({ token: ['', Validators.required] });

  submit(): void {
    this.session.set(this.form.getRawValue().token.trim());
    void this.router.navigateByUrl(this.returnUrl());
  }
}

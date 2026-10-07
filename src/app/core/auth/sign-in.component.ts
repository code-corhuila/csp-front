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
      <button type="submit" [disabled]="form.invalid">Sign in</button>
    </form>
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

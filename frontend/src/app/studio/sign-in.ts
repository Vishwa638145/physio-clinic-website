import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, errorMessage } from '../core/auth.service';
import { Wordmark } from '../shared/wordmark';

@Component({
  selector: 'k-sign-in',
  imports: [ReactiveFormsModule, RouterLink, Wordmark],
  template: `
    <div class="screen">
      <div class="panel">
        <a routerLink="/" aria-label="Back to the website"><k-wordmark /></a>
        <h1>Ads Studio</h1>
        <p class="sub">Create and manage the clinic’s Facebook and Instagram ads.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="s-email">Email</label>
            <input id="s-email" class="input" type="email" formControlName="email" autocomplete="username" />
          </div>
          <div class="field">
            <label for="s-pw">Password</label>
            <input id="s-pw" class="input" type="password" formControlName="password" autocomplete="current-password" />
          </div>
          @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
          <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .screen { min-height: 100dvh; display: grid; place-items: center; padding: 24px var(--gutter); }
    .panel { width: 100%; max-width: 400px; display: grid; gap: 8px; }
    h1 {
      margin-top: 40px;
      font-size: var(--t-4xl);
      font-weight: 760;
      font-stretch: 122%;
      font-variation-settings: 'wdth' 122;
    }
    .sub { color: var(--spruce-2); margin-bottom: 28px; }
    form { display: grid; gap: 18px; }
    .btn { margin-top: 6px; }
    .err { color: var(--danger); font-weight: 600; font-size: var(--t-sm); }
  `,
})
export class SignIn {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.error.set('Enter your email and password.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email, password);
      await this.router.navigateByUrl('/studio');
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}

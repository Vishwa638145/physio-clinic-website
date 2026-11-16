import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { errorMessage } from '../core/auth.service';
import { BRAND, SERVICES } from '../core/brand';
import { MetaApi } from '../core/meta-api.service';
import { trafficSource } from './traffic-source';

/** Short "request a call back" form. Posts to the same enquiries endpoint as the booking page. */
@Component({
  selector: 'k-callback-form',
  imports: [ReactiveFormsModule],
  template: `
    @if (sent()) {
      <div class="sent" role="status">
        <strong>Thank you, {{ firstName() }}.</strong>
        <span>We’ll call {{ form.value.phone }} shortly to fix a convenient time.</span>
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate [class.stacked]="layout() === 'stacked'">
        <div class="field">
          <label [for]="id + '-name'">Your name</label>
          <input [id]="id + '-name'" class="input" formControlName="name" autocomplete="name" placeholder="Full name" />
        </div>
        <div class="field">
          <label [for]="id + '-phone'">Mobile number</label>
          <input [id]="id + '-phone'" class="input" formControlName="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="98400 12345" />
        </div>
        <div class="field">
          <label [for]="id + '-concern'">Concern</label>
          <select [id]="id + '-concern'" class="input" formControlName="concern">
            @for (c of concerns; track c) { <option [value]="c">{{ c }}</option> }
          </select>
        </div>
        <input type="text" formControlName="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <button class="btn btn-primary" type="submit" [disabled]="sending()">
          {{ sending() ? 'Sending…' : 'Request a call back' }}
        </button>
        @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
      </form>
    }
  `,
  styles: `
    :host { display: block; }
    form { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 14px; align-items: end; }
    form.stacked { grid-template-columns: 1fr; }
    form.stacked .btn { width: 100%; }
    @media (max-width: 900px) { form:not(.stacked) { grid-template-columns: 1fr 1fr; } form:not(.stacked) .btn { grid-column: 1 / -1; } }
    @media (max-width: 520px) { form:not(.stacked) { grid-template-columns: 1fr; } }
    .hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
    .err { grid-column: 1 / -1; color: var(--danger); font-weight: 600; font-size: var(--t-sm); }
    .sent { display: grid; gap: 4px; padding: 16px 18px; border-radius: var(--r-sm); background: var(--accent-soft); color: var(--ink); }
    .sent strong { color: var(--ok); }
  `,
})
export class CallbackForm {
  private api = inject(MetaApi);
  readonly visit = input<'clinic' | 'home'>('clinic');
  readonly layout = input<'row' | 'stacked'>('row');
  readonly id = `cb-${Math.random().toString(36).slice(2, 7)}`;

  readonly concerns = [...SERVICES.filter((s) => s.slug !== 'home').map((s) => s.name), 'Not sure yet'];
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d][\d\s-]{7,16}$/)]],
    concern: ['Not sure yet'],
    website: [''],
  });

  firstName(): string {
    return (this.form.value.name ?? '').trim().split(/\s+/)[0] ?? '';
  }

  async submit(): Promise<void> {
    this.error.set('');
    const c = this.form.controls;
    if (c.name.invalid) return this.error.set('Please enter your name.');
    if (c.phone.invalid) return this.error.set('Please enter a mobile number we can call, like 98400 12345.');
    this.sending.set(true);
    try {
      const v = this.form.getRawValue();
      await this.api.submitEnquiry({
        name: v.name,
        phone: v.phone,
        concern: v.concern,
        visitType: this.visit(),
        preferredSlot: 'Call back',
        source: trafficSource(),
        website: v.website,
      });
      this.sent.set(true);
    } catch (err) {
      this.error.set(errorMessage(err, `That didn’t go through. Please call ${BRAND.phone}.`));
    } finally {
      this.sending.set(false);
    }
  }
}

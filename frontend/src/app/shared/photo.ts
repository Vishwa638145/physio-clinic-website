import { Component, input, signal } from '@angular/core';

/**
 * Image with a graceful fallback: if the file can't load (offline, not added yet),
 * a soft branded panel keeps the layout intact.
 */
@Component({
  selector: 'k-photo',
  template: `
    @if (!failed()) {
      <img [src]="src()" [alt]="alt()" [attr.loading]="eager() ? 'eager' : 'lazy'" [attr.fetchpriority]="eager() ? 'high' : null"
        decoding="async" (error)="failed.set(true)" />
    } @else {
      <div class="ph" role="img" [attr.aria-label]="alt()">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="11" r="3.4" />
          <path d="M12 17.5c3 1.6 5.4 2.2 8 2.2s5-.6 8-2.2M20 19.7v6.3l-4.5 7M20 26l4.5 7" />
        </svg>
        @if (label()) { <span>{{ label() }}</span> }
      </div>
    }
  `,
  styles: `
    :host { display: block; overflow: hidden; border-radius: var(--r-lg); background: var(--primary-soft); position: relative; }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ph {
      position: absolute; inset: 0;
      display: grid; place-content: center; justify-items: center; gap: 10px; padding: 16px; text-align: center;
      background: radial-gradient(120% 100% at 80% 0%, #d4ebe6 0%, var(--primary-soft) 55%, #d5e6eb 100%);
      color: var(--primary);
    }
    svg { width: 56px; height: 56px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; opacity: 0.55; }
    svg circle { fill: currentColor; stroke: none; }
    span { font-size: var(--t-sm); font-weight: 600; color: var(--ink-2); max-width: 28ch; }
  `,
})
export class Photo {
  readonly src = input.required<string>();
  readonly alt = input('');
  /** Optional text shown only in the fallback panel */
  readonly label = input('');
  readonly eager = input(false);
  readonly failed = signal(false);
}

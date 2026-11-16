import { Component, input } from '@angular/core';
import { BRAND } from '../core/brand';

/**
 * Clinic logo. Uses BRAND.logoSrc when set; otherwise a neutral built-in mark + BRAND.name.
 * Selector kept as k-wordmark so every screen (site and Ads Studio) picks up the change.
 */
@Component({
  selector: 'k-wordmark',
  template: `
    @if (logoSrc) {
      <img class="logo-img" [src]="logoSrc" [alt]="name" />
    } @else {
      <span class="logo" [class.light]="tone() === 'light'">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="11" class="bg" />
          <circle cx="20" cy="11" r="3.4" class="fg" />
          <path d="M12 17.5c3 1.6 5.4 2.2 8 2.2s5-.6 8-2.2M20 19.7v6.3l-4.5 7M20 26l4.5 7" class="stroke" />
        </svg>
        <span class="text">
          <span class="name">{{ name }}</span>
          @if (showDescriptor()) { <span class="desc">{{ descriptor }}</span> }
        </span>
      </span>
    }
  `,
  styles: `
    :host { display: inline-flex; }
    .logo-img { height: 44px; width: auto; }
    .logo { display: inline-flex; align-items: center; gap: 10px; color: var(--ink); }
    svg { width: 40px; height: 40px; flex: none; }
    .bg { fill: var(--primary); }
    .fg { fill: #fff; }
    .stroke { fill: none; stroke: #fff; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
    .text { display: grid; line-height: 1.1; }
    .name { font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em; }
    .desc { font-size: 0.72rem; font-weight: 600; color: var(--muted); margin-top: 2px; }
    .light { color: #fff; }
    .light .bg { fill: var(--accent); }
    .light .desc { color: rgba(255, 255, 255, 0.65); }
  `,
})
export class Wordmark {
  readonly tone = input<'dark' | 'light'>('dark');
  readonly showDescriptor = input(true);
  readonly name = BRAND.name;
  readonly descriptor = BRAND.descriptor;
  readonly logoSrc = BRAND.logoSrc;
}

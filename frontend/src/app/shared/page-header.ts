import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Banner at the top of inner pages: breadcrumb, title and one supporting line. */
@Component({
  selector: 'k-page-header',
  imports: [RouterLink],
  template: `
    <header class="ph">
      <div class="wrap">
        <nav aria-label="Breadcrumb" class="crumbs">
          <a routerLink="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">{{ crumb() || title() }}</span>
        </nav>
        <h1>{{ title() }}</h1>
        @if (lede()) { <p>{{ lede() }}</p> }
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .ph {
      background:
        radial-gradient(60% 120% at 100% 0%, rgba(35, 165, 138, 0.14) 0%, transparent 60%),
        linear-gradient(180deg, var(--sky) 0%, #eaf3f6 100%);
      padding: clamp(40px, 6vw, 72px) 0 clamp(40px, 6vw, 64px);
      border-bottom: 1px solid var(--line-soft);
    }
    .crumbs { display: flex; gap: 8px; font-size: var(--t-sm); color: var(--muted); margin-bottom: 14px; }
    .crumbs a { color: var(--primary); text-decoration: none; font-weight: 600; }
    .crumbs a:hover { text-decoration: underline; }
    h1 { font-size: var(--t-5xl); font-weight: 780; max-width: 18ch; }
    p { margin-top: 16px; font-size: var(--t-lg); color: var(--muted); max-width: 60ch; }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly lede = input('');
  readonly crumb = input('');
}

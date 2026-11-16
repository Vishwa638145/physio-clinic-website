import { Component, computed, input, signal } from '@angular/core';
import { formatMoney } from '../core/format';
import type { DailyPoint } from '../core/models';

/** Daily spend as bars, with a readout line that follows the pointer. */
@Component({
  selector: 'k-spend-chart',
  template: `
    <div class="chart">
      <p class="readout num" aria-live="polite">
        @if (active(); as p) {
          <strong>{{ dayLabel(p.date) }}</strong>
          <span>{{ money(p.spend) }} spent</span>
          <span>{{ p.clicks.toLocaleString('en-IN') }} clicks</span>
          <span>{{ p.impressions.toLocaleString('en-IN') }} impressions</span>
        } @else {
          <span>No delivery in this period.</span>
        }
      </p>
      <div class="plot" (mouseleave)="hover.set(null)">
        <div class="max num" aria-hidden="true">{{ money(max()) }}</div>
        <svg [attr.viewBox]="'0 0 ' + points().length * 10 + ' 100'" preserveAspectRatio="none" role="img"
          [attr.aria-label]="summary()">
          @for (p of points(); track p.date; let i = $index) {
            <rect
              [attr.x]="i * 10 + 1.5"
              [attr.width]="7"
              [attr.y]="100 - h(p.spend)"
              [attr.height]="h(p.spend)"
              [class.on]="hover() === i || (hover() === null && i === points().length - 1)"
              rx="1"
            />
            <rect class="hit" [attr.x]="i * 10" width="10" y="0" height="100" (mouseenter)="hover.set(i)" />
          }
        </svg>
        <div class="axis" aria-hidden="true">
          <span>{{ dayLabel(points()[0]?.date) }}</span>
          <span>{{ dayLabel(points()[points().length - 1]?.date) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .chart { display: grid; gap: 12px; }
    .readout { display: flex; flex-wrap: wrap; gap: 4px 18px; font-size: var(--t-sm); color: var(--spruce-2); min-height: 1.6em; }
    .readout strong { color: var(--spruce); }
    .plot { position: relative; padding-top: 18px; }
    .max { position: absolute; top: 0; left: 0; font-size: var(--t-xs); color: var(--spruce-3); }
    svg { width: 100%; height: 140px; border-top: 1px dashed var(--rule); border-bottom: 1.5px solid var(--spruce); }
    rect { fill: var(--rule); transition: fill 0.12s; }
    rect.on { fill: var(--spruce); }
    rect.hit { fill: transparent; cursor: crosshair; }
    .axis { display: flex; justify-content: space-between; font-size: var(--t-xs); color: var(--spruce-3); margin-top: 6px; }
  `,
})
export class SpendChart {
  readonly points = input<DailyPoint[]>([]);
  readonly currency = input('INR');
  readonly hover = signal<number | null>(null);

  readonly max = computed(() => Math.max(1, ...this.points().map((p) => p.spend)));
  readonly active = computed(() => {
    const pts = this.points();
    const i = this.hover();
    return i !== null ? pts[i] : pts[pts.length - 1];
  });
  readonly summary = computed(() => {
    const total = this.points().reduce((s, p) => s + p.spend, 0);
    return `Daily spend over ${this.points().length} days, ${this.money(total)} in total`;
  });

  h(v: number): number {
    return Math.max(v > 0 ? 1.5 : 0, (v / this.max()) * 96);
  }
  money(v: number): string {
    return formatMoney(v, this.currency());
  }
  dayLabel(iso?: string): string {
    if (!iso) return '';
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}

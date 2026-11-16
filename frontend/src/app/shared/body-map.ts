import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERVICES as ALL_SERVICES, REGIONS, WHOLE_BODY } from '../core/brand';

interface Hit {
  name: string;
  service: string;
  region: string;
}

/** "Where does it hurt?" — pick a body area or search, see the conditions we treat there. */
@Component({
  selector: 'k-body-map',
  imports: [RouterLink],
  template: `
    <div class="map">
      <div class="figure-col">
        <div class="figure">
          <svg viewBox="0 0 200 440" aria-hidden="true">
            <circle cx="100" cy="40" r="27" class="body" />
            <rect x="90" y="62" width="20" height="24" rx="8" class="body" />
            <rect x="64" y="86" width="72" height="146" rx="30" class="body" />
            <path d="M66 104 L44 186 L36 262" class="limb" />
            <path d="M134 104 L156 186 L164 262" class="limb" />
            <path d="M86 222 L82 330 L80 418" class="limb leg" />
            <path d="M114 222 L118 330 L120 418" class="limb leg" />
          </svg>
          @for (r of regions; track r.id) {
            <button
              type="button"
              class="spot"
              [class.on]="selected() === r.id"
              [style.left.%]="r.x"
              [style.top.%]="r.y"
              [attr.aria-pressed]="selected() === r.id"
              (click)="pick(r.id)"
            >
              <span class="visually-hidden">{{ r.name }}</span>
              <span class="tip" aria-hidden="true">{{ r.name }}</span>
            </button>
          }
        </div>
        <button type="button" class="whole" [class.on]="selected() === 'whole'" [attr.aria-pressed]="selected() === 'whole'" (click)="pick('whole')">
          Stroke, balance and whole-body weakness
        </button>
      </div>

      <div class="panel">
        <label for="cond-search" class="search-label">Search a condition</label>
        <input id="cond-search" class="input" type="search" placeholder="For example: sciatica, frozen shoulder" [value]="query()"
          (input)="query.set($any($event.target).value)" autocomplete="off" />

        @if (query().trim().length > 1) {
          <h3 class="panel-h" aria-live="polite">{{ results().length ? results().length + ' matches' : 'No match' }}</h3>
          @if (!results().length) {
            <p class="none">We may still be able to help. Call or WhatsApp the front desk and describe the problem.</p>
          }
          <ul class="conds">
            @for (h of results(); track h.name + h.region) {
              <li>
                <a [routerLink]="['/book']" [queryParams]="{ concern: serviceName(h.service) }">
                  <span>{{ h.name }}</span><small>{{ h.region }}</small>
                </a>
              </li>
            }
          </ul>
        } @else {
          <h3 class="panel-h" aria-live="polite">{{ current().name }}</h3>
          <ul class="conds">
            @for (c of current().conditions; track c.name) {
              <li>
                <a [routerLink]="['/book']" [queryParams]="{ concern: serviceName(c.service) }">
                  <span>{{ c.name }}</span><small>{{ serviceName(c.service) }}</small>
                </a>
              </li>
            }
          </ul>
        }
        <p class="foot">Choose a condition to book an assessment for it.</p>
      </div>
    </div>
  `,
  styleUrl: './body-map.scss',
})
export class BodyMap {
  readonly regions = REGIONS;
  readonly selected = signal<string>('knee');
  readonly query = signal('');

  readonly current = computed(() => {
    const id = this.selected();
    if (id === 'whole') return WHOLE_BODY;
    return REGIONS.find((r) => r.id === id) ?? REGIONS[0]!;
  });

  private all: Hit[] = [
    ...REGIONS.flatMap((r) => r.conditions.map((c) => ({ ...c, region: r.name }))),
    ...WHOLE_BODY.conditions.map((c) => ({ ...c, region: WHOLE_BODY.name })),
  ];

  readonly results = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.all.filter((h) => h.name.toLowerCase().includes(q) || h.region.toLowerCase().includes(q)).slice(0, 10);
  });

  pick(id: string): void {
    this.selected.set(id);
    this.query.set('');
  }

  serviceName(slug: string): string {
    return ALL_SERVICES.find((s) => s.slug === slug)?.name ?? 'Not sure yet';
  }
}

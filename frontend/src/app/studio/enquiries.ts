import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { errorMessage } from '../core/auth.service';
import type { Enquiry } from '../core/models';
import { MetaApi } from '../core/meta-api.service';

@Component({
  selector: 'k-enquiries',
  template: `
    <header class="head">
      <h1>Enquiries</h1>
      <p>Requests from the website’s booking form. Ones that came from an ad show the campaign tag.</p>
    </header>

    <div class="filters" role="group" aria-label="Filter by status">
      @for (f of filters; track f.value) {
        <button type="button" [class.on]="filter() === f.value" [attr.aria-pressed]="filter() === f.value" (click)="filter.set(f.value)">
          {{ f.label }} <span class="num">{{ count(f.value) }}</span>
        </button>
      }
    </div>

    @if (error()) { <p class="err" role="alert">{{ error() }}</p> }

    @if (!loading() && shown().length === 0) {
      <p class="empty">
        @if (filter() === 'all') { No enquiries yet. They’ll appear here as soon as someone uses the booking form. }
        @else { Nothing with this status. }
      </p>
    } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Phone</th>
              <th scope="col">Concern</th>
              <th scope="col">Visit</th>
              <th scope="col">Prefers</th>
              <th scope="col">Came from</th>
              <th scope="col">Received</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (e of shown(); track e.id) {
              <tr>
                <td>
                  <strong>{{ e.name }}</strong>
                  @if (e.message) { <span class="msg">{{ e.message }}</span> }
                </td>
                <td class="num"><a [href]="'tel:' + e.phone.replace(/\\s/g, '')">{{ e.phone }}</a></td>
                <td>{{ e.concern }}</td>
                <td>
                  @if (e.visitType === 'home') {
                    <strong>Home</strong><span class="msg">{{ homeAddress(e) }}</span>
                  } @else { Clinic }
                </td>
                <td>{{ e.preferredSlot || '—' }}</td>
                <td>@if (e.source) { <span class="tag">{{ e.source }}</span> } @else { Website }</td>
                <td class="num">{{ when(e.createdAt) }}</td>
                <td>
                  <label class="visually-hidden" [for]="'st-' + e.id">Status for {{ e.name }}</label>
                  <select class="input sm" [id]="'st-' + e.id" [value]="e.status" (change)="setStatus(e, $any($event.target).value)">
                    <option value="new" [selected]="e.status === 'new'">New</option>
                    <option value="contacted" [selected]="e.status === 'contacted'">Called</option>
                    <option value="booked" [selected]="e.status === 'booked'">Booked</option>
                    <option value="closed" [selected]="e.status === 'closed'">Closed</option>
                  </select>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    .head { margin-bottom: 24px; }
    h1 { font-size: var(--t-4xl); font-weight: 740; font-stretch: 118%; font-variation-settings: 'wdth' 118; }
    .head p { color: var(--spruce-2); margin-top: 6px; }
    .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .filters button {
      border: 1.5px solid var(--rule); background: var(--paper); border-radius: 999px; padding: 6px 14px;
      font-weight: 600; font-size: var(--t-sm); cursor: pointer;
      span { color: var(--spruce-3); margin-left: 4px; }
      &.on { background: var(--spruce); border-color: var(--spruce); color: var(--plaster); span { color: var(--band); } }
    }
    .err { color: var(--danger); font-weight: 600; margin-bottom: 16px; }
    .empty { padding: 40px 0; color: var(--spruce-2); border-top: 1.5px solid var(--spruce); }
    .table-wrap { overflow-x: auto; border-top: 1.5px solid var(--spruce); }
    table { width: 100%; border-collapse: collapse; min-width: 980px; }
    th { text-align: left; font-size: var(--t-xs); color: var(--spruce-3); font-weight: 600; padding: 12px 12px 12px 0; border-bottom: 1px solid var(--rule); }
    td { padding: 14px 12px 14px 0; border-bottom: 1px solid var(--rule-soft); font-size: var(--t-sm); vertical-align: top; }
    .msg { display: block; color: var(--spruce-3); max-width: 40ch; margin-top: 2px; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: var(--band-soft); font-size: var(--t-xs); font-weight: 600; }
    select.sm { min-height: 36px; padding: 4px 32px 4px 10px; width: auto; }
  `,
})
export class Enquiries implements OnInit {
  private api = inject(MetaApi);
  readonly items = signal<Enquiry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filter = signal<'all' | Enquiry['status']>('all');
  readonly filters: { value: 'all' | Enquiry['status']; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Called' },
    { value: 'booked', label: 'Booked' },
    { value: 'closed', label: 'Closed' },
  ];
  readonly shown = computed(() => (this.filter() === 'all' ? this.items() : this.items().filter((e) => e.status === this.filter())));

  async ngOnInit(): Promise<void> {
    try {
      this.items.set(await this.api.enquiries());
    } catch (err) {
      this.error.set(errorMessage(err, 'Couldn’t load enquiries.'));
    } finally {
      this.loading.set(false);
    }
  }

  homeAddress(e: Enquiry): string {
    return [e.area, e.address, e.pincode].filter((x) => !!x).join(', ');
  }

  count(f: 'all' | Enquiry['status']): number {
    return f === 'all' ? this.items().length : this.items().filter((e) => e.status === f).length;
  }

  async setStatus(e: Enquiry, status: Enquiry['status']): Promise<void> {
    const prev = e.status;
    this.items.update((l) => l.map((x) => (x.id === e.id ? { ...x, status } : x)));
    try {
      await this.api.setEnquiryStatus(e.id, status);
    } catch (err) {
      this.items.update((l) => l.map((x) => (x.id === e.id ? { ...x, status: prev } : x)));
      this.error.set(errorMessage(err, 'Couldn’t update the status.'));
    }
  }

  when(iso: string): string {
    const d = new Date(iso);
    const mins = Math.round((Date.now() - d.getTime()) / 60_000);
    if (mins < 60) return `${Math.max(1, mins)} min ago`;
    if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}

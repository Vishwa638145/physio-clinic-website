import { Pipe, PipeTransform } from '@angular/core';

const moneyCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(value: number | null | undefined, currency = 'INR', digits = 0): string {
  if (value === null || value === undefined) return '—';
  const key = `${currency}-${digits}`;
  let f = moneyCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: digits, minimumFractionDigits: digits });
    moneyCache.set(key, f);
  }
  return f.format(value);
}

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat('en-IN');

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(v: number | null | undefined, currency = 'INR', digits = 0): string {
    return formatMoney(v, currency, digits);
  }
}

@Pipe({ name: 'count' })
export class CountPipe implements PipeTransform {
  transform(v: number | null | undefined, mode: 'compact' | 'plain' = 'plain'): string {
    if (v === null || v === undefined) return '—';
    return mode === 'compact' && v >= 10_000 ? compact.format(v) : plain.format(Math.round(v));
  }
}

export const STATUS_LABEL: Record<string, { label: string; tone: '' | 'is-active' | 'is-review' | 'is-issue' }> = {
  ACTIVE: { label: 'Running', tone: 'is-active' },
  PAUSED: { label: 'Paused', tone: '' },
  CAMPAIGN_PAUSED: { label: 'Campaign paused', tone: '' },
  ADSET_PAUSED: { label: 'Ad set paused', tone: '' },
  IN_PROCESS: { label: 'In review', tone: 'is-review' },
  PENDING_REVIEW: { label: 'In review', tone: 'is-review' },
  PREAPPROVED: { label: 'Approved', tone: 'is-active' },
  WITH_ISSUES: { label: 'Has issues', tone: 'is-issue' },
  DISAPPROVED: { label: 'Rejected', tone: 'is-issue' },
  PENDING_BILLING_INFO: { label: 'Needs billing', tone: 'is-issue' },
  ARCHIVED: { label: 'Archived', tone: '' },
};

@Pipe({ name: 'deliveryLabel' })
export class DeliveryLabelPipe implements PipeTransform {
  transform(status: string): string {
    return STATUS_LABEL[status]?.label ?? status.replace(/_/g, ' ').toLowerCase();
  }
}

@Pipe({ name: 'deliveryTone' })
export class DeliveryTonePipe implements PipeTransform {
  transform(status: string): string {
    return STATUS_LABEL[status]?.tone ?? '';
  }
}

export const OBJECTIVE_LABEL: Record<string, string> = {
  OUTCOME_TRAFFIC: 'Website visits',
  OUTCOME_AWARENESS: 'Local awareness',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_ENGAGEMENT: 'Engagement',
  OUTCOME_SALES: 'Sales',
  OUTCOME_APP_PROMOTION: 'App promotion',
};

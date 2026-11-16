import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../core/auth.service';
import { CountPipe, DeliveryLabelPipe, DeliveryTonePipe, MoneyPipe, OBJECTIVE_LABEL } from '../core/format';
import type { AdSummary, CampaignSummary, DailyPoint, DatePreset } from '../core/models';
import { MetaApi } from '../core/meta-api.service';
import { SpendChart } from '../shared/spend-chart';
import { StudioState } from './studio-state';

@Component({
  selector: 'k-overview',
  imports: [RouterLink, MoneyPipe, CountPipe, DeliveryLabelPipe, DeliveryTonePipe, SpendChart],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview {
  readonly state = inject(StudioState);
  private api = inject(MetaApi);

  readonly presets: { value: DatePreset; label: string }[] = [
    { value: 'last_7d', label: 'Last 7 days' },
    { value: 'last_14d', label: 'Last 14 days' },
    { value: 'last_30d', label: 'Last 30 days' },
    { value: 'last_90d', label: 'Last 90 days' },
  ];
  readonly objectiveLabel = OBJECTIVE_LABEL;

  readonly campaigns = signal<CampaignSummary[]>([]);
  readonly daily = signal<DailyPoint[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly busyId = signal<string | null>(null);
  readonly openId = signal<string | null>(null);
  readonly ads = signal<Record<string, AdSummary[] | 'loading' | string>>({});

  readonly totals = computed(() => {
    const t = { spend: 0, linkClicks: 0, reach: 0, impressions: 0, clicks: 0 };
    for (const c of this.campaigns()) {
      t.spend += c.insights.spend;
      t.linkClicks += c.insights.linkClicks;
      t.reach += c.insights.reach;
      t.impressions += c.insights.impressions;
      t.clicks += c.insights.clicks;
    }
    return { ...t, cpc: t.linkClicks ? t.spend / t.linkClicks : 0 };
  });
  readonly running = computed(() => this.campaigns().filter((c) => c.status === 'ACTIVE').length);

  constructor() {
    effect(() => {
      const acc = this.state.account();
      const preset = this.state.preset();
      if (acc) void this.refresh(acc.id, preset);
    });
  }

  async refresh(accountId = this.state.account()?.id, preset = this.state.preset()): Promise<void> {
    if (!accountId) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const [campaigns, daily] = await Promise.all([this.api.campaigns(accountId, preset), this.api.daily(accountId, preset)]);
      this.campaigns.set(campaigns);
      this.daily.set(daily);
      this.ads.set({});
    } catch (err) {
      this.error.set(errorMessage(err, 'Couldn’t load campaigns from Meta.'));
    } finally {
      this.loading.set(false);
    }
  }

  async toggle(c: CampaignSummary): Promise<void> {
    const next = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    this.busyId.set(c.id);
    try {
      await this.api.setStatus(c.id, next);
      this.campaigns.update((list) =>
        list.map((x) =>
          x.id === c.id
            ? { ...x, status: next, effectiveStatus: x.effectiveStatus === 'IN_PROCESS' ? x.effectiveStatus : next }
            : x,
        ),
      );
    } catch (err) {
      this.error.set(errorMessage(err, `Couldn’t ${next === 'ACTIVE' ? 'resume' : 'pause'} “${c.name}”.`));
    } finally {
      this.busyId.set(null);
    }
  }

  async expand(c: CampaignSummary): Promise<void> {
    if (this.openId() === c.id) {
      this.openId.set(null);
      return;
    }
    this.openId.set(c.id);
    if (Array.isArray(this.ads()[c.id])) return;
    this.ads.update((m) => ({ ...m, [c.id]: 'loading' }));
    try {
      const list = await this.api.campaignAds(c.id, this.state.preset());
      this.ads.update((m) => ({ ...m, [c.id]: list }));
    } catch (err) {
      this.ads.update((m) => ({ ...m, [c.id]: errorMessage(err, 'Couldn’t load the ads in this campaign.') }));
    }
  }

  adsFor(id: string): AdSummary[] | null {
    const v = this.ads()[id];
    return Array.isArray(v) ? v : null;
  }
  adsMessage(id: string): string | null {
    const v = this.ads()[id];
    return v === 'loading' ? 'Loading ads…' : typeof v === 'string' ? v : null;
  }

  managerUrl(c: CampaignSummary): string {
    const acc = this.state.account()?.accountId ?? '';
    return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${acc}&selected_campaign_ids=${c.id}`;
  }

  onAccount(id: string): void {
    void this.state.selectAccount(id);
  }
  onPreset(v: string): void {
    this.state.preset.set(v as DatePreset);
  }
}

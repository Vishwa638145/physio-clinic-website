import { store } from '../lib/store.js';
import {
  type AdAccount,
  type AdSummary,
  type CampaignSummary,
  type ConnectionStatus,
  type CreateAdInput,
  type CreateAdResult,
  type DailyPoint,
  type DatePreset,
  type DeliveryStatus,
  emptyInsights,
  type FacebookPage,
  type GeoOption,
  type InsightTotals,
  MetaApiError,
  type MetaProvider,
  type UploadedImage,
} from './types.js';

/**
 * Demo provider — used when no Meta credentials are configured.
 * Returns realistic, deterministic data so the Ads Studio can be shown to the client
 * before their Business Manager / app review is ready. Nothing leaves the server.
 */

const ACCOUNT: AdAccount = {
  id: 'act_1048576000',
  accountId: '1048576000',
  name: 'Clinic ad account',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  status: 1,
  statusLabel: 'Active',
  amountSpent: 48210.55,
  businessName: 'Clinic Name',
};

const PAGE: FacebookPage = {
  id: '110220330440',
  name: 'Clinic Name',
  pictureUrl: null,
  instagram: { id: '17841400000000001', username: 'clinic.physio' },
};

interface DemoCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  effectiveStatus: string;
  dailyBudget: number;
  startTime: string;
  stopTime: string | null;
  createdTime: string;
  /** relative performance multipliers */
  ctrBase: number;
  cpmBase: number;
  ad: { title: string; body: string; image: string | null };
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

const campaigns: DemoCampaign[] = [
  {
    id: '120210000000001',
    name: 'Knee rehab · 5 km radius',
    objective: 'OUTCOME_TRAFFIC',
    status: 'ACTIVE',
    effectiveStatus: 'ACTIVE',
    dailyBudget: 600,
    startTime: daysAgo(41),
    stopTime: null,
    createdTime: daysAgo(42),
    ctrBase: 2.4,
    cpmBase: 92,
    ad: {
      title: 'Climb stairs without thinking about it',
      body: 'Structured knee rehab with one physio from first assessment to discharge. Evening slots available.',
      image: null,
    },
  },
  {
    id: '120210000000002',
    name: 'Desk back care · weekday mornings',
    objective: 'OUTCOME_TRAFFIC',
    status: 'ACTIVE',
    effectiveStatus: 'ACTIVE',
    dailyBudget: 450,
    startTime: daysAgo(27),
    stopTime: null,
    createdTime: daysAgo(28),
    ctrBase: 1.9,
    cpmBase: 104,
    ad: {
      title: 'A stronger back for long workdays',
      body: 'Assessment, hands-on treatment and a 15-minute daily plan you can do at your desk. 7:30 am slots.',
      image: null,
    },
  },
  {
    id: '120210000000003',
    name: 'Clinic awareness · 8 km radius',
    objective: 'OUTCOME_AWARENESS',
    status: 'PAUSED',
    effectiveStatus: 'PAUSED',
    dailyBudget: 800,
    startTime: daysAgo(70),
    stopTime: null,
    createdTime: daysAgo(71),
    ctrBase: 0.9,
    cpmBase: 58,
    ad: {
      title: 'Physiotherapy close to home',
      body: 'One-to-one physiotherapy for pain, injury and recovery after surgery. Clinic and home visits.',
      image: null,
    },
  },
  {
    id: '120210000000004',
    name: 'ACL return-to-sport programme',
    objective: 'OUTCOME_TRAFFIC',
    status: 'ACTIVE',
    effectiveStatus: 'IN_PROCESS',
    dailyBudget: 500,
    startTime: daysAgo(0),
    stopTime: null,
    createdTime: daysAgo(0),
    ctrBase: 2.8,
    cpmBase: 120,
    ad: {
      title: 'Back on the pitch, on a plan',
      body: 'A 9-month, criteria-based ACL programme with strength testing at every phase.',
      image: null,
    },
  },
];

/** Deterministic pseudo-random in [0,1) from a string seed */
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10_000) / 10_000;
}

const PRESET_DAYS: Record<DatePreset, number> = {
  today: 1,
  yesterday: 1,
  last_7d: 7,
  last_14d: 14,
  last_30d: 30,
  last_90d: 90,
  maximum: 120,
};

function activeDays(c: DemoCampaign, preset: DatePreset): number {
  const age = Math.max(0, Math.floor((Date.now() - new Date(c.startTime).getTime()) / 86_400_000));
  const window = PRESET_DAYS[preset];
  // paused campaigns stopped spending ~12 days ago
  const pausedGap = c.effectiveStatus === 'PAUSED' ? 12 : 0;
  if (c.effectiveStatus === 'IN_PROCESS') return 0;
  return Math.max(0, Math.min(window, age) - Math.min(window, pausedGap));
}

function insightsFor(c: DemoCampaign, preset: DatePreset): InsightTotals {
  const days = activeDays(c, preset);
  if (!days) return emptyInsights();
  let spend = 0;
  let impressions = 0;
  let clicks = 0;
  for (let d = 0; d < days; d++) {
    const r = rand(`${c.id}-${d}`);
    const daySpend = c.dailyBudget * (0.82 + r * 0.18);
    const dayImpr = (daySpend / (c.cpmBase * (0.9 + r * 0.25))) * 1000;
    spend += daySpend;
    impressions += dayImpr;
    clicks += dayImpr * (c.ctrBase / 100) * (0.85 + rand(`${c.id}c${d}`) * 0.3);
  }
  const reach = impressions / (1.35 + rand(c.id) * 0.4);
  const ctr = impressions ? (clicks / impressions) * 100 : 0;
  return {
    spend: round(spend, 2),
    impressions: Math.round(impressions),
    reach: Math.round(reach),
    clicks: Math.round(clicks),
    linkClicks: Math.round(clicks * 0.78),
    ctr: round(ctr, 2),
    cpc: clicks ? round(spend / clicks, 2) : 0,
  };
}

const round = (n: number, p: number) => Math.round(n * 10 ** p) / 10 ** p;

const PLACES: GeoOption[] = [
  { key: '1035921', name: 'Chennai', type: 'city', region: 'Tamil Nadu', countryCode: 'IN' },
  { key: '1035922', name: 'Avadi', type: 'city', region: 'Tamil Nadu', countryCode: 'IN' },
  { key: '1035923', name: 'Tambaram', type: 'city', region: 'Tamil Nadu', countryCode: 'IN' },
  { key: '1035924', name: 'Coimbatore', type: 'city', region: 'Tamil Nadu', countryCode: 'IN' },
  { key: '1035925', name: 'Madurai', type: 'city', region: 'Tamil Nadu', countryCode: 'IN' },
  { key: '1035926', name: 'Bengaluru', type: 'city', region: 'Karnataka', countryCode: 'IN' },
  { key: '1035927', name: 'Hyderabad', type: 'city', region: 'Telangana', countryCode: 'IN' },
  { key: '1035928', name: 'Kochi', type: 'city', region: 'Kerala', countryCode: 'IN' },
  { key: '1035929', name: 'Mumbai', type: 'city', region: 'Maharashtra', countryCode: 'IN' },
  { key: '483', name: 'Tamil Nadu', type: 'region', region: 'Tamil Nadu', countryCode: 'IN' },
  { key: 'IN', name: 'India', type: 'country', region: null, countryCode: 'IN' },
  { key: 'IN:600040', name: '600040', type: 'zip', region: 'Tamil Nadu', countryCode: 'IN' },
];

export class DemoMetaProvider implements MetaProvider {
  readonly mode = 'demo' as const;

  async status(): Promise<ConnectionStatus> {
    const sel = store.read((s) => ({ ad: s.meta.selectedAdAccountId, page: s.meta.selectedPageId }));
    return {
      mode: 'demo',
      connected: true,
      user: { id: '0', name: 'Demo user' },
      tokenExpiresAt: null,
      selectedAdAccountId: sel.ad ?? ACCOUNT.id,
      selectedPageId: sel.page ?? PAGE.id,
      graphVersion: 'demo',
      canUseOAuth: false,
    };
  }

  oauthUrl(): string {
    throw new MetaApiError('Demo mode: add META_APP_ID and META_APP_SECRET to connect a real Meta account.', 400);
  }
  async completeOAuth(): Promise<void> {
    throw new MetaApiError('Demo mode does not support OAuth.', 400);
  }
  async disconnect(): Promise<void> {
    /* nothing to do */
  }

  async adAccounts(): Promise<AdAccount[]> {
    return [ACCOUNT];
  }
  async pages(): Promise<FacebookPage[]> {
    return [PAGE];
  }

  async campaigns(_acc: string, preset: DatePreset): Promise<CampaignSummary[]> {
    return campaigns
      .filter((c) => c.status !== 'ARCHIVED')
      .sort((a, b) => b.createdTime.localeCompare(a.createdTime))
      .map((c) => ({
        id: c.id,
        name: c.name,
        objective: c.objective,
        status: c.status,
        effectiveStatus: c.effectiveStatus,
        dailyBudget: c.dailyBudget,
        lifetimeBudget: null,
        startTime: c.startTime,
        stopTime: c.stopTime,
        createdTime: c.createdTime,
        insights: insightsFor(c, preset),
      }));
  }

  async campaignAds(campaignId: string, preset: DatePreset): Promise<AdSummary[]> {
    const c = find(campaignId);
    return [
      {
        id: `${c.id}9`,
        name: `${c.name} · Ad`,
        status: 'ACTIVE',
        effectiveStatus: c.effectiveStatus === 'IN_PROCESS' ? 'PENDING_REVIEW' : c.effectiveStatus,
        adSetId: `${c.id}5`,
        adSetName: `${c.name} · Ad set`,
        thumbnailUrl: c.ad.image,
        title: c.ad.title,
        body: c.ad.body,
        reviewFeedback: null,
        insights: insightsFor(c, preset),
      },
    ];
  }

  async accountDaily(_acc: string, preset: DatePreset): Promise<DailyPoint[]> {
    const days = Math.min(PRESET_DAYS[preset], 90);
    const out: DailyPoint[] = [];
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);
      let spend = 0;
      let impressions = 0;
      let clicks = 0;
      for (const c of campaigns) {
        const age = Math.floor((Date.now() - new Date(c.startTime).getTime()) / 86_400_000);
        if (d > age) continue;
        if (c.effectiveStatus === 'IN_PROCESS') continue;
        if (c.effectiveStatus === 'PAUSED' && d < 12) continue;
        if (c.effectiveStatus !== 'ACTIVE' && c.effectiveStatus !== 'PAUSED') continue;
        const r = rand(`${c.id}-${d}`);
        const s = c.dailyBudget * (0.82 + r * 0.18);
        const i = (s / (c.cpmBase * (0.9 + r * 0.25))) * 1000;
        spend += s;
        impressions += i;
        clicks += i * (c.ctrBase / 100);
      }
      out.push({
        date,
        spend: round(spend, 2),
        impressions: Math.round(impressions),
        clicks: Math.round(clicks),
        reach: Math.round(impressions / 1.5),
      });
    }
    return out;
  }

  async setStatus(objectId: string, status: DeliveryStatus): Promise<void> {
    const c = find(objectId);
    c.status = status;
    if (c.effectiveStatus !== 'IN_PROCESS') c.effectiveStatus = status;
    store.log('meta.status', `[demo] ${c.name} → ${status}`);
  }

  async searchGeo(query: string): Promise<GeoOption[]> {
    const q = query.trim().toLowerCase();
    return PLACES.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }

  async uploadImage(_acc: string, file: Buffer): Promise<UploadedImage> {
    const hash = `demo${rand(file.subarray(0, 512).toString('base64')).toString(36).slice(2)}${file.length}`;
    return { hash, url: null };
  }

  async createAd(input: CreateAdInput): Promise<CreateAdResult> {
    const id = `1202${Date.now()}`;
    campaigns.push({
      id,
      name: input.name,
      objective: input.objective,
      status: input.launch ? 'ACTIVE' : 'PAUSED',
      effectiveStatus: input.launch ? 'IN_PROCESS' : 'PAUSED',
      dailyBudget: input.dailyBudget,
      startTime: input.startTime,
      stopTime: input.endTime ?? null,
      createdTime: new Date().toISOString(),
      ctrBase: 2,
      cpmBase: 100,
      ad: { title: input.headline, body: input.primaryText, image: null },
    });
    store.log('meta.created', `[demo] Campaign "${input.name}" ${input.launch ? 'launched' : 'saved as paused'}`);
    return {
      campaignId: id,
      adSetId: `${id}5`,
      creativeId: `${id}7`,
      adId: `${id}9`,
      status: input.launch ? 'ACTIVE' : 'PAUSED',
    };
  }
}

function find(id: string): DemoCampaign {
  const c = campaigns.find((x) => x.id === id || `${x.id}9` === id || `${x.id}5` === id);
  if (!c) throw new MetaApiError('Campaign not found', 404);
  return c;
}

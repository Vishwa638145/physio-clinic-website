export type DatePreset = 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'maximum';
export const DATE_PRESETS: DatePreset[] = ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'last_90d', 'maximum'];

export type DeliveryStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

/** Objectives exposed in the Ads Studio today. More can be added later (Leads, Sales…). */
export type SupportedObjective = 'OUTCOME_TRAFFIC' | 'OUTCOME_AWARENESS';

export type CtaType = 'BOOK_NOW' | 'LEARN_MORE' | 'CONTACT_US' | 'SIGN_UP' | 'GET_DIRECTIONS';

export interface ConnectionStatus {
  mode: 'demo' | 'system_user' | 'oauth';
  connected: boolean;
  user: { id: string; name: string } | null;
  tokenExpiresAt: string | null;
  selectedAdAccountId: string | null;
  selectedPageId: string | null;
  graphVersion: string;
  canUseOAuth: boolean;
}

export interface AdAccount {
  id: string; // act_123
  accountId: string; // 123
  name: string;
  currency: string;
  timezone: string;
  status: number; // 1 = active
  statusLabel: string;
  amountSpent: number; // major units
  businessName: string | null;
}

export interface FacebookPage {
  id: string;
  name: string;
  pictureUrl: string | null;
  instagram: { id: string; username: string | null } | null;
}

export interface InsightTotals {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  linkClicks: number;
  ctr: number; // %
  cpc: number; // major units
}

export interface CampaignSummary {
  id: string;
  name: string;
  objective: string;
  status: string;
  effectiveStatus: string;
  dailyBudget: number | null; // major units
  lifetimeBudget: number | null;
  startTime: string | null;
  stopTime: string | null;
  createdTime: string | null;
  insights: InsightTotals;
}

export interface AdSummary {
  id: string;
  name: string;
  status: string;
  effectiveStatus: string;
  adSetId: string;
  adSetName: string;
  thumbnailUrl: string | null;
  title: string | null;
  body: string | null;
  reviewFeedback: string | null;
  insights: InsightTotals;
}

export interface DailyPoint {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
}

export interface GeoOption {
  key: string;
  name: string;
  type: string; // city | region | country | zip
  region: string | null;
  countryCode: string | null;
}

export interface CreateAdInput {
  adAccountId: string;
  pageId: string;
  instagramUserId?: string | null;
  name: string;
  objective: SupportedObjective;
  dailyBudget: number; // major units
  startTime: string; // ISO
  endTime?: string | null;
  location:
    | { kind: 'radius'; latitude: number; longitude: number; radiusKm: number; label?: string }
    | { kind: 'places'; places: { key: string; type: string; name: string }[] };
  ageMin: number;
  ageMax: number;
  genders: ('male' | 'female')[]; // empty = all
  placements: 'automatic' | 'facebook_instagram';
  primaryText: string;
  headline: string;
  description?: string;
  linkUrl: string;
  cta: CtaType;
  imageHash: string;
  launch: boolean; // false = campaign created PAUSED
}

export interface CreateAdResult {
  campaignId: string;
  adSetId: string;
  creativeId: string;
  adId: string;
  status: DeliveryStatus;
}

export interface UploadedImage {
  hash: string;
  url: string | null;
}

export interface MetaProvider {
  readonly mode: ConnectionStatus['mode'];
  status(): Promise<ConnectionStatus>;
  oauthUrl(state: string): string;
  completeOAuth(code: string): Promise<void>;
  disconnect(): Promise<void>;

  adAccounts(): Promise<AdAccount[]>;
  pages(): Promise<FacebookPage[]>;
  campaigns(adAccountId: string, preset: DatePreset): Promise<CampaignSummary[]>;
  campaignAds(campaignId: string, preset: DatePreset): Promise<AdSummary[]>;
  accountDaily(adAccountId: string, preset: DatePreset): Promise<DailyPoint[]>;
  setStatus(objectId: string, status: DeliveryStatus): Promise<void>;
  searchGeo(query: string): Promise<GeoOption[]>;
  uploadImage(adAccountId: string, file: Buffer, filename: string, mime: string): Promise<UploadedImage>;
  createAd(input: CreateAdInput): Promise<CreateAdResult>;
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
    public readonly code?: number,
    public readonly subcode?: number,
    public readonly fbtraceId?: string,
  ) {
    super(message);
  }
}

/** Currencies Meta bills without a minor unit (offset 1). Everything else uses 100. */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'COP', 'CRC', 'HUF', 'ISK', 'IDR', 'PYG', 'TWD']);
export const currencyOffset = (currency: string): number => (ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100);

export const ACCOUNT_STATUS: Record<number, string> = {
  1: 'Active',
  2: 'Disabled',
  3: 'Unsettled',
  7: 'Pending risk review',
  8: 'Pending settlement',
  9: 'In grace period',
  100: 'Pending closure',
  101: 'Closed',
  201: 'Any active',
  202: 'Any closed',
};

export const emptyInsights = (): InsightTotals => ({
  spend: 0,
  impressions: 0,
  reach: 0,
  clicks: 0,
  linkClicks: 0,
  ctr: 0,
  cpc: 0,
});

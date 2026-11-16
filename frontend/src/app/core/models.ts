export type DatePreset = 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'maximum';
export type DeliveryStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type Objective = 'OUTCOME_TRAFFIC' | 'OUTCOME_AWARENESS';
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
  id: string;
  accountId: string;
  name: string;
  currency: string;
  timezone: string;
  status: number;
  statusLabel: string;
  amountSpent: number;
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
  ctr: number;
  cpc: number;
}

export interface CampaignSummary {
  id: string;
  name: string;
  objective: string;
  status: string;
  effectiveStatus: string;
  dailyBudget: number | null;
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
  type: string;
  region: string | null;
  countryCode: string | null;
}

export interface CreateAdPayload {
  adAccountId: string;
  pageId: string;
  instagramUserId?: string | null;
  name: string;
  objective: Objective;
  dailyBudget: number;
  startTime: string;
  endTime?: string | null;
  location:
    | { kind: 'radius'; latitude: number; longitude: number; radiusKm: number; label?: string }
    | { kind: 'places'; places: { key: string; type: string; name: string }[] };
  ageMin: number;
  ageMax: number;
  genders: ('male' | 'female')[];
  placements: 'automatic' | 'facebook_instagram';
  primaryText: string;
  headline: string;
  description?: string;
  linkUrl: string;
  cta: CtaType;
  imageHash: string;
  launch: boolean;
}

export interface CreateAdResult {
  campaignId: string;
  adSetId: string;
  creativeId: string;
  adId: string;
  status: DeliveryStatus;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  concern: string;
  preferredSlot?: string;
  message?: string;
  source?: string;
  visitType?: 'clinic' | 'home';
  pincode?: string;
  area?: string;
  address?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'booked' | 'closed';
}

export interface ApiErrorBody {
  error: string;
  fields?: { path: string; message: string }[];
}

import { config } from '../config.js';
import { decrypt, encrypt } from '../lib/crypto.js';
import { store } from '../lib/store.js';
import { graph } from './graph.js';
import {
  ACCOUNT_STATUS,
  type AdAccount,
  type AdSummary,
  type CampaignSummary,
  type ConnectionStatus,
  type CreateAdInput,
  type CreateAdResult,
  currencyOffset,
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

/* ── Raw Graph shapes ───────────────────────────────────────── */
interface RawAction {
  action_type: string;
  value: string;
}
interface RawInsights {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  actions?: RawAction[];
  date_start?: string;
}
interface Paged<T> {
  data: T[];
}

const INSIGHT_FIELDS = 'spend,impressions,reach,clicks,ctr,cpc,actions';

function mapInsights(raw?: RawInsights): InsightTotals {
  if (!raw) return emptyInsights();
  const linkClicks = Number(raw.actions?.find((a) => a.action_type === 'link_click')?.value ?? 0);
  return {
    spend: Number(raw.spend ?? 0),
    impressions: Number(raw.impressions ?? 0),
    reach: Number(raw.reach ?? 0),
    clicks: Number(raw.clicks ?? 0),
    linkClicks,
    ctr: Number(raw.ctr ?? 0),
    cpc: Number(raw.cpc ?? 0),
  };
}

const OPTIMIZATION: Record<CreateAdInput['objective'], string> = {
  OUTCOME_TRAFFIC: 'LINK_CLICKS',
  OUTCOME_AWARENESS: 'REACH',
};

export class LiveMetaProvider implements MetaProvider {
  readonly mode: ConnectionStatus['mode'] = config.meta.systemUserToken ? 'system_user' : 'oauth';
  private currencyCache = new Map<string, string>();

  /* ── Token handling ─────────────────────────────────────── */
  private token(): string {
    if (config.meta.systemUserToken) return config.meta.systemUserToken;
    const conn = store.read((s) => s.meta.connection);
    if (!conn) throw new MetaApiError('No Meta account is connected yet. Connect one from Ads Studio → Settings.', 409);
    if (conn.tokenExpiresAt && new Date(conn.tokenExpiresAt).getTime() < Date.now()) {
      throw new MetaApiError('The Meta connection has expired. Reconnect the account to continue.', 401);
    }
    return decrypt(conn.encryptedToken);
  }

  async status(): Promise<ConnectionStatus> {
    const sel = store.read((s) => ({
      ad: s.meta.selectedAdAccountId ?? (config.meta.defaultAdAccountId || null),
      page: s.meta.selectedPageId ?? (config.meta.defaultPageId || null),
    }));
    const base = {
      mode: this.mode,
      graphVersion: config.meta.graphVersion,
      canUseOAuth: Boolean(config.meta.appId && config.meta.appSecret),
      selectedAdAccountId: sel.ad ? normaliseAccountId(sel.ad) : null,
      selectedPageId: sel.page,
    };

    if (config.meta.systemUserToken) {
      try {
        const me = await graph.get<{ id: string; name: string }>('/me', this.token(), { fields: 'id,name' });
        return { ...base, connected: true, user: me, tokenExpiresAt: null };
      } catch {
        return { ...base, connected: false, user: null, tokenExpiresAt: null };
      }
    }
    const conn = store.read((s) => s.meta.connection);
    return {
      ...base,
      connected: Boolean(conn),
      user: conn ? { id: conn.userId, name: conn.userName } : null,
      tokenExpiresAt: conn?.tokenExpiresAt ?? null,
    };
  }

  /* ── OAuth (Facebook Login) ─────────────────────────────── */
  private redirectUri(): string {
    return `${config.apiPublicUrl}/api/meta/oauth/callback`;
  }

  oauthUrl(state: string): string {
    if (!config.meta.appId) throw new MetaApiError('META_APP_ID is not configured.', 500);
    const q = new URLSearchParams({
      client_id: config.meta.appId,
      redirect_uri: this.redirectUri(),
      state,
      response_type: 'code',
      scope: config.meta.oauthScopes,
    });
    return `https://www.facebook.com/${config.meta.graphVersion}/dialog/oauth?${q}`;
  }

  async completeOAuth(code: string): Promise<void> {
    const short = await graph.rawGet<{ access_token: string }>('/oauth/access_token', {
      client_id: config.meta.appId,
      client_secret: config.meta.appSecret,
      redirect_uri: this.redirectUri(),
      code,
    });
    // Swap for a ~60-day long-lived token
    const long = await graph.rawGet<{ access_token: string; expires_in?: number }>('/oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: config.meta.appId,
      client_secret: config.meta.appSecret,
      fb_exchange_token: short.access_token,
    });
    const me = await graph.get<{ id: string; name: string }>('/me', long.access_token, { fields: 'id,name' });
    store.write((s) => {
      s.meta.connection = {
        encryptedToken: encrypt(long.access_token),
        tokenExpiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000).toISOString() : null,
        userId: me.id,
        userName: me.name,
        connectedAt: new Date().toISOString(),
      };
    });
    store.log('meta.connected', `Connected Meta user ${me.name}`);
  }

  async disconnect(): Promise<void> {
    const conn = store.read((s) => s.meta.connection);
    if (conn) {
      try {
        // Revoke the app's permissions for this user (best effort)
        await graph.delete('/me/permissions', decrypt(conn.encryptedToken));
      } catch {
        /* token may already be invalid */
      }
    }
    store.write((s) => {
      s.meta.connection = null;
      s.meta.selectedAdAccountId = null;
      s.meta.selectedPageId = null;
    });
    store.log('meta.disconnected', 'Meta account disconnected');
  }

  /* ── Reads ──────────────────────────────────────────────── */
  async adAccounts(): Promise<AdAccount[]> {
    const rows = await graph.all<{
      id: string;
      account_id: string;
      name: string;
      currency: string;
      timezone_name: string;
      account_status: number;
      amount_spent: string;
      business?: { name: string };
    }>('/me/adaccounts', this.token(), {
      fields: 'id,account_id,name,currency,timezone_name,account_status,amount_spent,business{name}',
    });
    return rows.map((r) => {
      this.currencyCache.set(r.id, r.currency);
      return {
        id: r.id,
        accountId: r.account_id,
        name: r.name,
        currency: r.currency,
        timezone: r.timezone_name,
        status: r.account_status,
        statusLabel: ACCOUNT_STATUS[r.account_status] ?? `Status ${r.account_status}`,
        amountSpent: Number(r.amount_spent ?? 0) / currencyOffset(r.currency),
        businessName: r.business?.name ?? null,
      };
    });
  }

  async pages(): Promise<FacebookPage[]> {
    const rows = await graph.all<{
      id: string;
      name: string;
      picture?: { data?: { url?: string } };
      instagram_business_account?: { id: string; username?: string };
    }>('/me/accounts', this.token(), {
      fields: 'id,name,picture{url},instagram_business_account{id,username}',
    });
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      pictureUrl: p.picture?.data?.url ?? null,
      instagram: p.instagram_business_account
        ? { id: p.instagram_business_account.id, username: p.instagram_business_account.username ?? null }
        : null,
    }));
  }

  private async currency(adAccountId: string): Promise<string> {
    const id = normaliseAccountId(adAccountId);
    const cached = this.currencyCache.get(id);
    if (cached) return cached;
    const acc = await graph.get<{ currency: string }>(`/${id}`, this.token(), { fields: 'currency' });
    this.currencyCache.set(id, acc.currency);
    return acc.currency;
  }

  async campaigns(adAccountId: string, preset: DatePreset): Promise<CampaignSummary[]> {
    const id = normaliseAccountId(adAccountId);
    const offset = currencyOffset(await this.currency(id));
    const rows = await graph.all<{
      id: string;
      name: string;
      objective: string;
      status: string;
      effective_status: string;
      daily_budget?: string;
      lifetime_budget?: string;
      start_time?: string;
      stop_time?: string;
      created_time?: string;
      insights?: Paged<RawInsights>;
    }>(`/${id}/campaigns`, this.token(), {
      fields: `id,name,objective,status,effective_status,daily_budget,lifetime_budget,start_time,stop_time,created_time,insights.date_preset(${preset}){${INSIGHT_FIELDS}}`,
      filtering: [{ field: 'effective_status', operator: 'NOT_IN', value: ['DELETED', 'ARCHIVED'] }],
    });

    // Campaigns using ad-set budgets report no daily_budget; fall back to the sum of their ad sets.
    const adsetBudgets = await this.adsetBudgetsByCampaign(id);

    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      objective: c.objective,
      status: c.status,
      effectiveStatus: c.effective_status,
      dailyBudget: c.daily_budget
        ? Number(c.daily_budget) / offset
        : adsetBudgets.has(c.id)
          ? (adsetBudgets.get(c.id) ?? 0) / offset
          : null,
      lifetimeBudget: c.lifetime_budget ? Number(c.lifetime_budget) / offset : null,
      startTime: c.start_time ?? null,
      stopTime: c.stop_time ?? null,
      createdTime: c.created_time ?? null,
      insights: mapInsights(c.insights?.data[0]),
    }));
  }

  private async adsetBudgetsByCampaign(accountId: string): Promise<Map<string, number>> {
    const rows = await graph.all<{ campaign_id: string; daily_budget?: string }>(`/${accountId}/adsets`, this.token(), {
      fields: 'campaign_id,daily_budget',
      filtering: [{ field: 'effective_status', operator: 'NOT_IN', value: ['DELETED', 'ARCHIVED'] }],
    });
    const map = new Map<string, number>();
    for (const r of rows) {
      if (!r.daily_budget) continue;
      map.set(r.campaign_id, (map.get(r.campaign_id) ?? 0) + Number(r.daily_budget));
    }
    return map;
  }

  async campaignAds(campaignId: string, preset: DatePreset): Promise<AdSummary[]> {
    const rows = await graph.all<{
      id: string;
      name: string;
      status: string;
      effective_status: string;
      adset?: { id: string; name: string };
      creative?: { thumbnail_url?: string; title?: string; body?: string };
      ad_review_feedback?: { global?: Record<string, string> };
      insights?: Paged<RawInsights>;
    }>(`/${campaignId}/ads`, this.token(), {
      fields: `id,name,status,effective_status,adset{id,name},creative{thumbnail_url,title,body},ad_review_feedback,insights.date_preset(${preset}){${INSIGHT_FIELDS}}`,
    });
    return rows.map((a) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      effectiveStatus: a.effective_status,
      adSetId: a.adset?.id ?? '',
      adSetName: a.adset?.name ?? '',
      thumbnailUrl: a.creative?.thumbnail_url ?? null,
      title: a.creative?.title ?? null,
      body: a.creative?.body ?? null,
      reviewFeedback: a.ad_review_feedback?.global ? Object.values(a.ad_review_feedback.global).join(' ') : null,
      insights: mapInsights(a.insights?.data[0]),
    }));
  }

  async accountDaily(adAccountId: string, preset: DatePreset): Promise<DailyPoint[]> {
    const id = normaliseAccountId(adAccountId);
    const rows = await graph.all<RawInsights>(`/${id}/insights`, this.token(), {
      level: 'account',
      date_preset: preset === 'maximum' ? 'last_90d' : preset,
      time_increment: 1,
      fields: 'spend,impressions,clicks,reach',
    });
    return rows.map((r) => ({
      date: r.date_start ?? '',
      spend: Number(r.spend ?? 0),
      impressions: Number(r.impressions ?? 0),
      clicks: Number(r.clicks ?? 0),
      reach: Number(r.reach ?? 0),
    }));
  }

  async searchGeo(query: string): Promise<GeoOption[]> {
    const res = await graph.get<
      Paged<{ key: string; name: string; type: string; region?: string; country_code?: string }>
    >('/search', this.token(), {
      type: 'adgeolocation',
      q: query,
      location_types: ['city', 'region', 'zip', 'country'],
      limit: 10,
    });
    return res.data.map((g) => ({
      key: g.key,
      name: g.name,
      type: g.type,
      region: g.region ?? null,
      countryCode: g.country_code ?? null,
    }));
  }

  /* ── Writes ─────────────────────────────────────────────── */
  async setStatus(objectId: string, status: DeliveryStatus): Promise<void> {
    await graph.post(`/${objectId}`, this.token(), { status });
    store.log('meta.status', `${objectId} → ${status}`);
  }

  async uploadImage(adAccountId: string, file: Buffer, filename: string, mime: string): Promise<UploadedImage> {
    const id = normaliseAccountId(adAccountId);
    const res = await graph.upload<{ images: Record<string, { hash: string; url?: string }> }>(
      `/${id}/adimages`,
      this.token(),
      file,
      filename,
      mime,
    );
    const first = Object.values(res.images)[0];
    if (!first) throw new MetaApiError('Meta did not return an image hash.');
    return { hash: first.hash, url: first.url ?? null };
  }

  /**
   * One-shot creation: Campaign → Ad set → Creative → Ad.
   * If any step fails, the objects already created are deleted so nothing half-built is left behind.
   */
  async createAd(input: CreateAdInput): Promise<CreateAdResult> {
    const token = this.token();
    const act = normaliseAccountId(input.adAccountId);
    const offset = currencyOffset(await this.currency(act));
    const created: string[] = [];

    try {
      const campaign = await graph.post<{ id: string }>(`/${act}/campaigns`, token, {
        name: input.name,
        objective: input.objective,
        status: input.launch ? 'ACTIVE' : 'PAUSED',
        buying_type: 'AUCTION',
        special_ad_categories: [],
        // Required when the budget lives on the ad set rather than the campaign
        is_adset_budget_sharing_enabled: false,
      });
      created.push(campaign.id);

      const targeting: Record<string, unknown> = {
        age_min: input.ageMin,
        age_max: input.ageMax,
        targeting_automation: { advantage_audience: 0 },
        geo_locations:
          input.location.kind === 'radius'
            ? {
                custom_locations: [
                  {
                    latitude: input.location.latitude,
                    longitude: input.location.longitude,
                    radius: input.location.radiusKm,
                    distance_unit: 'kilometer',
                  },
                ],
                location_types: ['home', 'recent'],
              }
            : buildPlaces(input.location.places),
      };
      if (input.genders.length === 1) targeting['genders'] = [input.genders[0] === 'male' ? 1 : 2];
      if (input.placements === 'facebook_instagram') {
        targeting['publisher_platforms'] = ['facebook', 'instagram'];
        targeting['facebook_positions'] = ['feed', 'story', 'facebook_reels'];
        targeting['instagram_positions'] = ['stream', 'story', 'reels'];
      }

      const adSet = await graph.post<{ id: string }>(`/${act}/adsets`, token, {
        name: `${input.name} · Ad set`,
        campaign_id: campaign.id,
        daily_budget: Math.round(input.dailyBudget * offset),
        billing_event: 'IMPRESSIONS',
        optimization_goal: OPTIMIZATION[input.objective],
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        destination_type: input.objective === 'OUTCOME_TRAFFIC' ? 'WEBSITE' : undefined,
        start_time: input.startTime,
        end_time: input.endTime || undefined,
        targeting,
        status: 'ACTIVE', // delivery is governed by the campaign status
      });
      created.push(adSet.id);

      const creative = await graph.post<{ id: string }>(`/${act}/adcreatives`, token, {
        name: `${input.name} · Creative`,
        object_story_spec: {
          page_id: input.pageId,
          ...(input.instagramUserId ? { instagram_user_id: input.instagramUserId } : {}),
          link_data: {
            image_hash: input.imageHash,
            link: input.linkUrl,
            message: input.primaryText,
            name: input.headline,
            description: input.description || undefined,
            call_to_action: { type: input.cta, value: { link: input.linkUrl } },
          },
        },
      });
      created.push(creative.id);

      const ad = await graph.post<{ id: string }>(`/${act}/ads`, token, {
        name: `${input.name} · Ad`,
        adset_id: adSet.id,
        creative: { creative_id: creative.id },
        status: 'ACTIVE',
      });
      created.push(ad.id);

      store.log('meta.created', `Campaign "${input.name}" (${campaign.id}) ${input.launch ? 'launched' : 'saved as paused'}`);
      return {
        campaignId: campaign.id,
        adSetId: adSet.id,
        creativeId: creative.id,
        adId: ad.id,
        status: input.launch ? 'ACTIVE' : 'PAUSED',
      };
    } catch (err) {
      for (const id of created.reverse()) {
        try {
          await graph.delete(`/${id}`, token);
        } catch {
          /* best-effort rollback */
        }
      }
      throw err;
    }
  }
}

function buildPlaces(places: { key: string; type: string }[]): Record<string, unknown> {
  const geo: Record<string, unknown[]> = {};
  for (const p of places) {
    if (p.type === 'country') (geo['countries'] ??= []).push(p.key);
    else if (p.type === 'region') (geo['regions'] ??= []).push({ key: p.key });
    else if (p.type === 'zip') (geo['zips'] ??= []).push({ key: p.key });
    else (geo['cities'] ??= []).push({ key: p.key });
  }
  return { ...geo, location_types: ['home', 'recent'] };
}

export function normaliseAccountId(id: string): string {
  return id.startsWith('act_') ? id : `act_${id}`;
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  AdAccount,
  AdSummary,
  CampaignSummary,
  ConnectionStatus,
  CreateAdPayload,
  CreateAdResult,
  DailyPoint,
  DatePreset,
  DeliveryStatus,
  Enquiry,
  FacebookPage,
  GeoOption,
} from './models';

/** Thin, promise-based client for the clinic API. */
@Injectable({ providedIn: 'root' })
export class MetaApi {
  private http = inject(HttpClient);
  private p<T>(o: import('rxjs').Observable<T>): Promise<T> {
    return firstValueFrom(o);
  }

  status() {
    return this.p(this.http.get<ConnectionStatus>('/api/meta/status'));
  }
  startOAuth() {
    return this.p(this.http.post<{ url: string }>('/api/meta/oauth/start', {}));
  }
  disconnect() {
    return this.p(this.http.post<{ ok: boolean }>('/api/meta/disconnect', {}));
  }
  adAccounts() {
    return this.p(this.http.get<AdAccount[]>('/api/meta/ad-accounts'));
  }
  pages() {
    return this.p(this.http.get<FacebookPage[]>('/api/meta/pages'));
  }
  select(sel: { adAccountId?: string; pageId?: string }) {
    return this.p(this.http.put<{ ok: boolean }>('/api/meta/selection', sel));
  }
  campaigns(accountId: string, preset: DatePreset) {
    return this.p(this.http.get<CampaignSummary[]>(`/api/meta/ad-accounts/${accountId}/campaigns`, { params: { preset } }));
  }
  daily(accountId: string, preset: DatePreset) {
    return this.p(this.http.get<DailyPoint[]>(`/api/meta/ad-accounts/${accountId}/daily`, { params: { preset } }));
  }
  campaignAds(campaignId: string, preset: DatePreset) {
    return this.p(this.http.get<AdSummary[]>(`/api/meta/campaigns/${campaignId}/ads`, { params: { preset } }));
  }
  setStatus(objectId: string, status: DeliveryStatus) {
    return this.p(this.http.post<{ ok: boolean }>(`/api/meta/objects/${objectId}/status`, { status }));
  }
  searchGeo(q: string) {
    return this.p(this.http.get<GeoOption[]>('/api/meta/geo', { params: { q } }));
  }
  uploadImage(accountId: string, file: File) {
    const fd = new FormData();
    fd.append('image', file, file.name);
    return this.p(this.http.post<{ hash: string; url: string | null }>(`/api/meta/ad-accounts/${accountId}/images`, fd));
  }
  createAd(payload: CreateAdPayload) {
    return this.p(this.http.post<CreateAdResult>('/api/meta/ads', payload));
  }

  /* enquiries */
  enquiries() {
    return this.p(this.http.get<Enquiry[]>('/api/admin/enquiries'));
  }
  setEnquiryStatus(id: string, status: Enquiry['status']) {
    return this.p(this.http.patch<Enquiry>(`/api/admin/enquiries/${id}`, { status }));
  }
  submitEnquiry(body: Record<string, string>) {
    return this.p(this.http.post<{ id: string }>('/api/enquiries', body));
  }
}

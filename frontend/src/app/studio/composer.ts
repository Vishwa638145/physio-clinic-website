import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { errorMessage } from '../core/auth.service';
import { ALL_SERVICES, BRAND } from '../core/brand';
import { formatMoney, MoneyPipe } from '../core/format';
import type { CreateAdPayload, CreateAdResult, CtaType, GeoOption, Objective } from '../core/models';
import { MetaApi } from '../core/meta-api.service';
import { StudioState } from './studio-state';

interface PolicyNote {
  tone: 'warn' | 'info';
  text: string;
}

const CTA_LABELS: Record<CtaType, string> = {
  BOOK_NOW: 'Book now',
  LEARN_MORE: 'Learn more',
  CONTACT_US: 'Contact us',
  SIGN_UP: 'Sign up',
  GET_DIRECTIONS: 'Get directions',
};

function localInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

@Component({
  selector: 'k-composer',
  imports: [ReactiveFormsModule, RouterLink, MoneyPipe],
  templateUrl: './composer.html',
  styleUrl: './composer.scss',
})
export class Composer {
  readonly state = inject(StudioState);
  private api = inject(MetaApi);
  private fb = inject(FormBuilder);

  readonly ctaLabels = CTA_LABELS;
  readonly brandLabel = BRAND.geo.label;
  readonly landings = [
    { path: '/contact', label: 'Booking page' },
    { path: '/home-physiotherapy', label: 'Physiotherapy at home page' },
    { path: '/', label: 'Home page' },
    { path: '/about', label: 'About the physiotherapist' },
    ...ALL_SERVICES.map((s) => ({ path: `/contact?concern=${encodeURIComponent(s.name)}`, label: `Booking page, pre-filled: ${s.name}` })),
  ];

  pickLanding(path: string): void {
    if (!path) {
      this.form.controls.linkUrl.setValue('https://');
      document.getElementById('c-link')?.focus();
      return;
    }
    this.form.controls.linkUrl.setValue(`${BRAND.siteUrl}${path}`);
  }
  readonly ctaTypes = Object.keys(CTA_LABELS) as CtaType[];

  private tomorrow9 = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  })();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    objective: ['OUTCOME_TRAFFIC' as Objective],
    locationKind: ['radius' as 'radius' | 'places'],
    radiusKm: [5, [Validators.min(1), Validators.max(80)]],
    ageMin: [25, [Validators.min(18), Validators.max(65)]],
    ageMax: [65, [Validators.min(18), Validators.max(65)]],
    gender: ['all' as 'all' | 'male' | 'female'],
    placements: ['automatic' as 'automatic' | 'facebook_instagram'],
    dailyBudget: [500, [Validators.required, Validators.min(100)]],
    startTime: [localInput(this.tomorrow9), Validators.required],
    endTime: [''],
    primaryText: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2200)]],
    headline: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    description: [''],
    linkUrl: [`${BRAND.siteUrl}/contact`, [Validators.required, Validators.pattern(/^https?:\/\/.+\..+/)]],
    addUtm: [true],
    cta: ['BOOK_NOW' as CtaType],
  });

  private v = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /* places search */
  readonly geoQuery = this.fb.nonNullable.control('');
  readonly geoResults = signal<GeoOption[]>([]);
  readonly places = signal<GeoOption[]>([]);

  /* image */
  readonly imagePreview = signal<string | null>(null);
  readonly imageHash = signal<string | null>(null);
  readonly imageState = signal<'idle' | 'uploading' | 'ready' | 'error'>('idle');
  readonly imageError = signal('');

  /* submit */
  readonly confirming = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly result = signal<CreateAdResult | null>(null);

  readonly finalLink = computed(() => {
    const v = this.v();
    const url = v.linkUrl ?? '';
    if (!v.addUtm || !url) return url;
    try {
      const u = new URL(url);
      u.searchParams.set('utm_source', 'meta');
      u.searchParams.set('utm_medium', 'paid_social');
      u.searchParams.set('utm_campaign', slug(v.name || 'campaign'));
      return u.toString();
    } catch {
      return url;
    }
  });
  readonly displayDomain = computed(() => {
    try {
      return new URL(this.v().linkUrl ?? '').host;
    } catch {
      return 'yourwebsite.com';
    }
  });

  readonly days = computed(() => {
    const v = this.v();
    if (!v.endTime || !v.startTime) return null;
    const ms = new Date(v.endTime).getTime() - new Date(v.startTime).getTime();
    return ms > 0 ? Math.ceil(ms / 86_400_000) : null;
  });
  readonly spendNote = computed(() => {
    const budget = Number(this.v().dailyBudget) || 0;
    const cur = this.state.currency();
    const d = this.days();
    return d
      ? `Up to ${formatMoney(budget * d, cur)} over ${d} day${d === 1 ? '' : 's'}.`
      : `About ${formatMoney(budget * 30.4, cur)} a month if it runs continuously.`;
  });

  /** Meta restricts health ads that assert or imply a person's condition. Flag the common slips early. */
  readonly policyNotes = computed<PolicyNote[]>(() => {
    const v = this.v();
    const text = `${v.primaryText ?? ''} ${v.headline ?? ''} ${v.description ?? ''}`;
    const notes: PolicyNote[] = [];
    const condition = '(pain|injur|arthritis|sciatica|disc|slip|frozen|sprain|stroke|condition|problem|ache)';
    if (
      new RegExp(`\\b(are|do|did|have)\\s+you\\b[^.?!]{0,40}${condition}`, 'i').test(text) ||
      new RegExp(`\\byour\\s+(\\w+\\s+)?${condition}`, 'i').test(text) ||
      /\byour (back|knee|neck|shoulder|hip|ankle|spine)\b/i.test(text)
    ) {
      notes.push({
        tone: 'warn',
        text: 'Meta rejects ads that say or imply the reader has a health condition (“Is your back pain…”, “your knee injury”). Describe what the clinic offers instead: “Knee rehab with evening slots.”',
      });
    }
    if (/\b(cure[sd]?|guarantee[sd]?|100%|permanent(ly)?|miracle|instant relief)\b/i.test(text)) {
      notes.push({ tone: 'warn', text: 'Avoid promising cures or guaranteed results. It breaks Meta’s policy and the clinic’s professional guidelines.' });
    }
    if (/\b(before and after|lose \d+|weight loss)\b/i.test(text)) {
      notes.push({ tone: 'warn', text: 'Before-and-after claims are restricted for health ads.' });
    }
    if ((v.primaryText ?? '').length > 125) {
      notes.push({ tone: 'info', text: 'Feeds show about the first 125 characters before “See more”. Put the key point first.' });
    }
    return notes;
  });

  readonly ctaLabel = computed(() => CTA_LABELS[(this.v().cta ?? 'BOOK_NOW') as CtaType]);

  constructor() {
    const destroy = inject(DestroyRef);
    const sub = this.geoQuery.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(async (q) => {
      if (q.trim().length < 2) {
        this.geoResults.set([]);
        return;
      }
      try {
        this.geoResults.set(await this.api.searchGeo(q));
      } catch {
        this.geoResults.set([]);
      }
    });
    destroy.onDestroy(() => {
      sub.unsubscribe();
      const url = this.imagePreview();
      if (url) URL.revokeObjectURL(url);
    });
  }

  addPlace(p: GeoOption): void {
    if (!this.places().some((x) => x.key === p.key)) this.places.update((l) => [...l, p]);
    this.geoQuery.setValue('');
    this.geoResults.set([]);
  }
  removePlace(key: string): void {
    this.places.update((l) => l.filter((p) => p.key !== key));
  }

  async onImage(ev: Event): Promise<void> {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageError.set('');
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.imageState.set('error');
      this.imageError.set('Use a JPG or PNG image.');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      this.imageState.set('error');
      this.imageError.set('The image is larger than 30 MB.');
      return;
    }
    const old = this.imagePreview();
    if (old) URL.revokeObjectURL(old);
    this.imagePreview.set(URL.createObjectURL(file));
    const acc = this.state.account();
    if (!acc) {
      this.imageState.set('error');
      this.imageError.set('Choose an ad account in Meta connection first.');
      return;
    }
    this.imageState.set('uploading');
    try {
      const res = await this.api.uploadImage(acc.id, file);
      this.imageHash.set(res.hash);
      this.imageState.set('ready');
    } catch (err) {
      this.imageState.set('error');
      this.imageError.set(errorMessage(err, 'The image couldn’t be uploaded to Meta.'));
    }
  }

  readonly missing = computed(() => {
    this.v();
    const m: string[] = [];
    const c = this.form.controls;
    if (c.name.invalid) m.push('a campaign name');
    if (c.dailyBudget.invalid) m.push('a daily budget of at least ₹100');
    if (c.primaryText.invalid) m.push('the main text (10+ characters)');
    if (c.headline.invalid) m.push('a headline');
    if (c.linkUrl.invalid) m.push('a website link');
    if (this.v().locationKind === 'places' && this.places().length === 0) m.push('at least one area');
    if ((this.v().ageMax ?? 65) < (this.v().ageMin ?? 18)) m.push('an age range where the maximum is at least the minimum');
    if (!this.imageHash()) m.push('an image');
    if (!this.state.page()) m.push('a Facebook Page (in Meta connection)');
    return m;
  });

  requestPublish(launch: boolean): void {
    this.form.markAllAsTouched();
    this.submitError.set('');
    if (this.missing().length) {
      this.submitError.set(`Add ${this.missing().join(', ')}.`);
      return;
    }
    if (launch) this.confirming.set(true);
    else void this.submit(false);
  }

  async submit(launch: boolean): Promise<void> {
    const acc = this.state.account();
    const page = this.state.page();
    const hash = this.imageHash();
    if (!acc || !page || !hash) return;
    const v = this.form.getRawValue();

    const payload: CreateAdPayload = {
      adAccountId: acc.id,
      pageId: page.id,
      instagramUserId: page.instagram?.id ?? null,
      name: v.name.trim(),
      objective: v.objective,
      dailyBudget: Number(v.dailyBudget),
      startTime: new Date(v.startTime).toISOString(),
      endTime: v.endTime ? new Date(v.endTime).toISOString() : null,
      location:
        v.locationKind === 'radius'
          ? { kind: 'radius', latitude: BRAND.geo.latitude, longitude: BRAND.geo.longitude, radiusKm: Number(v.radiusKm), label: BRAND.geo.label }
          : { kind: 'places', places: this.places().map((p) => ({ key: p.key, type: p.type, name: p.name })) },
      ageMin: Number(v.ageMin),
      ageMax: Number(v.ageMax),
      genders: v.gender === 'all' ? [] : [v.gender],
      placements: v.placements,
      primaryText: v.primaryText.trim(),
      headline: v.headline.trim(),
      description: v.description.trim() || undefined,
      linkUrl: this.finalLink(),
      cta: v.cta,
      imageHash: hash,
      launch,
    };

    this.submitting.set(true);
    this.submitError.set('');
    try {
      this.result.set(await this.api.createAd(payload));
      this.confirming.set(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      this.submitError.set(errorMessage(err, 'Meta didn’t accept the ad. Nothing was created.'));
      this.confirming.set(false);
    } finally {
      this.submitting.set(false);
    }
  }

  managerUrl(r: CreateAdResult): string {
    return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${this.state.account()?.accountId ?? ''}&selected_campaign_ids=${r.campaignId}`;
  }

  startAnother(): void {
    this.result.set(null);
    this.form.reset();
    this.places.set([]);
    this.imageHash.set(null);
    this.imagePreview.set(null);
    this.imageState.set('idle');
  }

  err(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { errorMessage } from '../core/auth.service';
import { MetaApi } from '../core/meta-api.service';
import { StudioState } from './studio-state';

const RETURN_MESSAGES: Record<string, { tone: 'ok' | 'bad'; text: string }> = {
  connected: { tone: 'ok', text: 'Meta account connected. Choose the ad account and Page to use below.' },
  denied: { tone: 'bad', text: 'The connection was cancelled on Facebook. Try again and approve all requested permissions.' },
  expired: { tone: 'bad', text: 'That sign-in link expired. Start the connection again.' },
  failed: { tone: 'bad', text: 'Facebook didn’t return a usable token. Check the app ID, secret and redirect URI, then try again.' },
};

@Component({
  selector: 'k-settings',
  template: `
    <header class="head">
      <h1>Meta connection</h1>
      <p>The Facebook ad account and Page that ads are created in.</p>
    </header>

    @if (notice(); as n) { <p class="notice" [class.bad]="n.tone === 'bad'" role="status">{{ n.text }}</p> }
    @if (error()) { <p class="notice bad" role="alert">{{ error() }}</p> }

    @if (state.status(); as s) {
      <section class="block">
        <h2>Status</h2>
        <dl class="kv">
          <div><dt>Connection</dt><dd>
            @switch (s.mode) {
              @case ('demo') { Demo mode. No Meta credentials are configured on the server. }
              @case ('system_user') { Business system user token {{ s.connected ? '(working)' : '(not working: check the token)' }} }
              @default { {{ s.connected ? 'Connected through Facebook Login' : 'Not connected' }} }
            }
          </dd></div>
          @if (s.user && s.mode !== 'demo') { <div><dt>Connected as</dt><dd>{{ s.user.name }}</dd></div> }
          @if (s.tokenExpiresAt) { <div><dt>Access renews by</dt><dd>{{ expiry(s.tokenExpiresAt) }}</dd></div> }
          <div><dt>Marketing API version</dt><dd class="num">{{ s.graphVersion }}</dd></div>
        </dl>

        @if (s.mode === 'oauth') {
          <div class="actions">
            @if (!s.connected) {
              <button class="btn btn-primary" type="button" [disabled]="busy() || !s.canUseOAuth" (click)="connect()">Connect Meta account</button>
              @if (!s.canUseOAuth) { <p class="hint">Add META_APP_ID and META_APP_SECRET on the server first.</p> }
            } @else {
              <button class="btn btn-ghost" type="button" [disabled]="busy()" (click)="connect()">Reconnect</button>
              <button class="btn btn-ghost" type="button" [disabled]="busy()" (click)="disconnect()">Disconnect</button>
            }
          </div>
        }
      </section>

      @if (s.connected) {
        <section class="block">
          <h2>Where ads are created</h2>
          <div class="pick">
            <div class="field">
              <label for="set-acc">Ad account</label>
              <select id="set-acc" class="input" [value]="state.account()?.id" (change)="pickAccount($any($event.target).value)">
                @for (a of state.accounts(); track a.id) {
                  <option [value]="a.id" [selected]="a.id === state.account()?.id">{{ a.name }} ({{ a.currency }}, {{ a.statusLabel }})</option>
                } @empty { <option disabled>No ad accounts available to this login</option> }
              </select>
            </div>
            <div class="field">
              <label for="set-page">Facebook Page</label>
              <select id="set-page" class="input" [value]="state.page()?.id" (change)="pickPage($any($event.target).value)">
                @for (p of state.pages(); track p.id) {
                  <option [value]="p.id" [selected]="p.id === state.page()?.id">{{ p.name }}</option>
                } @empty { <option disabled>No Pages available to this login</option> }
              </select>
              <span class="hint">
                @if (state.page()?.instagram; as ig) { Instagram account linked: {{ '@' + (ig.username ?? ig.id) }}. Ads also run on Instagram as this account. }
                @else { No Instagram account is linked to this Page. Instagram ads will run under the Page’s name. }
              </span>
            </div>
          </div>
          @if (state.account(); as a) {
            @if (a.status !== 1) { <p class="notice bad">This ad account is “{{ a.statusLabel }}”. Ads won’t deliver until it’s active in Meta Business settings.</p> }
          }
        </section>
      }

      <section class="block">
        <h2>Setting up the connection</h2>
        <ol class="setup">
          <li>In Meta Business Suite, make sure the clinic owns the Facebook Page and an ad account with a payment method.</li>
          <li>Create an app at developers.facebook.com (type “Business”) and add the Marketing API product.</li>
          <li>Either create a system user with access to the ad account and Page and generate a token with <code>ads_management</code>, <code>ads_read</code> and <code>pages_read_engagement</code>, or add Facebook Login and set the redirect URI to <code class="num">{{ redirect }}</code>.</li>
          <li>Put the values in the server’s <code>.env</code> file and restart it. The full guide is in <code>docs/META_SETUP.md</code>.</li>
        </ol>
      </section>
    }
  `,
  styles: `
    .head { margin-bottom: 28px; }
    h1 { font-size: var(--t-4xl); font-weight: 740; font-stretch: 118%; font-variation-settings: 'wdth' 118; }
    .head p { color: var(--spruce-2); margin-top: 6px; }
    .block { border-top: 1.5px solid var(--spruce); padding: 18px 0 36px; max-width: 760px; display: grid; gap: 18px; }
    h2 { font-size: var(--t-2xl); font-weight: 650; font-stretch: 90%; font-variation-settings: 'wdth' 90; }
    .kv { margin: 0; }
    .kv div { display: grid; grid-template-columns: 13rem 1fr; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--rule-soft); font-size: var(--t-sm); }
    .kv dt { font-weight: 600; }
    .kv dd { margin: 0; color: var(--spruce-2); }
    @media (max-width: 560px) { .kv div { grid-template-columns: 1fr; gap: 2px; } }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .hint { font-size: var(--t-xs); color: var(--spruce-3); }
    .pick { display: grid; gap: 18px; }
    .notice { padding: 12px 16px; border-radius: var(--r-sm); background: #dcefe2; color: var(--ok); font-weight: 600; font-size: var(--t-sm); margin-bottom: 20px; max-width: 760px; }
    .notice.bad { background: #f6dcd8; color: var(--danger); }
    .setup { margin: 0; padding-left: 1.3em; display: grid; gap: 10px; font-size: var(--t-sm); color: var(--spruce-2); }
    code { background: var(--rule-soft); padding: 1px 6px; border-radius: 4px; font-size: 0.92em; overflow-wrap: anywhere; }
  `,
})
export class Settings implements OnInit {
  readonly state = inject(StudioState);
  private api = inject(MetaApi);
  private route = inject(ActivatedRoute);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  readonly redirect = `${location.protocol}//${location.hostname}:4000/api/meta/oauth/callback`;

  ngOnInit(): void {
    const r = this.route.snapshot.queryParamMap.get('meta');
    if (r && RETURN_MESSAGES[r]) {
      this.notice.set(RETURN_MESSAGES[r]);
      void this.state.load(true);
    }
  }

  async connect(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const { url } = await this.api.startOAuth();
      window.location.href = url;
    } catch (err) {
      this.error.set(errorMessage(err, 'Couldn’t start the Facebook sign-in.'));
      this.busy.set(false);
    }
  }

  async disconnect(): Promise<void> {
    if (!confirm('Disconnect the Meta account? Running ads keep running; you just won’t be able to manage them here.')) return;
    this.busy.set(true);
    try {
      await this.api.disconnect();
      await this.state.load(true);
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }

  async pickAccount(id: string): Promise<void> {
    try { await this.state.selectAccount(id); } catch (err) { this.error.set(errorMessage(err)); }
  }
  async pickPage(id: string): Promise<void> {
    try { await this.state.selectPage(id); } catch (err) { this.error.set(errorMessage(err)); }
  }

  expiry(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}

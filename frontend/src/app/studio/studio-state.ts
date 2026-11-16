import { computed, inject, Injectable, signal } from '@angular/core';
import { errorMessage } from '../core/auth.service';
import type { AdAccount, ConnectionStatus, DatePreset, FacebookPage } from '../core/models';
import { MetaApi } from '../core/meta-api.service';

/** Connection, ad account and page selection shared by every studio screen. */
@Injectable({ providedIn: 'root' })
export class StudioState {
  private api = inject(MetaApi);

  readonly status = signal<ConnectionStatus | null>(null);
  readonly accounts = signal<AdAccount[]>([]);
  readonly pages = signal<FacebookPage[]>([]);
  readonly preset = signal<DatePreset>('last_30d');
  readonly loading = signal(false);
  readonly error = signal('');

  readonly isDemo = computed(() => this.status()?.mode === 'demo');
  readonly connected = computed(() => this.status()?.connected ?? false);

  readonly account = computed<AdAccount | null>(() => {
    const id = this.status()?.selectedAdAccountId;
    const list = this.accounts();
    return list.find((a) => a.id === id) ?? list[0] ?? null;
  });
  readonly page = computed<FacebookPage | null>(() => {
    const id = this.status()?.selectedPageId;
    const list = this.pages();
    return list.find((p) => p.id === id) ?? list[0] ?? null;
  });
  readonly currency = computed(() => this.account()?.currency ?? 'INR');

  private loaded = false;

  async load(force = false): Promise<void> {
    if (this.loaded && !force) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const status = await this.api.status();
      this.status.set(status);
      if (status.connected) {
        const [accounts, pages] = await Promise.all([this.api.adAccounts(), this.api.pages()]);
        this.accounts.set(accounts);
        this.pages.set(pages);
      } else {
        this.accounts.set([]);
        this.pages.set([]);
      }
      this.loaded = true;
    } catch (err) {
      this.error.set(errorMessage(err, 'Couldn’t load the Meta connection.'));
    } finally {
      this.loading.set(false);
    }
  }

  async selectAccount(id: string): Promise<void> {
    await this.api.select({ adAccountId: id });
    this.status.update((s) => (s ? { ...s, selectedAdAccountId: id } : s));
  }

  async selectPage(id: string): Promise<void> {
    await this.api.select({ pageId: id });
    this.status.update((s) => (s ? { ...s, selectedPageId: id } : s));
  }
}

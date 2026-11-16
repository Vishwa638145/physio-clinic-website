import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

/**
 * Tiny JSON-file store. Good enough for one clinic; swap for Postgres/Mongo later
 * by re-implementing these few functions.
 */

export interface MetaConnection {
  /** AES-GCM encrypted long-lived user token */
  encryptedToken: string;
  tokenExpiresAt: string | null;
  userId: string;
  userName: string;
  connectedAt: string;
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

export interface ActivityEntry {
  id: string;
  at: string;
  action: string;
  detail: string;
}

interface StoreShape {
  meta: {
    connection: MetaConnection | null;
    selectedAdAccountId: string | null;
    selectedPageId: string | null;
    oauthStates: Record<string, number>;
  };
  enquiries: Enquiry[];
  activity: ActivityEntry[];
}

const file = path.join(config.dataDir, 'store.json');

const empty = (): StoreShape => ({
  meta: { connection: null, selectedAdAccountId: null, selectedPageId: null, oauthStates: {} },
  enquiries: [],
  activity: [],
});

let cache: StoreShape | null = null;

function load(): StoreShape {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(file, 'utf8');
    cache = { ...empty(), ...(JSON.parse(raw) as Partial<StoreShape>) } as StoreShape;
    cache.meta = { ...empty().meta, ...cache.meta };
  } catch {
    cache = empty();
  }
  return cache;
}

function persist(): void {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, file);
}

export const store = {
  read<T>(fn: (s: StoreShape) => T): T {
    return fn(load());
  },
  write<T>(fn: (s: StoreShape) => T): T {
    const result = fn(load());
    persist();
    return result;
  },
  log(action: string, detail: string): void {
    store.write((s) => {
      s.activity.unshift({ id: cryptoId(), at: new Date().toISOString(), action, detail });
      s.activity = s.activity.slice(0, 200);
    });
  },
};

export function cryptoId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

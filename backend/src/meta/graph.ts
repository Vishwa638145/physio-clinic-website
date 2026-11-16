import { config } from '../config.js';
import { appSecretProof } from '../lib/crypto.js';
import { MetaApiError } from './types.js';

const BASE = 'https://graph.facebook.com';

type Params = Record<string, unknown>;

interface GraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
}

function encode(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function withAuth(params: Params, token: string): Params {
  const out: Params = { ...params, access_token: token };
  if (config.meta.appSecret) out['appsecret_proof'] = appSecretProof(token, config.meta.appSecret);
  return out;
}

function toSearch(params: Params): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    sp.set(k, encode(v));
  }
  return sp;
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new MetaApiError(`Meta returned a non-JSON response (HTTP ${res.status}).`);
  }
  const err = (body as GraphErrorBody).error;
  if (!res.ok || err) {
    const message =
      err?.error_user_msg ||
      (err?.error_user_title ? `${err.error_user_title}: ${err.message ?? ''}` : err?.message) ||
      `Meta request failed (HTTP ${res.status}).`;
    // 190 = invalid/expired token → treat as 401 so the UI can prompt a reconnect
    const status = err?.code === 190 ? 401 : res.status >= 400 && res.status < 500 ? 400 : 502;
    throw new MetaApiError(message, status, err?.code, err?.error_subcode, err?.fbtrace_id);
  }
  return body as T;
}

export const graph = {
  url(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${BASE}/${config.meta.graphVersion}${p}`;
  },

  async get<T>(path: string, token: string, params: Params = {}): Promise<T> {
    const res = await fetch(`${graph.url(path)}?${toSearch(withAuth(params, token))}`);
    return parse<T>(res);
  },

  async post<T>(path: string, token: string, params: Params = {}): Promise<T> {
    const res = await fetch(graph.url(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: toSearch(withAuth(params, token)),
    });
    return parse<T>(res);
  },

  async delete(path: string, token: string): Promise<void> {
    const res = await fetch(`${graph.url(path)}?${toSearch(withAuth({}, token))}`, { method: 'DELETE' });
    await parse(res);
  },

  async upload<T>(path: string, token: string, file: Buffer, filename: string, mime: string): Promise<T> {
    const form = new FormData();
    for (const [k, v] of Object.entries(withAuth({}, token))) form.set(k, encode(v));
    form.set('filename', new Blob([new Uint8Array(file)], { type: mime }), filename);
    const res = await fetch(graph.url(path), { method: 'POST', body: form });
    return parse<T>(res);
  },

  /** Follows `paging.next` up to `maxPages` and concatenates `data`. */
  async all<T>(path: string, token: string, params: Params = {}, maxPages = 5): Promise<T[]> {
    const out: T[] = [];
    let page = await graph.get<{ data: T[]; paging?: { next?: string } }>(path, token, { limit: 100, ...params });
    out.push(...page.data);
    let n = 1;
    while (page.paging?.next && n < maxPages) {
      const res = await fetch(page.paging.next);
      page = await parse(res);
      out.push(...page.data);
      n++;
    }
    return out;
  },

  /** Raw (no access_token) GET, used for the OAuth code exchange. */
  async rawGet<T>(path: string, params: Params): Promise<T> {
    const res = await fetch(`${graph.url(path)}?${toSearch(params)}`);
    return parse<T>(res);
  },
};

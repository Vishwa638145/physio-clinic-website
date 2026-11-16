import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config.js';
import { requireAdmin } from '../lib/auth.js';
import { randomToken } from '../lib/crypto.js';
import { store } from '../lib/store.js';
import { meta } from '../meta/provider.js';
import { DATE_PRESETS, type DatePreset, MetaApiError } from '../meta/types.js';

export const metaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // Meta's limit for ad images is 30 MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true);
    else cb(new MetaApiError('Use a JPG or PNG image.', 400));
  },
});

const preset = (v: unknown): DatePreset =>
  DATE_PRESETS.includes(v as DatePreset) ? (v as DatePreset) : 'last_30d';

/* ── OAuth callback is hit by the browser redirect from Facebook, so it is not behind requireAdmin.
      It is protected by a single-use `state` value that only an authenticated admin can mint. ── */
metaRouter.get('/oauth/callback', async (req, res) => {
  const back = `${config.frontendUrl}/studio/settings`;
  const state = String(req.query['state'] ?? '');
  const code = String(req.query['code'] ?? '');
  const issued = store.read((s) => s.meta.oauthStates[state]);
  store.write((s) => {
    delete s.meta.oauthStates[state];
  });

  if (req.query['error']) {
    res.redirect(`${back}?meta=denied`);
    return;
  }
  if (!issued || Date.now() - issued > 10 * 60_000 || !code) {
    res.redirect(`${back}?meta=expired`);
    return;
  }
  try {
    await meta.completeOAuth(code);
    res.redirect(`${back}?meta=connected`);
  } catch (err) {
    console.error('[meta] OAuth exchange failed', err);
    res.redirect(`${back}?meta=failed`);
  }
});

metaRouter.use(requireAdmin);

metaRouter.get('/status', async (_req, res) => {
  res.json(await meta.status());
});

metaRouter.post('/oauth/start', (_req, res) => {
  const state = randomToken();
  store.write((s) => {
    // prune old states
    for (const [k, t] of Object.entries(s.meta.oauthStates)) if (Date.now() - t > 10 * 60_000) delete s.meta.oauthStates[k];
    s.meta.oauthStates[state] = Date.now();
  });
  res.json({ url: meta.oauthUrl(state) });
});

metaRouter.post('/disconnect', async (_req, res) => {
  await meta.disconnect();
  res.json({ ok: true });
});

metaRouter.get('/ad-accounts', async (_req, res) => {
  res.json(await meta.adAccounts());
});

metaRouter.get('/pages', async (_req, res) => {
  res.json(await meta.pages());
});

const selectionSchema = z.object({
  adAccountId: z.string().regex(/^(act_)?\d+$/).optional(),
  pageId: z.string().regex(/^\d+$/).optional(),
});

metaRouter.put('/selection', (req, res) => {
  const body = selectionSchema.parse(req.body);
  store.write((s) => {
    if (body.adAccountId) s.meta.selectedAdAccountId = body.adAccountId.startsWith('act_') ? body.adAccountId : `act_${body.adAccountId}`;
    if (body.pageId) s.meta.selectedPageId = body.pageId;
  });
  res.json({ ok: true });
});

metaRouter.get('/ad-accounts/:id/campaigns', async (req, res) => {
  res.json(await meta.campaigns(req.params.id, preset(req.query['preset'])));
});

metaRouter.get('/ad-accounts/:id/daily', async (req, res) => {
  res.json(await meta.accountDaily(req.params.id, preset(req.query['preset'])));
});

metaRouter.get('/campaigns/:id/ads', async (req, res) => {
  res.json(await meta.campaignAds(req.params.id, preset(req.query['preset'])));
});

const statusSchema = z.object({ status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']) });

metaRouter.post('/objects/:id/status', async (req, res) => {
  const { status } = statusSchema.parse(req.body);
  if (!/^\d+$/.test(req.params.id)) throw new MetaApiError('Invalid object id', 400);
  await meta.setStatus(req.params.id, status);
  res.json({ ok: true, status });
});

metaRouter.get('/geo', async (req, res) => {
  const q = String(req.query['q'] ?? '').trim();
  if (q.length < 2) {
    res.json([]);
    return;
  }
  res.json(await meta.searchGeo(q));
});

metaRouter.post('/ad-accounts/:id/images', upload.single('image'), async (req, res) => {
  if (!req.file) throw new MetaApiError('Attach an image file named "image".', 400);
  res.json(await meta.uploadImage(String(req.params['id']), req.file.buffer, req.file.originalname, req.file.mimetype));
});

/* ── Create a complete ad (campaign → ad set → creative → ad) ── */
const createSchema = z
  .object({
    adAccountId: z.string().regex(/^(act_)?\d+$/),
    pageId: z.string().regex(/^\d+$/),
    instagramUserId: z.string().regex(/^\d+$/).nullish(),
    name: z.string().trim().min(3).max(120),
    objective: z.enum(['OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS']),
    dailyBudget: z.number().positive().max(1_000_000),
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }).nullish(),
    location: z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('radius'),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusKm: z.number().min(1).max(80),
        label: z.string().optional(),
      }),
      z.object({
        kind: z.literal('places'),
        places: z
          .array(z.object({ key: z.string().min(1), type: z.string(), name: z.string() }))
          .min(1)
          .max(25),
      }),
    ]),
    ageMin: z.number().int().min(18).max(65),
    ageMax: z.number().int().min(18).max(65),
    genders: z.array(z.enum(['male', 'female'])).max(2),
    placements: z.enum(['automatic', 'facebook_instagram']),
    primaryText: z.string().trim().min(10).max(2200),
    headline: z.string().trim().min(3).max(255),
    description: z.string().trim().max(255).optional(),
    linkUrl: z.url({ protocol: /^https?$/ }),
    cta: z.enum(['BOOK_NOW', 'LEARN_MORE', 'CONTACT_US', 'SIGN_UP', 'GET_DIRECTIONS']),
    imageHash: z.string().min(4),
    launch: z.boolean(),
  })
  .refine((v) => v.ageMax >= v.ageMin, { message: 'Maximum age must be at least the minimum age', path: ['ageMax'] })
  .refine((v) => !v.endTime || new Date(v.endTime) > new Date(v.startTime), {
    message: 'End date must be after the start date',
    path: ['endTime'],
  });

metaRouter.post('/ads', async (req, res) => {
  const input = createSchema.parse(req.body);
  const result = await meta.createAd(input);
  res.status(201).json(result);
});

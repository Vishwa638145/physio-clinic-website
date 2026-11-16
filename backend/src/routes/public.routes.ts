import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { isDemoMode } from '../config.js';
import { checkCredentials, issueToken, requireAdmin } from '../lib/auth.js';
import { cryptoId, store } from '../lib/store.js';

export const publicRouter = Router();
export const adminRouter = Router();

/* ── Auth ───────────────────────────────────────────── */
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

publicRouter.post('/auth/login', loginLimiter, (req, res) => {
  const { email, password } = z.object({ email: z.string(), password: z.string() }).parse(req.body);
  if (!checkCredentials(email, password)) {
    res.status(401).json({ error: 'That email and password don’t match. Check both and try again.' });
    return;
  }
  res.json({ token: issueToken(email), email, demo: isDemoMode });
});

/* ── Appointment enquiries from the public site ─────── */
const enquiryLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,16}$/, 'Enter a phone number with 8–15 digits'),
  email: z.union([z.email(), z.literal('')]).optional(),
  concern: z.string().trim().min(2).max(60),
  preferredSlot: z.string().trim().max(40).optional(),
  message: z.string().trim().max(1000).optional(),
  source: z.string().trim().max(120).optional(), // e.g. utm_source from a Meta ad
  visitType: z.enum(['clinic', 'home']).optional(),
  pincode: z.union([z.string().regex(/^\d{6}$/, 'Enter a 6-digit PIN code'), z.literal('')]).optional(),
  area: z.string().trim().max(80).optional(),
  address: z.string().trim().max(200).optional(),
  website: z.string().max(0).optional(), // honeypot
});

publicRouter.post('/enquiries', enquiryLimiter, (req, res) => {
  const data = enquirySchema.parse(req.body);
  const { website: _hp, ...clean } = data;
  const enquiry = store.write((s) => {
    const e = { ...clean, email: clean.email || undefined, pincode: clean.pincode || undefined, area: clean.area || undefined, address: clean.address || undefined, id: cryptoId(), createdAt: new Date().toISOString(), status: 'new' as const };
    s.enquiries.unshift(e);
    return e;
  });
  res.status(201).json({ id: enquiry.id });
});

/* ── Admin views ─────────────────────────────────────── */
adminRouter.use(requireAdmin);

adminRouter.get('/enquiries', (_req, res) => {
  res.json(store.read((s) => s.enquiries));
});

adminRouter.patch('/enquiries/:id', (req, res) => {
  const { status } = z.object({ status: z.enum(['new', 'contacted', 'booked', 'closed']) }).parse(req.body);
  const updated = store.write((s) => {
    const e = s.enquiries.find((x) => x.id === req.params.id);
    if (e) e.status = status;
    return e;
  });
  if (!updated) {
    res.status(404).json({ error: 'Enquiry not found' });
    return;
  }
  res.json(updated);
});

adminRouter.get('/activity', (_req, res) => {
  res.json(store.read((s) => s.activity.slice(0, 50)));
});

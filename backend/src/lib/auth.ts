import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { verifyPassword } from './crypto.js';

const DEV_FALLBACK_PASSWORD = 'clinic-admin';

export function checkCredentials(email: string, password: string): boolean {
  if (email.trim().toLowerCase() !== config.admin.email) return false;
  if (config.admin.passwordHash) return verifyPassword(password, config.admin.passwordHash);
  // No hash configured: allow the documented dev password outside production only
  return !config.isProd && password === DEV_FALLBACK_PASSWORD;
}

export function issueToken(email: string): string {
  return jwt.sign({ sub: email, role: 'admin' }, config.jwtSecret, { expiresIn: '12h' });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; role: string };
    if (payload.role !== 'admin') throw new Error('forbidden');
    res.locals['admin'] = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has ended. Sign in again.' });
  }
}

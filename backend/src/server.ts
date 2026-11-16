import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { assertProductionSecrets, config, isDemoMode } from './config.js';
import { MetaApiError } from './meta/types.js';
import { metaRouter } from './routes/meta.routes.js';
import { adminRouter, publicRouter } from './routes/public.routes.js';

assertProductionSecrets();

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: config.frontendUrl, credentials: false }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, demo: isDemoMode, graphVersion: config.meta.graphVersion });
});

app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api/meta', metaRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/* Optionally serve the built Angular app from the same process (single-server deploy). */
const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '../../frontend/dist/frontend/browser');
if (fs.existsSync(path.join(webRoot, 'index.html'))) {
  app.use(express.static(webRoot, { maxAge: '7d', index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(webRoot, 'index.html'));
  });
}

/* Error handler — Express 5 forwards rejected promises here automatically. */
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Some fields need attention.',
      fields: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }
  if (err instanceof MetaApiError) {
    res.status(err.status).json({ error: err.message, metaCode: err.code, metaSubcode: err.subcode, fbtraceId: err.fbtraceId });
    return;
  }
  if (err instanceof MulterError) {
    res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'The image is larger than 30 MB.' : err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Try again in a moment.' });
});

app.listen(config.port, () => {
  console.log(`Clinic API listening on http://localhost:${config.port}`);
  console.log(isDemoMode ? '  Meta: DEMO MODE (no credentials configured)' : `  Meta: live, Graph ${config.meta.graphVersion}`);
});

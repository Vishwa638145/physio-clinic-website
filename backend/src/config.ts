import 'dotenv/config';
import path from 'node:path';

function str(name: string, fallback = ''): string {
  return (process.env[name] ?? fallback).trim();
}

const nodeEnv = str('NODE_ENV', 'development');
const isProd = nodeEnv === 'production';

export const config = {
  port: Number(str('PORT', '4000')),
  nodeEnv,
  isProd,
  frontendUrl: str('FRONTEND_URL', 'http://localhost:4200').replace(/\/$/, ''),
  apiPublicUrl: str('API_PUBLIC_URL', 'http://localhost:4000').replace(/\/$/, ''),
  dataDir: path.resolve(str('DATA_DIR', './data')),

  admin: {
    email: str('ADMIN_EMAIL', 'admin@example.com').toLowerCase(),
    passwordHash: str('ADMIN_PASSWORD_HASH'),
  },

  jwtSecret: str('JWT_SECRET', 'dev-only-jwt-secret'),
  tokenEncryptionKey: str('TOKEN_ENCRYPTION_KEY', 'dev-only-encryption-key'),

  meta: {
    appId: str('META_APP_ID'),
    appSecret: str('META_APP_SECRET'),
    graphVersion: str('META_GRAPH_VERSION', 'v26.0'),
    systemUserToken: str('META_SYSTEM_USER_TOKEN'),
    defaultAdAccountId: str('META_DEFAULT_AD_ACCOUNT_ID'),
    defaultPageId: str('META_DEFAULT_PAGE_ID'),
    oauthScopes: str(
      'META_OAUTH_SCOPES',
      'ads_management,ads_read,business_management,pages_show_list,pages_read_engagement',
    ),
  },
};

/** Demo mode: no Meta app configured and no system-user token → serve realistic sample data. */
export const isDemoMode = !config.meta.appId && !config.meta.systemUserToken;

export function assertProductionSecrets(): void {
  if (!isProd) return;
  const weak: string[] = [];
  if (config.jwtSecret.length < 32 || config.jwtSecret.startsWith('change-me')) weak.push('JWT_SECRET');
  if (config.tokenEncryptionKey.length < 32 || config.tokenEncryptionKey.startsWith('change-me'))
    weak.push('TOKEN_ENCRYPTION_KEY');
  if (!config.admin.passwordHash) weak.push('ADMIN_PASSWORD_HASH');
  if (weak.length) {
    throw new Error(`Refusing to start in production. Set strong values for: ${weak.join(', ')}`);
  }
}

import { isDemoMode } from '../config.js';
import { DemoMetaProvider } from './demo.js';
import { LiveMetaProvider } from './live.js';
import type { MetaProvider } from './types.js';

export const meta: MetaProvider = isDemoMode ? new DemoMetaProvider() : new LiveMetaProvider();

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb() {
  const { env } = getCloudflareContext();
  
  if (!env.DB) {
    throw new Error('Cloudflare D1 binding "DB" is not available in the current context.');
  }
  
  return drizzle(env.DB, { schema });
}

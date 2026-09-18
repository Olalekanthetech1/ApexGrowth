import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    if (process.env.DATABASE_URL) {
      let connectionString = process.env.DATABASE_URL;

      // Prepare connection string to satisfy pg-connection-string v3/libpq SSL requirements
      // and eliminate SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'
      try {
        const parsedUrl = new URL(connectionString);
        const currentSslMode = parsedUrl.searchParams.get('sslmode');
        if (currentSslMode === 'require' || currentSslMode === 'prefer' || currentSslMode === 'verify-ca') {
          parsedUrl.searchParams.set('uselibpqcompat', 'true');
          connectionString = parsedUrl.toString();
        } else if (!currentSslMode && (connectionString.includes('neon.tech') || connectionString.includes('supabase.co'))) {
          parsedUrl.searchParams.set('sslmode', 'require');
          parsedUrl.searchParams.set('uselibpqcompat', 'true');
          connectionString = parsedUrl.toString();
        }
      } catch {
        if (connectionString.includes('sslmode=require') && !connectionString.includes('uselibpqcompat=true')) {
          connectionString = connectionString.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true');
        }
      }

      const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
      const isSslNeeded =
        !isLocalhost &&
        (connectionString.includes('sslmode=require') ||
          connectionString.includes('sslmode=verify-full') ||
          connectionString.includes('render.com') ||
          (process.env.NODE_ENV === 'production' && !connectionString.includes('sslmode=disable')));

      global._postgresPool = new Pool({
        connectionString,
        max: 10,
        connectionTimeoutMillis: 15000,
        ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || '127.0.0.1',
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
        password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
export { pool };

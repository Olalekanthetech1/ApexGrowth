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

      // Automatically append Neon SSL compatibility parameters to prevent warnings and connection disruptions
      if (connectionString.includes('neon.tech') && !connectionString.includes('sslmode=')) {
        const separator = connectionString.includes('?') ? '&' : '?';
        connectionString = `${connectionString}${separator}uselibpqcompat=true&sslmode=require`;
      }

      const isSslNeeded =
        connectionString.includes('sslmode=require') ||
        connectionString.includes('sslmode=verify-full') ||
        connectionString.includes('render.com') ||
        process.env.NODE_ENV === 'production';

      global._postgresPool = new Pool({
        connectionString,
        max: 10,
        connectionTimeoutMillis: 15000,
        ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
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

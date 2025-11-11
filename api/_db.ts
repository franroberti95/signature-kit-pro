// Database connection utility for Neon
import { neon } from '@neondatabase/serverless';

let sqlInstance: ReturnType<typeof neon> | null = null;

// Lazy-load database connection to avoid errors at import time
export function getSql() {
  if (!sqlInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    sqlInstance = neon(databaseUrl);
  }
  return sqlInstance;
}

// Export sql as a Proxy that lazy-loads on first use
export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(_target, prop) {
    return (getSql() as any)[prop];
  },
});


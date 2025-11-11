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

// Export sql as a function that works with template literals
// This approach works better with ES modules
function sqlFunction(strings: TemplateStringsArray, ...values: unknown[]) {
  const sqlInstance = getSql();
  return sqlInstance(strings, ...values);
}

export const sql = sqlFunction as ReturnType<typeof neon>;
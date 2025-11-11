# Logger Usage Guide

## Overview

Two logger utilities have been created:
- **Frontend**: `src/lib/logger.ts` - For React components
- **Backend**: `api/_logger.ts` - For API routes

Both loggers **only log in development mode**. In production, logs are silenced (except errors).

## Frontend Logger (`src/lib/logger.ts`)

### Usage

```typescript
import { logger } from '@/lib/logger';

// Basic logging
logger.log('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.debug('Debug message');

// Labeled logging
logger.labeled('API', 'Fetching user data...');

// Grouped logging
logger.group('User Actions', () => {
  logger.log('Action 1');
  logger.log('Action 2');
});
```

### Behavior

- **Development**: All logs are shown
- **Production**: Only errors are logged (others are silenced)

## Backend Logger (`api/_logger.ts`)

### Usage

```typescript
import { logger } from './_logger';

// Basic logging
logger.log('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.debug('Debug message');

// API-specific helpers
logger.request('POST', '/api/documents', { title: 'Test' });
logger.response('POST', '/api/documents', 201, { id: '123' });

// Labeled logging
logger.labeled('Database', 'Query executed');

// Grouped logging
logger.group('Auth Flow', () => {
  logger.log('Step 1: Validate token');
  logger.log('Step 2: Get user');
});
```

### Behavior

- **Development**: All logs are shown
- **Production**: Only errors are logged (others are silenced)
- **Errors**: Always logged (even in production) for debugging

## Examples

### Frontend Example

```typescript
// src/pages/Dashboard.tsx
import { logger } from '@/lib/logger';

const fetchUserData = async () => {
  try {
    logger.info('Fetching user data...');
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    logger.log('User data received:', data);
    return data;
  } catch (error) {
    logger.error('Failed to fetch user data:', error);
    throw error;
  }
};
```

### Backend Example

```typescript
// api/documents/index.ts
import { logger } from '../_logger';

export default async function handler(req, res) {
  logger.request(req.method, req.url, req.body);
  
  try {
    const documents = await sql`SELECT * FROM documents`;
    logger.response(req.method, req.url, 200, { count: documents.length });
    return res.json({ documents });
  } catch (error) {
    logger.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Migration from console.log

### Before
```typescript
console.log('Debug message');
console.error('Error:', error);
```

### After
```typescript
import { logger } from './_logger'; // or '@/lib/logger' for frontend

logger.log('Debug message');
logger.error('Error:', error);
```

## Production Behavior

In production:
- ✅ **Errors are always logged** (for debugging)
- ❌ **Other logs are silenced** (cleaner logs, better performance)
- 🔮 **Future**: Errors can be sent to error tracking (Sentry, etc.)

## Adding Error Tracking (Future)

To add error tracking in production:

```typescript
// api/_logger.ts
error(...args: unknown[]): void {
  if (this.shouldLog('error')) {
    console.error(...args);
  }
  // Send to error tracking in production
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(args[0]);
  }
}
```

## Benefits

1. ✅ **Clean production logs** - No debug noise
2. ✅ **Better performance** - No string formatting in production
3. ✅ **Consistent logging** - Same API everywhere
4. ✅ **Easy to extend** - Add error tracking later
5. ✅ **Type-safe** - TypeScript support


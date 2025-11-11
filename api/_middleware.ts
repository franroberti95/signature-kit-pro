// Authentication middleware
import type { AuthenticatedRequest, ApiHandler } from './_types';
import type { VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { resolve } from 'path';
import { sql } from './_db';
import { verifyApiKey } from './_utils';
import { logger } from './_logger';

// Load .env.local manually if not in Vercel production (for local dev)
// vercel dev doesn't always load .env.local automatically
if (!process.env.VERCEL || process.env.NODE_ENV === 'development') {
  const rootPath = process.cwd();
  config({ path: resolve(rootPath, '.env.local') });
}

// Lazy-load JWT_SECRET to avoid errors at import time
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error('JWT_SECRET is missing. Checked:', {
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      cwd: process.cwd(),
    });
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

/**
 * Middleware to authenticate dashboard users (JWT token)
 */
export function requireAuth(handler: ApiHandler): ApiHandler {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('requireAuth: Missing or invalid Authorization header');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const jwtSecret = getJwtSecret();
      
      logger.log('requireAuth: Verifying token with JWT_SECRET', {
        hasToken: !!token,
        tokenLength: token.length,
        hasJwtSecret: !!jwtSecret,
      });

      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        email: string;
      };

      logger.log('requireAuth: Token verified successfully', {
        userId: decoded.userId,
        email: decoded.email,
      });

      // Attach user info to request
      req.userId = decoded.userId;
      req.userEmail = decoded.email;

      return handler(req, res);
    } catch (error) {
      logger.error('requireAuth: Token verification failed', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

/**
 * Middleware to authenticate API key (for external API calls)
 */
export async function requireApiKey(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<{ userId: string } | null> {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return null;
    }

            // Find API key in database
            const keys = await sql`
              SELECT user_id, api_key_hash, active
              FROM api_keys
              WHERE api_key = ${apiKey}
            ` as Array<{ user_id: string; api_key_hash: string; active: boolean }>;

            if (keys.length === 0) {
              res.status(401).json({ error: 'Invalid API key' });
              return null;
            }

            const keyData = keys[0];
    if (!keyData.active) {
      res.status(401).json({ error: 'API key is inactive' });
      return null;
    }

    // Verify API key hash
    const isValid = await verifyApiKey(apiKey, keyData.api_key_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid API key' });
      return null;
    }

    // Update last used timestamp
    await sql`
      UPDATE api_keys
      SET last_used_at = NOW()
      WHERE api_key = ${apiKey}
    `;

    return { userId: keyData.user_id };
  } catch (error) {
    logger.error('API key verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return null;
  }
}

/**
 * Helper to get user ID from either JWT or API key
 */
export async function getUserId(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<string | null> {
  // Try JWT first (dashboard)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
      return decoded.userId;
    } catch {
      // JWT invalid, try API key
    }
  }

  // Try API key (external API)
  const apiKeyResult = await requireApiKey(req, res);
  return apiKeyResult?.userId || null;
}


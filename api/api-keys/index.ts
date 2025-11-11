// GET, POST /api/api-keys - List and create API keys
import type { ApiKey, AuthenticatedRequest } from '../_types';
import type { VercelResponse } from '@vercel/node';
import { requireAuth } from '../_middleware';
import { sql } from '../_db';
import { generateApiKey, hashApiKey } from '../_utils';
import { logger } from '../_logger';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - List user's API keys
  if (req.method === 'GET') {
    try {
      const keys = await sql`
        SELECT id, key_name, api_key, created_at, last_used_at, active, expires_at
        FROM api_keys
        WHERE user_id = ${req.userId}
        ORDER BY created_at DESC
      `;

      // Don't expose full API key, only show first 8 chars
      const sanitizedKeys = keys.map((key) => ({
        id: key.id,
        keyName: key.key_name,
        apiKey: key.api_key.substring(0, 8) + '...' + key.api_key.substring(key.api_key.length - 4),
        fullApiKey: key.api_key, // Only return full key on creation
        createdAt: key.created_at,
        lastUsedAt: key.last_used_at,
        active: key.active,
        expiresAt: key.expires_at,
      }));

      return res.status(200).json({ keys: sanitizedKeys });
    } catch (error) {
      logger.error('List API keys error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST - Create new API key
  if (req.method === 'POST') {
    try {
      const { keyName } = req.body;

      // Generate API key
      const apiKey = generateApiKey();
      const apiKeyHash = await hashApiKey(apiKey);

      // Insert into database
      const newKey = await sql`
        INSERT INTO api_keys (user_id, key_name, api_key, api_key_hash)
        VALUES (${req.userId}, ${keyName || null}, ${apiKey}, ${apiKeyHash})
        RETURNING id, key_name, created_at
      ` as ApiKey[];

      return res.status(201).json({
        key: {
          id: newKey[0].id,
          keyName: newKey[0].key_name,
          apiKey, // Return full key only on creation
          createdAt: newKey[0].created_at,
        },
        message: 'API key created. Save it securely - it will not be shown again.',
      });
    } catch (error) {
      logger.error('Create API key error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default requireAuth(handler);


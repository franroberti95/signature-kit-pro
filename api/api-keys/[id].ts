// DELETE /api/api-keys/:id - Revoke API key
import type { AuthenticatedRequest } from '../_types';
import type { VercelResponse } from '@vercel/node';
import { requireAuth } from '../_middleware';
import { sql } from '../_db';
import { logger } from '../_logger';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'API key ID required' });
    }

    // Verify the key belongs to the user and delete it
    const result = await sql`
      DELETE FROM api_keys
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    return res.status(200).json({ message: 'API key revoked successfully' });
  } catch (error) {
    logger.error('Revoke API key error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);


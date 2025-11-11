// GET /api/auth/me - Get current authenticated user
import type { AuthenticatedRequest } from '../_types';
import type { VercelResponse } from '@vercel/node';
import { requireAuth } from '../_middleware';
import { sql } from '../_db';
import { logger } from '../_logger';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const users = await sql`
      SELECT id, email, name, subscription_tier, subscription_status, subscription_expires_at, created_at, last_login_at
      FROM users
      WHERE id = ${req.userId} AND active = true
    `;

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscription_tier,
        subscriptionStatus: user.subscription_status,
        subscriptionExpiresAt: user.subscription_expires_at,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);


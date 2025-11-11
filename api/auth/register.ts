// POST /api/auth/register - Dashboard user registration
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_db';
import { hashPassword } from '../_utils';
import { logger } from '../_logger';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}
    `;

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await sql`
      INSERT INTO users (email, password_hash, name, subscription_tier, subscription_status)
      VALUES (${email.toLowerCase().trim()}, ${passwordHash}, ${name || null}, 'free', 'active')
      RETURNING id, email, name, subscription_tier, created_at
    `;

    const user = newUser[0];

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscription_tier,
      },
      message: 'Registration successful. Please log in.',
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


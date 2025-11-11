// POST /api/auth/login - Dashboard user login
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_db';
import { verifyPassword } from '../_utils';
import { logger } from '../_logger';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user from database
    const users = await sql`
      SELECT id, email, password_hash, name, subscription_tier, subscription_status, active
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Check if user is OAuth-only (no password)
    if (!user.password_hash || user.password_hash === '') {
      return res.status(401).json({ 
        error: 'This account uses Google sign-in. Please sign in with Google.' 
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await sql`
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = ${user.id}
    `;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscription_tier,
        subscriptionStatus: user.subscription_status,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


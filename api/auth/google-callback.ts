// GET /api/auth/google-callback - Google OAuth callback
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../_db';
import { logger } from '../../_logger';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
    }

    // Verify state (CSRF protection)
    const cookies = req.headers.cookie || '';
    const cookieState = cookies.split(';').find(c => c.trim().startsWith('oauth_state='))?.split('=')[1];
    if (state && cookieState && state !== cookieState) {
      logger.warn('OAuth state mismatch - possible CSRF attack');
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
    }

    // Get the origin from the request to build correct redirect URI
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || FRONTEND_URL;
    const redirectUri = `${origin}/api/auth/google-callback`;

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      logger.error('Google token exchange failed:', await tokenResponse.text());
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      logger.error('Google user info fetch failed:', await userResponse.text());
      return res.redirect(`${FRONTEND_URL}/login?error=user_info_failed`);
    }

    const googleUser = await userResponse.json();
    const { email, name, picture } = googleUser;

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_email`);
    }

    // Find or create user
    let users = await sql`
      SELECT id, email, name, subscription_tier, subscription_status, active
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
    `;

    let user;
    if (users.length === 0) {
      // Create new user (no password for OAuth users)
      const newUsers = await sql`
        INSERT INTO users (email, password_hash, name, subscription_tier, subscription_status)
        VALUES (
          ${email.toLowerCase().trim()},
          NULL, -- NULL password hash for OAuth users
          ${name || null},
          'free',
          'active'
        )
        RETURNING id, email, name, subscription_tier, subscription_status
      `;
      user = newUsers[0];
    } else {
      user = users[0];
      
      // Update name if it changed
      if (name && user.name !== name) {
        await sql`
          UPDATE users
          SET name = ${name}, updated_at = NOW()
          WHERE id = ${user.id}
        `;
        user.name = name;
      }

      if (!user.active) {
        return res.redirect(`${FRONTEND_URL}/login?error=account_inactive`);
      }
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

    // Redirect to frontend with token
    return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
}


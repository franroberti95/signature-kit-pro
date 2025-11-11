// GET /api/auth/google-callback - Google OAuth callback
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';
import { resolve } from 'path';
import { sql } from '../_db';
import { logger } from '../_logger';
import jwt from 'jsonwebtoken';
import type { User } from '../types/user';

// Load .env.local manually if not in Vercel (for local dev)
if (!process.env.VERCEL) {
  // Use process.cwd() which works in both CommonJS and ES modules
  const rootPath = process.cwd();
  config({ path: resolve(rootPath, '.env.local') });
}

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required');
}

// TypeScript: After the checks above, these are guaranteed to be strings
const verifiedJwtSecret: string = JWT_SECRET;
const verifiedGoogleClientId: string = GOOGLE_CLIENT_ID;
const verifiedGoogleClientSecret: string = GOOGLE_CLIENT_SECRET;

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

    // Build redirect URI - use FRONTEND_URL for consistency
    // This must match exactly what's configured in Google Cloud Console
    const redirectUri = `${FRONTEND_URL}/api/auth/google-callback`;

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: verifiedGoogleClientId,
        client_secret: verifiedGoogleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      logger.error('Google token exchange failed:', await tokenResponse.text());
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string; token_type?: string; expires_in?: number };
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

    const googleUser = await userResponse.json() as { email: string; name?: string; picture?: string; id?: string };
    const { email, name } = googleUser;

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_email`);
    }

    // Find or create user
    const users = await sql`
      SELECT id, email, name, subscription_tier, subscription_status, active
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
    ` as User[];

    let user: Pick<User, 'id' | 'email' | 'name' | 'subscription_tier' | 'subscription_status' | 'active'>;
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
        RETURNING id, email, name, subscription_tier, subscription_status, active
      ` as Pick<User, 'id' | 'email' | 'name' | 'subscription_tier' | 'subscription_status' | 'active'>[];
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
      verifiedJwtSecret,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Google OAuth callback error:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });
    
    // Log to console in dev for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('OAuth Error Details:', {
        message: errorMessage,
        stack: errorStack,
        error,
      });
    }
    
    return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
}


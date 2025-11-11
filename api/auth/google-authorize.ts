// GET /api/auth/google-authorize - Redirect to Google OAuth
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local manually if not in Vercel (for local dev)
if (!process.env.VERCEL) {
  // Use process.cwd() which works in both CommonJS and ES modules
  const rootPath = process.cwd();
  config({ path: resolve(rootPath, '.env.local') });
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Debug: Log env vars (only in dev)
  if (process.env.NODE_ENV === 'development') {
    console.log('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
  }
  
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ 
      error: 'Google OAuth not configured',
      hint: 'Make sure GOOGLE_CLIENT_ID is set in .env.local and restart vercel dev'
    });
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store state in cookie (or you could use a session store)
  res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`);

  // Build redirect URI - use FRONTEND_URL for consistency
  // In production, this will be your production URL
  // In local dev, this should be http://localhost:8080
  const redirectUri = `${FRONTEND_URL}/api/auth/google-callback`;
  
  const scope = 'openid email profile';
  const responseType = 'code';

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', responseType);
  googleAuthUrl.searchParams.set('scope', scope);
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('access_type', 'online');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return res.redirect(googleAuthUrl.toString());
}


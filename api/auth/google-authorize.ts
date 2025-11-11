// GET /api/auth/google-authorize - Redirect to Google OAuth
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store state in cookie (or you could use a session store)
  res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`);

  // Get the origin from the request to build correct redirect URI
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || FRONTEND_URL;
  const redirectUri = `${origin}/api/auth/google-callback`;
  
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


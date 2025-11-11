// GET /api/test - Test endpoint to check API routing and port
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    return res.json({
      message: 'API test endpoint is working!',
      method: req.method,
      timestamp: new Date().toISOString(),
      request: {
        url: req.url,
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        frontendUrl: process.env.FRONTEND_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


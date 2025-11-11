// POST /api/sessions - Create signing session
import type { AuthenticatedRequest } from '../_types';
import type { VercelResponse } from '@vercel/node';
import { getUserId } from '../_middleware';
import { sql } from '../_db';
import { generateToken } from '../_utils';
import { logger } from '../_logger';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getUserId(req, res);
  if (!userId) {
    return; // Error already sent
  }

  try {
    const { document_id, signer_email, signer_name, expires_in_hours } =
      req.body;

    if (!document_id || !signer_email) {
      return res
        .status(400)
        .json({ error: 'document_id and signer_email are required' });
    }

    // Verify document belongs to user
    const documents = await sql`
      SELECT id FROM documents WHERE id = ${document_id} AND user_id = ${userId}
    `;

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Generate secure token
    const token = generateToken();

    // Set expiration (default 7 days)
    const expiresInHours = expires_in_hours || 168; // 7 days
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create signing session
    const session = await sql`
      INSERT INTO signing_sessions (
        document_id, token, signer_email, signer_name, expires_at, status
      )
      VALUES (
        ${document_id},
        ${token},
        ${signer_email.toLowerCase().trim()},
        ${signer_name || null},
        ${expiresAt.toISOString()},
        'pending'
      )
      RETURNING id, token, signer_email, signer_name, expires_at, status, created_at
    `;

    // Return signing URL (you'll need to set your frontend URL)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const signingUrl = `${frontendUrl}/sign/${token}`;

    return res.status(201).json({
      session: {
        id: session[0].id,
        token: session[0].token,
        signerEmail: session[0].signer_email,
        signerName: session[0].signer_name,
        expiresAt: session[0].expires_at,
        status: session[0].status,
        createdAt: session[0].created_at,
      },
      signingUrl,
    });
  } catch (error) {
    logger.error('Create session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;


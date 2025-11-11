// GET, POST /api/sessions/:token - Get session and submit form data (public)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_db';
import { logger } from '../_logger';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token required' });
  }

  // GET - Get session info (public, for signer)
  if (req.method === 'GET') {
    try {
      const sessions = await sql`
        SELECT 
          s.id,
          s.token,
          s.signer_email,
          s.signer_name,
          s.status,
          s.expires_at,
          s.created_at,
          d.id as document_id,
          d.document_type,
          d.title,
          d.data
        FROM signing_sessions s
        JOIN documents d ON s.document_id = d.id
        WHERE s.token = ${token}
      `;

      if (sessions.length === 0) {
        return res.status(404).json({ error: 'Signing session not found' });
      }

      const session = sessions[0];

      // Check if expired
      if (new Date(session.expires_at) < new Date()) {
        await sql`
          UPDATE signing_sessions
          SET status = 'expired'
          WHERE token = ${token}
        `;
        return res.status(410).json({ error: 'Signing session has expired' });
      }

      // Update opened_at if first time
      if (session.status === 'pending') {
        await sql`
          UPDATE signing_sessions
          SET status = 'opened', opened_at = NOW()
          WHERE token = ${token} AND status = 'pending'
        `;
      }

      return res.status(200).json({
        session: {
          id: session.id,
          signerEmail: session.signer_email,
          signerName: session.signer_name,
          status: session.status,
          expiresAt: session.expires_at,
        },
        document: {
          id: session.document_id,
          documentType: session.document_type,
          title: session.title,
          data: session.data,
        },
      });
    } catch (error) {
      logger.error('Get session error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST - Submit form data (public, for signer)
  if (req.method === 'POST') {
    try {
      const { form_data } = req.body;

      if (!form_data) {
        return res.status(400).json({ error: 'form_data is required' });
      }

      // Verify session exists and is valid
      const sessions = await sql`
        SELECT id, status, expires_at
        FROM signing_sessions
        WHERE token = ${token}
      `;

      if (sessions.length === 0) {
        return res.status(404).json({ error: 'Signing session not found' });
      }

      const session = sessions[0];

      if (session.status === 'completed') {
        return res.status(400).json({ error: 'Session already completed' });
      }

      if (session.status === 'expired') {
        return res.status(410).json({ error: 'Session has expired' });
      }

      if (new Date(session.expires_at) < new Date()) {
        await sql`
          UPDATE signing_sessions
          SET status = 'expired'
          WHERE token = ${token}
        `;
        return res.status(410).json({ error: 'Session has expired' });
      }

      // Update session with form data
      const updated = await sql`
        UPDATE signing_sessions
        SET 
          form_data = ${JSON.stringify(form_data)}::jsonb,
          status = 'completed',
          completed_at = NOW()
        WHERE token = ${token}
        RETURNING id, completed_at
      `;

      // TODO: Trigger webhooks here

      return res.status(200).json({
        message: 'Form submitted successfully',
        sessionId: updated[0].id,
        completedAt: updated[0].completed_at,
      });
    } catch (error) {
      logger.error('Submit form error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


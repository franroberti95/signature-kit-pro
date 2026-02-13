// GET, POST /api/documents - List and create documents
import type { AuthenticatedRequest } from '../_types';
import type { VercelResponse } from '@vercel/node';
import { requireAuth, requireApiKey, getUserId } from '../_middleware';
import { sql } from '../_db';
import { logger } from '../_logger';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  // Get user ID from either JWT (dashboard) or API key (external)
  const userId = await getUserId(req, res);
  if (!userId) {
    return; // Error already sent
  }

  // GET - List documents
  if (req.method === 'GET') {
    try {
      const { status, document_type, customer_id } = req.query;
      const customerIdHeader = req.headers['x-customer-id'] as string;
      const customerId = customer_id || customerIdHeader;

      let query = sql`
        SELECT id, document_type, title, status, customer_id, created_at, updated_at
        FROM documents
        WHERE user_id = ${userId}
      `;

      // Filter by customer_id if provided
      if (customerId && typeof customerId === 'string') {
        query = sql`
          SELECT id, document_type, title, status, customer_id, created_at, updated_at
          FROM documents
          WHERE user_id = ${userId} AND customer_id = ${customerId}
        `;
      }

      if (status && typeof status === 'string') {
        if (customerId && typeof customerId === 'string') {
          query = sql`
            SELECT id, document_type, title, status, customer_id, created_at, updated_at
            FROM documents
            WHERE user_id = ${userId} AND status = ${status} AND customer_id = ${customerId}
          `;
        } else {
          query = sql`
            SELECT id, document_type, title, status, customer_id, created_at, updated_at
            FROM documents
            WHERE user_id = ${userId} AND status = ${status}
          `;
        }
      }

      if (document_type && typeof document_type === 'string') {
        if (customerId && typeof customerId === 'string') {
          query = sql`
            SELECT id, document_type, title, status, customer_id, created_at, updated_at
            FROM documents
            WHERE user_id = ${userId} AND document_type = ${document_type} AND customer_id = ${customerId}
          `;
        } else {
          query = sql`
            SELECT id, document_type, title, status, customer_id, created_at, updated_at
            FROM documents
            WHERE user_id = ${userId} AND document_type = ${document_type}
          `;
        }
      }

      const documents = await query;

      return res.status(200).json({
        documents: documents.map((doc) => ({
          id: doc.id,
          documentType: doc.document_type,
          title: doc.title,
          status: doc.status,
          customerId: doc.customer_id,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
        })),
      });
    } catch (error) {
      logger.error('List documents error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST - Create document
  if (req.method === 'POST') {
    try {
      const { document_type, title, data, customerId } = req.body;
      const customerIdHeader = req.headers['x-customer-id'] as string;
      const customer_id = customerId || customerIdHeader;

      if (!document_type || !title || !data) {
        return res
          .status(400)
          .json({ error: 'document_type, title, and data are required' });
      }

      if (!['pdf', 'rich_text'].includes(document_type)) {
        return res
          .status(400)
          .json({ error: 'document_type must be "pdf" or "rich_text"' });
      }

      const newDoc = await sql`
        INSERT INTO documents (user_id, document_type, title, data, status, customer_id)
        VALUES (${userId}, ${document_type}, ${title}, ${JSON.stringify(data)}::jsonb, 'draft', ${customer_id || null})
        RETURNING id, document_type, title, status, customer_id, created_at, updated_at
      `;

      return res.status(201).json({
        document: {
          id: newDoc[0].id,
          documentType: newDoc[0].document_type,
          title: newDoc[0].title,
          status: newDoc[0].status,
          customerId: newDoc[0].customer_id,
          createdAt: newDoc[0].created_at,
          updatedAt: newDoc[0].updated_at,
        },
      });
    } catch (error) {
      logger.error('Create document error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Allow both dashboard auth and API key auth
export default handler;


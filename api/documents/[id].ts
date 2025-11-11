// GET, PUT, DELETE /api/documents/:id - Get, update, delete document
import type { AuthenticatedRequest } from '../_types';
import type { VercelResponse } from '@vercel/node';
import { getUserId } from '../_middleware';
import { sql } from '../_db';
import { logger } from '../_logger';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = await getUserId(req, res);
  if (!userId) {
    return; // Error already sent
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Document ID required' });
  }

  // GET - Get document
  if (req.method === 'GET') {
    try {
      const documents = await sql`
        SELECT id, user_id, document_type, title, data, status, created_at, updated_at
        FROM documents
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (documents.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const doc = documents[0];
      return res.status(200).json({
        document: {
          id: doc.id,
          documentType: doc.document_type,
          title: doc.title,
          data: doc.data,
          status: doc.status,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
        },
      });
    } catch (error) {
      logger.error('Get document error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT - Update document
  if (req.method === 'PUT') {
    try {
      const { title, data, status } = req.body;

      // Check if document exists
      const existing = await sql`
        SELECT id FROM documents WHERE id = ${id} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Build update query based on what's provided
      if (title !== undefined && data !== undefined && status !== undefined) {
        await sql`
          UPDATE documents
          SET title = ${title}, data = ${JSON.stringify(data)}::jsonb, status = ${status}, updated_at = NOW()
          WHERE id = ${id} AND user_id = ${userId}
        `;
      } else if (title !== undefined && data !== undefined) {
        await sql`
          UPDATE documents
          SET title = ${title}, data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
          WHERE id = ${id} AND user_id = ${userId}
        `;
      } else if (title !== undefined && status !== undefined) {
        await sql`
          UPDATE documents
          SET title = ${title}, status = ${status}, updated_at = NOW()
          WHERE id = ${id} AND user_id = ${userId}
        `;
      } else if (data !== undefined && status !== undefined) {
        await sql`
          UPDATE documents
          SET data = ${JSON.stringify(data)}::jsonb, status = ${status}, updated_at = NOW()
          WHERE id = ${id} AND user_id = ${userId}
        `;
      } else if (title !== undefined) {
        await sql`
          UPDATE documents
          SET title = ${title}, updated_at = NOW()
          WHERE id = ${id} AND user_id = ${userId}
        `;
      } else if (data !== undefined) {
        await sql`
          UPDATE documents
          SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
          WHERE id = ${id} AND user_id = ${userId}
        `;
      } else if (status !== undefined) {
        await sql`
          UPDATE documents
          SET status = ${status}, updated_at = NOW()
          WHERE id = ${id} AND user_id = ${userId}
        `;
      } else {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Get updated document
      const result = await sql`
        SELECT id, document_type, title, status, updated_at
        FROM documents
        WHERE id = ${id} AND user_id = ${userId}
      `;

      return res.status(200).json({
        document: {
          id: result[0].id,
          documentType: result[0].document_type,
          title: result[0].title,
          status: result[0].status,
          updatedAt: result[0].updated_at,
        },
      });
    } catch (error) {
      logger.error('Update document error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE - Delete document
  if (req.method === 'DELETE') {
    try {
      const result = await sql`
        DELETE FROM documents
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      return res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
      logger.error('Delete document error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default handler;


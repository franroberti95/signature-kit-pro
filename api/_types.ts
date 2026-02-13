// Shared types for API routes
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface AuthenticatedRequest extends VercelRequest {
  userId?: string;
  userEmail?: string;
}

export type ApiHandler = (
  req: AuthenticatedRequest,
  res: VercelResponse
) => Promise<VercelResponse | void>;

export interface User {
  id: string;
  email: string;
  name: string | null;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_name: string | null;
  api_key: string;
  created_at: string;
  last_used_at: string | null;
  active: boolean;
  expires_at: string | null;
}

export interface Document {
  id: string;
  user_id: string;
  document_type: 'pdf' | 'rich_text';
  title: string;
  data: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SigningSession {
  id: string;
  document_id: string;
  token: string;
  signer_email: string;
  signer_name: string | null;
  status: string;
  expires_at: string;
  form_data: Record<string, unknown> | null;
  created_at: string;
}


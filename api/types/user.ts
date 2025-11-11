/**
 * User types for database queries and API responses
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  subscription_tier: string;
  subscription_status: string;
  active: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  last_login_at?: Date | string;
  subscription_expires_at?: Date | string;
  password_hash?: string | null;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionExpiresAt?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface UserWithPassword extends User {
  password_hash: string;
}


import { supabase } from '../lib/supabase';
import type { AdvisorProfile } from './authService';

export interface AdvisorInvite {
  id: string;
  email: string;
  invite_token: string;
  is_super_admin: boolean;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
}

export async function createAdvisorInvite(input: {
  email: string;
  isSuperAdmin: boolean;
}): Promise<{ inviteToken: string; inviteUrl: string }> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('create_advisor_invite', {
    p_email: input.email.trim().toLowerCase(),
    p_is_super_admin: input.isSuperAdmin
  });

  if (error) {
    throw new Error(error.message);
  }

  const inviteToken = String(data);
  const inviteUrl = `${window.location.origin}/register?token=${encodeURIComponent(inviteToken)}`;

  return { inviteToken, inviteUrl };
}

export async function getInviteByToken(token: string): Promise<{
  email: string;
  is_super_admin: boolean;
  expires_at: string;
  status: string;
} | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('get_advisor_invite_by_token', {
    p_token: token
  });

  if (error) {
    throw new Error(error.message);
  }

  const invite = Array.isArray(data) ? data[0] : null;
  return invite ?? null;
}

export async function listPendingInvites(): Promise<AdvisorInvite[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('advisor_invites')
    .select('id,email,invite_token,is_super_admin,status,expires_at,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdvisorInvite[];
}

export async function listAdvisors(): Promise<AdvisorProfile[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('advisor_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdvisorProfile[];
}

export async function revokeAdvisorAccess(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('revoke_advisor_access', {
    p_user_id: userId
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAdvisorAccount(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('delete_advisor_account', {
    p_user_id: userId
  });

  if (error) {
    throw new Error(error.message);
  }
}

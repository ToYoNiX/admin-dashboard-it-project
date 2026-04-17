import { supabase } from '../lib/supabase';

export interface AdvisorProfile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function resolveEmailFromLoginIdentifier(loginIdentifier: string): Promise<string | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const normalized = loginIdentifier.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.includes('@')) {
    return normalized;
  }

  const byUsername = await supabase
    .from('advisor_profiles')
    .select('email')
    .eq('username', normalized)
    .maybeSingle();

  if (byUsername.error) {
    const isMissingUsernameColumn =
      byUsername.error.code === '42703' || /username/i.test(byUsername.error.message ?? '');

    if (!isMissingUsernameColumn) {
      throw new Error(byUsername.error.message);
    }
  } else if (byUsername.data?.email) {
    return String(byUsername.data.email).toLowerCase();
  }

  const byEmail = await supabase
    .from('advisor_profiles')
    .select('email')
    .eq('email', normalized)
    .maybeSingle();

  if (byEmail.error) {
    throw new Error(byEmail.error.message);
  }

  return byEmail.data?.email ? String(byEmail.data.email).toLowerCase() : null;
}

export async function signInWithPassword(loginIdentifier: string, password: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const email = await resolveEmailFromLoginIdentifier(loginIdentifier);
  if (!email) {
    throw new Error('No advisor account found for this username or email.');
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  fullName: string;
  inviteToken?: string;
}): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        invite_token: input.inviteToken ?? null
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signOut(): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getAdvisorProfile(userId: string): Promise<AdvisorProfile | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('advisor_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as AdvisorProfile | null) ?? null;
}

export async function uploadAdvisorAvatar(userId: string, file: File): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('advisor-avatars')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from('advisor-avatars').getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from('advisor_profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return avatarUrl;
}

export async function updateAdvisorProfileName(userId: string, fullName: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cleanedName = fullName.trim();
  if (!cleanedName) {
    throw new Error('Full name is required.');
  }

  const { error } = await supabase
    .from('advisor_profiles')
    .update({
      full_name: cleanedName,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function countAdvisorProfiles(): Promise<number> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { count, error } = await supabase
    .from('advisor_profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

import { supabase } from '../lib/supabase';

export interface AdvisorProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
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

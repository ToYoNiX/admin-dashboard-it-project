import { supabase, supabaseContactTable } from '../lib/supabase';

export interface ContactInfoRecord {
  key: 'primary';
  email: string | null;
  phone: string | null;
  address: string | null;
  map_link: string | null;
  updated_at: string;
}

export interface ContactInfoInput {
  email: string;
  phone: string;
  address: string;
  mapLink: string;
}

function isMissingContactTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /contact_information/i.test(error.message ?? '');
}

export async function getContactInfo(): Promise<ContactInfoRecord | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseContactTable)
    .select('*')
    .eq('key', 'primary')
    .maybeSingle();

  if (error) {
    if (isMissingContactTable(error)) {
      return null;
    }
    throw new Error(`Failed to load contact info: ${error.message}`);
  }

  return (data as ContactInfoRecord | null) ?? null;
}

export async function upsertContactInfo(input: ContactInfoInput): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from(supabaseContactTable).upsert(
    {
      key: 'primary',
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      address: input.address.trim() || null,
      map_link: input.mapLink.trim() || null,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'key' }
  );

  if (error) {
    throw new Error(`Failed to save contact info: ${error.message}`);
  }
}

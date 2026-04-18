import { supabase, supabaseContactSubmissionsTable } from '../lib/supabase';

export type ContactSubmissionType = 'super_admin_message' | 'complaint' | 'suggestion';
export type ContactSubmissionStatus = 'new' | 'reviewed' | 'resolved';

export interface ContactSubmissionRecord {
  id: string;
  submission_type: ContactSubmissionType;
  sender_name: string;
  sender_email: string;
  subject: string | null;
  message_text: string;
  status: ContactSubmissionStatus;
  created_at: string;
  updated_at: string;
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /contact_submissions/i.test(error.message ?? '');
}

export async function listContactSubmissions(type: ContactSubmissionType): Promise<ContactSubmissionRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseContactSubmissionsTable)
    .select('*')
    .eq('submission_type', type)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw new Error(`Failed to load contact submissions: ${error.message}`);
  }

  return (data ?? []) as ContactSubmissionRecord[];
}

export async function updateContactSubmissionStatus(
  id: string,
  status: ContactSubmissionStatus
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from(supabaseContactSubmissionsTable)
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update submission status: ${error.message}`);
  }
}

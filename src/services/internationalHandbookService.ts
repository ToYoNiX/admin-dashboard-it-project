import {
  supabase,
  supabaseInternationalHandbookBucket,
  supabaseInternationalHandbookTable
} from '../lib/supabase';
import {
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export interface InternationalHandbookRecord {
  key: 'current';
  title: string;
  file_path: string;
  created_at: string;
  updated_at: string;
}

const PDF_MIME_TYPES = ['application/pdf'];

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /international_handbook_documents/i.test(error.message ?? '');
}

export async function getInternationalHandbook(): Promise<InternationalHandbookRecord | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseInternationalHandbookTable)
    .select('*')
    .eq('key', 'current')
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) {
      return null;
    }
    throw new Error(`Failed to load handbook: ${error.message}`);
  }

  return (data as InternationalHandbookRecord | null) ?? null;
}

export async function upsertInternationalHandbook(
  title: string,
  file: File,
  existingRecord?: InternationalHandbookRecord | null
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error('Title is required.');
  }

  validateFile(file, {
    maxSizeInMb: 20,
    allowedMimeTypes: PDF_MIME_TYPES,
    label: 'Handbook PDF'
  });

  const target = parseStorageTarget(supabaseInternationalHandbookBucket, 'international-handbook');
  const filePath = await uploadFileToStorage(file, target, 'current', 'pdf');

  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseInternationalHandbookTable).upsert(
    {
      key: 'current',
      title: cleanTitle,
      file_path: filePath,
      updated_at: now
    },
    { onConflict: 'key' }
  );

  if (error) {
    await deleteStorageFileSafely(target.bucket, filePath);
    throw new Error(`Failed to save handbook: ${error.message}`);
  }

  if (existingRecord?.file_path && existingRecord.file_path !== filePath) {
    await deleteStorageFileSafely(target.bucket, existingRecord.file_path);
  }
}

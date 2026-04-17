import {
  supabase,
  supabaseHonorListBucket,
  supabaseHonorListTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export interface HonorListRecord {
  key: 'current';
  file_path: string;
  created_at: string;
  updated_at: string;
}

const HONOR_LIST_KEY = 'current';
const HONOR_LIST_MIME_TYPES = ['application/pdf'];

function isMissingHonorListTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /honor_list|honou?r/i.test(error.message ?? '');
}

function getMissingTableMessage(): string {
  return 'Honor list backend is not initialized yet. Run the SQL setup script first.';
}

function validateHonorListFile(file: File): void {
  validateFile(file, {
    maxSizeInMb: 20,
    allowedMimeTypes: HONOR_LIST_MIME_TYPES,
    label: 'Honor list PDF'
  });
}

export async function getHonorListDocument(): Promise<HonorListRecord | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseHonorListTable)
    .select('*')
    .eq('key', HONOR_LIST_KEY)
    .maybeSingle();

  if (error) {
    if (isMissingHonorListTable(error)) {
      return null;
    }
    throw new Error(`Failed to load honor list: ${error.message}`);
  }

  return (data as HonorListRecord | null) ?? null;
}

export async function upsertHonorListDocument(
  file: File,
  options?: { existingFilePath?: string | null }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateHonorListFile(file);

  const target = parseStorageTarget(supabaseHonorListBucket, 'honor-list');
  const uploadedPath = await uploadFileToStorage(file, target, HONOR_LIST_KEY, 'honor-list');

  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseHonorListTable).upsert(
    {
      key: HONOR_LIST_KEY,
      file_path: uploadedPath,
      updated_at: now
    },
    { onConflict: 'key' }
  );

  if (error) {
    await deleteStorageFile(target.bucket, uploadedPath);
    if (isMissingHonorListTable(error)) {
      throw new Error(getMissingTableMessage());
    }
    throw new Error(`Failed to save honor list: ${error.message}`);
  }

  if (options?.existingFilePath) {
    await deleteStorageFile(target.bucket, options.existingFilePath);
  }
}

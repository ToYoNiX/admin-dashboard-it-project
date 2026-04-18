import {
  supabase,
  supabaseHonorListResourcesTable,
  supabaseResourcesFilesBucket
} from '../lib/supabase';
import {
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export interface HonorListResourceRecord {
  id: string;
  title: string;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface HonorListResourceInput {
  title: string;
}

const FILE_MIME_TYPES = ['application/pdf'];

function assertInput(input: HonorListResourceInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }
}

function validateHonorListFile(file: File): void {
  validateFile(file, {
    maxSizeInMb: 20,
    allowedMimeTypes: FILE_MIME_TYPES,
    label: 'Honor list PDF'
  });
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /honor_list_resources/i.test(error.message ?? '');
}

async function uploadHonorListFile(file: File, recordId: string): Promise<string> {
  const target = parseStorageTarget(supabaseResourcesFilesBucket, 'honor-list-resources');
  return uploadFileToStorage(file, target, recordId, 'resource');
}

export async function listHonorListResources(): Promise<HonorListResourceRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseHonorListResourcesTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw new Error(`Failed to load honor list resources: ${error.message}`);
  }

  return (data ?? []) as HonorListResourceRecord[];
}

export async function createHonorListResource(input: HonorListResourceInput, file: File): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertInput(input);
  validateHonorListFile(file);

  const id = crypto.randomUUID();
  const filePath = await uploadHonorListFile(file, id);
  const now = new Date().toISOString();

  const { error } = await supabase.from(supabaseHonorListResourcesTable).insert({
    id,
    title: input.title.trim(),
    file_path: filePath,
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingTable(error)) {
      throw new Error('Honor List backend is not initialized yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to create honor list resource: ${error.message}`);
  }
}

export async function deleteHonorListResource(record: HonorListResourceRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseResourcesFilesBucket, 'honor-list-resources');
  await deleteStorageFileSafely(target.bucket, record.file_path);

  const { error } = await supabase
    .from(supabaseHonorListResourcesTable)
    .delete()
    .eq('id', record.id);

  if (error) {
    throw new Error(`Failed to delete honor list resource: ${error.message}`);
  }
}

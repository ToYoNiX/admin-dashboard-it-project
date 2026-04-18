import {
  supabase,
  supabaseAcademicAdvisingTable,
  supabaseResourcesFilesBucket
} from '../lib/supabase';
import {
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export interface AcademicAdvisingRecord {
  id: string;
  title: string;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicAdvisingInput {
  title: string;
}

const FILE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

function assertInput(input: AcademicAdvisingInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }
}

function validateAdvisingFile(file: File): void {
  validateFile(file, {
    maxSizeInMb: 25,
    allowedMimeTypes: FILE_MIME_TYPES,
    label: 'Academic advising file'
  });
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /academic_advising/i.test(error.message ?? '');
}

async function uploadAdvisingFile(file: File, recordId: string): Promise<string> {
  const target = parseStorageTarget(supabaseResourcesFilesBucket, 'academic-advising');
  return uploadFileToStorage(file, target, recordId, 'resource');
}

export async function listAcademicAdvisingRecords(): Promise<AcademicAdvisingRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseAcademicAdvisingTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw new Error(`Failed to load academic advising records: ${error.message}`);
  }

  return (data ?? []) as AcademicAdvisingRecord[];
}

export async function createAcademicAdvisingRecord(
  input: AcademicAdvisingInput,
  file: File
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertInput(input);

  if (!file) {
    throw new Error('Please attach a file.');
  }

  validateAdvisingFile(file);

  const id = crypto.randomUUID();
  const filePath = await uploadAdvisingFile(file, id);
  const now = new Date().toISOString();

  const { error } = await supabase.from(supabaseAcademicAdvisingTable).insert({
    id,
    title: input.title.trim(),
    file_path: filePath,
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingTable(error)) {
      throw new Error('Academic advising backend is not initialized yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to create academic advising record: ${error.message}`);
  }
}

export async function deleteAcademicAdvisingRecord(record: AcademicAdvisingRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseResourcesFilesBucket, 'academic-advising');
  await deleteStorageFileSafely(target.bucket, record.file_path);

  const { error } = await supabase
    .from(supabaseAcademicAdvisingTable)
    .delete()
    .eq('id', record.id);

  if (error) {
    throw new Error(`Failed to delete academic advising record: ${error.message}`);
  }
}

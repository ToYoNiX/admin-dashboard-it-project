import {
  supabase,
  supabaseRegistrationVideosTable,
  supabaseResourcesFilesBucket
} from '../lib/supabase';
import {
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export const registrationVideoSourceTypes = ['video', 'link', 'file'] as const;
export type RegistrationVideoSourceType = (typeof registrationVideoSourceTypes)[number];
export type RegistrationVideoStoredSourceType = RegistrationVideoSourceType | 'youtube' | 'upload';

export interface RegistrationVideoRecord {
  id: string;
  title: string;
  source_type: RegistrationVideoStoredSourceType;
  youtube_url: string | null;
  video_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationVideoInput {
  title: string;
  sourceType: RegistrationVideoSourceType;
  sourceUrl: string;
}

const VIDEO_FILE_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const DOCUMENT_FILE_MIME_TYPES = ['application/pdf'];

function assertInput(input: RegistrationVideoInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }

  if (!registrationVideoSourceTypes.includes(input.sourceType)) {
    throw new Error('Please select a valid source type.');
  }

  if (input.sourceType === 'link' && !/^https?:\/\//i.test(input.sourceUrl.trim())) {
    throw new Error('Please enter a valid source link.');
  }
}

function validateVideoFile(file: File): void {
  validateFile(file, {
    maxSizeInMb: 150,
    allowedMimeTypes: VIDEO_FILE_MIME_TYPES,
    label: 'Registration video file'
  });
}

function validateDocumentFile(file: File): void {
  validateFile(file, {
    maxSizeInMb: 150,
    allowedMimeTypes: DOCUMENT_FILE_MIME_TYPES,
    label: 'Registration document file'
  });
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /registration_videos/i.test(error.message ?? '');
}

async function uploadRegistrationSource(file: File, recordId: string): Promise<string> {
  const target = parseStorageTarget(supabaseResourcesFilesBucket, 'registration-videos');
  return uploadFileToStorage(file, target, recordId, 'source');
}

export async function listRegistrationVideos(): Promise<RegistrationVideoRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseRegistrationVideosTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw new Error(`Failed to load registration videos: ${error.message}`);
  }

  return (data ?? []) as RegistrationVideoRecord[];
}

export async function createRegistrationVideo(
  input: RegistrationVideoInput,
  sourceFile?: File | null
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertInput(input);

  const id = crypto.randomUUID();
  let videoPath: string | null = null;
  let sourceUrl: string | null = null;

  if (input.sourceType === 'video') {
    if (!sourceFile) {
      throw new Error('Please upload a video file.');
    }
    validateVideoFile(sourceFile);
    videoPath = await uploadRegistrationSource(sourceFile, id);
  } else if (input.sourceType === 'file') {
    if (!sourceFile) {
      throw new Error('Please upload a file.');
    }
    validateDocumentFile(sourceFile);
    videoPath = await uploadRegistrationSource(sourceFile, id);
  } else {
    sourceUrl = input.sourceUrl.trim();
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseRegistrationVideosTable).insert({
    id,
    title: input.title.trim(),
    source_type: input.sourceType,
    youtube_url: sourceUrl,
    video_path: videoPath,
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingTable(error)) {
      throw new Error('Registration backend is not initialized yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to create registration video: ${error.message}`);
  }
}

export async function deleteRegistrationVideo(record: RegistrationVideoRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (record.video_path) {
    const target = parseStorageTarget(supabaseResourcesFilesBucket, 'registration-videos');
    await deleteStorageFileSafely(target.bucket, record.video_path);
  }

  const { error } = await supabase
    .from(supabaseRegistrationVideosTable)
    .delete()
    .eq('id', record.id);

  if (error) {
    throw new Error(`Failed to delete registration video: ${error.message}`);
  }
}

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

export const registrationVideoSourceTypes = ['youtube', 'upload'] as const;
export type RegistrationVideoSourceType = (typeof registrationVideoSourceTypes)[number];

export interface RegistrationVideoRecord {
  id: string;
  title: string;
  source_type: RegistrationVideoSourceType;
  youtube_url: string | null;
  video_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationVideoInput {
  title: string;
  sourceType: RegistrationVideoSourceType;
  youtubeUrl: string;
}

const SOURCE_FILE_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'application/pdf'];

function assertInput(input: RegistrationVideoInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }

  if (!registrationVideoSourceTypes.includes(input.sourceType)) {
    throw new Error('Please select a valid source type.');
  }

  if (input.sourceType === 'youtube' && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(input.youtubeUrl.trim())) {
    throw new Error('Please enter a valid YouTube link.');
  }
}

function validateSourceFile(file: File): void {
  validateFile(file, {
    maxSizeInMb: 150,
    allowedMimeTypes: SOURCE_FILE_MIME_TYPES,
    label: 'Registration source file'
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
  videoFile?: File | null
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertInput(input);

  const id = crypto.randomUUID();
  let videoPath: string | null = null;
  let youtubeUrl: string | null = null;

  if (input.sourceType === 'upload') {
    if (!videoFile) {
      throw new Error('Please upload a source file.');
    }
    validateSourceFile(videoFile);
    videoPath = await uploadRegistrationSource(videoFile, id);
  } else {
    youtubeUrl = input.youtubeUrl.trim();
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseRegistrationVideosTable).insert({
    id,
    title: input.title.trim(),
    source_type: input.sourceType,
    youtube_url: youtubeUrl,
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

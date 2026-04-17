import {
  supabase,
  supabaseResourcesFilesBucket,
  supabaseSmartELearningTable
} from '../lib/supabase';
import {
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export const smartELearningSourceTypes = ['youtube', 'upload'] as const;
export type SmartELearningSourceType = (typeof smartELearningSourceTypes)[number];

export interface SmartELearningRecord {
  id: string;
  title: string;
  source_type: SmartELearningSourceType;
  youtube_url: string | null;
  video_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmartELearningInput {
  title: string;
  sourceType: SmartELearningSourceType;
  youtubeUrl: string;
}

const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function assertInput(input: SmartELearningInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }

  if (!smartELearningSourceTypes.includes(input.sourceType)) {
    throw new Error('Please select a valid source type.');
  }

  if (input.sourceType === 'youtube' && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(input.youtubeUrl.trim())) {
    throw new Error('Please enter a valid YouTube link.');
  }
}

function validateVideoFile(file: File): void {
  validateFile(file, {
    maxSizeInMb: 150,
    allowedMimeTypes: VIDEO_MIME_TYPES,
    label: 'Smart E-Learning video'
  });
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /smart_elearning_videos/i.test(error.message ?? '');
}

async function uploadVideo(file: File, recordId: string): Promise<string> {
  const target = parseStorageTarget(supabaseResourcesFilesBucket, 'smart-elearning');
  return uploadFileToStorage(file, target, recordId, 'video');
}

export async function listSmartELearningVideos(): Promise<SmartELearningRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseSmartELearningTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw new Error(`Failed to load smart e-learning videos: ${error.message}`);
  }

  return (data ?? []) as SmartELearningRecord[];
}

export async function createSmartELearningVideo(input: SmartELearningInput, videoFile?: File | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertInput(input);

  const id = crypto.randomUUID();
  let videoPath: string | null = null;
  let youtubeUrl: string | null = null;

  if (input.sourceType === 'upload') {
    if (!videoFile) {
      throw new Error('Please upload a video file.');
    }
    validateVideoFile(videoFile);
    videoPath = await uploadVideo(videoFile, id);
  } else {
    youtubeUrl = input.youtubeUrl.trim();
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseSmartELearningTable).insert({
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
      throw new Error('Smart E-Learning backend is not initialized yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to create smart e-learning video: ${error.message}`);
  }
}

export async function deleteSmartELearningVideo(record: SmartELearningRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (record.video_path) {
    const target = parseStorageTarget(supabaseResourcesFilesBucket, 'smart-elearning');
    await deleteStorageFileSafely(target.bucket, record.video_path);
  }

  const { error } = await supabase
    .from(supabaseSmartELearningTable)
    .delete()
    .eq('id', record.id);

  if (error) {
    throw new Error(`Failed to delete smart e-learning video: ${error.message}`);
  }
}

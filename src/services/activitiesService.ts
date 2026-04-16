import {
  supabase,
  supabaseActivitiesTable,
  supabaseActivityImagesBucket
} from '../lib/supabase';
import {
  deleteStorageFile,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export const activityTypes = ['Sport', 'Cultural', 'Art', 'Student Club'] as const;
export type ActivityType = (typeof activityTypes)[number];

export interface ActivityRecord {
  id: string;
  title: string;
  description: string;
  activity_type: ActivityType;
  href: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityInput {
  title: string;
  description: string;
  activityType: ActivityType;
  href: string;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function assertActivityInput(input: ActivityInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }
  if (!input.description.trim()) {
    throw new Error('Description is required.');
  }
  if (!activityTypes.includes(input.activityType)) {
    throw new Error('Please choose a valid activity type.');
  }
  if (input.href && !/^https?:\/\//i.test(input.href)) {
    throw new Error('Link must be a valid URL starting with http:// or https://');
  }
}

export async function listActivities(): Promise<ActivityRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseActivitiesTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load activities: ${error.message}`);
  }

  return (data ?? []) as ActivityRecord[];
}

export async function createActivity(input: ActivityInput, imageFile?: File | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertActivityInput(input);

  const id = crypto.randomUUID();
  let imagePath: string | null = null;

  if (imageFile) {
    validateFile(imageFile, {
      maxSizeInMb: 5,
      allowedMimeTypes: IMAGE_MIME_TYPES,
      label: 'Image'
    });

    const target = parseStorageTarget(supabaseActivityImagesBucket, 'activities');
    imagePath = await uploadFileToStorage(imageFile, target, id, 'image');
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from(supabaseActivitiesTable).insert({
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    activity_type: input.activityType,
    href: input.href.trim() || null,
    image_url: imagePath,
    is_published: false,
    published_at: null,
    created_at: now,
    updated_at: now
  });

  if (error) {
    throw new Error(`Failed to create activity: ${error.message}`);
  }
}

export async function updateActivity(
  id: string,
  input: ActivityInput,
  options: {
    imageFile?: File | null;
    existingImagePath?: string | null;
    removeExistingImage?: boolean;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertActivityInput(input);

  const target = parseStorageTarget(supabaseActivityImagesBucket, 'activities');
  let nextImagePath = options.existingImagePath ?? null;

  if (options.imageFile) {
    validateFile(options.imageFile, {
      maxSizeInMb: 5,
      allowedMimeTypes: IMAGE_MIME_TYPES,
      label: 'Image'
    });

    nextImagePath = await uploadFileToStorage(options.imageFile, target, id, 'image');

    if (options.existingImagePath) {
      await deleteStorageFile(target.bucket, options.existingImagePath);
    }
  } else if (options.removeExistingImage && options.existingImagePath) {
    await deleteStorageFile(target.bucket, options.existingImagePath);
    nextImagePath = null;
  }

  const { error } = await supabase
    .from(supabaseActivitiesTable)
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      activity_type: input.activityType,
      href: input.href.trim() || null,
      image_url: nextImagePath,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update activity: ${error.message}`);
  }
}

export async function deleteActivity(id: string, imagePath?: string | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseActivityImagesBucket, 'activities');

  if (imagePath) {
    await deleteStorageFile(target.bucket, imagePath);
  }

  const { error } = await supabase.from(supabaseActivitiesTable).delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete activity: ${error.message}`);
  }
}

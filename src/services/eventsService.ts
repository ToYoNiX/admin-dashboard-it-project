import {
  supabase,
  supabaseEventImagesBucket,
  supabaseEventsTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  day: string;
  month: string;
  time_range: string;
  location_name: string | null;
  href: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  title: string;
  description: string;
  day: string;
  month: string;
  timeRange: string;
  locationName: string;
  href: string;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function assertEventInput(input: EventInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }
  if (!input.description.trim()) {
    throw new Error('Description is required.');
  }
  if (!input.day.trim()) {
    throw new Error('Day is required.');
  }
  if (!input.month.trim()) {
    throw new Error('Month is required.');
  }
  if (!input.timeRange.trim()) {
    throw new Error('Time range is required.');
  }
  if (input.href.trim() && !input.locationName.trim()) {
    throw new Error('Location name is required when a map link is provided.');
  }
  if (input.locationName.trim() && !input.href.trim()) {
    throw new Error('Map link is required when a location name is provided.');
  }
  if (input.href && !/^https?:\/\//i.test(input.href)) {
    throw new Error('Link must be a valid URL starting with http:// or https://');
  }
}

export async function listEvents(): Promise<EventRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseEventsTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load events: ${error.message}`);
  }

  return (data ?? []) as EventRecord[];
}

export async function createEvent(input: EventInput, imageFile?: File | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertEventInput(input);

  const id = crypto.randomUUID();
  let imagePath: string | null = null;

  if (imageFile) {
    validateFile(imageFile, {
      maxSizeInMb: 5,
      allowedMimeTypes: IMAGE_MIME_TYPES,
      label: 'Image'
    });

    const target = parseStorageTarget(supabaseEventImagesBucket, 'events');
    imagePath = await uploadFileToStorage(imageFile, target, id, 'image');
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from(supabaseEventsTable).insert({
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    day: input.day.trim(),
    month: input.month.trim(),
    time_range: input.timeRange.trim(),
    location_name: input.locationName.trim() || null,
    href: input.href.trim() || null,
    image_url: imagePath,
    is_published: false,
    published_at: null,
    created_at: now,
    updated_at: now
  });

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }
}

export async function updateEvent(
  id: string,
  input: EventInput,
  options: {
    imageFile?: File | null;
    existingImagePath?: string | null;
    removeExistingImage?: boolean;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertEventInput(input);

  const target = parseStorageTarget(supabaseEventImagesBucket, 'events');
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
    .from(supabaseEventsTable)
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      day: input.day.trim(),
      month: input.month.trim(),
      time_range: input.timeRange.trim(),
      location_name: input.locationName.trim() || null,
      href: input.href.trim() || null,
      image_url: nextImagePath,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`);
  }
}

export async function deleteEvent(id: string, imagePath?: string | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseEventImagesBucket, 'events');

  if (imagePath) {
    await deleteStorageFileSafely(target.bucket, imagePath);
  }

  const { error } = await supabase.from(supabaseEventsTable).delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }
}

import {
  supabase,
  supabaseNewsImagesBucket,
  supabaseNewsTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export interface NewsRecord {
  id: string;
  title: string;
  description: string;
  href: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsInput {
  title: string;
  description: string;
  href: string;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function assertNewsInput(input: NewsInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }
  if (!input.description.trim()) {
    throw new Error('Description is required.');
  }
  if (input.href && !/^https?:\/\//i.test(input.href)) {
    throw new Error('Link must be a valid URL starting with http:// or https://');
  }
}

export async function listNews(): Promise<NewsRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseNewsTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load news: ${error.message}`);
  }

  return (data ?? []) as NewsRecord[];
}

export async function createNews(input: NewsInput, imageFile?: File | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertNewsInput(input);

  const id = crypto.randomUUID();
  let imagePath: string | null = null;

  if (imageFile) {
    validateFile(imageFile, {
      maxSizeInMb: 5,
      allowedMimeTypes: IMAGE_MIME_TYPES,
      label: 'Image'
    });

    const target = parseStorageTarget(supabaseNewsImagesBucket, 'news');
    imagePath = await uploadFileToStorage(imageFile, target, id, 'image');
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from(supabaseNewsTable).insert({
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    href: input.href.trim() || null,
    image_url: imagePath,
    is_published: false,
    published_at: null,
    created_at: now,
    updated_at: now
  });

  if (error) {
    throw new Error(`Failed to create news item: ${error.message}`);
  }
}

export async function updateNews(
  id: string,
  input: NewsInput,
  options: {
    imageFile?: File | null;
    existingImagePath?: string | null;
    removeExistingImage?: boolean;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertNewsInput(input);

  const target = parseStorageTarget(supabaseNewsImagesBucket, 'news');
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
    .from(supabaseNewsTable)
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      href: input.href.trim() || null,
      image_url: nextImagePath,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update news item: ${error.message}`);
  }
}

export async function deleteNews(id: string, imagePath?: string | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseNewsImagesBucket, 'news');

  if (imagePath) {
    await deleteStorageFile(target.bucket, imagePath);
  }

  const { error } = await supabase.from(supabaseNewsTable).delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete news item: ${error.message}`);
  }
}

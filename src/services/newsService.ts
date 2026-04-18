import {
  supabase,
  supabaseNewsImagesBucket,
  supabaseNewsTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  deleteStorageFileSafely,
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
  image_urls: string[] | null;
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

function uniqueImagePaths(paths: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();

  return paths
    .map((path) => path?.trim() ?? '')
    .filter((path) => path.length > 0)
    .filter((path) => {
      if (seen.has(path)) {
        return false;
      }

      seen.add(path);
      return true;
    });
}

function getPrimaryImagePath(paths: string[]): string | null {
  return paths[0] ?? null;
}

function normalizeNewsRecord(record: Record<string, unknown>): NewsRecord {
  const arrayPaths = Array.isArray(record.image_urls)
    ? record.image_urls.filter((path): path is string => typeof path === 'string')
    : [];

  const singlePath = typeof record.image_url === 'string' ? record.image_url : null;
  const imagePaths = uniqueImagePaths([...arrayPaths, singlePath]);

  return {
    ...(record as NewsRecord),
    image_urls: imagePaths.length > 0 ? imagePaths : null,
    image_url: getPrimaryImagePath(imagePaths)
  };
}

function isMissingImageUrlsColumn(error: { code?: string; message?: string }): boolean {
  return error.code === '42703' && /image_urls/i.test(error.message ?? '');
}

function missingImageUrlsColumnMessage(): string {
  return 'The news table is missing the image_urls column. Run the latest SQL setup script to enable multi-image news support.';
}

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

  return (data ?? []).map((record) => normalizeNewsRecord(record as Record<string, unknown>));
}

export async function createNews(input: NewsInput, imageFiles?: File[] | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertNewsInput(input);

  const id = crypto.randomUUID();
  const imagePaths: string[] = [];
  const target = parseStorageTarget(supabaseNewsImagesBucket, 'news');

  for (const [index, imageFile] of (imageFiles ?? []).entries()) {
    validateFile(imageFile, {
      maxSizeInMb: 5,
      allowedMimeTypes: IMAGE_MIME_TYPES,
      label: `Image #${index + 1}`
    });

    const imagePath = await uploadFileToStorage(imageFile, target, id, `image-${index + 1}`);
    imagePaths.push(imagePath);
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from(supabaseNewsTable).insert({
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    href: input.href.trim() || null,
    image_url: getPrimaryImagePath(imagePaths),
    image_urls: imagePaths.length > 0 ? imagePaths : null,
    is_published: false,
    published_at: null,
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingImageUrlsColumn(error)) {
      throw new Error(missingImageUrlsColumnMessage());
    }
    throw new Error(`Failed to create news item: ${error.message}`);
  }
}

export async function updateNews(
  id: string,
  input: NewsInput,
  options: {
    imageFiles?: File[] | null;
    existingImagePaths?: string[] | null;
    removedImagePaths?: string[] | null;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertNewsInput(input);

  const target = parseStorageTarget(supabaseNewsImagesBucket, 'news');
  const existingImagePaths = uniqueImagePaths(options.existingImagePaths ?? []);
  const removedImagePaths = uniqueImagePaths(options.removedImagePaths ?? []);
  const removedSet = new Set(removedImagePaths);

  const retainedImagePaths = existingImagePaths.filter((path) => !removedSet.has(path));

  const uploadedImagePaths: string[] = [];
  for (const [index, imageFile] of (options.imageFiles ?? []).entries()) {
    validateFile(imageFile, {
      maxSizeInMb: 5,
      allowedMimeTypes: IMAGE_MIME_TYPES,
      label: `Image #${index + 1}`
    });

    const imagePath = await uploadFileToStorage(imageFile, target, id, `image-${index + 1}`);
    uploadedImagePaths.push(imagePath);
  }

  for (const path of removedImagePaths) {
    await deleteStorageFile(target.bucket, path);
  }

  const nextImagePaths = [...retainedImagePaths, ...uploadedImagePaths];

  const { error } = await supabase
    .from(supabaseNewsTable)
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      href: input.href.trim() || null,
      image_url: getPrimaryImagePath(nextImagePaths),
      image_urls: nextImagePaths.length > 0 ? nextImagePaths : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    if (isMissingImageUrlsColumn(error)) {
      throw new Error(missingImageUrlsColumnMessage());
    }
    throw new Error(`Failed to update news item: ${error.message}`);
  }
}

export async function deleteNews(id: string, imagePaths?: string[] | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseNewsImagesBucket, 'news');

  for (const path of uniqueImagePaths(imagePaths ?? [])) {
    await deleteStorageFileSafely(target.bucket, path);
  }

  const { error } = await supabase.from(supabaseNewsTable).delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete news item: ${error.message}`);
  }
}

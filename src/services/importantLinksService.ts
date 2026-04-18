import {
  supabase,
  supabaseImportantLinksImagesBucket,
  supabaseImportantLinksTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export interface ImportantLinkRecord {
  id: string;
  title: string;
  description: string;
  href: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportantLinkInput {
  title: string;
  description: string;
  href: string;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function isMissingImportantLinksTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /important_links/i.test(error.message ?? '');
}

function validateImportantLinkInput(input: ImportantLinkInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }
  if (!input.description.trim()) {
    throw new Error('Description is required.');
  }
  if (!/^https?:\/\//i.test(input.href.trim())) {
    throw new Error('Link must start with http:// or https://');
  }
}

export async function listImportantLinks(): Promise<ImportantLinkRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseImportantLinksTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingImportantLinksTable(error)) {
      return [];
    }
    throw new Error(`Failed to load important links: ${error.message}`);
  }

  return (data ?? []) as ImportantLinkRecord[];
}

export async function createImportantLink(input: ImportantLinkInput, imageFile: File | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateImportantLinkInput(input);

  const id = crypto.randomUUID();
  const imageTarget = parseStorageTarget(supabaseImportantLinksImagesBucket, 'important-links');
  let imagePath: string | null = null;

  try {
    if (imageFile) {
      validateFile(imageFile, {
        maxSizeInMb: 8,
        allowedMimeTypes: IMAGE_MIME_TYPES,
        label: 'Image'
      });
      imagePath = await uploadFileToStorage(imageFile, imageTarget, id, 'image');
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from(supabaseImportantLinksTable).insert({
      id,
      title: input.title.trim(),
      description: input.description.trim(),
      href: input.href.trim(),
      image_path: imagePath,
      created_at: now,
      updated_at: now
    });

    if (error) {
      throw new Error(`Failed to create important link: ${error.message}`);
    }
  } catch (error) {
    if (imagePath) {
      await deleteStorageFileSafely(imageTarget.bucket, imagePath);
    }
    throw error;
  }
}

export async function updateImportantLink(
  id: string,
  input: ImportantLinkInput,
  options: { imageFile?: File | null; existingRecord?: ImportantLinkRecord | null }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateImportantLinkInput(input);

  const imageTarget = parseStorageTarget(supabaseImportantLinksImagesBucket, 'important-links');
  let nextImagePath = options.existingRecord?.image_path ?? null;

  try {
    if (options.imageFile) {
      validateFile(options.imageFile, {
        maxSizeInMb: 8,
        allowedMimeTypes: IMAGE_MIME_TYPES,
        label: 'Image'
      });
      nextImagePath = await uploadFileToStorage(options.imageFile, imageTarget, id, 'image');
    }

    const { error } = await supabase
      .from(supabaseImportantLinksTable)
      .update({
        title: input.title.trim(),
        description: input.description.trim(),
        href: input.href.trim(),
        image_path: nextImagePath,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update important link: ${error.message}`);
    }

    if (options.imageFile && options.existingRecord?.image_path && options.existingRecord.image_path !== nextImagePath) {
      await deleteStorageFileSafely(imageTarget.bucket, options.existingRecord.image_path);
    }
  } catch (error) {
    if (options.imageFile && nextImagePath && nextImagePath !== options.existingRecord?.image_path) {
      await deleteStorageFileSafely(imageTarget.bucket, nextImagePath);
    }
    throw error;
  }
}

export async function deleteImportantLink(record: ImportantLinkRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from(supabaseImportantLinksTable).delete().eq('id', record.id);
  if (error) {
    throw new Error(`Failed to delete important link: ${error.message}`);
  }

  if (record.image_path) {
    const imageTarget = parseStorageTarget(supabaseImportantLinksImagesBucket, 'important-links');
    await deleteStorageFileSafely(imageTarget.bucket, record.image_path);
  }
}

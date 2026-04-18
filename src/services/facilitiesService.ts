import {
  supabase,
  supabaseFacilitiesImagesBucket,
  supabaseFacilitiesTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export type FacilitiesSectionType = 'must-facilities' | 'international-students-handbook';

export interface FacilitiesRecord {
  id: string;
  section_type: FacilitiesSectionType;
  title: string;
  content_html: string;
  thumbnail_path: string | null;
  gallery_paths: string[];
  created_at: string;
  updated_at: string;
}

export interface FacilitiesInput {
  title: string;
  contentHtml: string;
}

interface UpdateFacilitiesOptions {
  existingRecord: FacilitiesRecord;
  retainedGalleryPaths: string[];
  thumbnailFile?: File | null;
  galleryFiles?: File[];
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function isMissingFacilitiesTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /facilit/i.test(error.message ?? '');
}

function getMissingFacilitiesMessage(): string {
  return 'Facilities backend is not initialized yet. Run the SQL setup script first.';
}

function validateImageFile(file: File, label: string): void {
  validateFile(file, {
    maxSizeInMb: 8,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    label
  });
}

async function uploadGalleryFiles(sectionType: FacilitiesSectionType, recordId: string, galleryFiles: File[]): Promise<string[]> {
  if (galleryFiles.length === 0) {
    return [];
  }

  const target = parseStorageTarget(supabaseFacilitiesImagesBucket, 'facilities');
  const uploadedPaths: string[] = [];

  try {
    for (const [index, file] of galleryFiles.entries()) {
      validateImageFile(file, `Gallery image ${index + 1}`);
      const uploadedPath = await uploadFileToStorage(file, target, recordId, `gallery-${sectionType}-${index + 1}`);
      uploadedPaths.push(uploadedPath);
    }
  } catch (error) {
    await Promise.all(uploadedPaths.map((path) => deleteStorageFileSafely(target.bucket, path)));
    throw error;
  }

  return uploadedPaths;
}

export async function listFacilitiesSections(sectionType: FacilitiesSectionType): Promise<FacilitiesRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseFacilitiesTable)
    .select('*')
    .eq('section_type', sectionType)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingFacilitiesTable(error)) {
      return [];
    }
    throw new Error(`Failed to load facilities content: ${error.message}`);
  }

  return ((data ?? []) as FacilitiesRecord[]).map((record) => ({
    ...record,
    gallery_paths: Array.isArray(record.gallery_paths) ? record.gallery_paths : []
  }));
}

export async function createFacilitiesSection(
  sectionType: FacilitiesSectionType,
  input: FacilitiesInput,
  thumbnailFile: File | null,
  galleryFiles: File[]
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const id = crypto.randomUUID();
  const target = parseStorageTarget(supabaseFacilitiesImagesBucket, 'facilities');

  let thumbnailPath: string | null = null;
  let uploadedGalleryPaths: string[] = [];

  try {
    if (thumbnailFile) {
      validateImageFile(thumbnailFile, 'Thumbnail image');
      thumbnailPath = await uploadFileToStorage(thumbnailFile, target, id, `thumbnail-${sectionType}`);
    }

    uploadedGalleryPaths = await uploadGalleryFiles(sectionType, id, galleryFiles);

    const now = new Date().toISOString();
    const { error } = await supabase.from(supabaseFacilitiesTable).insert({
      id,
      section_type: sectionType,
      title: input.title.trim(),
      content_html: input.contentHtml,
      thumbnail_path: thumbnailPath,
      gallery_paths: uploadedGalleryPaths,
      created_at: now,
      updated_at: now
    });

    if (error) {
      if (isMissingFacilitiesTable(error)) {
        throw new Error(getMissingFacilitiesMessage());
      }
      throw new Error(`Failed to save facilities content: ${error.message}`);
    }
  } catch (error) {
    if (thumbnailPath) {
      await deleteStorageFileSafely(target.bucket, thumbnailPath);
    }
    await Promise.all(uploadedGalleryPaths.map((path) => deleteStorageFileSafely(target.bucket, path)));
    throw error;
  }
}

export async function updateFacilitiesSection(
  id: string,
  input: FacilitiesInput,
  options: UpdateFacilitiesOptions
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseFacilitiesImagesBucket, 'facilities');
  const nextGalleryPaths = [...options.retainedGalleryPaths];
  const uploadedGalleryPaths = await uploadGalleryFiles(options.existingRecord.section_type, id, options.galleryFiles ?? []);
  nextGalleryPaths.push(...uploadedGalleryPaths);

  let nextThumbnailPath = options.existingRecord.thumbnail_path;
  let replacedThumbnailPath: string | null = null;

  try {
    if (options.thumbnailFile) {
      validateImageFile(options.thumbnailFile, 'Thumbnail image');
      nextThumbnailPath = await uploadFileToStorage(
        options.thumbnailFile,
        target,
        id,
        `thumbnail-${options.existingRecord.section_type}`
      );
      replacedThumbnailPath = options.existingRecord.thumbnail_path;
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from(supabaseFacilitiesTable)
      .update({
        title: input.title.trim(),
        content_html: input.contentHtml,
        thumbnail_path: nextThumbnailPath,
        gallery_paths: nextGalleryPaths,
        updated_at: now
      })
      .eq('id', id);

    if (error) {
      if (isMissingFacilitiesTable(error)) {
        throw new Error(getMissingFacilitiesMessage());
      }
      throw new Error(`Failed to update facilities content: ${error.message}`);
    }

    const removedPaths = options.existingRecord.gallery_paths.filter((path) => !options.retainedGalleryPaths.includes(path));
    await Promise.all(removedPaths.map((path) => deleteStorageFileSafely(target.bucket, path)));

    if (replacedThumbnailPath) {
      await deleteStorageFileSafely(target.bucket, replacedThumbnailPath);
    }
  } catch (error) {
    if (nextThumbnailPath && nextThumbnailPath !== options.existingRecord.thumbnail_path) {
      await deleteStorageFileSafely(target.bucket, nextThumbnailPath);
    }
    await Promise.all(uploadedGalleryPaths.map((path) => deleteStorageFileSafely(target.bucket, path)));
    throw error;
  }
}

export async function deleteFacilitiesSection(record: FacilitiesRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from(supabaseFacilitiesTable).delete().eq('id', record.id);

  if (error) {
    throw new Error(`Failed to delete facilities content: ${error.message}`);
  }

  const target = parseStorageTarget(supabaseFacilitiesImagesBucket, 'facilities');
  if (record.thumbnail_path) {
    await deleteStorageFileSafely(target.bucket, record.thumbnail_path);
  }
  await Promise.all(record.gallery_paths.map((path) => deleteStorageFileSafely(target.bucket, path)));
}

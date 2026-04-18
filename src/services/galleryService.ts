import {
  supabase,
  supabaseGalleryImagesBucket,
  supabaseGalleryTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export interface GalleryPhotoRecord {
  id: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function isMissingGalleryTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /gallery|photo_gallery/i.test(error.message ?? '');
}

export async function listGalleryPhotos(): Promise<GalleryPhotoRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseGalleryTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingGalleryTable(error)) {
      return [];
    }
    throw new Error(`Failed to load gallery photos: ${error.message}`);
  }

  return (data ?? []) as GalleryPhotoRecord[];
}

export async function uploadGalleryPhoto(imageFile: File): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateFile(imageFile, {
    maxSizeInMb: 8,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    label: 'Photo'
  });

  const id = crypto.randomUUID();
  const target = parseStorageTarget(supabaseGalleryImagesBucket, 'gallery');
  const imagePath = await uploadFileToStorage(imageFile, target, id, 'image');

  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseGalleryTable).insert({
    id,
    image_url: imagePath,
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingGalleryTable(error)) {
      throw new Error('Gallery backend is not initialized yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to upload photo: ${error.message}`);
  }
}

export async function deleteGalleryPhoto(record: GalleryPhotoRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseGalleryImagesBucket, 'gallery');

  if (record.image_url) {
    await deleteStorageFileSafely(target.bucket, record.image_url);
  }

  const { error } = await supabase.from(supabaseGalleryTable).delete().eq('id', record.id);

  if (error) {
    throw new Error(`Failed to delete photo: ${error.message}`);
  }
}

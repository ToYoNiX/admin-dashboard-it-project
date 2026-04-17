import {
  supabase,
  supabaseCvBucket,
  supabaseImageBucket,
  supabaseStaffTable
} from '../lib/supabase';
import { deleteStorageFile } from './storageUtils';

export interface StaffPayload {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  speciality: string;
  googleScholarLink: string;
  displayOrder: number;
}

export interface StaffRecord {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  email: string | null;
  department: string;
  position: string | null;
  speciality: string;
  google_scholar_link: string | null;
  display_order: number;
  cv_path: string | null;
  image_path: string;
  created_at: string;
  updated_at: string | null;
}

export const staffRanks = [
  'Professors',
  'Assistant Professors',
  'Lecturers',
  'Assistant Lecturers',
  'Teaching Assistants'
] as const;

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '-');

interface StorageTarget {
  bucket: string;
  folder: string;
}

function parseStorageTarget(rawValue: string, fallbackFolder: string): StorageTarget {
  const cleaned = rawValue.trim().replace(/^\/+|\/+$/g, '');
  const [bucket, ...folderParts] = cleaned.split('/').filter(Boolean);

  if (!bucket) {
    throw new Error('Storage bucket is not configured.');
  }

  return {
    bucket,
    folder: folderParts.length > 0 ? folderParts.join('/') : fallbackFolder
  };
}

async function uploadStaffFile(file: File, target: StorageTarget): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const filePath = `${target.folder}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from(target.bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) {
    throw new Error(`Failed to upload file to ${target.bucket}/${target.folder}: ${error.message}`);
  }

  return filePath;
}

export async function createStaffProfile(
  payload: StaffPayload,
  cvFile: File | null,
  staffImage: File
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cvTarget = parseStorageTarget(supabaseCvBucket, 'cv');
  const imageTarget = parseStorageTarget(supabaseImageBucket, 'images');

  const cvPath = cvFile ? await uploadStaffFile(cvFile, cvTarget) : null;
  const imagePath = await uploadStaffFile(staffImage, imageTarget);

  const { error } = await supabase.from(supabaseStaffTable).insert({
    title: payload.title,
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email.trim().toLowerCase(),
    department: payload.department,
    position: payload.position.trim() || null,
    speciality: payload.speciality,
    google_scholar_link: payload.googleScholarLink || null,
    display_order: payload.displayOrder,
    cv_path: cvPath,
    image_path: imagePath,
    created_at: new Date().toISOString()
  });

  if (error) {
    throw new Error(`Failed to create staff profile: ${error.message}`);
  }
}

export async function listStaffProfiles(): Promise<StaffRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseStaffTable)
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load staff profiles: ${error.message}`);
  }

  return (data ?? []) as StaffRecord[];
}

export async function updateStaffProfile(
  id: string,
  payload: StaffPayload,
  options: {
    cvFile?: File | null;
    staffImage?: File | null;
    existingCvPath: string | null;
    existingImagePath: string;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cvTarget = parseStorageTarget(supabaseCvBucket, 'cv');
  const imageTarget = parseStorageTarget(supabaseImageBucket, 'images');

  let nextCvPath = options.existingCvPath;
  let nextImagePath = options.existingImagePath;

  if (options.cvFile) {
    nextCvPath = await uploadStaffFile(options.cvFile, cvTarget);
    if (options.existingCvPath) {
      await deleteStorageFile(cvTarget.bucket, options.existingCvPath);
    }
  }

  if (options.staffImage) {
    nextImagePath = await uploadStaffFile(options.staffImage, imageTarget);
    await deleteStorageFile(imageTarget.bucket, options.existingImagePath);
  }

  const { error } = await supabase
    .from(supabaseStaffTable)
    .update({
      title: payload.title,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email.trim().toLowerCase(),
      department: payload.department,
      position: payload.position.trim() || null,
      speciality: payload.speciality,
      google_scholar_link: payload.googleScholarLink || null,
      display_order: payload.displayOrder,
      cv_path: nextCvPath,
      image_path: nextImagePath,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update staff profile: ${error.message}`);
  }
}

export async function reorderStaffProfiles(records: Array<Pick<StaffRecord, 'id' | 'display_order'>>): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  await Promise.all(
    records.map((record) =>
      supabase
        .from(supabaseStaffTable)
        .update({
          display_order: record.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)
    )
  ).then((results) => {
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      throw new Error(`Failed to reorder staff profiles: ${failed.error.message}`);
    }
  });
}

export async function deleteStaffProfile(record: StaffRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cvTarget = parseStorageTarget(supabaseCvBucket, 'cv');
  const imageTarget = parseStorageTarget(supabaseImageBucket, 'images');

  if (record.cv_path) {
    await deleteStorageFile(cvTarget.bucket, record.cv_path);
  }

  if (record.image_path) {
    await deleteStorageFile(imageTarget.bucket, record.image_path);
  }

  const { error } = await supabase.from(supabaseStaffTable).delete().eq('id', record.id);

  if (error) {
    throw new Error(`Failed to delete staff profile: ${error.message}`);
  }
}

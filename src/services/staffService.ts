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
  department: string;
  position: string;
  speciality: string;
  googleScholarLink: string;
}

export interface StaffRecord {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  department: string;
  position: string;
  speciality: string;
  google_scholar_link: string | null;
  cv_path: string;
  image_path: string;
  created_at: string;
  updated_at: string | null;
}

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
  cvFile: File,
  staffImage: File
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cvTarget = parseStorageTarget(supabaseCvBucket, 'cv');
  const imageTarget = parseStorageTarget(supabaseImageBucket, 'images');

  const cvPath = await uploadStaffFile(cvFile, cvTarget);
  const imagePath = await uploadStaffFile(staffImage, imageTarget);

  const { error } = await supabase.from(supabaseStaffTable).insert({
    title: payload.title,
    first_name: payload.firstName,
    last_name: payload.lastName,
    department: payload.department,
    position: payload.position,
    speciality: payload.speciality,
    google_scholar_link: payload.googleScholarLink || null,
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
    existingCvPath: string;
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
    await deleteStorageFile(cvTarget.bucket, options.existingCvPath);
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
      department: payload.department,
      position: payload.position,
      speciality: payload.speciality,
      google_scholar_link: payload.googleScholarLink || null,
      cv_path: nextCvPath,
      image_path: nextImagePath,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update staff profile: ${error.message}`);
  }
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

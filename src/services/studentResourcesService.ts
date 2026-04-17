import {
  supabase,
  supabaseResourcesFilesBucket,
  supabaseStudentResourcesTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export const studentResourceTypes = ['file', 'video', 'link'] as const;
export type StudentResourceType = (typeof studentResourceTypes)[number];

export const studentResourceCategories = [
  'Registration Guide',
  'Facilities Resource',
  'Other / Untagged'
] as const;
export type StudentResourceCategory = (typeof studentResourceCategories)[number];

export interface StudentResourceRecord {
  id: string;
  title: string;
  description: string | null;
  resource_type: StudentResourceType;
  category: StudentResourceCategory;
  resource_url: string | null;
  file_path: string | null;
  duration: string | null;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentResourceInput {
  title: string;
  description: string;
  category: StudentResourceCategory;
  resourceType: StudentResourceType;
  resourceUrl: string;
  duration: string;
}

const FILE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/plain',
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

const THUMBNAIL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function assertInput(input: StudentResourceInput): void {
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }

  if (!studentResourceCategories.includes(input.category)) {
    throw new Error('Please select a valid category.');
  }

  if (!studentResourceTypes.includes(input.resourceType)) {
    throw new Error('Please select a valid resource type.');
  }

  if (input.resourceType !== 'file' && !/^https?:\/\//i.test(input.resourceUrl.trim())) {
    throw new Error('Please provide a valid URL starting with http:// or https://');
  }
}

function validateResourceFile(file: File): void {
  validateFile(file, {
    maxSizeInMb: 100,
    allowedMimeTypes: FILE_MIME_TYPES,
    label: 'Resource file'
  });
}

function validateThumbnailFile(file: File): void {
  validateFile(file, {
    maxSizeInMb: 8,
    allowedMimeTypes: THUMBNAIL_MIME_TYPES,
    label: 'Thumbnail image'
  });
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /student_resources/i.test(error.message ?? '');
}

async function uploadResourceFile(file: File, recordId: string): Promise<string> {
  const target = parseStorageTarget(supabaseResourcesFilesBucket, 'resources');
  return uploadFileToStorage(file, target, recordId, 'resource');
}

export async function listStudentResources(): Promise<StudentResourceRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseStudentResourcesTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw new Error(`Failed to load student resources: ${error.message}`);
  }

  return (data ?? []) as StudentResourceRecord[];
}

export async function createStudentResource(
  input: StudentResourceInput,
  file?: File | null,
  thumbnailFile?: File | null
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertInput(input);

  if (input.resourceType === 'file' && !file) {
    throw new Error('Please attach a file resource.');
  }

  const id = crypto.randomUUID();
  let filePath: string | null = null;
  let thumbnailPath: string | null = null;
  let resourceUrl: string | null = null;

  if (input.resourceType === 'file' && file) {
    validateResourceFile(file);
    filePath = await uploadResourceFile(file, id);
  } else {
    resourceUrl = input.resourceUrl.trim();

    if (input.resourceType === 'video' && thumbnailFile) {
      validateThumbnailFile(thumbnailFile);
      const target = parseStorageTarget(supabaseResourcesFilesBucket, 'resources');
      thumbnailPath = await uploadFileToStorage(thumbnailFile, target, id, 'thumbnail');
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseStudentResourcesTable).insert({
    id,
    title: input.title.trim(),
    description: input.description.trim() || null,
    category: input.category,
    resource_type: input.resourceType,
    resource_url: resourceUrl,
    file_path: filePath,
    duration: input.resourceType === 'video' ? input.duration.trim() || null : null,
    thumbnail_path: thumbnailPath,
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingTable(error)) {
      throw new Error('Student resources backend is not initialized yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to create student resource: ${error.message}`);
  }
}

export async function updateStudentResource(
  id: string,
  input: StudentResourceInput,
  options: {
    file?: File | null;
    thumbnailFile?: File | null;
    existingRecord: StudentResourceRecord;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  assertInput(input);

  const target = parseStorageTarget(supabaseResourcesFilesBucket, 'resources');
  let nextFilePath: string | null = options.existingRecord.file_path;
  let nextResourceUrl: string | null = options.existingRecord.resource_url;
  let nextThumbnailPath: string | null = options.existingRecord.thumbnail_path;

  if (input.resourceType === 'file') {
    if (options.file) {
      validateResourceFile(options.file);
      nextFilePath = await uploadFileToStorage(options.file, target, id, 'resource');
      if (options.existingRecord.file_path) {
        await deleteStorageFile(target.bucket, options.existingRecord.file_path);
      }
    }

    if (!nextFilePath) {
      throw new Error('Please attach a file resource.');
    }

    nextResourceUrl = null;
    if (nextThumbnailPath) {
      await deleteStorageFile(target.bucket, nextThumbnailPath);
      nextThumbnailPath = null;
    }
  } else {
    if (options.existingRecord.file_path) {
      await deleteStorageFile(target.bucket, options.existingRecord.file_path);
    }
    nextFilePath = null;
    nextResourceUrl = input.resourceUrl.trim();

    if (input.resourceType === 'video') {
      if (options.thumbnailFile) {
        validateThumbnailFile(options.thumbnailFile);
        const uploadedThumbnailPath = await uploadFileToStorage(options.thumbnailFile, target, id, 'thumbnail');

        if (nextThumbnailPath) {
          await deleteStorageFile(target.bucket, nextThumbnailPath);
        }

        nextThumbnailPath = uploadedThumbnailPath;
      }
    } else if (nextThumbnailPath) {
      await deleteStorageFile(target.bucket, nextThumbnailPath);
      nextThumbnailPath = null;
    }
  }

  const { error } = await supabase
    .from(supabaseStudentResourcesTable)
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      category: input.category,
      resource_type: input.resourceType,
      resource_url: nextResourceUrl,
      file_path: nextFilePath,
      duration: input.resourceType === 'video' ? input.duration.trim() || null : null,
      thumbnail_path: nextThumbnailPath,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update student resource: ${error.message}`);
  }
}

export async function deleteStudentResource(record: StudentResourceRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseResourcesFilesBucket, 'resources');

  if (record.file_path) {
    await deleteStorageFile(target.bucket, record.file_path);
  }

  if (record.thumbnail_path) {
    await deleteStorageFile(target.bucket, record.thumbnail_path);
  }

  const { error } = await supabase.from(supabaseStudentResourcesTable).delete().eq('id', record.id);

  if (error) {
    throw new Error(`Failed to delete student resource: ${error.message}`);
  }
}

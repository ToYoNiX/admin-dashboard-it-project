import {
  supabase,
  supabaseHomeFilesBucket,
  supabaseHomeImagesBucket,
  supabaseHomeSectionsTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export type HomeSectionKey = 'about-sector' | 'mission' | 'vision' | 'sector-plan';

export interface HomeSectionRecord {
  section_key: HomeSectionKey;
  title: string | null;
  content_text: string | null;
  image_path: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomeSectionInput {
  title?: string;
  contentText?: string;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PDF_MIME_TYPES = ['application/pdf'];

function isMissingHomeSectionsTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /home_sections/i.test(error.message ?? '');
}

function getSetupMessage(): string {
  return 'Home sections backend is not initialized yet. Run the SQL setup script first.';
}

export async function getHomeSection(sectionKey: HomeSectionKey): Promise<HomeSectionRecord | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseHomeSectionsTable)
    .select('*')
    .eq('section_key', sectionKey)
    .maybeSingle();

  if (error) {
    if (isMissingHomeSectionsTable(error)) {
      return null;
    }
    throw new Error(`Failed to load home section: ${error.message}`);
  }

  return (data as HomeSectionRecord | null) ?? null;
}

export async function upsertHomeTextImageSection(
  sectionKey: Extract<HomeSectionKey, 'about-sector' | 'mission' | 'vision'>,
  input: HomeSectionInput,
  options?: { imageFile?: File | null; existingRecord?: HomeSectionRecord | null }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const imageTarget = parseStorageTarget(supabaseHomeImagesBucket, 'home');
  let nextImagePath = options?.existingRecord?.image_path ?? null;

  try {
    if (options?.imageFile) {
      validateFile(options.imageFile, {
        maxSizeInMb: 8,
        allowedMimeTypes: IMAGE_MIME_TYPES,
        label: 'Image'
      });
      nextImagePath = await uploadFileToStorage(options.imageFile, imageTarget, sectionKey, 'image');
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from(supabaseHomeSectionsTable).upsert(
      {
        section_key: sectionKey,
        title: null,
        content_text: input.contentText?.trim() ?? '',
        image_path: nextImagePath,
        file_path: null,
        updated_at: now
      },
      { onConflict: 'section_key' }
    );

    if (error) {
      if (isMissingHomeSectionsTable(error)) {
        throw new Error(getSetupMessage());
      }
      throw new Error(`Failed to save home section: ${error.message}`);
    }

    if (options?.imageFile && options.existingRecord?.image_path && options.existingRecord.image_path !== nextImagePath) {
      await deleteStorageFileSafely(imageTarget.bucket, options.existingRecord.image_path);
    }
  } catch (error) {
    if (options?.imageFile && nextImagePath && nextImagePath !== options?.existingRecord?.image_path) {
      await deleteStorageFileSafely(imageTarget.bucket, nextImagePath);
    }
    throw error;
  }
}

export async function upsertHomeDocumentSection(
  input: HomeSectionInput,
  options?: { pdfFile?: File | null; existingRecord?: HomeSectionRecord | null }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const fileTarget = parseStorageTarget(supabaseHomeFilesBucket, 'home');
  let nextFilePath = options?.existingRecord?.file_path ?? null;

  try {
    if (options?.pdfFile) {
      validateFile(options.pdfFile, {
        maxSizeInMb: 20,
        allowedMimeTypes: PDF_MIME_TYPES,
        label: 'PDF'
      });
      nextFilePath = await uploadFileToStorage(options.pdfFile, fileTarget, 'sector-plan', 'pdf');
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from(supabaseHomeSectionsTable).upsert(
      {
        section_key: 'sector-plan',
        title: input.title?.trim() ?? '',
        content_text: null,
        image_path: null,
        file_path: nextFilePath,
        updated_at: now
      },
      { onConflict: 'section_key' }
    );

    if (error) {
      if (isMissingHomeSectionsTable(error)) {
        throw new Error(getSetupMessage());
      }
      throw new Error(`Failed to save sector plan: ${error.message}`);
    }

    if (options?.pdfFile && options.existingRecord?.file_path && options.existingRecord.file_path !== nextFilePath) {
      await deleteStorageFileSafely(fileTarget.bucket, options.existingRecord.file_path);
    }
  } catch (error) {
    if (options?.pdfFile && nextFilePath && nextFilePath !== options?.existingRecord?.file_path) {
      await deleteStorageFileSafely(fileTarget.bucket, nextFilePath);
    }
    throw error;
  }
}

export async function deleteHomeSection(record: HomeSectionRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from(supabaseHomeSectionsTable).delete().eq('section_key', record.section_key);
  if (error) {
    throw new Error(`Failed to delete home section: ${error.message}`);
  }

  if (record.image_path) {
    const imageTarget = parseStorageTarget(supabaseHomeImagesBucket, 'home');
    await deleteStorageFileSafely(imageTarget.bucket, record.image_path);
  }

  if (record.file_path) {
    const fileTarget = parseStorageTarget(supabaseHomeFilesBucket, 'home');
    await deleteStorageFileSafely(fileTarget.bucket, record.file_path);
  }
}

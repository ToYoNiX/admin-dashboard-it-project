import {
  supabase,
  supabaseAdmissionFilesBucket,
  supabaseAdmissionTable
} from '../lib/supabase';
import {
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export type AdmissionSectionKey =
  | 'how-to-apply'
  | 'required-documents'
  | 'external-transfer-requirements';

export interface AdmissionTransferItem {
  id: string;
  title: string;
  file_path: string;
  file_type: 'image' | 'pdf';
}

export interface AdmissionSectionRecord {
  section_key: AdmissionSectionKey;
  steps: string[] | null;
  attachments: AdmissionTransferItem[] | null;
  updated_at: string;
}

export interface TransferDraftItem {
  id: string;
  title: string;
  existingFilePath?: string | null;
  existingFileType?: 'image' | 'pdf' | null;
  file?: File | null;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PDF_MIME_TYPES = ['application/pdf'];

function isMissingAdmissionTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /admission_sections/i.test(error.message ?? '');
}

function inferTransferFileType(file: File): 'image' | 'pdf' {
  if (PDF_MIME_TYPES.includes(file.type)) {
    return 'pdf';
  }

  if (IMAGE_MIME_TYPES.includes(file.type)) {
    return 'image';
  }

  throw new Error('Only PDF or image files are allowed.');
}

export async function getAdmissionSection(sectionKey: AdmissionSectionKey): Promise<AdmissionSectionRecord | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseAdmissionTable)
    .select('*')
    .eq('section_key', sectionKey)
    .maybeSingle();

  if (error) {
    if (isMissingAdmissionTable(error)) {
      return null;
    }
    throw new Error(`Failed to load admission section: ${error.message}`);
  }

  const record = (data as AdmissionSectionRecord | null) ?? null;
  if (!record) {
    return null;
  }

  return {
    ...record,
    steps: Array.isArray(record.steps) ? record.steps : [],
    attachments: Array.isArray(record.attachments) ? record.attachments : []
  };
}

export async function upsertAdmissionStepsSection(
  sectionKey: Extract<AdmissionSectionKey, 'how-to-apply' | 'required-documents'>,
  steps: string[]
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const cleanedSteps = steps.map((step) => step.trim()).filter(Boolean);
  if (cleanedSteps.length === 0) {
    throw new Error('Please add at least one step.');
  }

  const { error } = await supabase.from(supabaseAdmissionTable).upsert(
    {
      section_key: sectionKey,
      steps: cleanedSteps,
      attachments: [],
      updated_at: new Date().toISOString()
    },
    { onConflict: 'section_key' }
  );

  if (error) {
    throw new Error(`Failed to save admission section: ${error.message}`);
  }
}

export async function upsertExternalTransferRequirements(
  items: TransferDraftItem[],
  existingRecord?: AdmissionSectionRecord | null
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseAdmissionFilesBucket, 'admission');
  const uploadedPaths: string[] = [];

  try {
    const attachments: AdmissionTransferItem[] = [];

    for (const item of items) {
      const title = item.title.trim();
      if (!title) {
        throw new Error('Each transfer requirement needs a title.');
      }

      if (item.file) {
        const fileType = inferTransferFileType(item.file);
        validateFile(item.file, {
          maxSizeInMb: 10,
          allowedMimeTypes: [...IMAGE_MIME_TYPES, ...PDF_MIME_TYPES],
          label: title
        });
        const filePath = await uploadFileToStorage(item.file, target, item.id, fileType);
        uploadedPaths.push(filePath);
        attachments.push({
          id: item.id,
          title,
          file_path: filePath,
          file_type: fileType
        });
      } else if (item.existingFilePath && item.existingFileType) {
        attachments.push({
          id: item.id,
          title,
          file_path: item.existingFilePath,
          file_type: item.existingFileType
        });
      } else {
        throw new Error(`"${title}" needs an image or PDF file.`);
      }
    }

    const { error } = await supabase.from(supabaseAdmissionTable).upsert(
      {
        section_key: 'external-transfer-requirements',
        steps: [],
        attachments,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'section_key' }
    );

    if (error) {
      throw new Error(`Failed to save external transfer requirements: ${error.message}`);
    }

    const nextIds = new Set(attachments.map((item) => item.id));
    for (const attachment of existingRecord?.attachments ?? []) {
      if (!nextIds.has(attachment.id)) {
        await deleteStorageFileSafely(target.bucket, attachment.file_path);
      }
    }
  } catch (error) {
    await Promise.all(uploadedPaths.map((path) => deleteStorageFileSafely(target.bucket, path)));
    throw error;
  }
}

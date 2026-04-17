import {
  supabase,
  supabaseStudyPlanFilesBucket,
  supabaseStudyPlansTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export const STUDY_PLAN_SINGLE_FIELDS = [
  'undergrad_cs_old_curriculum',
  'undergrad_is_old_curriculum',
  'undergrad_ai_old_curriculum',
  'undergrad_cs_new_curriculum',
  'undergrad_is_new_curriculum',
  'undergrad_ai_new_curriculum',
  'master_cs_old_curriculum',
  'master_is_old_curriculum',
  'master_ai_old_curriculum',
  'master_cs_new_curriculum',
  'master_is_new_curriculum',
  'master_ai_new_curriculum',
  'phd_cs_old_curriculum',
  'phd_is_old_curriculum',
  'phd_ai_old_curriculum',
  'phd_cs_new_curriculum',
  'phd_is_new_curriculum',
  'phd_ai_new_curriculum'
] as const;

export type StudyPlanSingleField = (typeof STUDY_PLAN_SINGLE_FIELDS)[number];
export const STUDY_PLAN_DIPLOMA_FIELDS = [
  'diploma_big_data',
  'diploma_applied_ai',
  'diploma_business_intelligence'
] as const;
export type StudyPlanDiplomaField = (typeof STUDY_PLAN_DIPLOMA_FIELDS)[number];

export interface StudyPlanRecord {
  id: string;
  undergrad_cs_old_curriculum: string | null;
  undergrad_is_old_curriculum: string | null;
  undergrad_ai_old_curriculum: string | null;
  undergrad_cs_new_curriculum: string | null;
  undergrad_is_new_curriculum: string | null;
  undergrad_ai_new_curriculum: string | null;
  master_cs_old_curriculum: string | null;
  master_is_old_curriculum: string | null;
  master_ai_old_curriculum: string | null;
  master_cs_new_curriculum: string | null;
  master_is_new_curriculum: string | null;
  master_ai_new_curriculum: string | null;
  phd_cs_old_curriculum: string | null;
  phd_is_old_curriculum: string | null;
  phd_ai_old_curriculum: string | null;
  phd_cs_new_curriculum: string | null;
  phd_is_new_curriculum: string | null;
  phd_ai_new_curriculum: string | null;
  diploma_big_data: string[] | null;
  diploma_applied_ai: string[] | null;
  diploma_business_intelligence: string[] | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StudyPlanSingleFileMap = Partial<Record<StudyPlanSingleField, File | null>>;
export type StudyPlanDiplomaFileMap = Partial<Record<StudyPlanDiplomaField, File[]>>;
export type StudyPlanDiplomaRemoveMap = Partial<Record<StudyPlanDiplomaField, string[]>>;

export interface StudyPlansUpdateOptions {
  singleFiles: StudyPlanSingleFileMap;
  removeSingleFiles: Partial<Record<StudyPlanSingleField, boolean>>;
  diplomaFiles: StudyPlanDiplomaFileMap;
  removeDiplomaPaths: StudyPlanDiplomaRemoveMap;
  existingRecord?: StudyPlanRecord;
}

const DOC_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

function isMissingStudyPlansTableError(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false;
  }

  return (
    error.code === 'PGRST205' ||
    error.message?.includes("Could not find the table 'public.study_plans' in the schema cache") === true
  );
}

function getStudyPlansSetupMessage(): string {
  return 'Study Plans backend is not initialized yet. Run the SQL in supabase/admin_dashboard_collections.sql to create the table and policies.';
}

function validateDocumentFile(file: File, label: string): void {
  validateFile(file, {
    maxSizeInMb: 10,
    allowedMimeTypes: DOC_MIME_TYPES,
    label
  });
}

async function uploadDocument(
  file: File,
  recordId: string,
  fieldName: string
): Promise<string> {
  const target = parseStorageTarget(supabaseStudyPlanFilesBucket, 'study-plans');
  return uploadFileToStorage(file, target, recordId, fieldName);
}

export async function listStudyPlans(): Promise<StudyPlanRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseStudyPlansTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingStudyPlansTableError(error)) {
      return [];
    }
    throw new Error(`Failed to load study plans: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    ...row,
    diploma_big_data: Array.isArray(row.diploma_big_data) ? (row.diploma_big_data as string[]) : null,
    diploma_applied_ai: Array.isArray(row.diploma_applied_ai) ? (row.diploma_applied_ai as string[]) : null,
    diploma_business_intelligence: Array.isArray(row.diploma_business_intelligence)
      ? (row.diploma_business_intelligence as string[])
      : null
  })) as StudyPlanRecord[];
}

export async function createStudyPlan(options: {
  singleFiles: StudyPlanSingleFileMap;
  diplomaFiles: StudyPlanDiplomaFileMap;
}): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const id = crypto.randomUUID();
  const payload: Partial<StudyPlanRecord> & { id: string } = {
    id,
    is_published: false,
    published_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  for (const field of STUDY_PLAN_SINGLE_FIELDS) {
    const file = options.singleFiles[field] ?? null;
    if (file) {
      validateDocumentFile(file, field);
      payload[field] = await uploadDocument(file, id, field);
    } else {
      payload[field] = null;
    }
  }

  for (const field of STUDY_PLAN_DIPLOMA_FIELDS) {
    const files = options.diplomaFiles[field] ?? [];
    const diplomaPaths: string[] = [];

    for (const file of files) {
      validateDocumentFile(file, `${field} file`);
      const path = await uploadDocument(file, id, field);
      diplomaPaths.push(path);
    }

    payload[field] = diplomaPaths;
  }

  const { error } = await supabase.from(supabaseStudyPlansTable).insert(payload);
  if (error) {
    if (isMissingStudyPlansTableError(error)) {
      throw new Error(getStudyPlansSetupMessage());
    }
    throw new Error(`Failed to create study plans record: ${error.message}`);
  }
}

export async function updateStudyPlan(
  id: string,
  options: StudyPlansUpdateOptions
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const bucket = parseStorageTarget(supabaseStudyPlanFilesBucket, 'study-plans').bucket;
  const existing = options.existingRecord;
  const payload: Partial<StudyPlanRecord> = {
    updated_at: new Date().toISOString()
  };

  for (const field of STUDY_PLAN_SINGLE_FIELDS) {
    const nextFile = options.singleFiles[field] ?? null;
    const shouldRemove = options.removeSingleFiles[field] ?? false;
    const existingPath = existing?.[field] ?? null;

    if (nextFile) {
      validateDocumentFile(nextFile, field);
      payload[field] = await uploadDocument(nextFile, id, field);
      if (existingPath) {
        await deleteStorageFile(bucket, existingPath);
      }
      continue;
    }

    if (shouldRemove && existingPath) {
      await deleteStorageFile(bucket, existingPath);
      payload[field] = null;
      continue;
    }

    payload[field] = existingPath;
  }

  for (const field of STUDY_PLAN_DIPLOMA_FIELDS) {
    const existingPaths = existing?.[field] ?? [];
    const removedPaths = options.removeDiplomaPaths[field] ?? [];
    const incomingFiles = options.diplomaFiles[field] ?? [];

    const baseDiplomas = existingPaths.filter((path) => !removedPaths.includes(path));

    for (const path of removedPaths) {
      await deleteStorageFile(bucket, path);
    }

    const newDiplomas: string[] = [];
    for (const file of incomingFiles) {
      validateDocumentFile(file, `${field} file`);
      const path = await uploadDocument(file, id, field);
      newDiplomas.push(path);
    }

    payload[field] = [...baseDiplomas, ...newDiplomas];
  }

  const { error } = await supabase.from(supabaseStudyPlansTable).update(payload).eq('id', id);
  if (error) {
    if (isMissingStudyPlansTableError(error)) {
      throw new Error(getStudyPlansSetupMessage());
    }
    throw new Error(`Failed to update study plans record: ${error.message}`);
  }
}

export async function deleteStudyPlan(record: StudyPlanRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const bucket = parseStorageTarget(supabaseStudyPlanFilesBucket, 'study-plans').bucket;

  for (const field of STUDY_PLAN_SINGLE_FIELDS) {
    await deleteStorageFile(bucket, record[field]);
  }

  for (const field of STUDY_PLAN_DIPLOMA_FIELDS) {
    for (const path of record[field] ?? []) {
      await deleteStorageFile(bucket, path);
    }
  }

  const { error } = await supabase.from(supabaseStudyPlansTable).delete().eq('id', record.id);
  if (error) {
    if (isMissingStudyPlansTableError(error)) {
      throw new Error(getStudyPlansSetupMessage());
    }
    throw new Error(`Failed to delete study plans record: ${error.message}`);
  }
}

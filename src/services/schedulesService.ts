import {
  supabase,
  supabaseScheduleFilesBucket,
  supabaseSchedulesTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  deleteStorageFileSafely,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export const scheduleCategories = ['exams', 'lectures_sections'] as const;
export type ScheduleCategory = (typeof scheduleCategories)[number];
export const scheduleTypes = ['Quiz 1', 'Quiz 2', 'Final', 'Semester Schedule'] as const;
export type ScheduleType = (typeof scheduleTypes)[number];

export const semesterTypes = ['Fall', 'Spring', 'Summer'] as const;
export type SemesterType = (typeof semesterTypes)[number];

export interface ScheduleRecord {
  id: string;
  title: string;
  category: ScheduleCategory;
  schedule_type: ScheduleType;
  semester: SemesterType;
  year: number;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleInput {
  title: string;
  category: ScheduleCategory;
  scheduleType: ScheduleType;
  semester: SemesterType;
  year: number;
}

function validateScheduleInput(input: ScheduleInput): void {
  if (!input.title.trim()) {
    throw new Error('Please enter a title.');
  }

  if (!scheduleCategories.includes(input.category)) {
    throw new Error('Please choose a valid category.');
  }

  if (!scheduleTypes.includes(input.scheduleType)) {
    throw new Error('Please choose a valid schedule type.');
  }

  if (input.category === 'lectures_sections' && input.scheduleType !== 'Semester Schedule') {
    throw new Error('Lectures / Sections must use Semester Schedule.');
  }

  if (input.category === 'exams' && input.scheduleType === 'Semester Schedule') {
    throw new Error('Please choose a valid exam type.');
  }

  if (!semesterTypes.includes(input.semester)) {
    throw new Error('Please choose a valid semester.');
  }

  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 2100) {
    throw new Error('Please choose a valid year between 2000 and 2100.');
  }
}

function isMissingSchedulesTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /schedules/i.test(error.message ?? '');
}

function validateSchedulePdf(file: File): void {
  validateFile(file, {
    maxSizeInMb: 10,
    allowedMimeTypes: ['application/pdf'],
    label: 'Schedule PDF'
  });
}

async function uploadSchedulePdf(file: File, recordId: string): Promise<string> {
  const target = parseStorageTarget(supabaseScheduleFilesBucket, 'schedules');
  return uploadFileToStorage(file, target, recordId, 'schedule');
}

export async function listSchedulesForYear(year: number): Promise<ScheduleRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseSchedulesTable)
    .select('*')
    .eq('year', year)
    .order('category', { ascending: true })
    .order('semester', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingSchedulesTable(error)) {
      return [];
    }
    throw new Error(`Failed to load schedules: ${error.message}`);
  }

  return (data ?? []) as ScheduleRecord[];
}

export async function createSchedule(input: ScheduleInput, pdfFile: File): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateScheduleInput(input);
  validateSchedulePdf(pdfFile);

  const id = crypto.randomUUID();
  const filePath = await uploadSchedulePdf(pdfFile, id);
  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseSchedulesTable).insert({
    id,
    title: input.title.trim(),
    category: input.category,
    schedule_type: input.scheduleType,
    semester: input.semester,
    year: input.year,
    file_path: filePath,
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingSchedulesTable(error)) {
      throw new Error('Schedules table is not set up yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to create schedule: ${error.message}`);
  }
}

export async function updateSchedule(id: string, input: ScheduleInput): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateScheduleInput(input);

  const { error } = await supabase
    .from(supabaseSchedulesTable)
    .update({
      title: input.title.trim(),
      category: input.category,
      schedule_type: input.scheduleType,
      semester: input.semester,
      year: input.year,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    if (isMissingSchedulesTable(error)) {
      throw new Error('Schedules table is not set up yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to update schedule: ${error.message}`);
  }
}

export async function updateScheduleWithFile(
  id: string,
  input: ScheduleInput,
  options: {
    pdfFile?: File | null;
    existingFilePath: string;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateScheduleInput(input);

  const target = parseStorageTarget(supabaseScheduleFilesBucket, 'schedules');
  let nextFilePath = options.existingFilePath;

  if (options.pdfFile) {
    validateSchedulePdf(options.pdfFile);
    nextFilePath = await uploadFileToStorage(options.pdfFile, target, id, 'schedule');
    await deleteStorageFile(target.bucket, options.existingFilePath);
  }

  const { error } = await supabase
    .from(supabaseSchedulesTable)
    .update({
      title: input.title.trim(),
      category: input.category,
      schedule_type: input.scheduleType,
      semester: input.semester,
      year: input.year,
      file_path: nextFilePath,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    if (isMissingSchedulesTable(error)) {
      throw new Error('Schedules table is not set up yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to update schedule: ${error.message}`);
  }
}

export async function deleteSchedule(id: string, filePath?: string | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseScheduleFilesBucket, 'schedules');

  if (filePath) {
    await deleteStorageFileSafely(target.bucket, filePath);
  }

  const { error } = await supabase.from(supabaseSchedulesTable).delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete schedule: ${error.message}`);
  }
}

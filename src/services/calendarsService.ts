import {
  supabase,
  supabaseCalendarFilesBucket,
  supabaseCalendarsTable
} from '../lib/supabase';
import {
  deleteStorageFile,
  parseStorageTarget,
  uploadFileToStorage,
  validateFile
} from './storageUtils';

export const programLevels = ['Undergraduate', 'Postgraduate', 'Professional Diplomas'] as const;
export type ProgramLevel = (typeof programLevels)[number];

export interface CalendarRecord {
  id: string;
  program_level: ProgramLevel;
  year: number;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarInput {
  programLevel: ProgramLevel;
  year: number;
}

function validateCalendarInput(input: CalendarInput): void {
  if (!programLevels.includes(input.programLevel)) {
    throw new Error('Please choose a valid program level.');
  }

  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 2100) {
    throw new Error('Please choose a valid year between 2000 and 2100.');
  }
}

function isMissingCalendarsTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /calendars/i.test(error.message ?? '');
}

function validateCalendarPdf(file: File): void {
  validateFile(file, {
    maxSizeInMb: 10,
    allowedMimeTypes: ['application/pdf'],
    label: 'Calendar PDF'
  });
}

async function uploadCalendarPdf(file: File, recordId: string): Promise<string> {
  const target = parseStorageTarget(supabaseCalendarFilesBucket, 'calendars');
  return uploadFileToStorage(file, target, recordId, 'calendar');
}

export async function listCalendarsForYear(year: number): Promise<CalendarRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseCalendarsTable)
    .select('*')
    .eq('year', year)
    .order('program_level', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingCalendarsTable(error)) {
      return [];
    }
    throw new Error(`Failed to load calendars: ${error.message}`);
  }

  return (data ?? []) as CalendarRecord[];
}

export async function createCalendar(input: CalendarInput, pdfFile: File): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateCalendarInput(input);
  validateCalendarPdf(pdfFile);

  const id = crypto.randomUUID();
  const filePath = await uploadCalendarPdf(pdfFile, id);
  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseCalendarsTable).insert({
    id,
    program_level: input.programLevel,
    year: input.year,
    file_path: filePath,
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingCalendarsTable(error)) {
      throw new Error('Calendars table is not set up yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to create calendar: ${error.message}`);
  }
}

export async function updateCalendarWithFile(
  id: string,
  input: CalendarInput,
  options: {
    pdfFile?: File | null;
    existingFilePath: string;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateCalendarInput(input);

  const target = parseStorageTarget(supabaseCalendarFilesBucket, 'calendars');
  let nextFilePath = options.existingFilePath;

  if (options.pdfFile) {
    validateCalendarPdf(options.pdfFile);
    nextFilePath = await uploadFileToStorage(options.pdfFile, target, id, 'calendar');
    await deleteStorageFile(target.bucket, options.existingFilePath);
  }

  const { error } = await supabase
    .from(supabaseCalendarsTable)
    .update({
      program_level: input.programLevel,
      year: input.year,
      file_path: nextFilePath,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    if (isMissingCalendarsTable(error)) {
      throw new Error('Calendars table is not set up yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to update calendar: ${error.message}`);
  }
}

export async function deleteCalendar(id: string, filePath?: string | null): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const target = parseStorageTarget(supabaseCalendarFilesBucket, 'calendars');

  if (filePath) {
    await deleteStorageFile(target.bucket, filePath);
  }

  const { error } = await supabase.from(supabaseCalendarsTable).delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete calendar: ${error.message}`);
  }
}

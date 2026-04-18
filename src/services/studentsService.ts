import { supabase, supabaseStudentsTable } from '../lib/supabase';

export const studentMajors = ['cs', 'is', 'ai', 'general'] as const;
export type StudentMajor = (typeof studentMajors)[number];
export const studentStatuses = ['active', 'discontinued'] as const;
export type StudentStatus = (typeof studentStatuses)[number];

export interface StudentRecord {
  student_id: string;
  full_name: string;
  nationality: string;
  college: string | null;
  major: StudentMajor;
  team_code: string | null;
  amit: string | null;
  level: string;
  class_name: string | null;
  mobile: string | null;
  email: string | null;
  advisor_name: string | null;
  gpa: number | null;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export interface StudentInput {
  studentId: string;
  fullName: string;
  nationality: string;
  college?: string;
  major: StudentMajor;
  teamCode?: string;
  amit?: string;
  level: string;
  className?: string;
  mobile?: string;
  email?: string;
  advisorName?: string;
  gpa: number | null;
  status?: StudentStatus;
}

function validateStudentInput(input: StudentInput): void {
  if (!input.studentId.trim()) {
    throw new Error('Student ID is required.');
  }
  if (!input.fullName.trim()) {
    throw new Error('Full name is required.');
  }
  if (!input.nationality.trim()) {
    throw new Error('Nationality is required.');
  }
  if (!studentMajors.includes(input.major)) {
    throw new Error('Please select a valid major.');
  }
  if (!input.level.trim()) {
    throw new Error('Level is required.');
  }
  if (input.status && !studentStatuses.includes(input.status)) {
    throw new Error('Please select a valid student status.');
  }
  if (input.gpa != null && (input.gpa < 0 || input.gpa > 4)) {
    throw new Error('GPA must be between 0 and 4.');
  }
  if (input.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new Error('Email must be a valid email address.');
  }
}

function isMissingStudentsTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || error.code === '42P01' || /students/i.test(error.message ?? '');
}

export async function listStudents(): Promise<StudentRecord[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from(supabaseStudentsTable)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingStudentsTable(error)) {
      return [];
    }
    throw new Error(`Failed to load students: ${error.message}`);
  }

  return (data ?? []) as StudentRecord[];
}

export async function createStudent(input: StudentInput): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  validateStudentInput(input);

  const now = new Date().toISOString();
  const { error } = await supabase.from(supabaseStudentsTable).insert({
    student_id: input.studentId.trim(),
    full_name: input.fullName.trim(),
    nationality: input.nationality.trim(),
    college: input.college?.trim() || null,
    major: input.major,
    team_code: input.teamCode?.trim() || null,
    amit: input.amit?.trim() || null,
    level: input.level.trim(),
    class_name: input.className?.trim() || null,
    mobile: input.mobile?.trim() || null,
    email: input.email?.trim() || null,
    advisor_name: input.advisorName?.trim() || null,
    gpa: input.gpa,
    status: input.status ?? 'active',
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingStudentsTable(error)) {
      throw new Error('Students backend is not initialized yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to add student: ${error.message}`);
  }
}

export async function bulkUpsertStudents(inputs: StudentInput[]): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (inputs.length === 0) {
    throw new Error('No students found to import.');
  }

  inputs.forEach(validateStudentInput);

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    student_id: input.studentId.trim(),
    full_name: input.fullName.trim(),
    nationality: input.nationality.trim(),
    college: input.college?.trim() || null,
    major: input.major,
    team_code: input.teamCode?.trim() || null,
    amit: input.amit?.trim() || null,
    level: input.level.trim(),
    class_name: input.className?.trim() || null,
    mobile: input.mobile?.trim() || null,
    email: input.email?.trim() || null,
    advisor_name: input.advisorName?.trim() || null,
    gpa: input.gpa,
    status: input.status ?? 'active',
    updated_at: now
  }));

  const { error } = await supabase
    .from(supabaseStudentsTable)
    .upsert(payload, { onConflict: 'student_id' });

  if (error) {
    if (isMissingStudentsTable(error)) {
      throw new Error('Students backend is not initialized yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to import students: ${error.message}`);
  }
}

const INSERT_CHUNK_SIZE = 150;

export async function replaceAllStudents(inputs: StudentInput[]): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (inputs.length === 0) {
    throw new Error('No students found to import.');
  }

  inputs.forEach(validateStudentInput);

  const { error: deleteError } = await supabase.from(supabaseStudentsTable).delete().neq('student_id', '');

  if (deleteError) {
    if (isMissingStudentsTable(deleteError)) {
      throw new Error('Students backend is not initialized yet. Run the SQL setup script first.');
    }
    throw new Error(`Failed to clear existing students: ${deleteError.message}`);
  }

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    student_id: input.studentId.trim(),
    full_name: input.fullName.trim(),
    nationality: input.nationality.trim(),
    college: input.college?.trim() || null,
    major: input.major,
    team_code: input.teamCode?.trim() || null,
    amit: input.amit?.trim() || null,
    level: input.level.trim(),
    class_name: input.className?.trim() || null,
    mobile: input.mobile?.trim() || null,
    email: input.email?.trim() || null,
    advisor_name: input.advisorName?.trim() || null,
    gpa: input.gpa,
    status: input.status ?? 'active',
    created_at: now,
    updated_at: now
  }));

  for (let i = 0; i < payload.length; i += INSERT_CHUNK_SIZE) {
    const chunk = payload.slice(i, i + INSERT_CHUNK_SIZE);
    const { error: insertError } = await supabase.from(supabaseStudentsTable).insert(chunk);

    if (insertError) {
      throw new Error(`Failed to import students after clearing data: ${insertError.message}`);
    }
  }
}

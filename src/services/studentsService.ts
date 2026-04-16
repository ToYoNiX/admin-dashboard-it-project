import { supabase, supabaseStudentsTable } from '../lib/supabase';

export const studentMajors = ['cs', 'is', 'ai', 'general'] as const;
export type StudentMajor = (typeof studentMajors)[number];

export interface StudentRecord {
  student_id: string;
  full_name: string;
  nationality: string;
  major: StudentMajor;
  level: string;
  gpa: number | null;
  created_at: string;
  updated_at: string;
}

export interface StudentInput {
  studentId: string;
  fullName: string;
  nationality: string;
  major: StudentMajor;
  level: string;
  gpa: number | null;
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
  if (input.gpa != null && (input.gpa < 0 || input.gpa > 4)) {
    throw new Error('GPA must be between 0 and 4.');
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
    major: input.major,
    level: input.level.trim(),
    gpa: input.gpa,
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

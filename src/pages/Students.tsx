import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDownIcon,
  DownloadIcon,
  FileTextIcon,
  MailIcon,
  MessageSquareIcon,
  PlusIcon,
  SearchIcon,
  UploadIcon } from
'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabaseHonorListBucket } from '../lib/supabase';
import {
  getHonorListDocument,
  upsertHonorListDocument,
  type HonorListRecord
} from '../services/honorListService';
import { getPublicFileUrl } from '../services/storageUtils';
import {
  createStudent,
  listStudents,
  studentMajors,
  type StudentInput,
  type StudentRecord } from
'../services/studentsService';

type SortBy = 'name' | 'id' | 'gpa';
type SortDirection = 'asc' | 'desc';

interface StudentsProps {
  onNavigateToMessages?: () => void;
}

const DEFAULT_FORM_VALUES: StudentInput = {
  studentId: '',
  fullName: '',
  nationality: '',
  major: 'cs',
  level: 'Level 1',
  gpa: null
};

export function Students({ onNavigateToMessages }: StudentsProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [formValues, setFormValues] = useState<StudentInput>(DEFAULT_FORM_VALUES);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [honorListRecord, setHonorListRecord] = useState<HonorListRecord | null>(null);
  const [selectedHonorListFile, setSelectedHonorListFile] = useState<File | null>(null);
  const [isHonorListLoading, setIsHonorListLoading] = useState(true);
  const [isHonorListSaving, setIsHonorListSaving] = useState(false);
  const [honorListError, setHonorListError] = useState<string | null>(null);
  const [honorListSuccess, setHonorListSuccess] = useState<string | null>(null);

  const levelOptions = useMemo(() => {
    const levels = new Set<string>();
    students.forEach((student) => {
      levels.add(student.level);
    });

    return Array.from(levels).sort();
  }, [students]);

const trimUntilCapital = (str : String) => {
  // Find the index of the first character between A and Z
  const firstCapIndex = str.search(/[A-Z]/);

  // If no capital letter is found, return an empty string or the original
  // depending on your preference. Here we return the slice if found.
  return firstCapIndex !== -1 ? str.slice(firstCapIndex) : "";
};

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = students.filter((student) => {
      const studentEmail = `${student.student_id}@must.edu.eg`;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        student.student_id.toLowerCase().includes(normalizedSearch) ||
        student.full_name.toLowerCase().includes(normalizedSearch) ||
        studentEmail.toLowerCase().includes(normalizedSearch);

      const matchesMajor = selectedMajor === 'all' || student.major === selectedMajor;
      const matchesLevel = selectedLevel === 'all' || student.level === selectedLevel;

      return matchesSearch && matchesMajor && matchesLevel;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = a.full_name.localeCompare(b.full_name);
      }

      if (sortBy === 'id') {
        comparison = a.student_id.localeCompare(b.student_id);
      }

      if (sortBy === 'gpa') {
        const gpaA = a.gpa ?? Number.NEGATIVE_INFINITY;
        const gpaB = b.gpa ?? Number.NEGATIVE_INFINITY;
        comparison = gpaA - gpaB;
      }

      return sortDirection === 'asc' ? comparison : comparison * -1;
    });

    return filtered;
  }, [searchTerm, selectedMajor, selectedLevel, sortBy, sortDirection, students]);

  useEffect(() => {
    loadStudents();
    loadHonorList();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    setFeedbackError(null);

    try {
      const data = await listStudents();
      setStudents(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load students.';
      setFeedbackError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHonorList = async () => {
    setIsHonorListLoading(true);
    setHonorListError(null);

    try {
      const data = await getHonorListDocument();
      setHonorListRecord(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load honor list.';
      setHonorListError(message);
    } finally {
      setIsHonorListLoading(false);
    }
  };

  const handleUploadHonorList = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedHonorListFile) {
      setHonorListError('Please choose a PDF file first.');
      return;
    }

    setIsHonorListSaving(true);
    setHonorListError(null);
    setHonorListSuccess(null);

    try {
      await upsertHonorListDocument(selectedHonorListFile, {
        existingFilePath: honorListRecord?.file_path
      });
      setSelectedHonorListFile(null);
      setHonorListSuccess(honorListRecord ? 'Honor list updated successfully.' : 'Honor list uploaded successfully.');
      await loadHonorList();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload honor list PDF.';
      setHonorListError(message);
    } finally {
      setIsHonorListSaving(false);
    }
  };

  const handleFormFieldChange = (field: keyof StudentInput, value: string) => {
    if (field === 'gpa') {
      const nextGpa = value.trim() === '' ? null : Number(value);
      setFormValues((previous) => ({
        ...previous,
        gpa: Number.isFinite(nextGpa) ? nextGpa : null
      }));
      return;
    }

    setFormValues((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleCreateStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);
    setIsSubmitting(true);

    try {
      await createStudent(formValues);
      setFeedbackSuccess('Student created successfully.');
      setFormValues(DEFAULT_FORM_VALUES);
      setShowAddForm(false);
      await loadStudents();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create student.';
      setFeedbackError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatGpa = (gpa: number | null): string => {
    if (gpa == null || Number.isNaN(gpa)) {
      return '-';
    }
    return gpa.toFixed(2);
  };

  const navigateToMessages = () => {
    onNavigateToMessages?.();
  };

  const honorListFileUrl = getPublicFileUrl(supabaseHonorListBucket, honorListRecord?.file_path);

  const honorListFileName = useMemo(() => {
    if (!honorListRecord?.file_path) {
      return null;
    }

    const segments = honorListRecord.file_path.split('/');
    return segments[segments.length - 1] || honorListRecord.file_path;
  }, [honorListRecord]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-must-text-primary">
          Students Management
        </h1>
        <Button
          icon={<PlusIcon className="w-4 h-4" />}
          onClick={() => setShowAddForm((previous) => !previous)}>

          {showAddForm ? 'Close Form' : 'Add Student'}
        </Button>
      </div>

      {showAddForm &&
      <Card className="p-4">
          <form className="space-y-4" onSubmit={handleCreateStudent}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Student ID"
                value={formValues.studentId}
                onChange={(event) => handleFormFieldChange('studentId', event.target.value)}
                placeholder="e.g. 2025001"
                required />

              <Input
                label="Full Name"
                value={formValues.fullName}
                onChange={(event) => handleFormFieldChange('fullName', event.target.value)}
                placeholder="e.g. Ahmed Mohamed"
                required />

              <Input
                label="Nationality"
                value={formValues.nationality}
                onChange={(event) => handleFormFieldChange('nationality', event.target.value)}
                placeholder="e.g. Egypt"
                required />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">
                  Major
                </label>
                <select
                  value={formValues.major}
                  onChange={(event) => handleFormFieldChange('major', event.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none">

                  {studentMajors.map((major) =>
                  <option key={major} value={major}>
                      {major.toUpperCase()}
                    </option>
                  )}
                </select>
              </div>

              <Input
                label="Level"
                value={formValues.level}
                onChange={(event) => handleFormFieldChange('level', event.target.value)}
                placeholder="e.g. Level 3"
                required />

              <Input
                label="Current GPA"
                type="number"
                min={0}
                max={4}
                step="0.01"
                value={formValues.gpa == null ? '' : String(formValues.gpa)}
                onChange={(event) => handleFormFieldChange('gpa', event.target.value)}
                placeholder="Leave empty if unavailable" />

            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Student'}
              </Button>
            </div>
          </form>
        </Card>
      }

      {feedbackError &&
      <Card className="p-3 border border-red-300 text-red-700 dark:text-red-300">
          {feedbackError}
        </Card>
      }

      {feedbackSuccess &&
      <Card className="p-3 border border-green-300 text-green-700 dark:text-green-300">
          {feedbackSuccess}
        </Card>
      }

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-must-green" />
          <h2 className="text-lg font-semibold text-must-text-primary">Honor List PDF</h2>
        </div>

        {isHonorListLoading ?
        <p className="text-sm text-must-text-secondary">Loading honor list...</p> :
        <div className="space-y-2 text-sm">
            <p className="text-must-text-secondary">
              {honorListRecord ? 'Latest Honor List' : 'No honor list uploaded yet.'}
            </p>
            {honorListFileName &&
            <p className="text-must-text-primary break-all">
                File: {trimUntilCapital(honorListFileName)}
              </p>
            }
          </div>
        }

        <form className="space-y-3" onSubmit={handleUploadHonorList}>
          <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
            <UploadIcon className="w-4 h-4" />
            <span className="text-sm">Choose honor list PDF</span>
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={(event) => {
                setSelectedHonorListFile(event.target.files?.[0] ?? null);
                setHonorListError(null);
                setHonorListSuccess(null);
              }} />

          </label>

          {selectedHonorListFile &&
          <p className="text-xs text-must-text-secondary break-all">
              Selected: {selectedHonorListFile.name}
            </p>
          }

          {honorListError &&
          <p className="text-sm text-red-500">{honorListError}</p>
          }
          {honorListSuccess &&
          <p className="text-sm text-green-600">{honorListSuccess}</p>
          }

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={isHonorListSaving || !selectedHonorListFile}
              icon={<UploadIcon className="w-4 h-4" />}>

              {isHonorListSaving ? 'Saving...' : honorListRecord ? 'Replace PDF' : 'Upload PDF'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!honorListFileUrl}
              icon={<DownloadIcon className="w-4 h-4" />}
              onClick={() => {
                if (!honorListFileUrl) {
                  return;
                }
                window.open(honorListFileUrl, '_blank', 'noopener,noreferrer');
              }}>

              Download Current PDF
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by ID, Name, or Email..."
              icon={<SearchIcon className="w-4 h-4" />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)} />

          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
            <select
              value={selectedMajor}
              onChange={(event) => setSelectedMajor(event.target.value)}
              className="px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none min-w-[140px]">

              <option value="all">All Majors</option>
              {studentMajors.map((major) =>
              <option key={major} value={major}>
                  {major.toUpperCase()}
                </option>
              )}
            </select>
            <select
              value={selectedLevel}
              onChange={(event) => setSelectedLevel(event.target.value)}
              className="px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none min-w-[140px]">

              <option value="all">All Levels</option>
              {levelOptions.map((level) =>
              <option key={level} value={level}>
                  {level}
                </option>
              )}
            </select>
            <div className="flex items-center gap-2 border border-must-border rounded-lg px-3 bg-must-surface min-w-[250px]">
              <ArrowUpDownIcon className="w-4 h-4 text-must-text-secondary" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortBy)}
                className="py-2 bg-transparent text-sm outline-none">

                <option value="name">Sort by Name</option>
                <option value="id">Sort by ID</option>
                <option value="gpa">Sort by GPA</option>
              </select>
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                className="py-2 bg-transparent text-sm outline-none">

                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-must-border">
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Student ID
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Full Name
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Nationality
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Major
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Level
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  GPA
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-must-border">
              {!isLoading && filteredStudents.map((student) =>
              <tr
                key={student.student_id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">

                  <td className="px-6 py-4 text-sm font-medium text-must-text-primary">
                    {student.student_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-must-text-primary flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-must-navy text-white flex items-center justify-center text-xs font-bold">
                      {student.full_name.charAt(0)}
                    </div>
                    {student.full_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-must-text-secondary">
                    {student.nationality}
                  </td>
                  <td className="px-6 py-4 text-sm text-must-text-secondary">
                    {student.major.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-must-text-secondary">
                    {student.level}
                  </td>
                  <td className="px-6 py-4 text-sm text-must-text-secondary">
                    {formatGpa(student.gpa)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button
                    className="p-1.5 text-slate-400 hover:text-must-green transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Open Messages"
                    onClick={navigateToMessages}>

                      <MessageSquareIcon className="w-4 h-4" />
                    </button>
                    <a
                      className="inline-flex p-1.5 text-slate-400 hover:text-must-navy transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Send Email"
                      href={`mailto:${student.student_id}@must.edu.eg`}>

                      <MailIcon className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              )}
              {!isLoading && filteredStudents.length === 0 &&
              <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-must-text-secondary">

                    No students found.
                  </td>
                </tr>
              }
              {isLoading &&
              <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-must-text-secondary">

                    Loading students...
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-must-border flex items-center justify-between">
          <span className="text-sm text-must-text-secondary">
            Showing {filteredStudents.length} of {students.length} students
          </span>

        </div>
      </Card>
    </div>);

}
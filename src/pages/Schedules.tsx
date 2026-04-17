import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Edit2Icon,
  PlusIcon,
  Trash2Icon,
  UploadIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Pagination } from '../components/ui/Pagination';
import {
  createSchedule,
  deleteSchedule,
  listSchedulesForYear,
  scheduleCategories,
  scheduleTypes,
  semesterTypes,
  type ScheduleCategory,
  type ScheduleInput,
  type ScheduleRecord,
  updateScheduleWithFile
} from '../services/schedulesService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseScheduleFilesBucket } from '../lib/supabase';

const currentYear = new Date().getFullYear();

const initialForm: ScheduleInput = {
  title: '',
  category: 'exams',
  scheduleType: 'Quiz 1',
  semester: 'Fall',
  year: currentYear
};

export function Schedules() {
  const ITEMS_PER_PAGE = 6;
  const [records, setRecords] = useState<ScheduleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<ScheduleInput>(initialForm);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [editingRecord, setEditingRecord] = useState<ScheduleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleRecord | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | ScheduleCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void loadSchedules();
  }, []);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 2 }, (_, index) => currentYear + index);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => activeCategory === 'all' || record.category === activeCategory);
  }, [activeCategory, records]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredRecords]);

  const groupedRecords = useMemo(() => {
    return {
      exams: paginatedRecords.filter((record) => record.category === 'exams'),
      lectures_sections: paginatedRecords.filter((record) => record.category === 'lectures_sections')
    };
  }, [paginatedRecords]);

  async function loadSchedules(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listSchedulesForYear(currentYear);
      setRecords(data);
      setCurrentPage(1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load schedules.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm(): void {
    setForm(initialForm);
    setSelectedPdfFile(null);
    setEditingRecord(null);
    setSubmitError('');
  }

  function startEdit(record: ScheduleRecord): void {
    setEditingRecord(record);
    setSubmitError('');
    setForm({
      title: record.title,
      category: record.category,
      scheduleType: record.schedule_type,
      semester: record.semester,
      year: record.year
    });
    setSelectedPdfFile(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');

      if (editingRecord) {
        await updateScheduleWithFile(editingRecord.id, form, {
          pdfFile: selectedPdfFile,
          existingFilePath: editingRecord.file_path
        });
      } else {
        if (!selectedPdfFile) {
          setSubmitError('Please attach a schedule PDF file.');
          setIsSaving(false);
          return;
        }
        await createSchedule(form, selectedPdfFile);
      }

      await loadSchedules();
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save schedule.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) {
      return;
    }

    try {
      setSubmitError('');
      await deleteSchedule(deleteTarget.id, deleteTarget.file_path);
      if (editingRecord?.id === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      await loadSchedules();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete schedule.');
    }
  }

  function renderRecord(record: ScheduleRecord): React.ReactNode {
    const pdfUrl = getPublicFileUrl(supabaseScheduleFilesBucket, record.file_path);

    return (
      <Card key={record.id} className="hover:border-must-green/40 transition-colors">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-must-text-primary">{record.title}</p>
            <p className="text-xs text-must-text-secondary mt-1">
              Category: {record.category === 'exams' ? 'Exams' : 'Lectures / Sections'}
            </p>
            <p className="text-xs text-must-text-secondary mt-1">
              Type: {record.schedule_type} | Semester: {record.semester} | Year: {record.year}
            </p>
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-must-green hover:underline"
              >
                <ExternalLinkIcon className="w-4 h-4" />
                Open PDF
              </a>
            ) : (
              <p className="mt-2 text-xs text-must-text-secondary">No PDF attached.</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-must-border bg-slate-50/70 p-2 dark:bg-slate-800/30 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Edit2Icon className="w-4 h-4" />}
              onClick={() => startEdit(record)}
              className="justify-start"
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={<Trash2Icon className="w-4 h-4" />}
              onClick={() => setDeleteTarget(record)}
              className="justify-start"
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Schedules Management</h1>

      <div className="flex border-b border-must-border overflow-x-auto">
        {[
          { value: 'all', label: 'All' },
          { value: 'exams', label: 'Exams' },
          { value: 'lectures_sections', label: 'Lectures / Sections' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveCategory(tab.value as 'all' | ScheduleCategory);
              setCurrentPage(1);
            }}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeCategory === tab.value ? 'border-must-green text-must-green' : 'border-transparent text-must-text-secondary hover:text-must-text-primary hover:border-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              {editingRecord ? 'Edit Schedule' : 'Add Schedule'}
            </h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Enter schedule title"
                required
              />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      category: event.target.value as ScheduleCategory,
                      scheduleType: event.target.value === 'exams' ? 'Quiz 1' : 'Semester Schedule'
                    }))
                  }
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {scheduleCategories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'exams' ? 'Exams' : 'Lectures / Sections'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">
                  {form.category === 'exams' ? 'Exam Type' : 'Schedule Type'}
                </label>
                <select
                  value={form.scheduleType}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, scheduleType: event.target.value as ScheduleInput['scheduleType'] }))
                  }
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {scheduleTypes
                    .filter((type) => (form.category === 'exams' ? type !== 'Semester Schedule' : type === 'Semester Schedule'))
                    .map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Semester</label>
                <select
                  value={form.semester}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, semester: event.target.value as ScheduleInput['semester'] }))
                  }
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {semesterTypes.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Year</label>
                <select
                  value={form.year}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, year: Number(event.target.value) }))
                  }
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-2">Schedule PDF</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Choose PDF file</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,.pdf"
                    onChange={(event) => setSelectedPdfFile(event.target.files?.[0] ?? null)}
                    required={!editingRecord}
                  />
                </label>

                <div className="mt-3 flex items-center gap-2 text-sm text-must-text-secondary min-h-5">
                  <FileTextIcon className="w-4 h-4" />
                  <span>
                    {selectedPdfFile
                      ? selectedPdfFile.name
                      : editingRecord
                        ? 'Current PDF kept unless replaced'
                        : 'No PDF selected'}
                  </span>
                </div>
              </div>

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isSaving}
                  icon={editingRecord ? undefined : <PlusIcon className="w-4 h-4" />}
                >
                  {isSaving ? 'Saving...' : editingRecord ? 'Update Schedule' : 'Add Schedule'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                  {editingRecord ? 'Cancel Edit' : 'Clear'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="xl:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-must-text-primary">{currentYear} Schedules</h2>
            </CardHeader>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading schedules...</CardContent>
            </Card>
          ) : null}

          {!isLoading && filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">
                No schedules found for the selected category.
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && groupedRecords.exams.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-base font-semibold text-must-text-primary">Exams</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedRecords.exams.map((record) => renderRecord(record))}
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && groupedRecords.lectures_sections.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-base font-semibold text-must-text-primary">Lectures / Sections</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedRecords.lectures_sections.map((record) => renderRecord(record))}
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && filteredRecords.length > 0 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRecords.length}
              itemLabel="schedules"
              onPageChange={setCurrentPage}
            />
          ) : null}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Schedule"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This action cannot be undone.`
            : 'Delete this schedule?'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

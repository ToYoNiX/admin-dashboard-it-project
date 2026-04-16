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
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  createCalendar,
  deleteCalendar,
  listCalendarsForYear,
  programLevels,
  type CalendarInput,
  type CalendarRecord,
  updateCalendarWithFile
} from '../services/calendarsService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseCalendarFilesBucket } from '../lib/supabase';

const currentYear = new Date().getFullYear();

const initialForm: CalendarInput = {
  programLevel: 'Undergraduate',
  year: currentYear
};

export function Calendars() {
  const [records, setRecords] = useState<CalendarRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<CalendarInput>(initialForm);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [editingRecord, setEditingRecord] = useState<CalendarRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarRecord | null>(null);

  useEffect(() => {
    void loadCalendars();
  }, []);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 2 }, (_, index) => currentYear + index);
  }, []);

  const groupedByProgramLevel = useMemo(() => {
    const grouped: Record<string, CalendarRecord[]> = {
      Undergraduate: [],
      Postgraduate: [],
      'Professional Diplomas': []
    };

    for (const record of records) {
      if (!grouped[record.program_level]) {
        grouped[record.program_level] = [];
      }
      grouped[record.program_level].push(record);
    }

    return grouped;
  }, [records]);

  async function loadCalendars(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listCalendarsForYear(currentYear);
      setRecords(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load calendars.');
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

  function startEdit(record: CalendarRecord): void {
    setEditingRecord(record);
    setSubmitError('');
    setForm({
      programLevel: record.program_level,
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
        await updateCalendarWithFile(editingRecord.id, form, {
          pdfFile: selectedPdfFile,
          existingFilePath: editingRecord.file_path
        });
      } else {
        if (!selectedPdfFile) {
          setSubmitError('Please attach a calendar PDF file.');
          setIsSaving(false);
          return;
        }
        await createCalendar(form, selectedPdfFile);
      }

      await loadCalendars();
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save calendar.');
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
      await deleteCalendar(deleteTarget.id, deleteTarget.file_path);
      if (editingRecord?.id === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      await loadCalendars();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete calendar.');
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Calendar Management</h1>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              {editingRecord ? 'Edit Calendar' : 'Create Calendar'}
            </h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">
                  Program Level
                </label>
                <select
                  value={form.programLevel}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, programLevel: event.target.value as CalendarInput['programLevel'] }))
                  }
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {programLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
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
                <label className="block text-sm font-medium text-must-text-primary mb-2">Calendar PDF</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Choose PDF file</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSelectedPdfFile(file);
                    }}
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

              {form.year !== currentYear ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You are editing {form.year}. The right panel shows calendars for {currentYear} only.
                </p>
              ) : null}

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isSaving}
                  icon={editingRecord ? undefined : <PlusIcon className="w-4 h-4" />}
                >
                  {isSaving ? 'Saving...' : editingRecord ? 'Update Calendar' : 'Create Calendar'}
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
              <h2 className="text-lg font-semibold text-must-text-primary">{currentYear} Calendars</h2>
            </CardHeader>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading calendars...</CardContent>
            </Card>
          ) : null}

          {!isLoading && records.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">
                No calendars yet for {currentYear}.
              </CardContent>
            </Card>
          ) : null}

          {!isLoading &&
            programLevels.map((level) => (
              <Card key={level}>
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold text-must-text-primary">{level}</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groupedByProgramLevel[level]?.length ? (
                    groupedByProgramLevel[level].map((record) => {
                      const pdfUrl = getPublicFileUrl(supabaseCalendarFilesBucket, record.file_path);

                      return (
                        <Card key={record.id} className="hover:border-must-green/40 transition-colors">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-must-text-primary">{record.program_level}</p>
                              <p className="text-xs text-must-text-secondary mt-1">
                                Year: {record.year}
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

                            <div className="flex gap-2 shrink-0">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={<Edit2Icon className="w-4 h-4" />}
                                onClick={() => startEdit(record)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                icon={<Trash2Icon className="w-4 h-4" />}
                                onClick={() => setDeleteTarget(record)}
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <p className="text-sm text-must-text-secondary">No calendars in {level}.</p>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Calendar"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.program_level} for ${deleteTarget.year}? This action cannot be undone.`
            : 'Delete this calendar?'
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

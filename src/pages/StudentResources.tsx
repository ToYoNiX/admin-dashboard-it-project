import React, { useEffect, useState } from 'react';
import {
  DownloadIcon,
  FileTextIcon,
  LinkIcon,
  PlayCircleIcon,
  SchoolIcon,
  Trash2Icon,
  UploadIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  createStudentResource,
  deleteStudentResource,
  listStudentResources,
  studentResourceCategories,
  studentResourceTypes,
  type StudentResourceInput,
  type StudentResourceRecord,
  updateStudentResource
} from '../services/studentResourcesService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseResourcesFilesBucket } from '../lib/supabase';

const initialForm: StudentResourceInput = {
  title: '',
  description: '',
  category: 'Other / Untagged',
  resourceType: 'file',
  resourceUrl: '',
  duration: ''
};

function labelizeType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function StudentResources() {
  const [records, setRecords] = useState<StudentResourceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState('All');
  const [form, setForm] = useState<StudentResourceInput>(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [editingRecord, setEditingRecord] = useState<StudentResourceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentResourceRecord | null>(null);

  const typeTabs = ['All', 'File', 'Video', 'Link'];

  useEffect(() => {
    void loadResources();
  }, []);

  async function loadResources(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listStudentResources();
      setRecords(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load student resources.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm(): void {
    setForm(initialForm);
    setSelectedFile(null);
    setSelectedThumbnailFile(null);
    setEditingRecord(null);
    setSubmitError('');
  }

  function startEdit(record: StudentResourceRecord): void {
    setEditingRecord(record);
    setSubmitError('');
    setSelectedFile(null);
    setSelectedThumbnailFile(null);
    setForm({
      title: record.title,
      description: record.description ?? '',
      category: record.category,
      resourceType: record.resource_type,
      resourceUrl: record.resource_url ?? '',
      duration: record.duration ?? ''
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');

      if (editingRecord) {
        await updateStudentResource(editingRecord.id, form, {
          file: selectedFile,
          thumbnailFile: selectedThumbnailFile,
          existingRecord: editingRecord
        });
      } else {
        await createStudentResource(form, selectedFile, selectedThumbnailFile);
      }

      await loadResources();
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save student resource.');
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
      await deleteStudentResource(deleteTarget);
      if (editingRecord?.id === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      await loadResources();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete student resource.');
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Student Resources</h1>

      <div className="flex border-b border-must-border overflow-x-auto">
        {typeTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTypeTab(tab)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTypeTab === tab ? 'border-must-green text-must-green' : 'border-transparent text-must-text-secondary hover:text-must-text-primary hover:border-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <SchoolIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              {editingRecord ? 'Edit Resource' : 'Add Resource'}
            </h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Enter resource title"
                required
              />

              <Input
                label="Description (Optional)"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Short description shown under title"
              />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value as StudentResourceInput['category'] }))
                  }
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {studentResourceCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Resource Type</label>
                <select
                  value={form.resourceType}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, resourceType: event.target.value as StudentResourceInput['resourceType'] }))
                  }
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {studentResourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {labelizeType(type)}
                    </option>
                  ))}
                </select>
              </div>

              {form.resourceType === 'file' ? (
                <div>
                  <label className="block text-sm font-medium text-must-text-primary mb-2">File</label>
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                    <UploadIcon className="w-4 h-4" />
                    <span className="text-sm">Choose file</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                      required={!editingRecord}
                    />
                  </label>
                  <p className="mt-2 text-xs text-must-text-secondary">
                    {selectedFile ? selectedFile.name : editingRecord ? 'Current file kept unless replaced' : 'No file selected'}
                  </p>
                </div>
              ) : (
                <>
                  <Input
                    label={form.resourceType === 'video' ? 'Video URL' : 'Link URL'}
                    type="url"
                    value={form.resourceUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, resourceUrl: event.target.value }))}
                    placeholder="https://..."
                    icon={<LinkIcon className="w-4 h-4" />}
                    required
                  />

                  {form.resourceType === 'video' ?
                  <>
                      <Input
                        label="Duration (Optional)"
                        value={form.duration}
                        onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
                        placeholder="e.g. 12:30"
                      />

                      <div>
                        <label className="block text-sm font-medium text-must-text-primary mb-2">Thumbnail (Optional)</label>
                        <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                          <UploadIcon className="w-4 h-4" />
                          <span className="text-sm">Choose thumbnail image</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(event) => setSelectedThumbnailFile(event.target.files?.[0] ?? null)}
                          />
                        </label>
                        <p className="mt-2 text-xs text-must-text-secondary">
                          {selectedThumbnailFile ?
                          selectedThumbnailFile.name :
                          editingRecord?.thumbnail_path ?
                          'Current thumbnail kept unless replaced' :
                          'No thumbnail selected'}
                        </p>
                      </div>
                    </> :
                  null}
                </>
              )}

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingRecord ? 'Update Resource' : 'Add Resource'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                  {editingRecord ? 'Cancel Edit' : 'Clear'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="xl:col-span-3 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading resources...</CardContent>
            </Card>
          ) : null}

          {!isLoading && records.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">No student resources found yet.</CardContent>
            </Card>
          ) : null}

          {!isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {records
                .filter((record) => activeTypeTab === 'All' || record.resource_type === activeTypeTab.toLowerCase())
                .map((record) => {
                const fileUrl = getPublicFileUrl(supabaseResourcesFilesBucket, record.file_path);
                const thumbnailUrl = getPublicFileUrl(supabaseResourcesFilesBucket, record.thumbnail_path);
                const actionUrl = record.resource_type === 'file' ? fileUrl : record.resource_url;
                const isFileResource = record.resource_type === 'file';

                return (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-must-text-secondary">
                          {record.resource_type === 'video' ? (
                            <PlayCircleIcon className="w-5 h-5" />
                          ) : record.resource_type === 'link' ? (
                            <LinkIcon className="w-5 h-5" />
                          ) : (
                            <FileTextIcon className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-must-text-primary truncate">{record.title}</h3>
                          {record.description ? <p className="text-xs text-must-text-secondary mt-1 line-clamp-2">{record.description}</p> : null}
                          <p className="text-xs text-must-text-secondary mt-1">{record.category}</p>
                          <p className="text-xs text-must-text-secondary capitalize">{record.resource_type}</p>
                          {record.resource_type === 'video' && record.duration ?
                          <p className="text-xs text-must-text-secondary mt-1">Duration: {record.duration}</p> :
                          null}
                        </div>
                      </div>

                      {record.resource_type === 'video' && thumbnailUrl ?
                      <img
                        src={thumbnailUrl}
                        alt={`${record.title} thumbnail`}
                        className="mt-3 w-full h-32 object-cover rounded-lg border border-must-border" /> :
                      null}

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(record)}>
                          Edit
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={isFileResource ? <DownloadIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                            disabled={!actionUrl}
                            onClick={() => {
                              if (actionUrl) {
                                window.open(actionUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            {isFileResource ? 'Download' : 'Open Link'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            icon={<Trash2Icon className="w-4 h-4" />}
                            onClick={() => setDeleteTarget(record)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
                })}
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Resource"
        message="This will permanently delete the resource. This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}

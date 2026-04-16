import React, { useEffect, useMemo, useState } from 'react';
import {
  Edit2Icon,
  ExternalLinkIcon,
  EyeIcon,
  Maximize2Icon,
  PlusIcon,
  ShapesIcon,
  Trash2Icon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  activityTypes,
  createActivity,
  deleteActivity,
  listActivities,
  type ActivityInput,
  type ActivityRecord,
  updateActivity
} from '../services/activitiesService';
import { supabaseActivityImagesBucket } from '../lib/supabase';
import { getPublicFileUrl } from '../services/storageUtils';

interface ActivityFormErrors {
  title?: string;
  description?: string;
  activityType?: string;
  href?: string;
}

const initialForm: ActivityInput = {
  title: '',
  description: '',
  activityType: 'sport',
  href: ''
};

function getFileName(path: string): string {
  return path.split('/').at(-1) || path;
}

export function Activities() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ActivityInput>(initialForm);
  const [formErrors, setFormErrors] = useState<ActivityFormErrors>({});
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ActivityRecord | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ActivityRecord | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    void loadActivities();
  }, []);

  const selectedImagePreview = useMemo(() => {
    if (!selectedImageFile) {
      return null;
    }
    return URL.createObjectURL(selectedImageFile);
  }, [selectedImageFile]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const existingImagePath = editingRecord?.image_url ?? null;
  const shouldShowExistingImage = Boolean(existingImagePath && !removeExistingImage && !selectedImageFile);

  async function loadActivities(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listActivities();
      setRecords(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load activities.');
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const errors: ActivityFormErrors = {};

    if (!form.title.trim()) {
      errors.title = 'Title is required.';
    }

    if (!form.description.trim()) {
      errors.description = 'Description is required.';
    }

    if (!activityTypes.includes(form.activityType)) {
      errors.activityType = 'Activity type is required.';
    }

    if (form.href && !/^https?:\/\//i.test(form.href)) {
      errors.href = 'Please enter a valid URL starting with http:// or https://';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function resetForm(): void {
    setForm(initialForm);
    setFormErrors({});
    setSelectedImageFile(null);
    setRemoveExistingImage(false);
    setEditingRecord(null);
    setSubmitError('');
  }

  function startEdit(record: ActivityRecord): void {
    setEditingRecord(record);
    setForm({
      title: record.title,
      description: record.description,
      activityType: record.activity_type,
      href: record.href ?? ''
    });
    setFormErrors({});
    setSubmitError('');
    setSelectedImageFile(null);
    setRemoveExistingImage(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError('');

      if (editingRecord) {
        await updateActivity(editingRecord.id, form, {
          imageFile: selectedImageFile,
          existingImagePath,
          removeExistingImage
        });
      } else {
        await createActivity(form, selectedImageFile);
      }

      await loadActivities();
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save activity.');
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
      await deleteActivity(deleteTarget.id, deleteTarget.image_url);
      setDeleteTarget(null);
      if (editingRecord?.id === deleteTarget.id) {
        resetForm();
      }
      await loadActivities();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete activity.');
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Activities Management</h1>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <ShapesIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              {editingRecord ? 'Edit Activity' : 'Create Activity'}
            </h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                error={formErrors.title}
                placeholder="Enter activity title"
                required
              />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Activity Type</label>
                <select
                  value={form.activityType}
                  onChange={(event) => setForm((prev) => ({ ...prev, activityType: event.target.value as ActivityInput['activityType'] }))}
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {formErrors.activityType ? <p className="mt-1 text-sm text-red-500">{formErrors.activityType}</p> : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 focus:ring-2 focus:ring-must-green outline-none min-h-[130px] resize-y"
                  placeholder="Write activity description"
                  required
                />
                {formErrors.description ? (
                  <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                ) : null}
              </div>

              <Input
                label="Link (Optional)"
                type="url"
                value={form.href}
                onChange={(event) => setForm((prev) => ({ ...prev, href: event.target.value }))}
                error={formErrors.href}
                placeholder="https://example.com"
              />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-2">Image (Optional)</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Choose image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSelectedImageFile(file);
                      if (file) {
                        setRemoveExistingImage(false);
                      }
                    }}
                  />
                </label>

                {selectedImagePreview ? (
                  <div className="mt-3 rounded-lg border border-must-border p-3 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-must-text-secondary">Selected image preview</span>
                      <button
                        type="button"
                        onClick={() => setSelectedImageFile(null)}
                        className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
                      >
                        <XIcon className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                    <img src={selectedImagePreview} alt="Preview" className="w-full h-40 object-cover rounded-md" />
                  </div>
                ) : null}

                {shouldShowExistingImage && existingImagePath ? (
                  <div className="mt-3 rounded-lg border border-must-border p-3 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-must-text-secondary">Existing image</p>
                      <button
                        type="button"
                        onClick={() => setRemoveExistingImage(true)}
                        className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
                      >
                        <XIcon className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                    <p className="text-sm text-must-text-primary mt-1 break-all">{getFileName(existingImagePath)}</p>
                  </div>
                ) : null}
              </div>

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving} icon={editingRecord ? undefined : <PlusIcon className="w-4 h-4" />}>
                  {isSaving ? 'Saving...' : editingRecord ? 'Update Activity' : 'Create Activity'}
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
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading activity records...</CardContent>
            </Card>
          ) : null}

          {!isLoading && records.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">No activities found yet.</CardContent>
            </Card>
          ) : null}

          {!isLoading &&
            records.map((record) => (
              <Card key={record.id} className="hover:border-must-green/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      {record.image_url ? (
                        <button
                          type="button"
                          className="relative group rounded-lg overflow-hidden border border-must-border w-36 h-24 shrink-0"
                          onClick={() => {
                            const url = getPublicFileUrl(supabaseActivityImagesBucket, record.image_url);
                            if (url) {
                              setPreviewImageUrl(url);
                            }
                          }}
                        >
                          <img
                            src={getPublicFileUrl(supabaseActivityImagesBucket, record.image_url) || undefined}
                            alt={record.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </span>
                        </button>
                      ) : (
                        <div className="w-36 h-24 shrink-0 rounded-lg border border-must-border bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary flex items-center justify-center text-xs">
                          No image
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-must-text-primary">{record.title}</h3>
                          <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-must-text-secondary capitalize">
                            {record.activity_type}
                          </span>
                        </div>
                        <p className="text-sm text-must-text-secondary mt-2 whitespace-pre-line">{record.description}</p>

                        {record.href ? (
                          <a
                            href={record.href}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-sm text-must-green hover:underline"
                          >
                            <ExternalLinkIcon className="w-4 h-4" />
                            Open link
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
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
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Activity"
        message="This will permanently delete the activity and its uploaded image. This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      {previewImageUrl ? (
        <div className="fixed inset-0 z-[70] bg-black/75 flex items-center justify-center p-4" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-5xl w-full" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
              onClick={() => setPreviewImageUrl(null)}
            >
              <XIcon className="w-5 h-5" />
            </button>
            <img src={previewImageUrl} alt="Activity preview" className="w-full max-h-[85vh] object-contain rounded-lg" />
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded inline-flex items-center gap-1">
              <Maximize2Icon className="w-3 h-3" />
              Preview
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

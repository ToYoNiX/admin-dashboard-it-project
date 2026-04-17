import React, { useEffect, useMemo, useState } from 'react';
import {
  Edit2Icon,
  ExternalLinkIcon,
  EyeIcon,
  Maximize2Icon,
  NewspaperIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { createNews, deleteNews, listNews, type NewsInput, type NewsRecord, updateNews } from '../services/newsService';
import { supabaseNewsImagesBucket } from '../lib/supabase';
import { getPublicFileUrl } from '../services/storageUtils';

interface NewsFormErrors {
  title?: string;
  description?: string;
  href?: string;
}

const initialForm: NewsInput = {
  title: '',
  description: '',
  href: ''
};

function getFileName(path: string): string {
  const segments = path.split('/');
  return segments[segments.length - 1] || path;
}

function getRecordImagePaths(record: Pick<NewsRecord, 'image_url' | 'image_urls'> | null): string[] {
  if (!record) {
    return [];
  }

  const paths = Array.isArray(record.image_urls) ? record.image_urls : [];
  if (paths.length > 0) {
    return paths;
  }

  return record.image_url ? [record.image_url] : [];
}

export function News() {
  const [records, setRecords] = useState<NewsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<NewsInput>(initialForm);
  const [formErrors, setFormErrors] = useState<NewsFormErrors>({});
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [removedExistingImagePaths, setRemovedExistingImagePaths] = useState<string[]>([]);
  const [editingRecord, setEditingRecord] = useState<NewsRecord | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<NewsRecord | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    void loadNews();
  }, []);

  const selectedImagePreviews = useMemo(
    () => selectedImageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [selectedImageFiles]
  );

  useEffect(() => {
    return () => {
      for (const preview of selectedImagePreviews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [selectedImagePreviews]);

  const existingImagePaths = useMemo(() => getRecordImagePaths(editingRecord), [editingRecord]);
  const visibleExistingImagePaths = useMemo(
    () => existingImagePaths.filter((path) => !removedExistingImagePaths.includes(path)),
    [existingImagePaths, removedExistingImagePaths]
  );

  async function loadNews(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listNews();
      setRecords(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load news.');
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const errors: NewsFormErrors = {};

    if (!form.title.trim()) {
      errors.title = 'Title is required.';
    }

    if (!form.description.trim()) {
      errors.description = 'Description is required.';
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
    setSelectedImageFiles([]);
    setRemovedExistingImagePaths([]);
    setEditingRecord(null);
    setSubmitError('');
  }

  function startEdit(record: NewsRecord): void {
    setEditingRecord(record);
    setForm({
      title: record.title,
      description: record.description,
      href: record.href ?? ''
    });
    setFormErrors({});
    setSubmitError('');
    setSelectedImageFiles([]);
    setRemovedExistingImagePaths([]);
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
        await updateNews(editingRecord.id, form, {
          imageFiles: selectedImageFiles,
          existingImagePaths,
          removedImagePaths: removedExistingImagePaths
        });
      } else {
        await createNews(form, selectedImageFiles);
      }

      await loadNews();
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save news item.');
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
      await deleteNews(deleteTarget.id, getRecordImagePaths(deleteTarget));
      setDeleteTarget(null);
      if (editingRecord?.id === deleteTarget.id) {
        resetForm();
      }
      await loadNews();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete news item.');
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">News Management</h1>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <NewspaperIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              {editingRecord ? 'Edit News Item' : 'Create News Item'}
            </h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                error={formErrors.title}
                placeholder="Enter news title"
                required
              />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 focus:ring-2 focus:ring-must-green outline-none min-h-[130px] resize-y"
                  placeholder="Write news description"
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
                <label className="block text-sm font-medium text-must-text-primary mb-2">Images (Optional)</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Choose one or more images</span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      if (files.length > 0) {
                        setSelectedImageFiles(files);
                      }
                    }}
                  />
                </label>

                {selectedImagePreviews.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-must-border p-3 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-must-text-secondary">
                        Selected images ({selectedImagePreviews.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedImageFiles([])}
                        className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
                      >
                        <XIcon className="w-3 h-3" />
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedImagePreviews.map((preview, index) => (
                        <div key={`${preview.file.name}-${index}`} className="relative rounded-md overflow-hidden border border-must-border">
                          <img src={preview.url} alt={`Selected preview ${index + 1}`} className="w-full h-28 object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImageFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
                            }}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                            aria-label={`Remove selected image ${index + 1}`}
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {visibleExistingImagePaths.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-must-border p-3 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-must-text-secondary">
                        Existing images ({visibleExistingImagePaths.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setRemovedExistingImagePaths([...existingImagePaths])}
                        className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
                      >
                        <XIcon className="w-3 h-3" />
                        Remove all
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {visibleExistingImagePaths.map((path) => (
                        <div key={path} className="flex items-center justify-between gap-3 rounded-md border border-must-border px-2 py-1.5">
                          <p className="text-sm text-must-text-primary break-all">{getFileName(path)}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setRemovedExistingImagePaths((prev) => (prev.includes(path) ? prev : [...prev, path]));
                            }}
                            className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1 shrink-0"
                          >
                            <XIcon className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving} icon={editingRecord ? undefined : <PlusIcon className="w-4 h-4" />}>
                  {isSaving ? 'Saving...' : editingRecord ? 'Update News' : 'Create News'}
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
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading news records...</CardContent>
            </Card>
          ) : null}

          {!isLoading && records.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">No news items found yet.</CardContent>
            </Card>
          ) : null}

          {!isLoading &&
            records.map((record) => (
              <Card key={record.id} className="hover:border-must-green/40 transition-colors">
                <CardContent className="p-5">
                  {(() => {
                    const imagePaths = getRecordImagePaths(record);
                    const imageUrls = imagePaths
                      .map((path) => getPublicFileUrl(supabaseNewsImagesBucket, path))
                      .filter((url): url is string => Boolean(url));

                    return (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          {imageUrls.length > 0 ? (
                            <button
                              type="button"
                              className="relative group rounded-lg overflow-hidden border border-must-border w-36 h-24 shrink-0"
                              onClick={() => setPreviewImageUrl(imageUrls[0])}
                            >
                              <img src={imageUrls[0]} alt={record.title} className="w-full h-full object-cover" />
                              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                                <EyeIcon className="w-4 h-4 mr-1" />
                                View
                              </span>
                              {imageUrls.length > 1 ? (
                                <span className="absolute top-2 right-2 rounded-full bg-black/70 text-white text-[10px] px-2 py-0.5">
                                  +{imageUrls.length - 1}
                                </span>
                              ) : null}
                            </button>
                          ) : (
                            <div className="w-36 h-24 shrink-0 rounded-lg border border-must-border bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary flex items-center justify-center text-xs">
                              No image
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-must-text-primary">{record.title}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full border border-must-border text-must-text-secondary">
                                {imageUrls.length} {imageUrls.length === 1 ? 'image' : 'images'}
                              </span>
                            </div>
                            <p className="text-sm text-must-text-secondary mt-2 whitespace-pre-line">{record.description}</p>

                            {imageUrls.length > 1 ? (
                              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                                {imageUrls.map((imageUrl, index) => (
                                  <button
                                    key={`${record.id}-image-${index + 1}`}
                                    type="button"
                                    className="rounded-md overflow-hidden border border-must-border w-16 h-12 shrink-0"
                                    onClick={() => setPreviewImageUrl(imageUrl)}
                                    aria-label={`Preview image ${index + 1} for ${record.title}`}
                                  >
                                    <img src={imageUrl} alt={`${record.title} ${index + 1}`} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            ) : null}

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
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete News Item"
        message="This will permanently delete the news item and all its uploaded images. This action cannot be undone."
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
            <img src={previewImageUrl} alt="News preview" className="w-full max-h-[85vh] object-contain rounded-lg" />
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

import React, { useEffect, useState } from 'react';
import { ExternalLinkIcon, ImageIcon, Link2Icon, Trash2Icon, UploadIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  createImportantLink,
  deleteImportantLink,
  listImportantLinks,
  updateImportantLink,
  type ImportantLinkInput,
  type ImportantLinkRecord
} from '../services/importantLinksService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseImportantLinksImagesBucket } from '../lib/supabase';

const initialForm: ImportantLinkInput = {
  title: '',
  description: '',
  href: ''
};

export function ImportantLinks() {
  const [records, setRecords] = useState<ImportantLinkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<ImportantLinkInput>(initialForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [editingRecord, setEditingRecord] = useState<ImportantLinkRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImportantLinkRecord | null>(null);

  useEffect(() => {
    void loadLinks();
  }, []);

  async function loadLinks(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      setRecords(await listImportantLinks());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load important links.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm(): void {
    setForm(initialForm);
    setSelectedImage(null);
    setEditingRecord(null);
    setSubmitError('');
  }

  function startEdit(record: ImportantLinkRecord): void {
    setEditingRecord(record);
    setForm({
      title: record.title,
      description: record.description,
      href: record.href
    });
    setSelectedImage(null);
    setSubmitError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');

      if (editingRecord) {
        await updateImportantLink(editingRecord.id, form, {
          imageFile: selectedImage,
          existingRecord: editingRecord
        });
      } else {
        await createImportantLink(form, selectedImage);
      }

      await loadLinks();
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save important link.');
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
      await deleteImportantLink(deleteTarget);
      if (editingRecord?.id === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      await loadLinks();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete important link.');
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Important Links</h1>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <Link2Icon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              {editingRecord ? 'Edit Link' : 'Add Link'}
            </h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Enter title"
                required
              />
              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 focus:ring-2 focus:ring-must-green outline-none min-h-[120px] resize-y"
                  placeholder="Write description"
                  required
                />
              </div>
              <Input
                label="Link"
                type="url"
                value={form.href}
                onChange={(event) => setForm((prev) => ({ ...prev, href: event.target.value }))}
                placeholder="https://example.com"
                required
              />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-2">Photo</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Choose image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                  />
                </label>
                <p className="mt-2 text-xs text-must-text-secondary">
                  {selectedImage ? selectedImage.name : editingRecord?.image_path ? 'Current image kept unless replaced' : 'No image selected'}
                </p>
              </div>

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingRecord ? 'Update Link' : 'Add Link'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                  {editingRecord ? 'Cancel Edit' : 'Clear'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="xl:col-span-3 space-y-4">
          {isLoading ? <Card><CardContent className="p-6 text-sm text-must-text-secondary">Loading important links...</CardContent></Card> : null}
          {!isLoading && records.length === 0 ? <Card><CardContent className="p-6 text-sm text-must-text-secondary">No important links found yet.</CardContent></Card> : null}
          {!isLoading && records.map((record) => {
            const imageUrl = getPublicFileUrl(supabaseImportantLinksImagesBucket, record.image_path);

            return (
              <Card key={record.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="md:w-44">
                      {imageUrl ? (
                        <img src={imageUrl} alt={record.title} className="h-32 w-full rounded-xl border border-must-border object-cover" />
                      ) : (
                        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-must-border bg-slate-50 text-sm text-must-text-secondary dark:bg-slate-800/30">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <h3 className="text-lg font-semibold text-must-text-primary">{record.title}</h3>
                      <p className="text-sm text-must-text-secondary whitespace-pre-wrap">{record.description}</p>
                      <a href={record.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-must-green hover:underline">
                        <ExternalLinkIcon className="w-4 h-4" />
                        Open link
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 rounded-xl border border-must-border bg-slate-50/70 p-3 dark:bg-slate-800/30">
                    <Button type="button" size="sm" variant="outline" onClick={() => startEdit(record)}>
                      Edit Link
                    </Button>
                    <Button type="button" size="sm" variant="danger" icon={<Trash2Icon className="w-4 h-4" />} onClick={() => setDeleteTarget(record)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Important Link"
        message={`Delete "${deleteTarget?.title ?? ''}"? This action cannot be undone.`}
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

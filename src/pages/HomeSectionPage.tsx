import React, { useEffect, useState } from 'react';
import {
  DownloadIcon,
  FileTextIcon,
  ImageIcon,
  InfoIcon,
  Trash2Icon,
  UploadIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  deleteHomeSection,
  getHomeSection,
  upsertHomeDocumentSection,
  upsertHomeTextImageSection,
  type HomeSectionKey,
  type HomeSectionRecord
} from '../services/homeSectionsService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseHomeFilesBucket, supabaseHomeImagesBucket } from '../lib/supabase';

interface HomeSectionPageProps {
  pageTitle: string;
  sectionKey: HomeSectionKey;
  mode: 'text-image' | 'document';
}

export function HomeSectionPage({ pageTitle, sectionKey, mode }: HomeSectionPageProps) {
  const [record, setRecord] = useState<HomeSectionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [contentText, setContentText] = useState('');
  const [title, setTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    void loadSection();
  }, [sectionKey]);

  async function loadSection(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await getHomeSection(sectionKey);
      setRecord(data);
      setTitle(data?.title ?? '');
      setContentText(data?.content_text ?? '');
      setSelectedImage(null);
      setSelectedPdf(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load section.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');

      if (mode === 'text-image') {
        if (!contentText.trim()) {
          throw new Error('Please enter the text.');
        }

        await upsertHomeTextImageSection(sectionKey as 'about-sector' | 'mission' | 'vision', {
          contentText
        }, {
          imageFile: selectedImage,
          existingRecord: record
        });
      } else {
        if (!title.trim()) {
          throw new Error('Please enter the title.');
        }

        if (!selectedPdf && !record?.file_path) {
          throw new Error('Please choose a PDF file.');
        }

        await upsertHomeDocumentSection({
          title
        }, {
          pdfFile: selectedPdf,
          existingRecord: record
        });
      }

      await loadSection();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save section.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!record) {
      return;
    }

    try {
      setSubmitError('');
      await deleteHomeSection(record);
      setDeleteOpen(false);
      await loadSection();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete section.');
    }
  }

  const imageUrl = getPublicFileUrl(supabaseHomeImagesBucket, record?.image_path);
  const pdfUrl = getPublicFileUrl(supabaseHomeFilesBucket, record?.file_path);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">{pageTitle}</h1>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <InfoIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">Manage Section</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'document' ? (
                <Input
                  label="Title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter sector plan title"
                  required
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-must-text-primary mb-1">Text</label>
                  <textarea
                    value={contentText}
                    onChange={(event) => setContentText(event.target.value)}
                    rows={10}
                    placeholder={`Write the ${pageTitle.toLowerCase()} text here`}
                    className="w-full rounded-xl border border-must-border bg-must-surface px-4 py-3 text-sm text-must-text-primary outline-none focus:ring-2 focus:ring-must-green"
                  />
                </div>
              )}

              {mode === 'text-image' ? (
                <div>
                  <label className="block text-sm font-medium text-must-text-primary mb-2">Image</label>
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
                    {selectedImage ? selectedImage.name : record?.image_path ? 'Current image kept unless replaced' : 'No image selected'}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-must-text-primary mb-2">PDF</label>
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                    <UploadIcon className="w-4 h-4" />
                    <span className="text-sm">Choose PDF</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(event) => setSelectedPdf(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="mt-2 text-xs text-must-text-secondary">
                    {selectedPdf ? selectedPdf.name : record?.file_path ? 'Current PDF kept unless replaced' : 'No PDF selected'}
                  </p>
                </div>
              )}

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Section'}
                </Button>
                {record ? (
                  <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)} disabled={isSaving}>
                    Delete
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="xl:col-span-3 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading section...</CardContent>
            </Card>
          ) : null}

          {!isLoading && !record ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">No content saved yet for this section.</CardContent>
            </Card>
          ) : null}

          {!isLoading && record ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                {mode === 'document' ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-must-text-secondary">
                        <FileTextIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-must-text-primary">{record.title}</h3>
                      </div>
                    </div>
                    {pdfUrl ? (
                      <Button
                        type="button"
                        variant="secondary"
                        icon={<DownloadIcon className="w-4 h-4" />}
                        onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                      >
                        Open PDF
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <>
                    {imageUrl ? (
                      <img src={imageUrl} alt={pageTitle} className="h-56 w-full rounded-xl border border-must-border object-cover" />
                    ) : (
                      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-must-border bg-slate-50 text-sm text-must-text-secondary dark:bg-slate-800/30">
                        No image
                      </div>
                    )}
                    <div className="whitespace-pre-wrap rounded-xl border border-must-border bg-slate-50/70 p-4 text-sm leading-7 text-must-text-primary dark:bg-slate-800/30">
                      {record.content_text || 'No text yet.'}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete Section"
        message={`Delete ${pageTitle}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          void handleDelete();
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

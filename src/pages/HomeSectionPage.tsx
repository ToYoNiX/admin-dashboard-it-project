import React, { useEffect, useState } from 'react';
import {
  BoldIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  Heading1Icon,
  Heading2Icon,
  ImageIcon,
  InfoIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  PaletteIcon,
  Trash2Icon,
  UnderlineIcon,
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
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const [record, setRecord] = useState<HomeSectionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [contentText, setContentText] = useState('');
  const [title, setTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const colorOptions = ['#111827', '#166534', '#1d4ed8', '#b45309', '#b91c1c', '#7c3aed'];

  useEffect(() => {
    void loadSection();
  }, [sectionKey]);

  useEffect(() => {
    if (mode === 'text-image' && editorRef.current && editorRef.current.innerHTML !== contentText) {
      editorRef.current.innerHTML = contentText;
    }
  }, [contentText, mode]);

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
      setPreviewMode(false);
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
        const nextContent = (editorRef.current?.innerHTML ?? contentText).trim();

        if (!nextContent || nextContent === '<br>') {
          throw new Error('Please enter the text.');
        }

        await upsertHomeTextImageSection(sectionKey as 'about-sector' | 'mission' | 'vision', {
          contentText: nextContent
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

  function syncEditorHtml(): void {
    setContentText(editorRef.current?.innerHTML ?? '');
  }

  function applyEditorCommand(command: string, value?: string): void {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorHtml();
  }

  function applyBlockFormat(tag: 'p' | 'h2' | 'h3'): void {
    applyEditorCommand('formatBlock', tag);
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-must-text-primary">Text</label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={<EyeIcon className="w-4 h-4" />}
                      onClick={() => setPreviewMode((prev) => !prev)}
                    >
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                  </div>

                  {!previewMode ? (
                    <>
                      <div className="space-y-3 rounded-xl border border-must-border bg-slate-50/80 p-3 dark:bg-slate-800/30">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" icon={<Heading1Icon className="w-4 h-4" />} onClick={() => applyBlockFormat('h2')}>
                            Heading
                          </Button>
                          <Button type="button" size="sm" variant="outline" icon={<Heading2Icon className="w-4 h-4" />} onClick={() => applyBlockFormat('h3')}>
                            Subheading
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => applyBlockFormat('p')}>
                            Normal Text
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" icon={<BoldIcon className="w-4 h-4" />} onClick={() => applyEditorCommand('bold')}>
                            Bold
                          </Button>
                          <Button type="button" size="sm" variant="outline" icon={<ItalicIcon className="w-4 h-4" />} onClick={() => applyEditorCommand('italic')}>
                            Italic
                          </Button>
                          <Button type="button" size="sm" variant="outline" icon={<UnderlineIcon className="w-4 h-4" />} onClick={() => applyEditorCommand('underline')}>
                            Underline
                          </Button>
                          <Button type="button" size="sm" variant="outline" icon={<ListIcon className="w-4 h-4" />} onClick={() => applyEditorCommand('insertUnorderedList')}>
                            Bullet List
                          </Button>
                          <Button type="button" size="sm" variant="outline" icon={<ListOrderedIcon className="w-4 h-4" />} onClick={() => applyEditorCommand('insertOrderedList')}>
                            Numbered List
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => applyEditorCommand('removeFormat')}>
                            Clear Format
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-lg border border-must-border bg-must-surface px-3 py-1.5 text-sm text-must-text-primary">
                            <PaletteIcon className="w-4 h-4" />
                            Custom Color
                            <input
                              type="color"
                              className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                              onChange={(event) => applyEditorCommand('foreColor', event.target.value)}
                            />
                          </span>
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              type="button"
                              aria-label={`Use color ${color}`}
                              className="h-8 w-8 rounded-full border border-must-border transition-transform hover:scale-105"
                              style={{ backgroundColor: color }}
                              onClick={() => applyEditorCommand('foreColor', color)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-dashed border-must-border bg-amber-50/60 px-3 py-2 text-xs text-must-text-secondary dark:bg-slate-800/20">
                        Tip: write normally first, then highlight the text and choose style or color.
                      </div>

                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={syncEditorHtml}
                        className="min-h-[280px] rounded-xl border border-must-border bg-must-surface px-4 py-3 text-sm leading-7 text-must-text-primary outline-none focus:ring-2 focus:ring-must-green"
                        data-placeholder={`Write the ${pageTitle.toLowerCase()} text here`}
                      />
                    </>
                  ) : (
                    <div
                      className="min-h-[280px] rounded-xl border border-must-border bg-slate-50/70 px-4 py-3 text-sm text-must-text-primary dark:bg-slate-800/30"
                      dangerouslySetInnerHTML={{ __html: contentText || '<p class="text-slate-400">Nothing to preview yet.</p>' }}
                    />
                  )}
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

            {mode === 'text-image' ? (
              <style>
                {`
                  [contenteditable="true"][data-placeholder]:empty::before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                  }

                  [contenteditable="true"] h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0.75rem 0;
                  }

                  [contenteditable="true"] h3 {
                    font-size: 1.05rem;
                    font-weight: 600;
                    margin: 0.65rem 0;
                  }

                  [contenteditable="true"] ul,
                  [contenteditable="true"] ol {
                    margin: 0.75rem 0;
                    padding-left: 1.5rem;
                  }

                  [contenteditable="true"] p {
                    margin: 0.5rem 0;
                  }
                `}
              </style>
            ) : null}
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
                    <div
                      className="rounded-xl border border-must-border bg-slate-50/70 p-4 text-sm leading-7 text-must-text-primary dark:bg-slate-800/30"
                      dangerouslySetInnerHTML={{ __html: record.content_text || '<p>No text yet.</p>' }}
                    />
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

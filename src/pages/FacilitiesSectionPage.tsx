import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BoldIcon,
  EyeIcon,
  FileTextIcon,
  Heading1Icon,
  Heading2Icon,
  ImageIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  PaletteIcon,
  PlusIcon,
  Trash2Icon,
  UnderlineIcon,
  UploadIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Pagination } from '../components/ui/Pagination';
import {
  createFacilitiesSection,
  deleteFacilitiesSection,
  listFacilitiesSections,
  updateFacilitiesSection,
  type FacilitiesInput,
  type FacilitiesRecord,
  type FacilitiesSectionType
} from '../services/facilitiesService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseFacilitiesImagesBucket } from '../lib/supabase';

interface FacilitiesSectionPageProps {
  sectionType: FacilitiesSectionType;
  pageTitle: string;
  emptyStateLabel: string;
}

const initialForm: FacilitiesInput = {
  title: '',
  contentHtml: ''
};

const colorOptions = ['#111827', '#166534', '#1d4ed8', '#b45309', '#b91c1c', '#7c3aed'];

export function FacilitiesSectionPage({
  sectionType,
  pageTitle,
  emptyStateLabel
}: FacilitiesSectionPageProps) {
  const ITEMS_PER_PAGE = 4;
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [records, setRecords] = useState<FacilitiesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<FacilitiesInput>(initialForm);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
  const [retainedGalleryPaths, setRetainedGalleryPaths] = useState<string[]>([]);
  const [editingRecord, setEditingRecord] = useState<FacilitiesRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FacilitiesRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    void loadRecords();
  }, [sectionType]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== form.contentHtml) {
      editorRef.current.innerHTML = form.contentHtml;
    }
  }, [form.contentHtml]);

  async function loadRecords(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listFacilitiesSections(sectionType);
      setRecords(data);
      setCurrentPage(1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load facilities content.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm(): void {
    setForm(initialForm);
    setSelectedThumbnailFile(null);
    setSelectedGalleryFiles([]);
    setRetainedGalleryPaths([]);
    setEditingRecord(null);
    setPreviewMode(false);
    setSubmitError('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  }

  function startEdit(record: FacilitiesRecord): void {
    setEditingRecord(record);
    setForm({
      title: record.title,
      contentHtml: record.content_html
    });
    setSelectedThumbnailFile(null);
    setSelectedGalleryFiles([]);
    setRetainedGalleryPaths(record.gallery_paths);
    setPreviewMode(false);
    setSubmitError('');
  }

  function syncEditorHtml(): void {
    setForm((prev) => ({
      ...prev,
      contentHtml: editorRef.current?.innerHTML ?? ''
    }));
  }

  function applyEditorCommand(command: string, value?: string): void {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorHtml();
  }

  function applyBlockFormat(tag: 'p' | 'h2' | 'h3'): void {
    applyEditorCommand('formatBlock', tag);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');

      const cleanTitle = form.title.trim();
      const cleanContent = (editorRef.current?.innerHTML ?? form.contentHtml).trim();

      if (!cleanTitle) {
        throw new Error('Please enter a title.');
      }

      if (!cleanContent || cleanContent === '<br>') {
        throw new Error('Please enter the content.');
      }

      const payload: FacilitiesInput = {
        title: cleanTitle,
        contentHtml: cleanContent
      };

      if (editingRecord) {
        await updateFacilitiesSection(editingRecord.id, payload, {
          existingRecord: editingRecord,
          retainedGalleryPaths,
          thumbnailFile: selectedThumbnailFile,
          galleryFiles: selectedGalleryFiles
        });
      } else {
        await createFacilitiesSection(sectionType, payload, selectedThumbnailFile, selectedGalleryFiles);
      }

      await loadRecords();
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save facilities content.');
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
      await deleteFacilitiesSection(deleteTarget);
      if (editingRecord?.id === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      await loadRecords();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete facilities content.');
    }
  }

  const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE));
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return records.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">{pageTitle}</h1>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              {editingRecord ? 'Edit Content' : 'Add Content'}
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-must-text-primary">Content</label>
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
                        <Button type="button" size="sm" variant="outline" icon={<PlusIcon className="w-4 h-4" />} onClick={() => applyEditorCommand('insertParagraph')}>
                          New Paragraph
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
                      Tip: write normally first, then highlight text and click a style or color. Use Heading and Subheading to structure the content clearly.
                    </div>

                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={syncEditorHtml}
                      className="min-h-[280px] rounded-xl border border-must-border bg-must-surface px-4 py-3 text-sm leading-7 text-must-text-primary outline-none focus:ring-2 focus:ring-must-green"
                      data-placeholder="Write the facilities content here. You can add headings, bold text, colored text, and lists."
                    />
                  </>
                ) : (
                  <div
                    className="min-h-[280px] rounded-xl border border-must-border bg-slate-50/70 px-4 py-3 text-sm text-must-text-primary dark:bg-slate-800/30"
                    dangerouslySetInnerHTML={{ __html: form.contentHtml || '<p class="text-slate-400">Nothing to preview yet.</p>' }}
                  />
                )}
              </div>

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

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-2">Thumbnail Photo</label>
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
                  {selectedThumbnailFile
                    ? selectedThumbnailFile.name
                    : editingRecord?.thumbnail_path
                      ? 'Current thumbnail kept unless replaced'
                      : 'No thumbnail selected'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-2">Gallery Photos</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Choose multiple gallery images</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(event) => setSelectedGalleryFiles(Array.from(event.target.files ?? []))}
                  />
                </label>
                <p className="mt-2 text-xs text-must-text-secondary">
                  {selectedGalleryFiles.length > 0
                    ? `${selectedGalleryFiles.length} new image(s) selected`
                    : 'No new gallery images selected'}
                </p>
              </div>

              {editingRecord && retainedGalleryPaths.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-must-text-primary">Current Gallery</p>
                  <div className="grid grid-cols-2 gap-3">
                    {retainedGalleryPaths.map((path) => {
                      const imageUrl = getPublicFileUrl(supabaseFacilitiesImagesBucket, path);

                      return (
                        <div key={path} className="rounded-xl border border-must-border p-2">
                          {imageUrl ? (
                            <img src={imageUrl} alt="Gallery item" className="h-24 w-full rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-must-text-secondary">
                              Preview unavailable
                            </div>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="mt-2 w-full"
                            onClick={() => setRetainedGalleryPaths((prev) => prev.filter((item) => item !== path))}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingRecord ? 'Update Content' : 'Add Content'}
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
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading content...</CardContent>
            </Card>
          ) : null}

          {!isLoading && records.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">{emptyStateLabel}</CardContent>
            </Card>
          ) : null}

          {!isLoading && records.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4">
                {paginatedRecords.map((record) => {
                  const thumbnailUrl = getPublicFileUrl(supabaseFacilitiesImagesBucket, record.thumbnail_path);
                  const galleryUrls = record.gallery_paths
                    .map((path) => getPublicFileUrl(supabaseFacilitiesImagesBucket, path))
                    .filter((value): value is string => Boolean(value));

                  return (
                    <Card key={record.id}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col gap-4 md:flex-row">
                          <div className="md:w-56">
                            {thumbnailUrl ? (
                              <img
                                src={thumbnailUrl}
                                alt={`${record.title} thumbnail`}
                                className="h-40 w-full rounded-xl border border-must-border object-cover"
                              />
                            ) : (
                              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-must-border bg-slate-50 text-sm text-must-text-secondary dark:bg-slate-800/30">
                                No thumbnail
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-3">
                            <h3 className="text-lg font-semibold text-must-text-primary">{record.title}</h3>
                            <div
                              className="prose prose-sm max-w-none text-must-text-primary"
                              dangerouslySetInnerHTML={{ __html: record.content_html }}
                            />
                          </div>
                        </div>

                        {galleryUrls.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-must-text-primary">Photo Gallery</p>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                              {galleryUrls.map((url) => (
                                <img key={url} src={url} alt="Facility gallery" className="h-24 w-full rounded-lg border border-must-border object-cover" />
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2 rounded-xl border border-must-border bg-slate-50/70 p-3 dark:bg-slate-800/30">
                          <Button type="button" size="sm" variant="outline" onClick={() => startEdit(record)}>
                            Edit Content
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={records.length}
                itemLabel="items"
                onPageChange={setCurrentPage}
              />
            </>
          ) : null}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Content"
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

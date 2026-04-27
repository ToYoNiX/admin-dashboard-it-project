import React, { useEffect, useMemo, useState } from 'react';
import {
  ExternalLinkIcon,
  PlayCircleIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Pagination } from '../components/ui/Pagination';
import {
  createSmartELearningVideo,
  deleteSmartELearningVideo,
  listSmartELearningVideos,
  smartELearningSourceTypes,
  type SmartELearningInput,
  type SmartELearningRecord
} from '../services/smartELearningService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseResourcesFilesBucket } from '../lib/supabase';

const initialForm: SmartELearningInput = {
  title: '',
  sourceType: 'video',
  sourceUrl: ''
};

type TabMode = 'add' | 'view';

function labelizeSource(type: string): string {
  if (type === 'video') {
    return 'Upload Video';
  }
  if (type === 'link' || type === 'youtube') {
    return 'Link';
  }
  return 'Upload PDF';
}

export function SmartELearning() {
  const ITEMS_PER_PAGE = 6;
  const [activeTab, setActiveTab] = useState<TabMode>('add');
  const [records, setRecords] = useState<SmartELearningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<SmartELearningInput>(initialForm);
  const [selectedSourceFile, setSelectedSourceFile] = useState<File | null>(null);
  const [pdfFileTitle, setPdfFileTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SmartELearningRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void loadRecords();
  }, []);

  async function loadRecords(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listSmartELearningVideos();
      setRecords(data);
      setCurrentPage(1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load smart e-learning sources.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm(): void {
    setForm(initialForm);
    setSelectedSourceFile(null);
    setPdfFileTitle('');
    setSubmitError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');
      await createSmartELearningVideo(form, selectedSourceFile);
      await loadRecords();
      resetForm();
      setActiveTab('view');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save smart e-learning source.');
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
      await deleteSmartELearningVideo(deleteTarget);
      setDeleteTarget(null);
      await loadRecords();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete smart e-learning source.');
    }
  }

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return records;
    }

    return records.filter((record) => record.title.toLowerCase().includes(query));
  }, [records, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredRecords]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Smart E-Learning</h1>

      <div className="flex border-b border-must-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('add')}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'add' ? 'border-must-green text-must-green' : 'border-transparent text-must-text-secondary hover:text-must-text-primary hover:border-slate-300'}`}
        >
          Add
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'view' ? 'border-must-green text-must-green' : 'border-transparent text-must-text-secondary hover:text-must-text-primary hover:border-slate-300'}`}
        >
          View
        </button>
      </div>

      {activeTab === 'add' ? (
        <Card className="max-w-3xl">
          <CardHeader className="flex flex-row items-center gap-2">
            <PlayCircleIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">Add Smart E-Learning Source</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Enter smart e-learning video title"
                required
              />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Source</label>
                <select
                  value={form.sourceType}
                  onChange={(event) => setForm((prev) => ({ ...prev, sourceType: event.target.value as SmartELearningInput['sourceType'] }))}
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {smartELearningSourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {labelizeSource(type)}
                    </option>
                  ))}
                </select>
              </div>

              {form.sourceType === 'link' ? (
                <Input
                  label="Link"
                  type="url"
                  value={form.sourceUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
                  placeholder="https://example.com/file.pdf or https://example.com/page"
                  required
                />
              ) : null}

              {form.sourceType === 'video' ? (
                <div>
                  <label className="block text-sm font-medium text-must-text-primary mb-2">Video File</label>
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                    <UploadIcon className="w-4 h-4" />
                    <span className="text-sm">Choose video</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(event) => setSelectedSourceFile(event.target.files?.[0] ?? null)}
                      required
                    />
                  </label>
                  <p className="mt-2 text-xs text-must-text-secondary">
                    {selectedSourceFile ? selectedSourceFile.name : 'No video selected'}
                  </p>
                </div>
              ) : null}

              {form.sourceType === 'file' ? (
                <div className="space-y-4">
                  <Input
                    label="PDF File Title"
                    value={pdfFileTitle}
                    onChange={(event) => setPdfFileTitle(event.target.value)}
                    placeholder="Enter PDF file title"
                  />
                  <div>
                    <label className="block text-sm font-medium text-must-text-primary mb-2">Source</label>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                      <UploadIcon className="w-4 h-4" />
                      <span className="text-sm">Choose file</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(event) => setSelectedSourceFile(event.target.files?.[0] ?? null)}
                        required
                      />
                    </label>
                    <p className="mt-2 text-xs text-must-text-secondary">
                      {selectedSourceFile ? selectedSourceFile.name : 'No file selected'}
                    </p>
                  </div>
                </div>
              ) : null}

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Add Video'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="max-w-md">
                <Input
                  label="Search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by title"
                  icon={<SearchIcon className="w-4 h-4" />}
                />
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading smart e-learning sources...</CardContent>
            </Card>
          ) : null}

          {!isLoading && filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">No smart e-learning sources found yet.</CardContent>
            </Card>
          ) : null}

          {!isLoading && filteredRecords.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedRecords.map((record) => {
                  const videoUrl = getPublicFileUrl(supabaseResourcesFilesBucket, record.video_path);
                  const actionUrl = record.source_type === 'file' || record.source_type === 'upload' ? videoUrl : record.youtube_url;

                  return (
                    <Card key={record.id}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-must-text-secondary">
                            <PlayCircleIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-must-text-primary break-words">{record.title}</h3>
                            <p className="text-xs text-must-text-secondary mt-1">
                              {labelizeSource(record.source_type)} • {new Date(record.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-must-border bg-slate-50 dark:bg-slate-800/30 p-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon={<ExternalLinkIcon className="w-4 h-4" />}
                            onClick={() => {
                              if (actionUrl) {
                                window.open(actionUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            Open Source
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
                })}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredRecords.length}
                itemLabel="sources"
                onPageChange={setCurrentPage}
              />
            </>
          ) : null}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Smart E-Learning Source"
        message={`Delete "${deleteTarget?.title ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

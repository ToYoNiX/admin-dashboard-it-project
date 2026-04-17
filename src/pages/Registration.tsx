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
  createRegistrationVideo,
  deleteRegistrationVideo,
  listRegistrationVideos,
  registrationVideoSourceTypes,
  type RegistrationVideoInput,
  type RegistrationVideoRecord
} from '../services/registrationVideosService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseResourcesFilesBucket } from '../lib/supabase';

const initialForm: RegistrationVideoInput = {
  title: '',
  sourceType: 'youtube',
  youtubeUrl: ''
};

type RegistrationTab = 'add' | 'view';

function labelizeSource(type: string): string {
  return type === 'youtube' ? 'YouTube Link' : 'Upload Video';
}

export function Registration() {
  const ITEMS_PER_PAGE = 6;
  const [activeTab, setActiveTab] = useState<RegistrationTab>('add');
  const [records, setRecords] = useState<RegistrationVideoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<RegistrationVideoInput>(initialForm);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<RegistrationVideoRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void loadRecords();
  }, []);

  async function loadRecords(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listRegistrationVideos();
      setRecords(data);
      setCurrentPage(1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load registration videos.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm(): void {
    setForm(initialForm);
    setSelectedVideoFile(null);
    setSubmitError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');
      await createRegistrationVideo(form, selectedVideoFile);
      await loadRecords();
      resetForm();
      setActiveTab('view');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save registration video.');
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
      await deleteRegistrationVideo(deleteTarget);
      setDeleteTarget(null);
      await loadRecords();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete registration video.');
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
      <h1 className="text-2xl font-bold text-must-text-primary">Registration</h1>

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
            <h2 className="text-lg font-semibold text-must-text-primary">Add Registration Details Video</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Enter registration video title"
                required
              />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Video Source</label>
                <select
                  value={form.sourceType}
                  onChange={(event) => setForm((prev) => ({ ...prev, sourceType: event.target.value as RegistrationVideoInput['sourceType'] }))}
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {registrationVideoSourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {labelizeSource(type)}
                    </option>
                  ))}
                </select>
              </div>

              {form.sourceType === 'youtube' ? (
                <Input
                  label="YouTube Link"
                  type="url"
                  value={form.youtubeUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))}
                  placeholder="https://youtube.com/..."
                  required
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-must-text-primary mb-2">Video File</label>
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                    <UploadIcon className="w-4 h-4" />
                    <span className="text-sm">Choose video</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(event) => setSelectedVideoFile(event.target.files?.[0] ?? null)}
                      required
                    />
                  </label>
                  <p className="mt-2 text-xs text-must-text-secondary">
                    {selectedVideoFile ? selectedVideoFile.name : 'No video selected'}
                  </p>
                </div>
              )}

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
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading registration videos...</CardContent>
            </Card>
          ) : null}

          {!isLoading && filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">No registration videos found yet.</CardContent>
            </Card>
          ) : null}

          {!isLoading && filteredRecords.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedRecords.map((record) => {
                  const videoUrl = getPublicFileUrl(supabaseResourcesFilesBucket, record.video_path);
                  const actionUrl = record.source_type === 'youtube' ? record.youtube_url : videoUrl;

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
                            Open
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
                itemLabel="videos"
                onPageChange={setCurrentPage}
              />
            </>
          ) : null}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Registration Video"
        message={`Delete "${deleteTarget?.title ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  FileTextIcon,
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
  createHonorListResource,
  deleteHonorListResource,
  listHonorListResources,
  type HonorListResourceInput,
  type HonorListResourceRecord
} from '../services/honorListResourcesService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseResourcesFilesBucket } from '../lib/supabase';

const initialForm: HonorListResourceInput = {
  title: ''
};

type TabMode = 'add' | 'view';

export function HonorList() {
  const ITEMS_PER_PAGE = 6;
  const [activeTab, setActiveTab] = useState<TabMode>('add');
  const [records, setRecords] = useState<HonorListResourceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<HonorListResourceInput>(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<HonorListResourceRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void loadRecords();
  }, []);

  async function loadRecords(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listHonorListResources();
      setRecords(data);
      setCurrentPage(1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load honor list.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm(): void {
    setForm(initialForm);
    setSelectedFile(null);
    setSubmitError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');

      if (!selectedFile) {
        throw new Error('Please choose a PDF file.');
      }

      await createHonorListResource(form, selectedFile);
      await loadRecords();
      resetForm();
      setActiveTab('view');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save honor list.');
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
      await deleteHonorListResource(deleteTarget);
      setDeleteTarget(null);
      await loadRecords();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete honor list item.');
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
      <h1 className="text-2xl font-bold text-must-text-primary">Honor List</h1>

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
            <FileTextIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">Add Honor List PDF</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Enter honor list title"
                required
              />

              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-2">PDF File</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Choose PDF</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    required
                  />
                </label>
                <p className="mt-2 text-xs text-must-text-secondary">
                  {selectedFile ? selectedFile.name : 'No PDF selected'}
                </p>
              </div>

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Add PDF'}
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
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading honor list...</CardContent>
            </Card>
          ) : null}

          {!isLoading && filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">No honor list items found yet.</CardContent>
            </Card>
          ) : null}

          {!isLoading && filteredRecords.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedRecords.map((record) => {
                  const fileUrl = getPublicFileUrl(supabaseResourcesFilesBucket, record.file_path);

                  return (
                    <Card key={record.id}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-must-text-secondary">
                            <FileTextIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {fileUrl ? (
                              <button
                                type="button"
                                onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                                className="text-left text-base font-semibold text-must-text-primary break-words hover:text-must-green hover:underline"
                              >
                                {record.title}
                              </button>
                            ) : (
                              <h3 className="text-base font-semibold text-must-text-primary break-words">{record.title}</h3>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-must-border bg-slate-50 dark:bg-slate-800/30 p-2">
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
                itemLabel="items"
                onPageChange={setCurrentPage}
              />
            </>
          ) : null}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Honor List Item"
        message={`Delete "${deleteTarget?.title ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { DownloadIcon, FileTextIcon, UploadIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  getInternationalHandbook,
  upsertInternationalHandbook,
  type InternationalHandbookRecord
} from '../services/internationalHandbookService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseInternationalHandbookBucket } from '../lib/supabase';

export function InternationalStudentsHandbook() {
  const [record, setRecord] = useState<InternationalHandbookRecord | null>(null);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    void loadHandbook();
  }, []);

  async function loadHandbook(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await getInternationalHandbook();
      setRecord(data);
      setTitle(data?.title ?? '');
      setSelectedFile(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load handbook.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');

      if (!selectedFile) {
        throw new Error('Please choose a PDF file.');
      }

      await upsertInternationalHandbook(title, selectedFile, record);
      await loadHandbook();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save handbook.');
    } finally {
      setIsSaving(false);
    }
  }

  const fileUrl = getPublicFileUrl(supabaseInternationalHandbookBucket, record?.file_path);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">International Handbook</h1>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">Upload Handbook</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter handbook title"
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
                  />
                </label>
                <p className="mt-2 text-xs text-must-text-secondary">
                  {selectedFile ? selectedFile.name : record?.file_path ? 'Current PDF kept unless replaced' : 'No PDF selected'}
                </p>
              </div>

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving || isLoading}>
                  {isSaving ? 'Saving...' : 'Save Handbook'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="xl:col-span-3 space-y-4">
          {isLoading ? <Card><CardContent className="p-6 text-sm text-must-text-secondary">Loading handbook...</CardContent></Card> : null}
          {!isLoading && !record ? <Card><CardContent className="p-6 text-sm text-must-text-secondary">No handbook uploaded yet.</CardContent></Card> : null}
          {!isLoading && record ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-must-text-primary">{record.title}</h3>
                {fileUrl ? (
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<DownloadIcon className="w-4 h-4" />}
                    onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                  >
                    Open PDF
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLinkIcon, FileTextIcon, ImageIcon, PlusIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  getAdmissionSection,
  upsertAdmissionStepsSection,
  upsertExternalTransferRequirements,
  type AdmissionSectionKey,
  type AdmissionTransferItem,
  type TransferDraftItem
} from '../services/admissionService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseAdmissionFilesBucket } from '../lib/supabase';

type AdmissionTab = 'How to Apply' | 'Requirement Docs' | 'External Transfer Requirements';

const TAB_CONFIG: Record<AdmissionTab, { key: AdmissionSectionKey; description: string }> = {
  'How to Apply': {
    key: 'how-to-apply',
    description: 'Add and reorder the application steps students should follow.'
  },
  'Requirement Docs': {
    key: 'required-documents',
    description: 'List the required documents as separate steps.'
  },
  'External Transfer Requirements': {
    key: 'external-transfer-requirements',
    description: 'Upload titled PDF or image items for external transfer requirements.'
  }
};

export function Admission() {
  const [activeTab, setActiveTab] = useState<AdmissionTab>('How to Apply');
  const [steps, setSteps] = useState<string[]>(['']);
  const [transferItems, setTransferItems] = useState<TransferDraftItem[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<AdmissionTransferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const activeKey = TAB_CONFIG[activeTab].key;

  useEffect(() => {
    void loadSection();
  }, [activeTab]);

  async function loadSection(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const record = await getAdmissionSection(activeKey);

      if (activeKey === 'external-transfer-requirements') {
        const attachments = record?.attachments ?? [];
        setExistingAttachments(attachments);
        setTransferItems(
          attachments.length > 0
            ? attachments.map((item) => ({
                id: item.id,
                title: item.title,
                existingFilePath: item.file_path,
                existingFileType: item.file_type
              }))
            : [{ id: crypto.randomUUID(), title: '', file: null }]
        );
      } else {
        setSteps(record?.steps && record.steps.length > 0 ? record.steps : ['']);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load admission data.');
    } finally {
      setIsLoading(false);
    }
  }

  const existingAttachmentMap = useMemo(
    () => new Map(existingAttachments.map((item) => [item.id, item])),
    [existingAttachments]
  );

  async function handleSave(): Promise<void> {
    try {
      setIsSaving(true);
      setSubmitError('');

      if (activeKey === 'external-transfer-requirements') {
        await upsertExternalTransferRequirements(
          transferItems.filter((item) => item.title.trim() || item.file || item.existingFilePath),
          { section_key: activeKey, steps: [], attachments: existingAttachments, updated_at: new Date().toISOString() }
        );
      } else {
        await upsertAdmissionStepsSection(activeKey as 'how-to-apply' | 'required-documents', steps);
      }

      await loadSection();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save admission data.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Admission</h1>

      <div className="flex border-b border-must-border overflow-x-auto">
        {(Object.keys(TAB_CONFIG) as AdmissionTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-must-green text-must-green' : 'border-transparent text-must-text-secondary hover:text-must-text-primary hover:border-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-must-text-primary">{activeTab}</h2>
          <p className="text-sm text-must-text-secondary mt-1">{TAB_CONFIG[activeTab].description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p className="text-sm text-must-text-secondary">Loading admission content...</p> : null}

          {!isLoading && activeKey !== 'external-transfer-requirements' ? (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={`step-${index + 1}`} className="flex gap-3 items-start">
                  <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-sm font-semibold text-must-green">
                    {index + 1}
                  </div>
                  <textarea
                    value={step}
                    onChange={(event) => setSteps((prev) => prev.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}
                    className="flex-1 rounded-xl border border-must-border bg-must-surface px-4 py-3 text-sm text-must-text-primary outline-none focus:ring-2 focus:ring-must-green min-h-[96px] resize-y"
                    placeholder={`Step ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSteps((prev) => prev.length === 1 ? [''] : prev.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    Delete
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" icon={<PlusIcon className="w-4 h-4" />} onClick={() => setSteps((prev) => [...prev, ''])}>
                Add Step
              </Button>
            </div>
          ) : null}

          {!isLoading && activeKey === 'external-transfer-requirements' ? (
            <div className="space-y-4">
              {transferItems.map((item, index) => {
                const existing = existingAttachmentMap.get(item.id);
                const fileUrl = getPublicFileUrl(supabaseAdmissionFilesBucket, item.existingFilePath ?? existing?.file_path ?? null);
                const fileType = item.existingFileType ?? existing?.file_type ?? null;

                return (
                  <div key={item.id} className="rounded-xl border border-must-border p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-must-text-primary">Requirement {index + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setTransferItems((prev) => prev.length === 1 ? [{ id: crypto.randomUUID(), title: '', file: null }] : prev.filter((draft) => draft.id !== item.id))}
                      >
                        Delete
                      </Button>
                    </div>

                    <Input
                      label="Title"
                      value={item.title}
                      onChange={(event) => setTransferItems((prev) => prev.map((draft) => draft.id === item.id ? { ...draft, title: event.target.value } : draft))}
                      placeholder="Enter file title"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-must-text-primary mb-2">File</label>
                      <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                        <UploadIcon className="w-4 h-4" />
                        <span className="text-sm">Choose image or PDF</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
                          className="hidden"
                          onChange={(event) =>
                            setTransferItems((prev) =>
                              prev.map((draft) => draft.id === item.id ? { ...draft, file: event.target.files?.[0] ?? null } : draft)
                            )
                          }
                        />
                      </label>
                      <p className="mt-2 text-xs text-must-text-secondary">
                        {item.file ? item.file.name : fileUrl ? 'Current file kept unless replaced' : 'No file selected'}
                      </p>
                    </div>

                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-must-green hover:underline"
                      >
                        {fileType === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileTextIcon className="w-4 h-4" />}
                        <ExternalLinkIcon className="w-4 h-4" />
                        Open current file
                      </a>
                    ) : null}
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                icon={<PlusIcon className="w-4 h-4" />}
                onClick={() => setTransferItems((prev) => [...prev, { id: crypto.randomUUID(), title: '', file: null }])}
              >
                Add Requirement
              </Button>
            </div>
          ) : null}

          {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

          <div className="flex gap-3 pt-1">
            <Button type="button" onClick={() => { void handleSave(); }} disabled={isSaving || isLoading}>
              {isSaving ? 'Saving...' : 'Save Admission Content'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

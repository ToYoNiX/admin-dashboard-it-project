import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpenCheckIcon,
  DownloadIcon,
  FileTextIcon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabaseStudyPlanFilesBucket } from '../lib/supabase';
import { getPublicFileUrl } from '../services/storageUtils';
import {
  createStudyPlan,
  listStudyPlans,
  STUDY_PLAN_SINGLE_FIELDS,
  type StudyPlanRecord,
  type StudyPlanSingleField,
  type StudyPlanSingleFileMap,
  updateStudyPlan
} from '../services/studyPlansService';

interface SingleFieldMeta {
  key: StudyPlanSingleField;
  label: string;
}

const UNDERGRAD_OLD_FIELDS: SingleFieldMeta[] = [
  { key: 'undergrad_cs_old_curriculum', label: 'CS - Old Curriculum' },
  { key: 'undergrad_is_old_curriculum', label: 'IS - Old Curriculum' },
  { key: 'undergrad_ai_old_curriculum', label: 'AI - Old Curriculum' }
];

const UNDERGRAD_NEW_FIELDS: SingleFieldMeta[] = [
  { key: 'undergrad_cs_new_curriculum', label: 'CS - New Curriculum' },
  { key: 'undergrad_is_new_curriculum', label: 'IS - New Curriculum' },
  { key: 'undergrad_ai_new_curriculum', label: 'AI - New Curriculum' }
];

const POSTGRAD_FIELDS: SingleFieldMeta[] = [
  { key: 'postgrad_cs', label: 'MSc. CS' },
  { key: 'postgrad_ai', label: 'MSc. AI' }
];

function createEmptySingleFileMap(): StudyPlanSingleFileMap {
  const map: StudyPlanSingleFileMap = {};
  for (const field of STUDY_PLAN_SINGLE_FIELDS) {
    map[field] = null;
  }
  return map;
}

function createEmptyRemoveFlags(): Partial<Record<StudyPlanSingleField, boolean>> {
  const map: Partial<Record<StudyPlanSingleField, boolean>> = {};
  for (const field of STUDY_PLAN_SINGLE_FIELDS) {
    map[field] = false;
  }
  return map;
}

export function StudyPlans() {
  const [activeTab, setActiveTab] = useState('All');
  const [record, setRecord] = useState<StudyPlanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [singleFiles, setSingleFiles] = useState<StudyPlanSingleFileMap>(createEmptySingleFileMap);
  const [removeSingleFiles, setRemoveSingleFiles] = useState<Partial<Record<StudyPlanSingleField, boolean>>>(
    createEmptyRemoveFlags
  );
  const [professionalDiplomaFiles, setProfessionalDiplomaFiles] = useState<File[]>([]);
  const [removeProfessionalDiplomaPaths, setRemoveProfessionalDiplomaPaths] = useState<string[]>([]);

  const [submitError, setSubmitError] = useState('');

  const tabs = ['All', 'Undergraduate', 'Postgraduate', 'Professional Diplomas'];

  const singleFileInputRefs = useRef<Partial<Record<StudyPlanSingleField, HTMLInputElement | null>>>({});

  useEffect(() => {
    void loadStudyPlans();
  }, []);

  async function loadStudyPlans(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listStudyPlans();
      setRecord(data[0] ?? null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load study plans.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm(): void {
    setSingleFiles(createEmptySingleFileMap());
    setRemoveSingleFiles(createEmptyRemoveFlags());
    setProfessionalDiplomaFiles([]);
    setRemoveProfessionalDiplomaPaths([]);
    setSubmitError('');
  }

  function handleSingleFileChange(field: StudyPlanSingleField, file: File | null): void {
    setSingleFiles((prev) => ({ ...prev, [field]: file }));
    if (file) {
      setRemoveSingleFiles((prev) => ({ ...prev, [field]: false }));
    }
  }

  function openFile(path: string): void {
    const url = getPublicFileUrl(supabaseStudyPlanFilesBucket, path);
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function renderSingleUploadField(field: SingleFieldMeta): React.ReactNode {
    const existingPath = record?.[field.key] ?? null;
    const isMarkedForRemoval = Boolean(removeSingleFiles[field.key]);
    const selectedFile = singleFiles[field.key] ?? null;
    const hasExistingFile = Boolean(existingPath && !isMarkedForRemoval);

    return (
      <div key={field.key} className="rounded-lg border border-must-border p-4 bg-slate-50 dark:bg-slate-800/40">
        <label className="block text-sm font-medium text-must-text-primary mb-2">{field.label}</label>

        <input
          ref={(element) => {
            singleFileInputRefs.current[field.key] = element;
          }}
          type="file"
          className="hidden"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => handleSingleFileChange(field.key, event.target.files?.[0] ?? null)}
        />

        {hasExistingFile && !selectedFile ? (
          <div className="space-y-3">
            <div className="flex gap-2">
                  <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<DownloadIcon className="w-4 h-4" />}
                onClick={() => openFile(existingPath as string)}
              >
                Download
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => singleFileInputRefs.current[field.key]?.click()}
              >
                Update
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setRemoveSingleFiles((prev) => ({ ...prev, [field.key]: true }))}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<UploadIcon className="w-4 h-4" />}
              onClick={() => singleFileInputRefs.current[field.key]?.click()}
            >
              Choose File
            </Button>

            {selectedFile ? (
              <div className="text-sm text-must-text-primary flex items-center justify-between gap-2">
                <span className="truncate">File selected</span>
                <button
                  type="button"
                  onClick={() => handleSingleFileChange(field.key, null)}
                  className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
                >
                  <XIcon className="w-3 h-3" />
                  Remove
                </button>
              </div>
            ) : null}

            {isMarkedForRemoval ? (
              <p className="text-xs text-red-600">Existing file will be deleted on save.</p>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');

      if (record) {
        await updateStudyPlan(record.id, {
          singleFiles,
          removeSingleFiles,
          professionalDiplomaFiles,
          removeProfessionalDiplomaPaths,
          existingRecord: record
        });
      } else {
        await createStudyPlan({
          singleFiles,
          professionalDiplomaFiles
        });
      }

      await loadStudyPlans();
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save study plans record.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Study Plans Management</h1>

      <div className="flex border-b border-must-border overflow-x-auto">
        {tabs.map((tab) => (
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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <BookOpenCheckIcon className="w-5 h-5 text-must-green" />
              <h2 className="text-lg font-semibold text-must-text-primary">Manage Study Plans Files</h2>
            </div>

            <div className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-must-text-secondary">
              {record ? 'Latest record loaded' : 'No record yet - first save will create it'}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-sm text-must-text-secondary">Loading study plans configuration...</div>
          ) : null}

          {!isLoading ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {(activeTab === 'All' || activeTab === 'Undergraduate') ? (
                  <div className="rounded-xl border border-must-border p-4 md:p-5 bg-must-surface">
                    <h3 className="text-base font-semibold text-must-text-primary">Undergraduate</h3>
                    <p className="text-sm text-must-text-secondary mt-1">
                      Separate uploads for CS, IS, and AI across old/new curriculum.
                    </p>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
                      <div className="rounded-lg border border-must-border p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                        <h4 className="text-sm font-semibold text-must-text-primary">Old Curriculum</h4>
                        <div className="space-y-3">{UNDERGRAD_OLD_FIELDS.map((field) => renderSingleUploadField(field))}</div>
                      </div>

                      <div className="rounded-lg border border-must-border p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                        <h4 className="text-sm font-semibold text-must-text-primary">New Curriculum</h4>
                        <div className="space-y-3">{UNDERGRAD_NEW_FIELDS.map((field) => renderSingleUploadField(field))}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {(activeTab === 'All' || activeTab === 'Postgraduate') ? (
                  <div className="rounded-xl border border-must-border p-4 md:p-5 bg-must-surface">
                    <h3 className="text-base font-semibold text-must-text-primary">Postgraduate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {POSTGRAD_FIELDS.map((field) => renderSingleUploadField(field))}
                    </div>
                  </div>
                ) : null}
              </div>

              {(activeTab === 'All' || activeTab === 'Professional Diplomas') ? (
                <div className="rounded-lg border border-must-border p-4 bg-slate-50 dark:bg-slate-800/40">
                <label className="block text-sm font-medium text-must-text-primary mb-2">
                  Professional Diplomas (Multiple Files)
                </label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-must-border rounded-lg bg-must-surface text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Choose one or more files</span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      setProfessionalDiplomaFiles((prev) => [...prev, ...files]);
                    }}
                  />
                </label>

                {professionalDiplomaFiles.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {professionalDiplomaFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="text-sm text-must-text-primary flex items-center justify-between gap-2">
                        <span className="truncate">New file {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProfessionalDiplomaFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                          }}
                          className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
                        >
                          <XIcon className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {(record?.professional_diplomas ?? []).length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {(record?.professional_diplomas ?? []).map((path, index) => {
                      const marked = removeProfessionalDiplomaPaths.includes(path);
                      if (marked) {
                        return null;
                      }

                      return (
                        <div key={path} className="text-sm text-must-text-secondary flex items-center justify-between gap-2">
                          <span className="truncate">Diploma file {index + 1}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              icon={<DownloadIcon className="w-4 h-4" />}
                              onClick={() => openFile(path)}
                            >
                              Download
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                setRemoveProfessionalDiplomaPaths((prev) => [...prev, path]);
                              }}
                              className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
                            >
                              <XIcon className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                </div>
              ) : null}

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSaving} icon={<FileTextIcon className="w-4 h-4" />}>
                  {isSaving ? 'Saving...' : 'Save Study Plans'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                  Reset Pending Changes
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenCheckIcon,
  DownloadIcon,
  FileTextIcon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { supabaseStudyPlanFilesBucket } from '../lib/supabase';
import { getPublicFileUrl } from '../services/storageUtils';
import {
  createStudyPlan,
  listStudyPlans,
  STUDY_PLAN_DIPLOMA_FIELDS,
  STUDY_PLAN_SINGLE_FIELDS,
  type StudyPlanDiplomaField,
  type StudyPlanDiplomaFileMap,
  type StudyPlanDiplomaRemoveMap,
  type StudyPlanRecord,
  type StudyPlanSingleField,
  type StudyPlanSingleFileMap,
  updateStudyPlan
} from '../services/studyPlansService';

interface SingleFieldMeta {
  key: StudyPlanSingleField;
  label: string;
  program: 'cs' | 'is' | 'ai';
  curriculum: 'old' | 'new';
}

type MainTab = 'Undergraduate Programs' | 'Postgraduate Programs';
type SectionMode = 'add' | 'view';
type FormTrack = 'undergraduate' | 'postgraduate';
type ProgramCode = 'cs' | 'is' | 'ai';
type CurriculumCode = 'old' | 'new';
type PostgraduateType = 'master' | 'phd' | 'professional_diploma';
type FilterProgram = ProgramCode | 'all';
type FilterCurriculum = CurriculumCode | 'all';
type FilterPostgraduateType = PostgraduateType | 'all';
type FilterDiploma = StudyPlanDiplomaField | 'all';

const ITEMS_PER_PAGE = 5;

const UNDERGRAD_OLD_FIELDS: SingleFieldMeta[] = [
  { key: 'undergrad_cs_old_curriculum', label: 'Computer Science - Old Curriculum', program: 'cs', curriculum: 'old' },
  { key: 'undergrad_is_old_curriculum', label: 'Information Systems - Old Curriculum', program: 'is', curriculum: 'old' },
  { key: 'undergrad_ai_old_curriculum', label: 'Artificial Intelligence - Old Curriculum', program: 'ai', curriculum: 'old' }
];

const UNDERGRAD_NEW_FIELDS: SingleFieldMeta[] = [
  { key: 'undergrad_cs_new_curriculum', label: 'Computer Science - New Curriculum', program: 'cs', curriculum: 'new' },
  { key: 'undergrad_is_new_curriculum', label: 'Information Systems - New Curriculum', program: 'is', curriculum: 'new' },
  { key: 'undergrad_ai_new_curriculum', label: 'Artificial Intelligence - New Curriculum', program: 'ai', curriculum: 'new' }
];

const MASTER_FIELDS: SingleFieldMeta[] = [
  { key: 'master_cs_old_curriculum', label: 'Computer Science - Old Curriculum', program: 'cs', curriculum: 'old' },
  { key: 'master_is_old_curriculum', label: 'Information Systems - Old Curriculum', program: 'is', curriculum: 'old' },
  { key: 'master_ai_old_curriculum', label: 'Artificial Intelligence - Old Curriculum', program: 'ai', curriculum: 'old' },
  { key: 'master_cs_new_curriculum', label: 'Computer Science - New Curriculum', program: 'cs', curriculum: 'new' },
  { key: 'master_is_new_curriculum', label: 'Information Systems - New Curriculum', program: 'is', curriculum: 'new' },
  { key: 'master_ai_new_curriculum', label: 'Artificial Intelligence - New Curriculum', program: 'ai', curriculum: 'new' }
];

const PHD_FIELDS: SingleFieldMeta[] = [
  { key: 'phd_cs_old_curriculum', label: 'Computer Science - Old Curriculum', program: 'cs', curriculum: 'old' },
  { key: 'phd_is_old_curriculum', label: 'Information Systems - Old Curriculum', program: 'is', curriculum: 'old' },
  { key: 'phd_ai_old_curriculum', label: 'Artificial Intelligence - Old Curriculum', program: 'ai', curriculum: 'old' },
  { key: 'phd_cs_new_curriculum', label: 'Computer Science - New Curriculum', program: 'cs', curriculum: 'new' },
  { key: 'phd_is_new_curriculum', label: 'Information Systems - New Curriculum', program: 'is', curriculum: 'new' },
  { key: 'phd_ai_new_curriculum', label: 'Artificial Intelligence - New Curriculum', program: 'ai', curriculum: 'new' }
];

const DIPLOMA_LABELS: Record<StudyPlanDiplomaField, string> = {
  diploma_big_data: 'Big Data',
  diploma_applied_ai: 'Applied AI',
  diploma_business_intelligence: 'Business Intelligence'
};

const DIPLOMA_OPTIONS: Array<{ value: StudyPlanDiplomaField; label: string }> = [
  { value: 'diploma_big_data', label: 'Big Data' },
  { value: 'diploma_applied_ai', label: 'Applied AI' },
  { value: 'diploma_business_intelligence', label: 'Business Intelligence' }
];

const PROGRAM_OPTIONS: Array<{ value: ProgramCode; label: string }> = [
  { value: 'cs', label: 'Computer Science' },
  { value: 'is', label: 'Information Systems' },
  { value: 'ai', label: 'Artificial Intelligence' }
];

const CURRICULUM_OPTIONS: Array<{ value: CurriculumCode; label: string }> = [
  { value: 'old', label: 'Old' },
  { value: 'new', label: 'New' }
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

function createEmptyDiplomaFileMap(): StudyPlanDiplomaFileMap {
  const map: StudyPlanDiplomaFileMap = {};
  for (const field of STUDY_PLAN_DIPLOMA_FIELDS) {
    map[field] = [];
  }
  return map;
}

function createEmptyDiplomaRemoveMap(): StudyPlanDiplomaRemoveMap {
  const map: StudyPlanDiplomaRemoveMap = {};
  for (const field of STUDY_PLAN_DIPLOMA_FIELDS) {
    map[field] = [];
  }
  return map;
}

function createEmptyDiplomaPageMap(): Record<StudyPlanDiplomaField, number> {
  return {
    diploma_big_data: 1,
    diploma_applied_ai: 1,
    diploma_business_intelligence: 1
  };
}

function getPaginatedItems<T>(items: T[], page: number): T[] {
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
}

export function StudyPlans() {
  const [activeTab, setActiveTab] = useState<MainTab>('Undergraduate Programs');
  const [sectionMode, setSectionMode] = useState<SectionMode>('add');
  const [record, setRecord] = useState<StudyPlanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [singleFiles, setSingleFiles] = useState<StudyPlanSingleFileMap>(createEmptySingleFileMap);
  const [removeSingleFiles, setRemoveSingleFiles] = useState<Partial<Record<StudyPlanSingleField, boolean>>>(
    createEmptyRemoveFlags
  );
  const [diplomaFiles, setDiplomaFiles] = useState<StudyPlanDiplomaFileMap>(createEmptyDiplomaFileMap);
  const [removeDiplomaPaths, setRemoveDiplomaPaths] = useState<StudyPlanDiplomaRemoveMap>(createEmptyDiplomaRemoveMap);
  const [existingDiplomaPages, setExistingDiplomaPages] = useState<Record<StudyPlanDiplomaField, number>>(
    createEmptyDiplomaPageMap
  );
  const [pendingDiplomaPages, setPendingDiplomaPages] = useState<Record<StudyPlanDiplomaField, number>>(
    createEmptyDiplomaPageMap
  );
  const [submitError, setSubmitError] = useState('');

  const [formTrack, setFormTrack] = useState<FormTrack>('undergraduate');
  const [undergradProgram, setUndergradProgram] = useState<ProgramCode>('cs');
  const [undergradCurriculum, setUndergradCurriculum] = useState<CurriculumCode>('old');
  const [postgraduateType, setPostgraduateType] = useState<PostgraduateType>('master');
  const [postgraduateProgram, setPostgraduateProgram] = useState<ProgramCode>('cs');
  const [postgraduateCurriculum, setPostgraduateCurriculum] = useState<CurriculumCode>('old');
  const [diplomaCategory, setDiplomaCategory] = useState<StudyPlanDiplomaField>('diploma_big_data');
  const [viewUndergradProgram, setViewUndergradProgram] = useState<FilterProgram>('all');
  const [viewUndergradCurriculum, setViewUndergradCurriculum] = useState<FilterCurriculum>('all');
  const [viewPostgraduateType, setViewPostgraduateType] = useState<FilterPostgraduateType>('all');
  const [viewPostgraduateProgram, setViewPostgraduateProgram] = useState<FilterProgram>('all');
  const [viewPostgraduateCurriculum, setViewPostgraduateCurriculum] = useState<FilterCurriculum>('all');
  const [viewDiplomaCategory, setViewDiplomaCategory] = useState<FilterDiploma>('all');

  const singleFileInputRefs = useRef<Partial<Record<StudyPlanSingleField, HTMLInputElement | null>>>({});
  const diplomaInputRefs = useRef<Partial<Record<StudyPlanDiplomaField, HTMLInputElement | null>>>({});

  const visibleExistingDiplomaPaths = useMemo(() => {
    const result: Record<StudyPlanDiplomaField, string[]> = {
      diploma_big_data: [],
      diploma_applied_ai: [],
      diploma_business_intelligence: []
    };

    for (const field of STUDY_PLAN_DIPLOMA_FIELDS) {
      result[field] = (record?.[field] ?? []).filter((path) => !(removeDiplomaPaths[field] ?? []).includes(path));
    }

    return result;
  }, [record, removeDiplomaPaths]);

  useEffect(() => {
    void loadStudyPlans();
  }, []);

  async function loadStudyPlans(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listStudyPlans();
      setRecord(data[0] ?? null);
      setExistingDiplomaPages(createEmptyDiplomaPageMap());
      setPendingDiplomaPages(createEmptyDiplomaPageMap());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load study plans.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm(): void {
    setSingleFiles(createEmptySingleFileMap());
    setRemoveSingleFiles(createEmptyRemoveFlags());
    setDiplomaFiles(createEmptyDiplomaFileMap());
    setRemoveDiplomaPaths(createEmptyDiplomaRemoveMap());
    setExistingDiplomaPages(createEmptyDiplomaPageMap());
    setPendingDiplomaPages(createEmptyDiplomaPageMap());
    setSubmitError('');
  }

  function openFile(path: string): void {
    const url = getPublicFileUrl(supabaseStudyPlanFilesBucket, path);
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleTabChange(tab: MainTab): void {
    setActiveTab(tab);
    setFormTrack(tab === 'Undergraduate Programs' ? 'undergraduate' : 'postgraduate');
    setSectionMode('add');
  }

  function resolveSingleFieldMeta(
    track: FormTrack,
    program: ProgramCode,
    curriculum: CurriculumCode,
    postType: Exclude<PostgraduateType, 'professional_diploma'>
  ): SingleFieldMeta {
    if (track === 'undergraduate') {
      return [...UNDERGRAD_OLD_FIELDS, ...UNDERGRAD_NEW_FIELDS].find(
        (field) => field.program === program && field.curriculum === curriculum
      ) as SingleFieldMeta;
    }

    const source = postType === 'master' ? MASTER_FIELDS : PHD_FIELDS;
    return source.find((field) => field.program === program && field.curriculum === curriculum) as SingleFieldMeta;
  }

  const selectedSingleFieldMeta =
    formTrack === 'undergraduate'
      ? resolveSingleFieldMeta('undergraduate', undergradProgram, undergradCurriculum, 'master')
      : postgraduateType !== 'professional_diploma'
        ? resolveSingleFieldMeta('postgraduate', postgraduateProgram, postgraduateCurriculum, postgraduateType)
        : null;

  const filteredUndergraduateFields = useMemo(() => {
    return [...UNDERGRAD_OLD_FIELDS, ...UNDERGRAD_NEW_FIELDS].filter((field) => {
      const programMatches = viewUndergradProgram === 'all' || field.program === viewUndergradProgram;
      const curriculumMatches = viewUndergradCurriculum === 'all' || field.curriculum === viewUndergradCurriculum;
      return programMatches && curriculumMatches;
    });
  }, [viewUndergradCurriculum, viewUndergradProgram]);

  const filteredMasterFields = useMemo(() => {
    return MASTER_FIELDS.filter((field) => {
      const typeMatches = viewPostgraduateType === 'all' || viewPostgraduateType === 'master';
      const programMatches = viewPostgraduateProgram === 'all' || field.program === viewPostgraduateProgram;
      const curriculumMatches = viewPostgraduateCurriculum === 'all' || field.curriculum === viewPostgraduateCurriculum;
      return typeMatches && programMatches && curriculumMatches;
    });
  }, [viewPostgraduateCurriculum, viewPostgraduateProgram, viewPostgraduateType]);

  const filteredPhdFields = useMemo(() => {
    return PHD_FIELDS.filter((field) => {
      const typeMatches = viewPostgraduateType === 'all' || viewPostgraduateType === 'phd';
      const programMatches = viewPostgraduateProgram === 'all' || field.program === viewPostgraduateProgram;
      const curriculumMatches = viewPostgraduateCurriculum === 'all' || field.curriculum === viewPostgraduateCurriculum;
      return typeMatches && programMatches && curriculumMatches;
    });
  }, [viewPostgraduateCurriculum, viewPostgraduateProgram, viewPostgraduateType]);

  const filteredDiplomaFields = useMemo(() => {
    if (viewPostgraduateType !== 'all' && viewPostgraduateType !== 'professional_diploma') {
      return [] as StudyPlanDiplomaField[];
    }

    return STUDY_PLAN_DIPLOMA_FIELDS.filter((field) => viewDiplomaCategory === 'all' || field === viewDiplomaCategory);
  }, [viewDiplomaCategory, viewPostgraduateType]);

  function handleSingleFileChange(field: StudyPlanSingleField, file: File | null): void {
    setSingleFiles((prev) => ({ ...prev, [field]: file }));
    if (file) {
      setRemoveSingleFiles((prev) => ({ ...prev, [field]: false }));
    }
  }

  function handleDiplomaFilesChange(field: StudyPlanDiplomaField, files: File[]): void {
    setDiplomaFiles((prev) => ({
      ...prev,
      [field]: [...(prev[field] ?? []), ...files]
    }));
    setPendingDiplomaPages((prev) => ({ ...prev, [field]: 1 }));
  }

  function renderFocusedSingleUpload(meta: SingleFieldMeta): React.ReactNode {
    const existingPath = record?.[meta.key] ?? null;
    const isMarkedForRemoval = Boolean(removeSingleFiles[meta.key]);
    const selectedFile = singleFiles[meta.key] ?? null;
    const hasExistingFile = Boolean(existingPath && !isMarkedForRemoval);

    return (
      <div className="rounded-xl border border-must-border bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-must-text-primary">{meta.label}</p>
          <p className="text-xs text-must-text-secondary mt-1">
            Choose the file here, then save from the main button below.
          </p>
        </div>

        <input
          ref={(element) => {
            singleFileInputRefs.current[meta.key] = element;
          }}
          type="file"
          className="hidden"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => handleSingleFileChange(meta.key, event.target.files?.[0] ?? null)}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<UploadIcon className="w-4 h-4" />}
            onClick={() => singleFileInputRefs.current[meta.key]?.click()}
          >
            Choose File
          </Button>

          {hasExistingFile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<DownloadIcon className="w-4 h-4" />}
              onClick={() => openFile(existingPath as string)}
            >
              Download Current File
            </Button>
          ) : null}

          {hasExistingFile ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setRemoveSingleFiles((prev) => ({ ...prev, [meta.key]: true }))}
            >
              Delete Current File
            </Button>
          ) : null}
        </div>

        {selectedFile ? (
          <div className="rounded-lg border border-must-green/30 bg-must-green/5 px-3 py-2 text-sm text-must-text-primary flex items-center justify-between gap-3">
            <span className="truncate">Pending upload: {selectedFile.name}</span>
            <button
              type="button"
              onClick={() => handleSingleFileChange(meta.key, null)}
              className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
            >
              <XIcon className="w-3 h-3" />
              Remove
            </button>
          </div>
        ) : null}

        {isMarkedForRemoval ? (
          <p className="text-xs text-red-600">Current file will be deleted after saving.</p>
        ) : null}
      </div>
    );
  }

  function renderFocusedDiplomaUpload(field: StudyPlanDiplomaField): React.ReactNode {
    const pendingFiles = diplomaFiles[field] ?? [];
    const existingPaths = visibleExistingDiplomaPaths[field] ?? [];
    const pendingPage = pendingDiplomaPages[field] ?? 1;
    const existingPage = existingDiplomaPages[field] ?? 1;
    const paginatedPendingFiles = getPaginatedItems(pendingFiles, pendingPage);
    const paginatedExistingPaths = getPaginatedItems(existingPaths, existingPage);
    const pendingPages = Math.max(1, Math.ceil(pendingFiles.length / ITEMS_PER_PAGE));
    const existingPages = Math.max(1, Math.ceil(existingPaths.length / ITEMS_PER_PAGE));

    return (
      <div className="rounded-xl border border-must-border bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-must-text-primary">{DIPLOMA_LABELS[field]}</p>
          <p className="text-xs text-must-text-secondary mt-1">
            You can add one or more diploma files here, then save from the main button below.
          </p>
        </div>

        <input
          ref={(element) => {
            diplomaInputRefs.current[field] = element;
          }}
          type="file"
          className="hidden"
          multiple
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => handleDiplomaFilesChange(field, Array.from(event.target.files ?? []))}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<UploadIcon className="w-4 h-4" />}
          onClick={() => diplomaInputRefs.current[field]?.click()}
        >
          Add Diploma Files
        </Button>

        {pendingFiles.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-must-text-secondary">Pending files</p>
            {paginatedPendingFiles.map((file, index) => {
              const absoluteIndex = (pendingPage - 1) * ITEMS_PER_PAGE + index;
              return (
                <div key={`${field}-${file.name}-${absoluteIndex}`} className="flex items-center justify-between gap-3 rounded-lg border border-must-green/30 bg-must-green/5 px-3 py-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDiplomaFiles((prev) => ({
                        ...prev,
                        [field]: (prev[field] ?? []).filter((_, itemIndex) => itemIndex !== absoluteIndex)
                      }));
                    }}
                    className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
                  >
                    <XIcon className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              );
            })}
            <Pagination
              currentPage={pendingPage}
              totalPages={pendingPages}
              totalItems={pendingFiles.length}
              itemLabel="pending files"
              onPageChange={(page) => setPendingDiplomaPages((prev) => ({ ...prev, [field]: page }))}
            />
          </div>
        ) : null}

        {existingPaths.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-must-text-secondary">Saved files</p>
            {paginatedExistingPaths.map((path, index) => {
              const absoluteIndex = (existingPage - 1) * ITEMS_PER_PAGE + index;
              return (
                <div key={`${field}-${path}`} className="flex items-center justify-between gap-3 rounded-lg border border-must-border bg-must-surface px-3 py-2 text-sm">
                  <span className="truncate">Saved file {absoluteIndex + 1}</span>
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
                        setRemoveDiplomaPaths((prev) => ({
                          ...prev,
                          [field]: [...(prev[field] ?? []), path]
                        }));
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
            <Pagination
              currentPage={existingPage}
              totalPages={existingPages}
              totalItems={existingPaths.length}
              itemLabel="saved files"
              onPageChange={(page) => setExistingDiplomaPages((prev) => ({ ...prev, [field]: page }))}
            />
          </div>
        ) : null}
      </div>
    );
  }

  function renderSingleLibraryField(meta: SingleFieldMeta): React.ReactNode {
    const selectedFile = singleFiles[meta.key] ?? null;
    const existingPath = record?.[meta.key] ?? null;
    const isMarkedForRemoval = Boolean(removeSingleFiles[meta.key]);
    const hasExistingFile = Boolean(existingPath && !isMarkedForRemoval);

    return (
      <div key={meta.key} className="rounded-lg border border-must-border bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-must-text-primary">{meta.label}</h4>
            <p className="text-xs text-must-text-secondary mt-1">Use the form above to replace or add this file.</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full ${selectedFile ? 'bg-must-green/10 text-must-green' : hasExistingFile ? 'bg-slate-100 text-must-text-secondary' : 'bg-amber-100 text-amber-700'}`}>
            {selectedFile ? 'Pending update' : hasExistingFile ? 'Saved' : 'Empty'}
          </span>
        </div>

        {selectedFile ? (
          <div className="rounded-lg border border-must-green/30 bg-must-green/5 px-3 py-2 text-sm text-must-text-primary">
            Pending file: {selectedFile.name}
          </div>
        ) : null}

        {isMarkedForRemoval ? <p className="text-xs text-red-600">Current file will be deleted after saving.</p> : null}

        <div className="flex flex-wrap gap-2">
          {hasExistingFile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<DownloadIcon className="w-4 h-4" />}
              onClick={() => openFile(existingPath as string)}
            >
              Download
            </Button>
          ) : null}
          {hasExistingFile ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setRemoveSingleFiles((prev) => ({ ...prev, [meta.key]: true }))}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  function renderSingleFieldSection(title: string, fields: SingleFieldMeta[]): React.ReactNode {
    return (
      <div className="rounded-xl border border-must-border p-4 md:p-5 bg-must-surface space-y-4">
        <div>
          <h3 className="text-base font-semibold text-must-text-primary">{title}</h3>
          <p className="text-sm text-must-text-secondary mt-1">Filtered files for this section.</p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {fields.map((field) => renderSingleLibraryField(field))}
        </div>
      </div>
    );
  }

  function renderEmptyFilterState(message: string): React.ReactNode {
    return (
      <div className="rounded-xl border border-dashed border-must-border bg-slate-50 dark:bg-slate-800/30 px-4 py-8 text-center text-sm text-must-text-secondary">
        {message}
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
          diplomaFiles,
          removeDiplomaPaths,
          existingRecord: record
        });
      } else {
        await createStudyPlan({
          singleFiles,
          diplomaFiles
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
      <h1 className="text-2xl font-bold text-must-text-primary">Educational Programs Management</h1>

      <div className="flex border-b border-must-border overflow-x-auto">
        {(['Undergraduate Programs', 'Postgraduate Programs'] as MainTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
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
              <h2 className="text-lg font-semibold text-must-text-primary">{activeTab}</h2>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-must-border bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setSectionMode('add')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${sectionMode === 'add' ? 'bg-must-green text-white' : 'text-must-text-secondary hover:text-must-text-primary'}`}
              >
                Add Files
              </button>
              <button
                type="button"
                onClick={() => setSectionMode('view')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${sectionMode === 'view' ? 'bg-must-green text-white' : 'text-must-text-secondary hover:text-must-text-primary'}`}
              >
                View Files
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLoading ? <div className="text-sm text-must-text-secondary">Loading study plans configuration...</div> : null}

          {!isLoading && sectionMode === 'add' ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-xl border border-must-border p-4 md:p-5 bg-must-surface space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-must-text-primary">
                    {activeTab === 'Undergraduate Programs' ? 'Undergraduate Programs Upload' : 'Postgraduate Programs Upload'}
                  </h3>
                  <p className="text-sm text-must-text-secondary mt-1">
                    Add files only for the current tab from here.
                  </p>
                </div>

                {activeTab === 'Undergraduate Programs' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-must-text-primary">Programs</label>
                      <select
                        value={undergradProgram}
                        onChange={(event) => setUndergradProgram(event.target.value as ProgramCode)}
                        className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none"
                      >
                        {PROGRAM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-must-text-primary">Curriculum</label>
                      <select
                        value={undergradCurriculum}
                        onChange={(event) => setUndergradCurriculum(event.target.value as CurriculumCode)}
                        className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none"
                      >
                        {CURRICULUM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-must-text-primary">Postgraduate Type</label>
                      <select
                        value={postgraduateType}
                        onChange={(event) => setPostgraduateType(event.target.value as PostgraduateType)}
                        className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none"
                      >
                        <option value="master">Master Programs</option>
                        <option value="phd">PhD Programs</option>
                        <option value="professional_diploma">Professional Diplomas</option>
                      </select>
                    </div>

                    {postgraduateType === 'professional_diploma' ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-must-text-primary">Diploma Category</label>
                        <select
                          value={diplomaCategory}
                          onChange={(event) => setDiplomaCategory(event.target.value as StudyPlanDiplomaField)}
                          className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none"
                        >
                          {DIPLOMA_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-must-text-primary">Programs</label>
                          <select
                            value={postgraduateProgram}
                            onChange={(event) => setPostgraduateProgram(event.target.value as ProgramCode)}
                            className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none"
                          >
                            {PROGRAM_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-must-text-primary">Curriculum</label>
                          <select
                            value={postgraduateCurriculum}
                            onChange={(event) => setPostgraduateCurriculum(event.target.value as CurriculumCode)}
                            className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none"
                          >
                            {CURRICULUM_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'Undergraduate Programs' && selectedSingleFieldMeta
                  ? renderFocusedSingleUpload(selectedSingleFieldMeta)
                  : null}

                {activeTab === 'Postgraduate Programs' && postgraduateType !== 'professional_diploma' && selectedSingleFieldMeta
                  ? renderFocusedSingleUpload(selectedSingleFieldMeta)
                  : null}

                {activeTab === 'Postgraduate Programs' && postgraduateType === 'professional_diploma'
                  ? renderFocusedDiplomaUpload(diplomaCategory)
                  : null}
              </div>

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSaving} icon={<FileTextIcon className="w-4 h-4" />}>
                  {isSaving ? 'Saving...' : 'Save Educational Programs'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                  Reset Pending Changes
                </Button>
              </div>
            </form>
          ) : null}

          {!isLoading && sectionMode === 'view' ? (
            activeTab === 'Undergraduate Programs' ? (
              <>
                <div className="rounded-xl border border-must-border p-4 md:p-5 bg-must-surface space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-must-text-primary">Undergraduate Filters</h3>
                    <p className="text-sm text-must-text-secondary mt-1">Narrow the list by program and curriculum.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-must-text-primary">Programs</label>
                      <select
                        value={viewUndergradProgram}
                        onChange={(event) => setViewUndergradProgram(event.target.value as FilterProgram)}
                        className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none"
                      >
                        <option value="all">All Programs</option>
                        {PROGRAM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-must-text-primary">Curriculum</label>
                      <select
                        value={viewUndergradCurriculum}
                        onChange={(event) => setViewUndergradCurriculum(event.target.value as FilterCurriculum)}
                        className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none"
                      >
                        <option value="all">All Curriculums</option>
                        {CURRICULUM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {filteredUndergraduateFields.length > 0
                  ? renderSingleFieldSection('Filtered Undergraduate Files', filteredUndergraduateFields)
                  : renderEmptyFilterState('No undergraduate files match the selected filters.')}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-must-border p-4 md:p-5 bg-must-surface space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-must-text-primary">Postgraduate Filters</h3>
                    <p className="text-sm text-must-text-secondary mt-1">
                      Filter by type, program, curriculum, or diploma category.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-must-text-primary">Type</label>
                      <select
                        value={viewPostgraduateType}
                        onChange={(event) => setViewPostgraduateType(event.target.value as FilterPostgraduateType)}
                        className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none"
                      >
                        <option value="all">All Types</option>
                        <option value="master">Master Programs</option>
                        <option value="phd">PhD Programs</option>
                        <option value="professional_diploma">Professional Diplomas</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-must-text-primary">Programs</label>
                      <select
                        value={viewPostgraduateProgram}
                        onChange={(event) => setViewPostgraduateProgram(event.target.value as FilterProgram)}
                        disabled={viewPostgraduateType === 'professional_diploma'}
                        className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none disabled:opacity-60"
                      >
                        <option value="all">All Programs</option>
                        {PROGRAM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-must-text-primary">Curriculum</label>
                      <select
                        value={viewPostgraduateCurriculum}
                        onChange={(event) => setViewPostgraduateCurriculum(event.target.value as FilterCurriculum)}
                        disabled={viewPostgraduateType === 'professional_diploma'}
                        className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none disabled:opacity-60"
                      >
                        <option value="all">All Curriculums</option>
                        {CURRICULUM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-must-text-primary">Diploma Category</label>
                      <select
                        value={viewDiplomaCategory}
                        onChange={(event) => setViewDiplomaCategory(event.target.value as FilterDiploma)}
                        disabled={viewPostgraduateType !== 'all' && viewPostgraduateType !== 'professional_diploma'}
                        className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none disabled:opacity-60"
                      >
                        <option value="all">All Diplomas</option>
                        {DIPLOMA_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {filteredMasterFields.length > 0 ? renderSingleFieldSection('Filtered Master Files', filteredMasterFields) : null}
                {filteredPhdFields.length > 0 ? renderSingleFieldSection('Filtered PhD Files', filteredPhdFields) : null}

                {filteredDiplomaFields.length > 0 ? (
                  <div className="rounded-xl border border-must-border p-4 md:p-5 bg-must-surface space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-must-text-primary">Filtered Professional Diplomas</h3>
                      <p className="text-sm text-must-text-secondary mt-1">Filtered diploma files only.</p>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      {filteredDiplomaFields.map((field) => renderFocusedDiplomaUpload(field))}
                    </div>
                  </div>
                ) : null}

                {filteredMasterFields.length === 0 && filteredPhdFields.length === 0 && filteredDiplomaFields.length === 0
                  ? renderEmptyFilterState('No postgraduate files match the selected filters.')
                  : null}
              </>
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

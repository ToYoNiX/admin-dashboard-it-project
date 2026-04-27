import React, { useMemo, useState } from 'react';
import {
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Edit2Icon,
  EyeIcon,
  FileTextIcon,
  ImageIcon,
  LinkIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  CheckCircle2Icon,
  AlertCircleIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Pagination } from '../components/ui/Pagination';
import {
  createStaffProfile,
  deleteStaffProfile,
  listStaffProfiles,
  reorderStaffProfiles,
  staffRanks,
  type StaffRecord,
  updateStaffProfile
} from '../services/staffService';
import { isSupabaseConfigured, supabaseImageBucket } from '../lib/supabase';
import { getPublicFileUrl } from '../services/storageUtils';

interface StaffFormData {
  title: (typeof staffRanks)[number];
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  speciality: string;
  googleScholarLink: string;
}

const initialFormData: StaffFormData = {
  title: 'Professor',
  firstName: '',
  lastName: '',
  email: '',
  department: '',
  position: '',
  speciality: '',
  googleScholarLink: ''
};

export function Staff() {
  const ITEMS_PER_PAGE = 6;
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [staffImage, setStaffImage] = useState<File | null>(null);
  const [savedMessageVisible, setSavedMessageVisible] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StaffRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRankTab, setActiveRankTab] = useState<(typeof staffRanks)[number] | 'All'>('All');
  const [isReordering, setIsReordering] = useState(false);

  const getRankSortValue = (rank: string) => {
    const index = staffRanks.indexOf(rank as (typeof staffRanks)[number]);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    void loadStaffProfiles();
  }, []);

  const loadStaffProfiles = async () => {
    try {
      setIsLoadingRecords(true);
      const data = await listStaffProfiles();
      setStaffRecords(data);
      setCurrentPage(1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load staff entries.');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleCvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCvFile(event.target.files?.[0] ?? null);
  };

  const handleStaffImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStaffImage(event.target.files?.[0] ?? null);
  };

  const clearForm = () => {
    setFormData(initialFormData);
    setCvFile(null);
    setStaffImage(null);
    setSavedMessageVisible(false);
    setSubmitError('');
    setEditingRecord(null);
  };

  const startEdit = (record: StaffRecord) => {
    setEditingRecord(record);
    setSavedMessageVisible(false);
    setSubmitError('');
    setCvFile(null);
    setStaffImage(null);
    setFormData({
      title: record.title,
      firstName: record.first_name,
      lastName: record.last_name,
      email: record.email ?? '',
      department: record.department ?? '',
      position: record.position ?? '',
      speciality: record.speciality,
      googleScholarLink: record.google_scholar_link ?? ''
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavedMessageVisible(false);
    setSubmitError('');

    if (!isSupabaseConfigured) {
      setSubmitError('Supabase environment variables are missing. Please configure .env first.');
      return;
    }

    if (!staffImage && !editingRecord) {
      setSubmitError('Please upload a staff image.');
      return;
    }

    try {
      setIsSubmitting(true);
      const nextDisplayOrder =
        editingRecord?.display_order ??
        staffRecords.filter((record) => record.title === formData.title).length + 1;

      const payload = {
        ...formData,
        displayOrder: nextDisplayOrder
      };

      if (editingRecord) {
        await updateStaffProfile(editingRecord.id, payload, {
          cvFile,
          staffImage,
          existingCvPath: editingRecord.cv_path,
          existingImagePath: editingRecord.image_path
        });
      } else {
        if (!staffImage) {
          setSubmitError('Please upload a staff image.');
          setIsSubmitting(false);
          return;
        }
        await createStaffProfile(payload, cvFile, staffImage);
      }

      await loadStaffProfiles();
      setSavedMessageVisible(true);
      setFormData(initialFormData);
      setCvFile(null);
      setStaffImage(null);
      setEditingRecord(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save staff profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const persistRankOrder = async (reordered: StaffRecord[]) => {
    const reorderedWithDisplayOrder = reordered.map((record, index) => ({
      ...record,
      display_order: index + 1
    }));

    const unaffectedRecords = staffRecords.filter(
      (record) => !reorderedWithDisplayOrder.some((reorderedRecord) => reorderedRecord.id === record.id)
    );
    const nextStaffRecords = [...unaffectedRecords, ...reorderedWithDisplayOrder].sort((a, b) => {
      const rankComparison = getRankSortValue(a.title) - getRankSortValue(b.title);
      if (rankComparison !== 0) {
        return rankComparison;
      }
      return a.display_order - b.display_order;
    });

    setStaffRecords(nextStaffRecords);

    try {
      setIsReordering(true);
      await reorderStaffProfiles(
        reorderedWithDisplayOrder.map((record) => ({
          id: record.id,
          display_order: record.display_order
        }))
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save staff order.');
      await loadStaffProfiles();
    } finally {
      setIsReordering(false);
    }
  };

  const moveStaffRecord = async (staffId: string, direction: 'up' | 'down') => {
    const sourceIndex = filteredStaffRecords.findIndex((record) => record.id === staffId);

    if (sourceIndex === -1) {
      return;
    }

    const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;

    if (targetIndex < 0 || targetIndex >= filteredStaffRecords.length) {
      return;
    }

    const reordered = [...filteredStaffRecords];
    const [movedRecord] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedRecord);
    await persistRankOrder(reordered);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setSubmitError('');
      await deleteStaffProfile(deleteTarget);

      if (editingRecord?.id === deleteTarget.id) {
        clearForm();
      }

      setDeleteTarget(null);
      await loadStaffProfiles();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete staff profile.');
    }
  };

  const paginatedStaffRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const filtered = activeRankTab === 'All' ? staffRecords : staffRecords.filter((record) => record.title === activeRankTab);
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activeRankTab, currentPage, staffRecords]);

  const filteredStaffRecords = useMemo(() => {
    return activeRankTab === 'All' ? staffRecords : staffRecords.filter((record) => record.title === activeRankTab);
  }, [activeRankTab, staffRecords]);

  const totalPages = Math.max(1, Math.ceil(filteredStaffRecords.length / ITEMS_PER_PAGE));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-must-navy dark:text-white">
          <BriefcaseIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-must-text-primary">Academic Staff</h1>
          <p className="text-sm text-must-text-secondary">
            Add profile details and upload supporting files.
          </p>
        </div>
      </div>

      <div className="flex border-b border-must-border overflow-x-auto">
        {(['All', ...staffRanks] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveRankTab(tab);
              setCurrentPage(1);
            }}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeRankTab === tab ? 'border-must-green text-must-green' : 'border-transparent text-must-text-secondary hover:text-must-text-primary hover:border-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <BriefcaseIcon className="w-5 h-5 text-must-navy dark:text-white" />
          <h2 className="text-lg font-semibold text-must-text-primary">
            {editingRecord ? 'Edit Staff Member' : 'New Staff Member'}
          </h2>
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4" />
              Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">
                  Academic Degree <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((previous) => ({ ...previous, title: event.target.value as (typeof staffRanks)[number] }))
                  }
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm focus:ring-2 focus:ring-must-green outline-none"
                >
                  {staffRanks.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
                required
              />
              <Input
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@must.edu.eg"
                type="email"
                required
              />
              <Input
                label="Position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                placeholder="e.g. Assistant Professor"
              />
              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g. Computer Science"
                required
              />
              <Input
                label="Research Directions"
                name="speciality"
                value={formData.speciality}
                onChange={handleInputChange}
                placeholder="e.g. Artificial Intelligence, Data Mining"
                required
              />
              <Input
                label="Google Scholar Link (Optional)"
                name="googleScholarLink"
                value={formData.googleScholarLink}
                onChange={handleInputChange}
                placeholder="https://scholar.google.com/..."
                type="url"
                icon={<LinkIcon className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-must-border bg-must-surface p-4">
                <label className="block text-sm font-medium text-must-text-primary mb-3">
                  Upload CV
                </label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-5 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Choose CV file</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCvChange}
                    className="hidden"
                  />
                </label>
                <div className="mt-3 flex items-center gap-2 text-sm text-must-text-secondary min-h-5">
                  <FileTextIcon className="w-4 h-4" />
                  <span>
                    {cvFile ? cvFile.name : editingRecord ? 'Current CV kept unless replaced' : 'No file selected'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-must-border bg-must-surface p-4">
                <label className="block text-sm font-medium text-must-text-primary mb-3">
                  Upload Staff Image <span className="ml-1 text-red-500">*</span>
                </label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-5 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Choose image file</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={handleStaffImageChange}
                    className="hidden"
                    required={!editingRecord}
                  />
                </label>
                <div className="mt-3 flex items-center gap-2 text-sm text-must-text-secondary min-h-5">
                  <ImageIcon className="w-4 h-4" />
                  <span>
                    {staffImage ? staffImage.name : editingRecord ? 'Current image kept unless replaced' : 'No image selected'}
                  </span>
                </div>
              </div>
            </div>

            {savedMessageVisible && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4" />
                Staff profile was saved to Supabase.
              </div>
            )}

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4" />
                {submitError}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={clearForm} disabled={isSubmitting}>
                {editingRecord ? 'Cancel Edit' : 'Clear'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingRecord ? 'Update Staff Profile' : 'Save Staff Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-must-text-primary">Academic Staff</h2>
            <p className="mt-1 text-xs text-must-text-secondary">
              Use the move buttons to reorder staff exactly as they should appear on the frontend.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isReordering ? <span className="text-xs text-must-green">Saving order...</span> : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={clearForm}
            >
              Add New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <p className="text-sm text-must-text-secondary">Loading staff entries...</p>
          ) : null}

          {!isLoadingRecords && staffRecords.length === 0 ? (
            <p className="text-sm text-must-text-secondary">No staff entries yet.</p>
          ) : null}

          <div className="grid grid-cols-1 gap-4">
            {paginatedStaffRecords.map((record) => {
              const imageUrl = getPublicFileUrl(supabaseImageBucket, record.image_path);
              const fullName = `${record.title} ${record.first_name} ${record.last_name}`;

              return (
                <Card key={record.id} className="border border-must-border overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={fullName}
                            className="h-20 w-20 rounded-xl object-cover border border-must-border shadow-sm"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-must-border">
                            <EyeIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-must-text-primary truncate">{fullName}</h3>
                            <p className="mt-1 text-sm text-must-green">{record.title}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-must-green border border-green-100">
                            Order #{record.display_order}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-must-text-secondary">
                          {record.position ? <p className="truncate">Position: {record.position}</p> : null}
                          <p className="truncate">Email: {record.email || 'No email provided'}</p>
                          <p className="truncate">Department: {record.department || 'N/A'}</p>
                          <p className="line-clamp-2">Research Directions: {record.speciality}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-must-border pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={<ChevronUpIcon className="w-4 h-4" />}
                        onClick={() => {
                          void moveStaffRecord(record.id, 'up');
                        }}
                        disabled={isReordering || filteredStaffRecords[0]?.id === record.id}
                      >
                        Move Up
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={<ChevronDownIcon className="w-4 h-4" />}
                        onClick={() => {
                          void moveStaffRecord(record.id, 'down');
                        }}
                        disabled={isReordering || filteredStaffRecords[filteredStaffRecords.length - 1]?.id === record.id}
                      >
                        Move Down
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={<Edit2Icon className="w-4 h-4" />}
                        onClick={() => startEdit(record)}
                      >
                        Edit
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

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredStaffRecords.length}
              itemLabel="staff members"
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Staff Profile"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.title} ${deleteTarget.first_name} ${deleteTarget.last_name}? This action cannot be undone.`
            : 'Are you sure you want to delete this staff profile?'
        }
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

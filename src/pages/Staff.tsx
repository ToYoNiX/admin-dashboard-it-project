import React, { useState } from 'react';
import {
  BriefcaseIcon,
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
import {
  createStaffProfile,
  deleteStaffProfile,
  listStaffProfiles,
  type StaffRecord,
  updateStaffProfile
} from '../services/staffService';
import { isSupabaseConfigured, supabaseImageBucket } from '../lib/supabase';
import { getPublicFileUrl } from '../services/storageUtils';

interface StaffFormData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  speciality: string;
  googleScholarLink: string;
}

const initialFormData: StaffFormData = {
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  department: '',
  position: '',
  speciality: '',
  googleScholarLink: ''
};

export function Staff() {
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
      position: record.position,
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

    if (!editingRecord && (!cvFile || !staffImage)) {
      setSubmitError('Please upload both CV and staff image files.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingRecord) {
        await updateStaffProfile(editingRecord.id, formData, {
          cvFile,
          staffImage,
          existingCvPath: editingRecord.cv_path,
          existingImagePath: editingRecord.image_path
        });
      } else {
        if (!cvFile || !staffImage) {
          setSubmitError('Please upload both CV and staff image files.');
          setIsSubmitting(false);
          return;
        }
        await createStaffProfile(formData, cvFile, staffImage);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-must-navy dark:text-white">
          <BriefcaseIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-must-text-primary">Academic Staff</h1>
          <p className="text-sm text-must-text-secondary">
            Add staff profile details and upload supporting files.
          </p>
        </div>
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
              <Input
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Prof., Dr., Mr., Ms."
                required
              />
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
                required
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
                label="Speciality"
                name="speciality"
                value={formData.speciality}
                onChange={handleInputChange}
                placeholder="e.g. Artificial Intelligence"
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
                    required={!editingRecord}
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
                  Upload Staff Image
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
          <h2 className="text-lg font-semibold text-must-text-primary">Academic Staff</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={clearForm}
          >
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <p className="text-sm text-must-text-secondary">Loading staff entries...</p>
          ) : null}

          {!isLoadingRecords && staffRecords.length === 0 ? (
            <p className="text-sm text-must-text-secondary">No staff entries yet.</p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffRecords.map((record) => {
              const imageUrl = getPublicFileUrl(supabaseImageBucket, record.image_path);
              const fullName = `${record.title} ${record.first_name} ${record.last_name}`;

              return (
                <Card key={record.id} className="border border-must-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={fullName}
                          className="w-16 h-16 rounded-lg object-cover border border-must-border"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <EyeIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-must-text-primary truncate">{fullName}</h3>
                        <p className="text-sm text-must-text-secondary truncate">{record.position}</p>
                        <p className="text-xs text-must-text-secondary mt-1 truncate">{record.email || 'No email provided'}</p>
                        <p className="text-xs text-must-text-secondary mt-1 truncate">Department: {record.department || 'N/A'}</p>
                        <p className="text-xs text-must-text-secondary mt-1 truncate">{record.speciality}</p>
                      </div>

                      <div className="ml-auto mt-2 flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="secondary"
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
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

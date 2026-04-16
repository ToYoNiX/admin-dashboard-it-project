import React, { useEffect, useMemo, useState } from 'react';
import {
  EyeIcon,
  ImagePlusIcon,
  Maximize2Icon,
  Trash2Icon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  deleteGalleryPhoto,
  listGalleryPhotos,
  type GalleryPhotoRecord,
  uploadGalleryPhoto
} from '../services/galleryService';
import { getPublicFileUrl } from '../services/storageUtils';
import { supabaseGalleryImagesBucket } from '../lib/supabase';

export function Gallery() {
  const [records, setRecords] = useState<GalleryPhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<GalleryPhotoRecord | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    void loadGallery();
  }, []);

  const selectedImagePreview = useMemo(() => {
    if (!selectedImageFile) {
      return null;
    }
    return URL.createObjectURL(selectedImageFile);
  }, [selectedImageFile]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  async function loadGallery(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const data = await listGalleryPhotos();
      setRecords(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load gallery.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetUpload(): void {
    setSelectedImageFile(null);
    setSubmitError('');
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!selectedImageFile) {
      setSubmitError('Please choose a photo first.');
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError('');
      await uploadGalleryPhoto(selectedImageFile);
      await loadGallery();
      resetUpload();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to upload photo.');
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
      await deleteGalleryPhoto(deleteTarget);
      setDeleteTarget(null);
      await loadGallery();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete photo.');
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Photo Gallery</h1>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader className="flex flex-row items-center gap-2">
            <ImagePlusIcon className="w-5 h-5 text-must-green" />
            <h2 className="text-lg font-semibold text-must-text-primary">Upload Slider Photos</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleUpload}>
              <label className="flex items-center justify-center gap-2 w-full px-4 py-5 border border-dashed border-must-border rounded-lg bg-slate-50 dark:bg-slate-800/40 text-must-text-secondary hover:text-must-text-primary hover:border-must-green transition-colors cursor-pointer">
                <UploadIcon className="w-4 h-4" />
                <span className="text-sm">Choose photo</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    setSelectedImageFile(event.target.files?.[0] ?? null);
                    setSubmitError('');
                  }}
                />
              </label>

              {selectedImagePreview ? (
                <div className="rounded-lg border border-must-border p-3 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-must-text-secondary">Selected photo preview</span>
                    <button
                      type="button"
                      onClick={resetUpload}
                      className="text-red-600 hover:text-red-700 text-xs inline-flex items-center gap-1"
                    >
                      <XIcon className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                  <img src={selectedImagePreview} alt="Preview" className="w-full h-44 object-cover rounded-md" />
                </div>
              ) : null}

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving} icon={<UploadIcon className="w-4 h-4" />}>
                  {isSaving ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <Button type="button" variant="outline" onClick={resetUpload} disabled={isSaving}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="xl:col-span-3 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">Loading gallery photos...</CardContent>
            </Card>
          ) : null}

          {!isLoading && records.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-must-text-secondary">No photos in gallery yet.</CardContent>
            </Card>
          ) : null}

          {!isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {records.map((record) => {
                const imageUrl = getPublicFileUrl(supabaseGalleryImagesBucket, record.image_url);

                return (
                  <Card key={record.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {imageUrl ? (
                        <button
                          type="button"
                          className="relative group w-full"
                          onClick={() => setPreviewImageUrl(imageUrl)}
                        >
                          <img src={imageUrl} alt="Gallery" className="w-full h-44 object-cover" />
                          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Preview
                          </span>
                        </button>
                      ) : (
                        <div className="w-full h-44 flex items-center justify-center text-sm text-must-text-secondary bg-slate-50 dark:bg-slate-800/40">
                          Missing image
                        </div>
                      )}

                      <div className="p-3 flex justify-end">
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
          ) : null}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Photo"
        message="This will permanently delete the photo from the gallery and storage. This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      {previewImageUrl ? (
        <div className="fixed inset-0 z-[70] bg-black/75 flex items-center justify-center p-4" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-5xl w-full" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
              onClick={() => setPreviewImageUrl(null)}
            >
              <XIcon className="w-5 h-5" />
            </button>
            <img src={previewImageUrl} alt="Gallery preview" className="w-full max-h-[85vh] object-contain rounded-lg" />
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded inline-flex items-center gap-1">
              <Maximize2Icon className="w-3 h-3" />
              Preview
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

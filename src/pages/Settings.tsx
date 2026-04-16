import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  UserIcon,
  UploadIcon } from
'lucide-react';
import {
  getAdvisorProfile,
  updateAdvisorProfileName,
  uploadAdvisorAvatar } from
'../services/authService';

interface SettingsProps {
  userId: string;
  userEmail: string;
}

export function Settings({ userId, userEmail }: SettingsProps) {
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const profile = await getAdvisorProfile(userId);
        setFullName(profile?.full_name || '');
        setAvatarUrl(profile?.avatar_url || null);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load profile.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [userId]);

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'AD';
  }, [fullName]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateAdvisorProfileName(userId, fullName);

      if (avatarFile) {
        const nextAvatarUrl = await uploadAdvisorAvatar(userId, avatarFile);
        setAvatarUrl(nextAvatarUrl);
        setAvatarFile(null);
      }

      setSuccess('Profile updated successfully.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to save profile settings.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-must-text-primary">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <UserIcon className="w-5 h-5 text-must-navy dark:text-white" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              Profile Settings
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ?
            <p className="text-sm text-must-text-secondary">Loading profile...</p> :
            <>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-must-navy text-white flex items-center justify-center text-2xl font-bold border-4 border-slate-100 dark:border-slate-800 overflow-hidden">
                    {avatarUrl ?
                  <img src={avatarUrl} alt="Advisor avatar" className="w-full h-full object-cover" /> :
                  initials}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-must-border bg-transparent text-must-text-primary hover:bg-slate-50 dark:hover:bg-slate-800 text-sm cursor-pointer">
                      <UploadIcon className="w-4 h-4" />
                      Upload New Avatar
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} />

                    </label>
                    <p className="text-xs text-must-text-secondary mt-2">
                      JPG, PNG, WEBP. Max size 5MB.
                    </p>
                    {avatarFile ?
                  <p className="text-xs text-must-green mt-1">Selected: {avatarFile.name}</p> :
                  null}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter your full name" />

                  <Input
                    label="Email Address"
                    value={userEmail}
                    type="email"
                    disabled />

                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                {success ? <p className="text-sm text-green-600">{success}</p> : null}
              </>
            }
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button size="lg" onClick={() => {
          void handleSave();
        }} disabled={isLoading || isSaving}>

            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>);

}
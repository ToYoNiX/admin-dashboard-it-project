import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getInviteByToken } from '../../services/advisorsAdminService';
import { signUpWithPassword, uploadAdvisorAvatar } from '../../services/authService';
import { supabase } from '../../lib/supabase';
import { AuthShell } from './AuthShell';

function useInviteToken(): string {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('token')?.trim() ?? '';
}

export function RegisterFromInvitePage() {
  const token = useMemo(() => useInviteToken(), []);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviteValid, setIsInviteValid] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setIsInviteValid(false);
        setIsLoadingInvite(false);
        setError('Missing invite token.');
        return;
      }

      try {
        const invite = await getInviteByToken(token);
        if (!invite || invite.status !== 'pending') {
          setIsInviteValid(false);
          setError('Invite is invalid or already used.');
          return;
        }

        if (new Date(invite.expires_at).getTime() < Date.now()) {
          setIsInviteValid(false);
          setError('Invite has expired.');
          return;
        }

        setInviteEmail(invite.email);
        setIsInviteValid(true);
      } catch (inviteError) {
        const message = inviteError instanceof Error ? inviteError.message : 'Failed to validate invite.';
        setError(message);
      } finally {
        setIsLoadingInvite(false);
      }
    };

    void loadInvite();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isInviteValid) {
      setError('Invite is invalid.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signUpWithPassword({
        email: inviteEmail,
        password,
        fullName: fullName.trim(),
        inviteToken: token
      });

      const { data: authData } = await supabase!.auth.getSession();
      const userId = authData.session?.user.id;

      if (userId && avatarFile) {
        await uploadAdvisorAvatar(userId, avatarFile);
      }

      setSuccess('Registration completed. You can now login.');
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to complete registration.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Advisor Invitation"
      subtitle="Complete your account registration"
      footer={<a href="/" className="text-must-green font-semibold hover:underline">Back to login</a>}
    >
      {isLoadingInvite ? <p className="text-sm text-must-text-secondary">Validating invite...</p> : null}

      {!isLoadingInvite && isInviteValid ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Invited Email" value={inviteEmail} disabled />
          <Input
            label="Full Name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Enter your full name"
            required
          />

          <div>
            <label className="block text-sm font-medium text-must-text-primary mb-1">Profile Picture (Optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 text-sm"
            />
          </div>

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create password"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            required
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Complete Registration'}
          </Button>
        </form>
      ) : null}

      {!isLoadingInvite && !isInviteValid && error ? <p className="text-sm text-red-600">{error}</p> : null}
    </AuthShell>
  );
}

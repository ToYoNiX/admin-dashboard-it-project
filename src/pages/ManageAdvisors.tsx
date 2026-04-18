import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import {
  createAdvisorInvite,
  deleteAdvisorAccount,
  listAdvisors,
  listPendingInvites,
  revokeAdvisorAccess,
  type AdvisorInvite
} from '../services/advisorsAdminService';
import type { AdvisorProfile } from '../services/authService';

export function ManageAdvisors() {
  const [email, setEmail] = useState('');
  const [isSuperAdminInvite, setIsSuperAdminInvite] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<AdvisorInvite[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [inviteData, advisorData] = await Promise.all([listPendingInvites(), listAdvisors()]);
      setPendingInvites(inviteData);
      setAdvisors(advisorData);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load advisor data.';
      setError(message);
    }
  };

  const handleCreateInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await createAdvisorInvite({
        email,
        isSuperAdmin: isSuperAdminInvite
      });

      const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('MUST International Student Affairs Invite')}&body=${encodeURIComponent(`You have been invited to the MUST International Student Affairs Dashboard. Use this link to register: ${result.inviteUrl}`)}`;
      window.open(mailto, '_blank', 'noopener,noreferrer');

      setFeedback(`Invite created and email draft opened for ${email}.`);
      setEmail('');
      setIsSuperAdminInvite(false);
      await loadData();
    } catch (inviteError) {
      const message = inviteError instanceof Error ? inviteError.message : 'Failed to create invite.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (advisor: AdvisorProfile) => {
    try {
      setError(null);
      await revokeAdvisorAccess(advisor.id);
      await loadData();
    } catch (revokeError) {
      const message = revokeError instanceof Error ? revokeError.message : 'Failed to revoke advisor access.';
      setError(message);
    }
  };

  const handleDelete = async (advisor: AdvisorProfile) => {
    try {
      setError(null);
      await deleteAdvisorAccount(advisor.id);
      await loadData();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete advisor account.';
      setError(message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Manage Advisors</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-must-text-primary">Send Advisor Invite</h2>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateInvite}>
            <Input
              label="Advisor Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="advisor@must.edu.eg"
              required
            />

            <label className="flex items-center gap-2 text-sm text-must-text-primary">
              <input
                type="checkbox"
                checked={isSuperAdminInvite}
                onChange={(event) => setIsSuperAdminInvite(event.target.checked)}
                className="rounded border-must-border"
              />
              Invite as Super Admin
            </label>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Invite...' : 'Create Invite & Send Link'}
            </Button>
          </form>

          {feedback ? <p className="mt-3 text-sm text-green-600">{feedback}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-must-text-primary">Pending Invites</h2>
        </CardHeader>
        <CardContent>
          {pendingInvites.length === 0 ? (
            <p className="text-sm text-must-text-secondary">No pending invites.</p>
          ) : (
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between border border-must-border rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-must-text-primary">{invite.email}</p>
                    <p className="text-xs text-must-text-secondary">Expires: {new Date(invite.expires_at).toLocaleString()}</p>
                  </div>
                  {invite.is_super_admin ? <Badge variant="info">Super Admin</Badge> : <Badge>Advisor</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-must-text-primary">Advisors</h2>
        </CardHeader>
        <CardContent>
          {advisors.length === 0 ? (
            <p className="text-sm text-must-text-secondary">No advisors found.</p>
          ) : (
            <div className="space-y-2">
              {advisors.map((advisor) => (
                <div key={advisor.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-must-border rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-must-text-primary">{advisor.full_name || advisor.email}</p>
                    <p className="text-xs text-must-text-secondary">{advisor.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {advisor.is_super_admin ? <Badge variant="warning">Super Admin</Badge> : <Badge>Advisor</Badge>}
                    {!advisor.is_active ? <Badge variant="danger">Revoked</Badge> : null}

                    {!advisor.is_super_admin ? (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={() => void handleRevoke(advisor)}>
                          Revoke Access
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => void handleDelete(advisor)}>
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { MailIcon, MessageSquareMoreIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  listContactSubmissions,
  updateContactSubmissionStatus,
  type ContactSubmissionRecord,
  type ContactSubmissionStatus,
  type ContactSubmissionType
} from '../services/contactCenterService';

interface ContactCenterProps {
  isSuperAdmin: boolean;
}

type ContactTab = 'Super Admin Messages' | 'Complaints' | 'Suggestions';

const TAB_TO_TYPE: Record<ContactTab, ContactSubmissionType> = {
  'Super Admin Messages': 'super_admin_message',
  Complaints: 'complaint',
  Suggestions: 'suggestion'
};

export function ContactCenter({ isSuperAdmin }: ContactCenterProps) {
  const [activeTab, setActiveTab] = useState<ContactTab>('Super Admin Messages');
  const [records, setRecords] = useState<ContactSubmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }
    void loadRecords();
  }, [activeTab, isSuperAdmin]);

  async function loadRecords(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      setRecords(await listContactSubmissions(TAB_TO_TYPE[activeTab]));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load contact center records.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: ContactSubmissionStatus): Promise<void> {
    try {
      setSubmitError('');
      await updateContactSubmissionStatus(id, status);
      await loadRecords();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update status.');
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h1 className="text-2xl font-bold text-must-text-primary">Contact Center</h1>
        <Card>
          <CardContent className="p-6 text-sm text-must-text-secondary">
            Contact Center is available only for super admins.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Contact Center</h1>

      <div className="flex border-b border-must-border overflow-x-auto">
        {(Object.keys(TAB_TO_TYPE) as ContactTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-must-green text-must-green' : 'border-transparent text-must-text-secondary hover:text-must-text-primary hover:border-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? <Card><CardContent className="p-6 text-sm text-must-text-secondary">Loading contact center messages...</CardContent></Card> : null}
      {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}
      {!isLoading && records.length === 0 ? <Card><CardContent className="p-6 text-sm text-must-text-secondary">No records found yet for this tab.</CardContent></Card> : null}

      {!isLoading && records.map((record) => (
        <Card key={record.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-must-text-primary">{record.subject || record.sender_name}</h2>
              <p className="mt-1 text-sm text-must-text-secondary">{record.sender_name} • {record.sender_email}</p>
            </div>
            <div className="flex items-center gap-2">
              <MailIcon className="w-4 h-4 text-must-text-secondary" />
              <select
                value={record.status}
                onChange={(event) => {
                  void handleStatusChange(record.id, event.target.value as ContactSubmissionStatus);
                }}
                className="rounded-lg border border-must-border bg-must-surface px-3 py-2 text-sm text-must-text-primary outline-none focus:ring-2 focus:ring-must-green"
              >
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-must-border bg-slate-50/70 p-4 text-sm leading-7 text-must-text-primary dark:bg-slate-800/30">
              {record.message_text}
            </div>
            <div className="text-xs text-must-text-secondary">
              {new Date(record.created_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { MailIcon, MapPinIcon, PhoneIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { getContactInfo, upsertContactInfo } from '../services/contactInfoService';

export function Contact() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    void loadContact();
  }, []);

  async function loadContact(): Promise<void> {
    try {
      setIsLoading(true);
      setSubmitError('');
      const record = await getContactInfo();
      setEmail(record?.email ?? '');
      setPhone(record?.phone ?? '');
      setAddress(record?.address ?? '');
      setMapLink(record?.map_link ?? '');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to load contact info.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSubmitError('');
      await upsertContactInfo({ email, phone, address, mapLink });
      await loadContact();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save contact info.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">Contact</h1>

      <Card className="max-w-4xl">
        <CardHeader>
          <h2 className="text-lg font-semibold text-must-text-primary">Contact Information</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-must-text-secondary">Loading contact information...</p> : null}

          {!isLoading ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} icon={<MailIcon className="w-4 h-4" />} placeholder="contact@example.com" />
              <Input label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} icon={<PhoneIcon className="w-4 h-4" />} placeholder="+20 ..." />
              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">Address</label>
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 focus:ring-2 focus:ring-must-green outline-none min-h-[120px] resize-y"
                  placeholder="Enter address"
                />
              </div>
              <Input label="Map Link" type="url" value={mapLink} onChange={(event) => setMapLink(event.target.value)} icon={<MapPinIcon className="w-4 h-4" />} placeholder="https://maps.google.com/..." />

              {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Contact Info'}</Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

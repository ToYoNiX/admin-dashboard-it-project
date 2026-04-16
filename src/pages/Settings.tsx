import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  UserIcon,
  BellIcon,
  GlobeIcon,
  MonitorIcon,
  ShieldIcon } from
'lucide-react';
export function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-must-text-primary">Settings</h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <UserIcon className="w-5 h-5 text-must-navy dark:text-white" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              Profile Settings
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-must-navy text-white flex items-center justify-center text-2xl font-bold border-4 border-slate-100 dark:border-slate-800">
                AD
              </div>
              <div>
                <Button variant="outline" size="sm" className="mb-2">
                  Upload New Avatar
                </Button>
                <p className="text-xs text-must-text-secondary">
                  JPG, GIF or PNG. Max size of 800K
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" defaultValue="Advisor Name" />
              <Input
                label="Email Address"
                defaultValue="advisor@must.edu.eg"
                type="email" />

              <Input label="Phone Number" defaultValue="+20 123 456 7890" />
              <Input
                label="Role"
                defaultValue="International Student Advisor"
                disabled />

            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BellIcon className="w-5 h-5 text-must-navy" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              Notification Preferences
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
            {
              title: 'Email Notifications',
              desc: 'Receive daily summary emails'
            },
            {
              title: 'SMS Alerts',
              desc: 'Receive SMS for urgent requests'
            },
            {
              title: 'Push Notifications',
              desc: 'Receive in-app push notifications'
            }].
            map((item, i) =>
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-must-border last:border-0 last:pb-0">

                <div>
                  <h3 className="text-sm font-medium text-must-text-primary">
                    {item.title}
                  </h3>
                  <p className="text-xs text-must-text-secondary">
                    {item.desc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={i !== 1} />

                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-must-green"></div>
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language & Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <GlobeIcon className="w-5 h-5 text-must-navy" />
              <h2 className="text-lg font-semibold text-must-text-primary">
                Language
              </h2>
            </CardHeader>
            <CardContent>
              <label className="block text-sm font-medium text-must-text-primary mb-2">
                System Language
              </label>
              <select className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none">
                <option value="en">English (US)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <MonitorIcon className="w-5 h-5 text-must-navy" />
              <h2 className="text-lg font-semibold text-must-text-primary">
                Display
              </h2>
            </CardHeader>
            <CardContent>
              <label className="block text-sm font-medium text-must-text-primary mb-2">
                Font Size
              </label>
              <select className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none">
                <option value="sm">Small</option>
                <option value="md" selected>
                  Medium (Default)
                </option>
                <option value="lg">Large</option>
              </select>
            </CardContent>
          </Card>
        </div>

        {/* Security */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-must-navy" />
            <h2 className="text-lg font-semibold text-must-text-primary">
              Security
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••" />

              <div className="hidden md:block"></div>
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••" />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••" />

            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button size="lg">Save All Changes</Button>
        </div>
      </div>
    </div>);

}
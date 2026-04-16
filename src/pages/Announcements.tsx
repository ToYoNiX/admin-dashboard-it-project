import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MegaphoneIcon, Edit2Icon, Trash2Icon } from 'lucide-react';
const announcementsData = [
{
  id: 1,
  title: 'Fall Semester Registration Deadline',
  target: 'All Students',
  date: 'Oct 10, 2024',
  priority: 'Urgent'
},
{
  id: 2,
  title: 'New Visa Regulations for International Students',
  target: 'International',
  date: 'Oct 08, 2024',
  priority: 'Important'
},
{
  id: 3,
  title: 'Engineering Faculty Orientation',
  target: 'Engineering',
  date: 'Oct 05, 2024',
  priority: 'Normal'
},
{
  id: 4,
  title: 'Campus Wi-Fi Maintenance',
  target: 'All Students',
  date: 'Oct 01, 2024',
  priority: 'Normal'
},
{
  id: 5,
  title: 'Welcome International Freshmen!',
  target: 'Level 1',
  date: 'Sep 28, 2024',
  priority: 'Normal'
}];

export function Announcements() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">
        Announcements Management
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <h2 className="text-lg font-semibold text-must-text-primary flex items-center">
              <MegaphoneIcon className="w-5 h-5 mr-2 text-must-green" />
              Create Announcement
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Title" placeholder="Enter announcement title" />

            <div>
              <label className="block text-sm font-medium text-must-text-primary mb-1">
                Description
              </label>
              <textarea
                className="w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 focus:ring-2 focus:ring-must-green outline-none min-h-[120px] resize-y"
                placeholder="Write your announcement here..." />

            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">
                  Target Audience
                </label>
                <select className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none">
                  <option>All Students</option>
                  <option>By Faculty</option>
                  <option>By Country</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">
                  Priority
                </label>
                <select className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none">
                  <option>Normal</option>
                  <option>Important</option>
                  <option>Urgent</option>
                </select>
              </div>
            </div>

            <Button className="w-full mt-4">Publish Announcement</Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {announcementsData.map((announcement) =>
          <Card
            key={announcement.id}
            className="hover:border-must-green/50 transition-colors">

              <CardContent className="p-5 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-must-text-primary">
                      {announcement.title}
                    </h3>
                    {announcement.priority === 'Urgent' &&
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full uppercase">
                        Urgent
                      </span>
                  }
                    {announcement.priority === 'Important' &&
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-100 text-yellow-700 rounded-full uppercase">
                        Important
                      </span>
                  }
                  </div>
                  <p className="text-sm text-must-text-secondary line-clamp-2">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-must-text-secondary font-medium">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      Target: {announcement.target}
                    </span>
                    <span>{announcement.date}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit2Icon className="w-4 h-4" />}>

                    Edit
                  </Button>
                  <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2Icon className="w-4 h-4" />}
                  className="bg-red-50 text-red-600 hover:bg-red-100 border-none dark:bg-red-900/20 dark:hover:bg-red-900/40">

                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>);

}
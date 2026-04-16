import React from 'react';
import {
  SearchIcon,
  FilterIcon,
  PlusIcon,
  EyeIcon,
  MessageSquareIcon,
  DownloadIcon } from
'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
const studentsData = [
{
  id: '2023001',
  name: 'Ahmed Al-Fayed',
  nationality: '🇪🇬 Egypt',
  faculty: 'Engineering',
  level: 'Level 3',
  advisor: 'Dr. Sarah',
  status: 'Active'
},
{
  id: '2023045',
  name: 'Fatima Bello',
  nationality: '🇳🇬 Nigeria',
  faculty: 'Medicine',
  level: 'Level 2',
  advisor: 'Dr. Omar',
  status: 'Active'
},
{
  id: '2022102',
  name: 'Raj Patel',
  nationality: '🇮🇳 India',
  faculty: 'CS',
  level: 'Level 4',
  advisor: 'Dr. Hisham',
  status: 'Active'
},
{
  id: '2024012',
  name: 'Ali Khan',
  nationality: '🇵🇰 Pakistan',
  faculty: 'Business',
  level: 'Level 1',
  advisor: 'Dr. Mona',
  status: 'Inactive'
},
{
  id: '2021088',
  name: 'Maria Garcia',
  nationality: '🇪🇸 Spain',
  faculty: 'Arts',
  level: 'Level 4',
  advisor: 'Dr. Tarek',
  status: 'Graduated'
},
{
  id: '2023156',
  name: 'John Doe',
  nationality: '🇺🇸 USA',
  faculty: 'Engineering',
  level: 'Level 2',
  advisor: 'Dr. Sarah',
  status: 'Active'
},
{
  id: '2022099',
  name: 'Aisha Mohammed',
  nationality: '🇸🇦 Saudi Arabia',
  faculty: 'Pharmacy',
  level: 'Level 3',
  advisor: 'Dr. Youssef',
  status: 'Suspended'
},
{
  id: '2024033',
  name: 'Chen Wei',
  nationality: '🇨🇳 China',
  faculty: 'CS',
  level: 'Level 1',
  advisor: 'Dr. Hisham',
  status: 'Active'
},
{
  id: '2023077',
  name: 'Hassan Ali',
  nationality: '🇮🇶 Iraq',
  faculty: 'Medicine',
  level: 'Level 2',
  advisor: 'Dr. Omar',
  status: 'Active'
},
{
  id: '2021005',
  name: 'Sara Smith',
  nationality: '🇬🇧 UK',
  faculty: 'Business',
  level: 'Level 4',
  advisor: 'Dr. Mona',
  status: 'Active'
}];

export function Students() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success">Active</Badge>;
      case 'Inactive':
        return <Badge variant="default">Inactive</Badge>;
      case 'Suspended':
        return <Badge variant="danger">Suspended</Badge>;
      case 'Graduated':
        return <Badge variant="info">Graduated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-must-text-primary">
          Students Management
        </h1>
        <Button icon={<PlusIcon className="w-4 h-4" />}>Add Student</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by ID, Name, or Email..."
              icon={<SearchIcon className="w-4 h-4" />} />

          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
            <select className="px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none min-w-[140px]">
              <option value="">All Countries</option>
              <option value="egypt">Egypt</option>
              <option value="nigeria">Nigeria</option>
              <option value="india">India</option>
            </select>
            <select className="px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none min-w-[140px]">
              <option value="">All Faculties</option>
              <option value="engineering">Engineering</option>
              <option value="medicine">Medicine</option>
              <option value="cs">Computer Science</option>
            </select>
            <Button variant="outline" icon={<FilterIcon className="w-4 h-4" />}>
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-must-border">
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Student ID
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Full Name
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Nationality
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Faculty
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Level
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Status
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-must-border">
              {studentsData.map((student) =>
              <tr
                key={student.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">

                  <td className="px-6 py-4 text-sm font-medium text-must-text-primary">
                    {student.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-must-text-primary flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-must-navy text-white flex items-center justify-center text-xs font-bold">
                      {student.name.charAt(0)}
                    </div>
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-must-text-secondary">
                    {student.nationality}
                  </td>
                  <td className="px-6 py-4 text-sm text-must-text-secondary">
                    {student.faculty}
                  </td>
                  <td className="px-6 py-4 text-sm text-must-text-secondary">
                    {student.level}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(student.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button
                    className="p-1.5 text-slate-400 hover:text-must-navy transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="View Profile">

                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                    className="p-1.5 text-slate-400 hover:text-must-green transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Send Message">

                      <MessageSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                    className="p-1.5 text-slate-400 hover:text-must-gold transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Download Documents">

                      <DownloadIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-must-border flex items-center justify-between">
          <span className="text-sm text-must-text-secondary">
            Showing 1 to 10 of 1,247 entries
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="primary" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <span className="px-2 py-1 text-must-text-secondary">...</span>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>);

}
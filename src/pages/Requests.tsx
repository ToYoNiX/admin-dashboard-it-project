import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CheckIcon, XIcon, InfoIcon } from 'lucide-react';
const requestsData = [
{
  id: 'REQ-2024-001',
  student: 'Ahmed Al-Fayed',
  type: 'Enrollment Letter',
  date: 'Oct 12, 2024',
  status: 'Pending'
},
{
  id: 'REQ-2024-002',
  student: 'Fatima Bello',
  type: 'Visa Renewal',
  date: 'Oct 11, 2024',
  status: 'Approved'
},
{
  id: 'REQ-2024-003',
  student: 'Raj Patel',
  type: 'Transcript',
  date: 'Oct 10, 2024',
  status: 'Pending'
},
{
  id: 'REQ-2024-004',
  student: 'Ali Khan',
  type: 'Change Major',
  date: 'Oct 09, 2024',
  status: 'Rejected'
},
{
  id: 'REQ-2024-005',
  student: 'Maria Garcia',
  type: 'Complaint',
  date: 'Oct 08, 2024',
  status: 'Approved'
},
{
  id: 'REQ-2024-006',
  student: 'John Doe',
  type: 'Enrollment Letter',
  date: 'Oct 07, 2024',
  status: 'Pending'
},
{
  id: 'REQ-2024-007',
  student: 'Aisha Mohammed',
  type: 'Transcript',
  date: 'Oct 06, 2024',
  status: 'Approved'
},
{
  id: 'REQ-2024-008',
  student: 'Chen Wei',
  type: 'Visa Renewal',
  date: 'Oct 05, 2024',
  status: 'Pending'
}];

export function Requests() {
  const [activeTab, setActiveTab] = useState('All');
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] dark:text-white">
            Pending
          </span>);

      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1B8A3D]/10 text-[#1B8A3D] dark:text-white">
            Approved
          </span>);

      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DC2626]/10 text-[#DC2626] dark:text-white">
            Rejected
          </span>);

      default:
        return <Badge>{status}</Badge>;
    }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-must-text-primary">
          Requests Management
        </h1>
        <select className="px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none">
          <option value="">All Request Types</option>
          <option value="enrollment">Enrollment Letter</option>
          <option value="transcript">Transcript</option>
          <option value="visa">Visa Renewal</option>
          <option value="major">Change Major</option>
          <option value="complaint">Complaint</option>
        </select>
      </div>

      <div className="flex border-b border-must-border overflow-x-auto">
        {['All', 'Pending', 'Approved', 'Rejected'].map((tab) =>
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-must-green text-must-green' : 'border-transparent text-must-text-secondary hover:text-must-text-primary hover:border-slate-300'}`}>

            {tab}
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-must-border">
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Request ID
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Student Name
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Request Type
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-must-text-secondary">
                  Submission Date
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
              {requestsData.
              filter(
                (req) => activeTab === 'All' || req.status === activeTab
              ).
              map((req) =>
              <tr
                key={req.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">

                    <td className="px-6 py-4 text-sm font-medium text-must-text-primary">
                      {req.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-must-text-primary">
                      {req.student}
                    </td>
                    <td className="px-6 py-4 text-sm text-must-text-secondary">
                      {req.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-must-text-secondary">
                      {req.date}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      {req.status === 'Pending' ?
                  <>
                          <button
                      className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                      title="Approve">

                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Reject">

                            <XIcon className="w-4 h-4" />
                          </button>
                          <button
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      title="Request More Info">

                            <InfoIcon className="w-4 h-4" />
                          </button>
                        </> :

                  <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                  }
                    </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}
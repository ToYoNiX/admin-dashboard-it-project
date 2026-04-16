import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  UploadIcon,
  FileTextIcon,
  DownloadIcon,
  EyeIcon,
  Trash2Icon } from
'lucide-react';
const documents = [
{
  id: 1,
  name: 'Academic_Calendar_2024_2025.pdf',
  size: '2.4 MB',
  date: 'Sep 01, 2024',
  category: 'Academic Calendar'
},
{
  id: 2,
  name: 'University_Regulations_v2.pdf',
  size: '5.1 MB',
  date: 'Aug 15, 2024',
  category: 'University Regulations'
},
{
  id: 3,
  name: 'Visa_Requirements_Guide.pdf',
  size: '1.8 MB',
  date: 'Sep 10, 2024',
  category: 'Visa Requirements'
},
{
  id: 4,
  name: 'Engineering_Faculty_Rules.pdf',
  size: '3.2 MB',
  date: 'Aug 20, 2024',
  category: 'Faculty Regulations'
},
{
  id: 5,
  name: 'Medicine_Faculty_Rules.pdf',
  size: '3.5 MB',
  date: 'Aug 21, 2024',
  category: 'Faculty Regulations'
},
{
  id: 6,
  name: 'Student_Code_of_Conduct.pdf',
  size: '1.2 MB',
  date: 'Jul 30, 2024',
  category: 'University Regulations'
}];

export function Documents() {
  const [activeTab, setActiveTab] = useState('All');
  const categories = [
  'All',
  'Academic Calendar',
  'University Regulations',
  'Visa Requirements',
  'Faculty Regulations'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-must-text-primary">
          Documents Management
        </h1>
        <Button icon={<UploadIcon className="w-4 h-4" />}>
          Upload Document
        </Button>
      </div>

      <div className="flex border-b border-must-border overflow-x-auto">
        {categories.map((tab) =>
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-must-green text-must-green' : 'border-transparent text-must-text-secondary hover:text-must-text-primary hover:border-slate-300'}`}>

            {tab}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {documents.
        filter((doc) => activeTab === 'All' || doc.category === activeTab).
        map((doc) =>
        <Card
          key={doc.id}
          className="group hover:border-must-navy/30 transition-all duration-300">

              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-must-navy dark:text-white rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                    <FileTextIcon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                  className="font-semibold text-must-text-primary text-sm truncate mb-1"
                  title={doc.name}>

                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-must-text-secondary mb-3">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.date}</span>
                    </div>
                    <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-must-text-secondary text-[10px] font-medium rounded">
                      {doc.category}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-must-border flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                variant="ghost"
                size="sm"
                icon={<EyeIcon className="w-4 h-4" />}
                className="h-8">

                    Preview
                  </Button>
                  <Button
                variant="ghost"
                size="sm"
                icon={<DownloadIcon className="w-4 h-4" />}
                className="h-8">

                    Download
                  </Button>
                  <Button
                variant="danger"
                size="sm"
                icon={<Trash2Icon className="w-4 h-4" />}
                className="h-8 bg-red-50 text-red-600 hover:bg-red-100 border-none dark:bg-red-900/20 dark:hover:bg-red-900/40" />

                </div>
              </CardContent>
            </Card>
        )}
      </div>
    </div>);

}
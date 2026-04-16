import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  UploadCloudIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon } from
'lucide-react';
export function Schedules() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from(
    {
      length: 35
    },
    (_, i) => i - 2
  ); // Simple calendar logic for demo
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">
        Schedule Management
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold text-must-text-primary">
              Upload Schedule
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-must-border rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
              <UploadCloudIcon className="w-10 h-10 text-must-text-secondary mx-auto mb-3" />
              <p className="text-sm font-medium text-must-text-primary mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-must-text-secondary">
                CSV, Excel, or PDF (max. 10MB)
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">
                  Assign to Faculty
                </label>
                <select className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none">
                  <option>Select Faculty...</option>
                  <option>Engineering</option>
                  <option>Medicine</option>
                  <option>Computer Science</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-must-text-primary mb-1">
                  Assign to Level
                </label>
                <select className="w-full px-4 py-2 rounded-lg border border-must-border bg-must-surface text-sm focus:ring-2 focus:ring-must-green outline-none">
                  <option>Select Level...</option>
                  <option>Level 1</option>
                  <option>Level 2</option>
                  <option>Level 3</option>
                  <option>Level 4</option>
                </select>
              </div>
              <Button
                className="w-full mt-2"
                icon={<CalendarIcon className="w-4 h-4" />}>

                Publish Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-must-text-primary">
              October 2024
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeftIcon className="w-4 h-4" />} />

              <Button
                variant="outline"
                size="sm"
                icon={<ChevronRightIcon className="w-4 h-4" />} />

            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-must-border rounded-lg overflow-hidden border border-must-border">
              {days.map((day) =>
              <div
                key={day}
                className="bg-must-surface py-2 text-center text-xs font-semibold text-must-text-secondary">

                  {day}
                </div>
              )}

              {dates.map((date, i) => {
                const isCurrentMonth = date > 0 && date <= 31;
                const isToday = date === 15;
                return (
                  <div
                    key={i}
                    className={`min-h-[100px] bg-must-surface p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!isCurrentMonth ? 'opacity-40' : ''}`}>

                    <span
                      className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-must-green text-white' : 'text-must-text-primary'}`}>

                      {isCurrentMonth ?
                      date :
                      date <= 0 ?
                      30 + date :
                      date - 31}
                    </span>

                    {date === 12 &&
                    <div className="mt-1 px-2 py-1 text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-white rounded truncate">
                        Midterm Exams
                      </div>
                    }
                    {date === 18 &&
                    <div className="mt-1 px-2 py-1 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-white rounded truncate">
                        CS101 Lecture
                      </div>
                    }
                    {date === 25 &&
                    <div className="mt-1 px-2 py-1 text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-white rounded truncate">
                        Registration Deadline
                      </div>
                    }
                  </div>);

              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}
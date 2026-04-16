import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileIcon, DownloadIcon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell } from
'recharts';
const countryData = [
{
  name: 'Egypt',
  value: 450
},
{
  name: 'Nigeria',
  value: 200
},
{
  name: 'India',
  value: 150
},
{
  name: 'Pakistan',
  value: 120
},
{
  name: 'Saudi Arabia',
  value: 90
}];

const facultyData = [
{
  name: 'Engineering',
  value: 35
},
{
  name: 'Medicine',
  value: 30
},
{
  name: 'Pharmacy',
  value: 15
},
{
  name: 'CS',
  value: 20
}];

const requestsData = [
{
  name: 'Jan',
  requests: 120
},
{
  name: 'Feb',
  requests: 150
},
{
  name: 'Mar',
  requests: 180
},
{
  name: 'Apr',
  requests: 140
},
{
  name: 'May',
  requests: 210
},
{
  name: 'Jun',
  requests: 250
}];

const COLORS = ['#0D1B3E', '#1B8A3D', '#C5A55A', '#3B82F6', '#94A3B8'];
export function Reports() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-must-text-primary">
          Reports & Analytics
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" icon={<FileIcon className="w-4 h-4" />}>
            Export PDF
          </Button>
          <Button variant="outline" icon={<DownloadIcon className="w-4 h-4" />}>
            Export Excel
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-must-text-secondary">
            Date Range:
          </span>
          <input
            type="date"
            className="px-3 py-1.5 rounded-md border border-must-border bg-must-surface text-sm" />

          <span className="text-must-text-secondary">to</span>
          <input
            type="date"
            className="px-3 py-1.5 rounded-md border border-must-border bg-must-surface text-sm" />

          <Button variant="primary" size="sm">
            Apply Filter
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-must-text-primary">
              Students by Country
            </h2>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={countryData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--must-border)" />

                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: 'var(--must-text-secondary)'
                  }} />

                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: 'var(--must-text-secondary)'
                  }}
                  width={80} />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />

                <Bar
                  dataKey="value"
                  fill="var(--must-navy)"
                  radius={[0, 4, 4, 0]}
                  barSize={20} />

              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-must-text-primary">
              Students by Faculty
            </h2>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value">

                  {facultyData.map((entry, index) =>
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]} />

                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />

              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {facultyData.map((entry, index) =>
              <div
                key={entry.name}
                className="flex items-center text-xs text-must-text-secondary">

                  <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length]
                  }}>
                </span>
                  {entry.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-must-text-primary">
              Monthly Requests Volume
            </h2>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={requestsData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0
                }}>

                <defs>
                  <linearGradient
                    id="colorRequests"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">

                    <stop
                      offset="5%"
                      stopColor="var(--must-green)"
                      stopOpacity={0.3} />

                    <stop
                      offset="95%"
                      stopColor="var(--must-green)"
                      stopOpacity={0} />

                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--must-border)" />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: 'var(--must-text-secondary)'
                  }} />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: 'var(--must-text-secondary)'
                  }} />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />

                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--must-green)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRequests)" />

              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>);

}
import React from 'react';
import {
  UsersIcon,
  GlobeIcon,
  FileTextIcon,
  CheckCircleIcon } from
'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line } from
'recharts';
const pieData = [
{
  name: 'Egypt',
  value: 35
},
{
  name: 'Nigeria',
  value: 15
},
{
  name: 'India',
  value: 12
},
{
  name: 'Pakistan',
  value: 10
},
{
  name: 'Others',
  value: 28
}];

const COLORS = ['#0D1B3E', '#1B8A3D', '#C5A55A', '#3B82F6', '#94A3B8'];
const barData = [
{
  name: 'Engineering',
  students: 420
},
{
  name: 'Medicine',
  students: 380
},
{
  name: 'Pharmacy',
  students: 250
},
{
  name: 'CS',
  students: 180
},
{
  name: 'Business',
  students: 150
},
{
  name: 'Arts',
  students: 90
}];

const lineData = [
{
  name: 'Jan',
  registrations: 45
},
{
  name: 'Feb',
  registrations: 52
},
{
  name: 'Mar',
  registrations: 38
},
{
  name: 'Apr',
  registrations: 65
},
{
  name: 'May',
  registrations: 85
},
{
  name: 'Jun',
  registrations: 120
}];

export function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-must-text-primary">
            Welcome back, Advisor
          </h1>
          <p className="text-must-text-secondary mt-1">
            Student Affairs – International Office
          </p>
        </div>
        <div className="text-sm font-medium text-must-text-secondary bg-must-surface px-4 py-2 rounded-lg border border-must-border shadow-sm">
          {today}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<UsersIcon className="w-6 h-6" />}
          value="1,247"
          label="Total Students"
          trend="+12%"
          trendDirection="up"
          colorClass="text-blue-600 dark:text-white bg-blue-100 dark:bg-blue-900/30" />

        <StatCard
          icon={<GlobeIcon className="w-6 h-6" />}
          value="45"
          label="Students by Country"
          colorClass="text-purple-600 dark:text-white bg-purple-100 dark:bg-purple-900/30" />

        <StatCard
          icon={<FileTextIcon className="w-6 h-6" />}
          value="23"
          label="Pending Requests"
          trend="-5%"
          trendDirection="down"
          colorClass="text-yellow-600 dark:text-white bg-yellow-100 dark:bg-yellow-900/30" />

        <StatCard
          icon={<CheckCircleIcon className="w-6 h-6" />}
          value="156"
          label="Approved Requests"
          trend="+8%"
          trendDirection="up"
          colorClass="text-green-600 dark:text-white bg-green-100 dark:bg-green-900/30" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-must-text-primary">
              Students by Country
            </h2>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value">

                  {pieData.map((entry, index) =>
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
              {pieData.map((entry, index) =>
              <div
                key={entry.name}
                className="flex items-center text-xs text-must-text-secondary">

                  <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length]
                  }}>
                </span>
                  {entry.name} ({entry.value}%)
                </div>
              )}
            </div>
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
              <BarChart
                data={barData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0
                }}>

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
                  cursor={{
                    fill: 'var(--must-bg)'
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />

                <Bar
                  dataKey="students"
                  fill="var(--must-navy)"
                  radius={[4, 4, 0, 0]} />

              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-must-text-primary">
            Recent Registrations
          </h2>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lineData}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 0
              }}>

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

              <Line
                type="monotone"
                dataKey="registrations"
                stroke="var(--must-green)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: 'var(--must-green)',
                  strokeWidth: 2,
                  stroke: 'var(--must-surface)'
                }}
                activeDot={{
                  r: 6
                }} />

            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>);

}
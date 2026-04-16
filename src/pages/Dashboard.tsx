import { useEffect, useMemo, useState } from 'react';
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
  ResponsiveContainer } from
'recharts';
import { listStudents, type StudentRecord } from '../services/studentsService';

const COLORS = ['#0D1B3E', '#1B8A3D', '#C5A55A', '#3B82F6', '#94A3B8'];

function formatGpa(gpa: number | null): string {
  if (gpa == null || Number.isNaN(gpa)) {
    return '-';
  }

  return gpa.toFixed(2);
}

function toCountryLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'Unknown';
  }

  return trimmed
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

interface DashboardProps {
  userName: string;
}

export function Dashboard({ userName }: DashboardProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardStudents = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await listStudents();
        setStudents(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load students for dashboard.';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardStudents();
  }, []);

  const countryPieData = useMemo(() => {
    const countryCountMap = new Map<string, number>();

    students.forEach((student) => {
      const country = toCountryLabel(student.nationality || 'Unknown');
      countryCountMap.set(country, (countryCountMap.get(country) ?? 0) + 1);
    });

    const sorted = Array.from(countryCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    if (sorted.length <= 4) {
      return sorted;
    }

    const topThree = sorted.slice(0, 3);
    const otherTotal = sorted.slice(3).reduce((sum, item) => sum + item.value, 0);
    return [...topThree, { name: 'Other', value: otherTotal }];
  }, [students]);

  const majorBarData = useMemo(() => {
    const majorOrder = ['cs', 'is', 'ai', 'general'];
    const majorCountMap = new Map<string, number>();

    students.forEach((student) => {
      majorCountMap.set(student.major, (majorCountMap.get(student.major) ?? 0) + 1);
    });

    return majorOrder
      .filter((major) => majorCountMap.has(major))
      .map((major) => ({
        name: major.toUpperCase(),
        students: majorCountMap.get(major) ?? 0
      }));
  }, [students]);

  const levelBarData = useMemo(() => {
    const levelCountMap = new Map<string, number>();

    students.forEach((student) => {
      const levelLabel = student.level.trim() || 'Unknown';
      levelCountMap.set(levelLabel, (levelCountMap.get(levelLabel) ?? 0) + 1);
    });

    const getLevelSortValue = (level: string): number => {
      const matches = level.match(/\d+/);
      if (!matches) {
        return Number.MAX_SAFE_INTEGER;
      }
      return Number(matches[0]);
    };

    return Array.from(levelCountMap.entries())
      .sort((a, b) => getLevelSortValue(a[0]) - getLevelSortValue(b[0]))
      .map(([name, studentsCount]) => ({ name, students: studentsCount }));
  }, [students]);

  const uniqueCountriesCount = useMemo(() => {
    return new Set(students.map((student) => toCountryLabel(student.nationality || 'Unknown'))).size;
  }, [students]);

  const highestGpa = useMemo(() => {
    const availableGpas = students
      .map((student) => student.gpa)
      .filter((gpa): gpa is number => gpa != null && !Number.isNaN(gpa));

    if (availableGpas.length === 0) {
      return null;
    }

    return Math.max(...availableGpas);
  }, [students]);

  const lowestGpa = useMemo(() => {
    const availableGpas = students
      .map((student) => student.gpa)
      .filter((gpa): gpa is number => gpa != null && !Number.isNaN(gpa));

    if (availableGpas.length === 0) {
      return null;
    }

    return Math.min(...availableGpas);
  }, [students]);

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
            Welcome, Advisor {userName}
          </h1>
          <p className="text-must-text-secondary mt-1">
            College of Infomation Technology – International Student Affairs Office
          </p>
        </div>
        <div className="text-sm font-medium text-must-text-secondary bg-must-surface px-4 py-2 rounded-lg border border-must-border shadow-sm">
          {today}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<UsersIcon className="w-6 h-6" />}
          value={isLoading ? '...' : students.length}
          label="Total Students"
          colorClass="text-blue-600 dark:text-white bg-blue-100 dark:bg-blue-900/30" />

        <StatCard
          icon={<GlobeIcon className="w-6 h-6" />}
          value={isLoading ? '...' : uniqueCountriesCount}
          label="Number of Countries"
          colorClass="text-purple-600 dark:text-white bg-purple-100 dark:bg-purple-900/30" />

        <StatCard
          icon={<FileTextIcon className="w-6 h-6" />}
          value={isLoading ? '...' : formatGpa(highestGpa)}
          label="Highest GPA"
          colorClass="text-yellow-600 dark:text-white bg-yellow-100 dark:bg-yellow-900/30" />

        <StatCard
          icon={<CheckCircleIcon className="w-6 h-6" />}
          value={isLoading ? '...' : formatGpa(lowestGpa)}
          label="Lowest GPA"
          colorClass="text-green-600 dark:text-white bg-green-100 dark:bg-green-900/30" />

      </div>

      {loadError &&
      <Card className="p-4 border border-red-300 text-red-700 dark:text-red-300">
          {loadError}
        </Card>
      }

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-must-text-primary">
              Students by Country
            </h2>
          </CardHeader>
          <CardContent className="h-[300px] relative">
            {countryPieData.length === 0 ?
            <div className="absolute inset-0 flex items-center justify-center text-sm text-must-text-secondary">
                No students yet
              </div> :
            <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value">

                      {countryPieData.map((_, index) =>
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
                  {countryPieData.map((entry, index) =>
                <div
                  key={entry.name}
                  className="flex items-center text-xs text-must-text-secondary">

                      <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length]
                    }}>
                  </span>
                      {entry.name} ({entry.value})
                    </div>
                )}
                </div>
              </>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-must-text-primary">
              Students by Major
            </h2>
          </CardHeader>
          <CardContent className="h-[300px] relative">
            {majorBarData.length === 0 ?
            <div className="absolute inset-0 flex items-center justify-center text-sm text-must-text-secondary">
                No students yet
              </div> :
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={majorBarData}
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
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-must-text-primary">
            Students by Level
          </h2>
        </CardHeader>
        <CardContent className="h-[300px] relative">
          {levelBarData.length === 0 ?
          <div className="absolute inset-0 flex items-center justify-center text-sm text-must-text-secondary">
              No students yet
            </div> :
          <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={levelBarData}
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
                  fill="var(--must-green)"
                  radius={[4, 4, 0, 0]} />

              </BarChart>
            </ResponsiveContainer>
          }
        </CardContent>
      </Card>
    </div>);

}
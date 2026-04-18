import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { UsersIcon, FileTextIcon, UserCheckIcon, UserXIcon, DownloadIcon, FileIcon } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
import { countAdvisorProfiles } from '../services/authService';

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

function getSvgDataUrl(svg: SVGSVGElement): string {
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  const width = svg.clientWidth || Number(svg.getAttribute('width')) || 900;
  const height = svg.clientHeight || Number(svg.getAttribute('height')) || 320;

  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clonedSvg.setAttribute('width', String(width));
  clonedSvg.setAttribute('height', String(height));

  if (!clonedSvg.getAttribute('viewBox')) {
    clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clonedSvg);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
}

function getCountryColor(index: number, total: number): string {
  const palette = [
    '#dc2626',
    '#2563eb',
    '#16a34a',
    '#f59e0b',
    '#7c3aed',
    '#db2777',
    '#0891b2',
    '#ea580c',
    '#65a30d',
    '#4f46e5',
    '#be123c',
    '#0f766e'
  ];

  return palette[index % palette.length];
}

interface ReportsProps {
  userName: string;
}

export function Reports({ userName }: ReportsProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [advisorCount, setAdvisorCount] = useState(0);
  const countryChartRef = useRef<HTMLDivElement | null>(null);
  const majorChartRef = useRef<HTMLDivElement | null>(null);
  const levelChartRef = useRef<HTMLDivElement | null>(null);
  const gpaChartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadDashboardStudents = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await listStudents();
        const advisors = await countAdvisorProfiles();
        setStudents(data);
        setAdvisorCount(advisors);
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

    return Array.from(countryCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
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

  const gpaRangeData = useMemo(() => {
    const ranges = [
      { label: 'Excellent', min: 3.6, max: 4 },
      { label: 'Very Good', min: 2.7, max: 3.599999 },
      { label: 'Good', min: 2, max: 2.699999 },
      { label: 'Pass', min: 0, max: 1.999999 }
    ];

    return ranges.map((range) => ({
      name: range.label,
      students: students.filter((student) => student.gpa != null && student.gpa >= range.min && student.gpa <= range.max).length
    }));
  }, [students]);

  const activeStudentsCount = useMemo(() => {
    return students.filter((student) => student.status === 'active').length;
  }, [students]);

  const discontinuedStudentsCount = useMemo(() => {
    return students.filter((student) => student.status === 'discontinued').length;
  }, [students]);

  const strugglingStudentsCount = useMemo(() => {
    return students.filter((student) => student.gpa != null && student.gpa < 2).length;
  }, [students]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const downloadChartAsPng = (chartRef: RefObject<HTMLDivElement | null>, title: string, fileName: string) => {
    const svg = chartRef.current?.querySelector('svg');

    if (!svg) {
      setLoadError('Chart is not ready to download yet.');
      return;
    }

    const image = new Image();
    const url = getSvgDataUrl(svg);

    image.onload = () => {
      const chartWidth = svg.clientWidth || 900;
      const chartHeight = svg.clientHeight || 320;
      const padding = 32;
      const headerHeight = 72;
      const canvas = document.createElement('canvas');
      const scale = 2;

      canvas.width = (chartWidth + padding * 2) * scale;
      canvas.height = (chartHeight + padding * 2 + headerHeight) * scale;

      const context = canvas.getContext('2d');
      if (!context) {
        setLoadError('Failed to prepare chart download.');
        return;
      }

      context.scale(scale, scale);
      const cardWidth = chartWidth + padding * 2;
      const cardHeight = chartHeight + padding * 2 + headerHeight;
      const radius = 24;

      context.fillStyle = '#eef6f0';
      context.fillRect(0, 0, cardWidth, cardHeight);

      context.fillStyle = '#ffffff';
      context.beginPath();
      context.moveTo(radius, 0);
      context.lineTo(cardWidth - radius, 0);
      context.quadraticCurveTo(cardWidth, 0, cardWidth, radius);
      context.lineTo(cardWidth, cardHeight - radius);
      context.quadraticCurveTo(cardWidth, cardHeight, cardWidth - radius, cardHeight);
      context.lineTo(radius, cardHeight);
      context.quadraticCurveTo(0, cardHeight, 0, cardHeight - radius);
      context.lineTo(0, radius);
      context.quadraticCurveTo(0, 0, radius, 0);
      context.closePath();
      context.fill();

      context.strokeStyle = '#d7e7db';
      context.lineWidth = 1;
      context.stroke();

      context.fillStyle = '#16301e';
      context.font = '700 24px Arial';
      context.fillText(title, padding, 38);

      context.fillStyle = '#5f7164';
      context.font = '400 14px Arial';
      context.fillText(`Total students: ${students.length}`, padding, 62);

      context.drawImage(image, padding, headerHeight, chartWidth, chartHeight);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          setLoadError('Failed to generate chart image.');
          return;
        }

        const pngUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };

    image.onerror = () => {
      setLoadError('Failed to generate chart image.');
    };

    image.src = url;
  };

  const handleDownloadCountryChart = () => {
    downloadChartAsPng(countryChartRef, 'Students by Country', 'reports-students-by-country.png');
  };

  const handleDownloadMajorChart = () => {
    downloadChartAsPng(majorChartRef, 'Students by Major', 'reports-students-by-major.png');
  };

  const handleDownloadLevelChart = () => {
    downloadChartAsPng(levelChartRef, 'Students by Level', 'reports-students-by-level.png');
  };

  const handleDownloadGpaChart = () => {
    downloadChartAsPng(gpaChartRef, 'Students by CGPA Classification', 'reports-cgpa-classification-chart.png');
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-must-text-primary">Reports & statistical analytics</h1>
          <p className="text-must-text-secondary mt-1">
            Signed in as {userName}. College of Information Technology – International Student Affairs Office.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" icon={<FileIcon className="w-4 h-4" />}>
              Export PDF
            </Button>
            <Button type="button" variant="outline" size="sm" icon={<DownloadIcon className="w-4 h-4" />}>
              Export Excel
            </Button>
          </div>
          <div className="text-sm font-medium text-must-text-secondary bg-must-surface px-4 py-2 rounded-lg border border-must-border shadow-sm text-center sm:text-right">
            {today}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<UsersIcon className="w-6 h-6" />}
          value={isLoading ? '...' : activeStudentsCount}
          label="Active Students"
          colorClass="text-blue-600 dark:text-white bg-blue-100 dark:bg-blue-900/30" />

        <StatCard
          icon={<UserCheckIcon className="w-6 h-6" />}
          value={isLoading ? '...' : advisorCount}
          label="Advisors"
          colorClass="text-purple-600 dark:text-white bg-purple-100 dark:bg-purple-900/30" />

        <StatCard
          icon={<FileTextIcon className="w-6 h-6" />}
          value={isLoading ? '...' : strugglingStudentsCount}
          label="Struggling Students"
          colorClass="text-yellow-600 dark:text-white bg-yellow-100 dark:bg-yellow-900/30" />

        <StatCard
          icon={<UserXIcon className="w-6 h-6" />}
          value={isLoading ? '...' : discontinuedStudentsCount}
          label="Discontinued Students"
          colorClass="text-green-600 dark:text-white bg-green-100 dark:bg-green-900/30" />

      </div>

      {loadError &&
      <Card className="p-4 border border-red-300 text-red-700 dark:text-red-300">
          {loadError}
        </Card>
      }

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="group">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-must-text-primary">
              Students by Country
            </h2>
            <button
              type="button"
              onClick={handleDownloadCountryChart}
              className="inline-flex items-center gap-2 rounded-lg border border-must-border px-3 py-2 text-sm text-must-text-secondary hover:text-must-text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100">

              <DownloadIcon className="w-4 h-4" />
              Download
            </button>
          </CardHeader>
          <CardContent className="h-[360px] relative">
            <div ref={countryChartRef} className="h-full flex flex-col">
              {countryPieData.length === 0 ?
              <div className="absolute inset-0 flex items-center justify-center text-sm text-must-text-secondary">
                  No students yet
                </div> :
              <>
                  <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={countryPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="value">

                          {countryPieData.map((_, index) =>
                        <Cell
                          key={`cell-${index}`}
                          fill={getCountryColor(index, countryPieData.length)} />

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
                  </div>
                  <div className="mt-3 max-h-[112px] overflow-y-auto border-t border-must-border/70 pt-3">
                    <div className="flex flex-wrap justify-center gap-3">
                    {countryPieData.map((entry, index) =>
                  <div
                    key={entry.name}
                    title={`${entry.name}: ${entry.value} student${entry.value === 1 ? '' : 's'}`}
                    className="inline-flex items-center gap-2 rounded-full border border-must-border bg-slate-50 px-3 py-1.5 text-xs text-must-text-primary shadow-sm hover:bg-slate-100 transition-colors">

                        <span
                      className="inline-block h-2.5 w-6 rounded-full"
                      style={{
                        backgroundColor: getCountryColor(index, countryPieData.length)
                      }}>
                    </span>
                        <span className="font-medium">{entry.name}</span>
                        <span className="text-must-text-secondary">{entry.value}</span>
                      </div>
                  )}
                    </div>
                  </div>
                </>
              }
            </div>
          </CardContent>
        </Card>

        <Card className="group">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-must-text-primary">
              Students by Major
            </h2>
            <button
              type="button"
              onClick={handleDownloadMajorChart}
              className="inline-flex items-center gap-2 rounded-lg border border-must-border px-3 py-2 text-sm text-must-text-secondary hover:text-must-text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100">

              <DownloadIcon className="w-4 h-4" />
              Download
            </button>
          </CardHeader>
          <CardContent className="h-[300px] relative">
            <div ref={majorChartRef} className="h-full">
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
                      fill="var(--must-green)"
                      radius={[6, 6, 0, 0]} />

                  </BarChart>
                </ResponsiveContainer>
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="group">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-must-text-primary">
            Students by Level
          </h2>
          <button
            type="button"
            onClick={handleDownloadLevelChart}
            className="inline-flex items-center gap-2 rounded-lg border border-must-border px-3 py-2 text-sm text-must-text-secondary hover:text-must-text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100">

            <DownloadIcon className="w-4 h-4" />
            Download
          </button>
        </CardHeader>
        <CardContent className="h-[300px] relative">
          <div ref={levelChartRef} className="h-full">
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
                    radius={[6, 6, 0, 0]} />

                </BarChart>
              </ResponsiveContainer>
            }
          </div>
        </CardContent>
      </Card>

      <Card className="group">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-must-text-primary">
            Students by CGPA Classification
          </h2>
          <button
            type="button"
            onClick={handleDownloadGpaChart}
            className="inline-flex items-center gap-2 rounded-lg border border-must-border px-3 py-2 text-sm text-must-text-secondary hover:text-must-text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100">

            <DownloadIcon className="w-4 h-4" />
            Download
          </button>
        </CardHeader>
        <CardContent className="h-[320px] relative">
          <div ref={gpaChartRef} className="h-full">
            {gpaRangeData.every((item) => item.students === 0) ?
            <div className="absolute inset-0 flex items-center justify-center text-sm text-must-text-secondary">
                No GPA data yet
              </div> :
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gpaRangeData}
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
                    allowDecimals={false}
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
                    radius={[6, 6, 0, 0]} />

                </BarChart>
              </ResponsiveContainer>
            }
          </div>
        </CardContent>
      </Card>
    </div>);

}

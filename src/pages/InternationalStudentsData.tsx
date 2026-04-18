import { useEffect, useMemo, useState } from 'react';
import { GlobeIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { listStudents, type StudentRecord } from '../services/studentsService';

function isLikelyDomesticEgyptian(nationality: string): boolean {
  const n = nationality.trim().toLowerCase();
  if (!n) {
    return false;
  }
  return n === 'egypt' || n === 'egyptian' || n === 'eg' || n.startsWith('egypt');
}

export function InternationalStudentsData() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listStudents();
        if (!cancelled) {
          setStudents(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load student records.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const internationalStudents = useMemo(
    () => students.filter((s) => !isLikelyDomesticEgyptian(s.nationality ?? '')),
    [students]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-must-text-primary">International Students Data</h1>
      <p className="text-sm text-must-text-secondary max-w-3xl">
        Records where nationality is not flagged as Egyptian. Use this view for international student
        advising and reporting.
      </p>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-must-text-primary flex items-center gap-2">
            <GlobeIcon className="w-5 h-5 text-must-green" />
            International roster
            {!isLoading && (
              <span className="text-sm font-normal text-must-text-secondary">
                ({internationalStudents.length} of {students.length} students)
              </span>
            )}
          </h2>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {isLoading && <p className="text-sm text-must-text-secondary">Loading…</p>}
          {!isLoading && !error && internationalStudents.length === 0 && (
            <p className="text-sm text-must-text-secondary">No international student records found.</p>
          )}
          {!isLoading && !error && internationalStudents.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-must-border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/40 text-must-text-secondary">
                  <tr>
                    <th className="px-3 py-2 text-right font-medium">Student ID</th>
                    <th className="px-3 py-2 text-right font-medium">Name</th>
                    <th className="px-3 py-2 text-right font-medium">Nationality</th>
                    <th className="px-3 py-2 text-right font-medium">Major</th>
                    <th className="px-3 py-2 text-right font-medium">Level</th>
                    <th className="px-3 py-2 text-right font-medium">Advisor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-must-border text-must-text-primary">
                  {internationalStudents.map((student) => (
                    <tr key={student.student_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2 whitespace-nowrap">{student.student_id}</td>
                      <td className="px-3 py-2">{student.full_name}</td>
                      <td className="px-3 py-2">{student.nationality || '—'}</td>
                      <td className="px-3 py-2 uppercase">{student.major}</td>
                      <td className="px-3 py-2">{student.level}</td>
                      <td className="px-3 py-2">{student.advisor_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

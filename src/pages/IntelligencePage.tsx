import { useState, useMemo, useEffect } from "react";
import { useStudents } from "@/hooks/useStudents";
import YearFilter from "@/components/YearFilter";
import DepartmentFilter from "@/components/DepartmentFilter";
import ExtrapolationPanel from "@/components/ExtrapolationPanel";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { BrainCircuit } from "lucide-react";

export default function IntelligencePage() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  const { students: allStudents, loading, error, refetch } = useStudents(
    selectedYear !== "all" ? { year: selectedYear } : {}
  );

  const departments = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.department))).sort(),
    [allStudents]
  );

  useEffect(() => {
    setSelectedDepts(departments);
  }, [departments]);

  const students = useMemo(() => {
    if (selectedDepts.length === 0 || selectedDepts.length === departments.length)
      return allStudents;
    return allStudents.filter((s) => selectedDepts.includes(s.department));
  }, [allStudents, selectedDepts, departments]);

  if (loading) return <LoadingState message="Loading intelligence data…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projections</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Extrapolation engine — projecting absentee performance from present student distributions
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />
      <DepartmentFilter
        departments={departments}
        selected={selectedDepts}
        onChange={setSelectedDepts}
      />

      {/* Extrapolation Panel */}
      {students.length > 0 ? (
        <ExtrapolationPanel students={students} />
      ) : (
        <div className="kpi-card text-center py-12">
          <p className="text-muted-foreground">No students match the selected filters.</p>
        </div>
      )}
    </div>
  );
}

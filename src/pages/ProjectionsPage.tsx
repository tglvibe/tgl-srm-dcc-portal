import { useState, useMemo, useEffect } from "react";
import { useStudents } from "@/hooks/useStudents";
import YearFilter from "@/components/YearFilter";
import MultiSelectFilter from "@/components/MultiSelectFilter";
import ExtrapolationPanel from "@/components/ExtrapolationPanel";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { BrainCircuit } from "lucide-react";

export default function ProjectionsPage() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  const { students: allStudents, loading, error, refetch } = useStudents(
    selectedYear !== "all" ? { year: selectedYear } : {}
  );

  const programs = useMemo(() => Array.from(new Set(allStudents.map((s) => s.program))).filter(Boolean) as string[], [allStudents]);
  const departments = useMemo(() => Array.from(new Set(allStudents.map((s) => s.department))).sort(), [allStudents]);

  // specializations depend on selected departments/programs
  const studentsByDeptAndProgram = useMemo(() => {
    let data = allStudents;
    if (selectedDepts.length > 0 && selectedDepts.length < departments.length) data = data.filter(s => selectedDepts.includes(s.department));
    if (selectedPrograms.length > 0 && selectedPrograms.length < programs.length) data = data.filter(s => selectedPrograms.includes(String(s.program)));
    return data;
  }, [allStudents, selectedDepts, selectedPrograms, departments, programs]);

  const specializations = useMemo(() => Array.from(new Set(studentsByDeptAndProgram.map(s => s.specialization))).filter(Boolean).sort() as string[], [studentsByDeptAndProgram]);

  useEffect(() => { setSelectedDepts(departments); }, [departments]);
  useEffect(() => { setSelectedPrograms(programs); }, [programs]);
  useEffect(() => { setSelectedSpecs(specializations); }, [specializations]);

  const students = useMemo(() => {
    let data = allStudents;
    if (selectedPrograms.length > 0 && selectedPrograms.length < programs.length) data = data.filter(s => selectedPrograms.includes(String(s.program)));
    if (selectedDepts.length > 0 && selectedDepts.length < departments.length) data = data.filter(s => selectedDepts.includes(s.department));
    if (selectedSpecs.length > 0 && selectedSpecs.length < specializations.length) data = data.filter(s => selectedSpecs.includes(s.specialization));
    return data;
  }, [allStudents, selectedPrograms, selectedDepts, selectedSpecs, programs, departments, specializations]);

  if (loading) return <LoadingState message="Loading projections data…" />;
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
      <div className="space-y-2">
        <MultiSelectFilter
          label="Program"
          items={programs}
          selected={selectedPrograms}
          onChange={setSelectedPrograms}
          hideAllButton={true}
        />
        <MultiSelectFilter
          label="Departments"
          items={departments}
          selected={selectedDepts}
          onChange={setSelectedDepts}
          hideAllButton={true}
        />
        <MultiSelectFilter
          label="Specializations"
          items={specializations}
          selected={selectedSpecs}
          onChange={setSelectedSpecs}
          hideAllButton={true}
        />
      </div>

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

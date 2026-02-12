import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import StatCard from "@/components/StatCard";
import DepartmentFilter from "@/components/DepartmentFilter";
import YearFilter from "@/components/YearFilter";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ExportDialog from "@/components/ExportDialog";
import BandBadge from "@/components/BandBadge";
import { Lightbulb } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  isActive, isR1Passed, isR2Present, getR2Category,
  R2_CATEGORIES_ORDER, PIE_COLORS, computeR2Categories,
} from "@/lib/analyticsUtils";

export default function AdminDashboard() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [exportCtx, setExportCtx] = useState<{ label: string; students: StudentRecord[] } | null>(null);

  const { students: allStudents, loading, error, refetch } = useStudents(
    selectedYear !== "all" ? { year: selectedYear } : {}
  );

  // Unique departments
  const departments = useMemo(() => {
    return Array.from(new Set(allStudents.map((s) => s.department))).sort();
  }, [allStudents]);

  // Reset dept selection when year changes
  useEffect(() => {
    setSelectedDepts(departments);
  }, [departments]);

  // Filter by selected departments
  const students = useMemo(() => {
    if (selectedDepts.length === 0 || selectedDepts.length === departments.length) return allStudents;
    return allStudents.filter((s) => selectedDepts.includes(s.department));
  }, [allStudents, selectedDepts, departments]);

  // Compute all stats
  const stats = useMemo(() => {
    const total = students.length;
    const specs = new Set(students.map((s) => s.specialization)).size;
    const activeCount = students.filter(isActive).length;
    const inactiveCount = total - activeCount;
    const r1Present = students.filter((s) => s.r1_attendance === "Present").length;
    const r1Absent = total - r1Present;
    const r1Passed = students.filter(isR1Passed).length;
    const r1Failed = r1Present - r1Passed;

    const r2All = students.filter((s) => s.r2_status != null);
    const r2Conducted = r2All.length > 0;
    const r2Qualified = r1Passed;
    const r2PresentCount = r2All.filter(isR2Present).length;
    const r2AbsentCount = r2All.filter((s) => s.r2_status === "R2-ABSENT").length;
    const r2PresentStudents = r2All.filter(isR2Present);
    const r2PassedCount = r2PresentStudents.filter((s) => {
      const cat = getR2Category(s.r2_status!);
      return cat === "T3" || cat === "High Potential";
    }).length;
    const r2FailedCount = r2PresentCount - r2PassedCount;
    const r2Categories = computeR2Categories(students);

    // Dept band breakdown
    const deptBands = departments
      .filter((d) => selectedDepts.includes(d))
      .map((dept) => {
        const ds = students.filter((s) => s.department === dept && s.r1_attendance === "Present");
        return {
          department: dept,
          "C1–C4": ds.filter((s) => ["C1", "C2", "C3", "C4"].includes(s.coding_band || "")).length,
          "C5–C6": ds.filter((s) => ["C5", "C6"].includes(s.coding_band || "")).length,
        };
      })
      .filter((d) => d["C1–C4"] + d["C5–C6"] > 0);

    const pct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(0) : "0");

    return {
      total, specs, activeCount, inactiveCount,
      activePct: pct(activeCount, total), inactivePct: pct(inactiveCount, total),
      r1Present, r1Absent,
      r1PresentPct: pct(r1Present, total), r1AbsentPct: pct(r1Absent, total),
      r1Passed, r1Failed,
      r1PassedPct: pct(r1Passed, r1Present), r1FailedPct: pct(r1Failed, r1Present),
      r2Conducted, r2Qualified, r2PresentCount, r2AbsentCount, r2PassedCount, r2FailedCount,
      r2QualifiedPct: "100",
      r2PresentPct: pct(r2PresentCount, r2Qualified),
      r2PassedPct: pct(r2PassedCount, r2PresentCount),
      r2FailedPct: pct(r2FailedCount, r2PresentCount),
      r2Categories,
      deptBands,
    };
  }, [students, departments, selectedDepts]);

  if (loading) return <LoadingState message="Loading dashboard data…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const openExport = (label: string, filtered?: StudentRecord[]) => {
    setExportCtx({ label, students: filtered || students });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time analytics across {stats.total.toLocaleString()} student records
          </p>
        </div>
        <Link
          to={`/insights?year=${selectedYear}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-warning text-warning-foreground font-semibold text-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all"
        >
          <Lightbulb className="w-4 h-4" />
          Insights
        </Link>
      </div>

      {/* Year Filter */}
      <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />

      {/* Department Filter */}
      <DepartmentFilter departments={departments} selected={selectedDepts} onChange={setSelectedDepts} />

      {/* Row 1: Total, Specializations, Active, Inactive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={stats.total} label="Total Students" onClick={() => openExport("Total Students")} />
        <StatCard value={stats.specs} label="Specializations" variant="info" />
        <StatCard
          value={stats.activeCount} label="Active Students" percentage={`${stats.activePct}%`}
          variant="success" onClick={() => openExport("Active Students", students.filter(isActive))}
        />
        <StatCard
          value={stats.inactiveCount} label="Inactive Students" percentage={`${stats.inactivePct}%`}
          variant="danger" onClick={() => openExport("Inactive Students", students.filter((s) => !isActive(s)))}
        />
      </div>

      {/* Row 2: R1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={stats.r1Present} label="R1 Present" percentage={`${stats.r1PresentPct}%`}
          variant="success" onClick={() => openExport("R1 Present", students.filter((s) => s.r1_attendance === "Present"))}
        />
        <StatCard
          value={stats.r1Absent} label="R1 Absent" percentage={`${stats.r1AbsentPct}%`}
          variant="danger" onClick={() => openExport("R1 Absent", students.filter((s) => s.r1_attendance === "Absent"))}
        />
        <StatCard
          value={stats.r1Passed} label="R1 Passed" percentage={`${stats.r1PassedPct}%`}
          variant="success" onClick={() => openExport("R1 Passed", students.filter(isR1Passed))}
        />
        <StatCard
          value={stats.r1Failed} label="R1 Failed" percentage={`${stats.r1FailedPct}%`}
          variant="danger" onClick={() => openExport("R1 Failed", students.filter((s) => s.r1_attendance === "Present" && s.r1_result !== "PASS"))}
        />
      </div>

      {/* R2 Section (conditional) */}
      {stats.r2Conducted && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground px-4 py-1.5 rounded-full bg-muted border border-border">
              Round 2
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={stats.r2Qualified} label="R2 Qualified" percentage={`${stats.r2QualifiedPct}%`} variant="info" />
            <StatCard value={stats.r2PresentCount} label="R2 Present" percentage={`${stats.r2PresentPct}%`} variant="success" />
            <StatCard value={stats.r2PassedCount} label="R2 Passed" percentage={`${stats.r2PassedPct}%`} variant="success" />
            <StatCard value={stats.r2FailedCount} label="R2 Failed" percentage={`${stats.r2FailedPct}%`} variant="danger" />
          </div>

          {/* R2 Category Table + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="kpi-card">
              <h3 className="text-sm font-semibold text-foreground mb-4">R2 Performance Categories</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">No.</th>
                    <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.r2Categories.map((cat) => (
                    <tr key={cat.category} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">{cat.category}</td>
                      <td className="py-2.5 px-3 text-right text-foreground">{cat.count}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{cat.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="kpi-card flex flex-col items-center justify-center">
              <h3 className="text-sm font-semibold text-foreground mb-4 self-start">R2 Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stats.r2Categories.filter((c) => c.count > 0)}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                    dataKey="count" nameKey="category"
                    label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.r2Categories.filter((c) => c.count > 0).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Students"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Department Band Charts */}
      {stats.deptBands.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">R1 Pass Bands by Department (C1–C4)</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, stats.deptBands.length * 36)}>
              <BarChart data={stats.deptBands} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={65} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="C1–C4" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">R1 Fail Bands by Department (C5–C6)</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, stats.deptBands.length * 36)}>
              <BarChart data={stats.deptBands} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={65} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="C5–C6" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {exportCtx && (
        <ExportDialog
          open={!!exportCtx}
          label={exportCtx.label}
          students={exportCtx.students}
          year={selectedYear}
          onClose={() => setExportCtx(null)}
        />
      )}
    </div>
  );
}

// Type import for inline usage
import type { StudentRecord } from "@/types/database";

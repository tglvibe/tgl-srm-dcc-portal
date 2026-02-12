import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import YearFilter from "@/components/YearFilter";
import DepartmentFilter from "@/components/DepartmentFilter";
import ExportDialog from "@/components/ExportDialog";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { ArrowLeft, FileText } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  isActive, PIE_COLORS,
  computeDeptSpecTable, computeBandDistribution,
  computeR2Categories, R2_CATEGORIES_ORDER,
} from "@/lib/analyticsUtils";
import type { StudentRecord } from "@/types/database";

export default function InsightsPage() {
  const [searchParams] = useSearchParams();
  const [selectedYear, setSelectedYear] = useState(searchParams.get("year") || "all");
  const [selectedRound, setSelectedRound] = useState<"1" | "2">("1");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [exportCtx, setExportCtx] = useState<{ label: string; students: StudentRecord[] } | null>(null);

  const { students: allStudents, loading, error, refetch } = useStudents(
    selectedYear !== "all" ? { year: selectedYear } : {}
  );

  const departments = useMemo(() => Array.from(new Set(allStudents.map((s) => s.department))).sort(), [allStudents]);

  useEffect(() => { setSelectedDepts(departments); }, [departments]);

  // Available specializations based on selected departments
  const specializations = useMemo(() => {
    const filtered = selectedDepts.length === departments.length
      ? allStudents
      : allStudents.filter((s) => selectedDepts.includes(s.department));
    return Array.from(new Set(filtered.map((s) => s.specialization))).sort();
  }, [allStudents, selectedDepts, departments]);

  useEffect(() => { setSelectedSpecs(specializations); }, [specializations]);

  // Filtered students
  const students = useMemo(() => {
    let data = allStudents;
    if (selectedDepts.length > 0 && selectedDepts.length < departments.length) {
      data = data.filter((s) => selectedDepts.includes(s.department));
    }
    if (selectedSpecs.length > 0 && selectedSpecs.length < specializations.length) {
      data = data.filter((s) => selectedSpecs.includes(s.specialization));
    }
    return data;
  }, [allStudents, selectedDepts, selectedSpecs, departments, specializations]);

  // Stats
  const total = students.length;
  const activeCount = students.filter(isActive).length;
  const inactiveCount = total - activeCount;

  // Table data
  const { rows, totals } = useMemo(
    () => computeDeptSpecTable(students, selectedRound),
    [students, selectedRound]
  );

  // Attendance and result pies
  const attendancePie = useMemo(() => {
    if (selectedRound === "1") {
      const present = students.filter((s) => s.r1_attendance === "Present").length;
      const absent = total - present;
      return [
        { name: "Present", value: present },
        { name: "Absent", value: absent },
      ];
    }
    return [
      { name: "Present", value: totals.present },
      { name: "Absent", value: totals.absent },
    ];
  }, [students, total, totals, selectedRound]);

  const resultPie = useMemo(() => [
    { name: "Passed", value: totals.passed },
    { name: "Failed", value: totals.failed },
  ], [totals]);

  // Band distributions
  const codingBands = useMemo(() => computeBandDistribution(students, "coding_band"), [students]);
  const aptitudeBands = useMemo(() => computeBandDistribution(students, "aptitude_band"), [students]);

  // R2 categories
  const r2Categories = useMemo(() => computeR2Categories(students), [students]);
  const hasR2 = students.some((s) => s.r2_status != null);

  if (loading) return <LoadingState message="Loading insights data…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const openExport = (label: string) => setExportCtx({ label, students });

  const handleReportClick = () => {
    const params = new URLSearchParams({
      year: selectedYear,
      round: selectedRound,
      dept: selectedDepts.join(","),
      spec: selectedSpecs.join(","),
    });
    window.open(`/report?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Insights</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Detailed analytics & breakdowns
            </p>
          </div>
        </div>
        <button
          onClick={handleReportClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:shadow-lg transition-all"
        >
          <FileText className="w-4 h-4" />
          PDF Report
        </button>
      </div>

      {/* Year Filter */}
      <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />

      {/* Top Stats */}
      <div className="flex items-center gap-6 kpi-card">
        <div className="text-center px-4">
          <div className="text-2xl font-bold text-foreground">{total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total Students</div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center px-4">
          <div className="text-2xl font-bold text-success">{activeCount.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Active Students</div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center px-4">
          <div className="text-2xl font-bold text-destructive">{inactiveCount.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Inactive Students</div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="space-y-3">
        <DepartmentFilter departments={departments} selected={selectedDepts} onChange={setSelectedDepts} label="Departments" />
        <DepartmentFilter departments={specializations} selected={selectedSpecs} onChange={setSelectedSpecs} label="Specializations" />
      </div>

      {/* Round Toggle */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm w-fit">
        <button
          onClick={() => setSelectedRound("1")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedRound === "1"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Round 1
        </button>
        <button
          onClick={() => setSelectedRound("2")}
          disabled={!hasR2}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedRound === "2"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          } ${!hasR2 ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          Round 2
        </button>
      </div>

      {/* Main Table */}
      <div className="kpi-card overflow-x-auto">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Department × Specialization Breakdown ({selectedRound === "1" ? "Round 1" : "Round 2"})
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-2.5 px-2 font-medium text-muted-foreground">Department</th>
              <th className="text-left py-2.5 px-2 font-medium text-muted-foreground">Specialization</th>
              <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Qualified</th>
              <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Present</th>
              <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Present%</th>
              <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Absent</th>
              <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Absent%</th>
              <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Passed</th>
              <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Passed%</th>
              <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Failed</th>
              <th className="text-right py-2.5 px-2 font-medium text-muted-foreground">Failed%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => openExport(`${row.department} – ${row.specialization}`)}
              >
                <td className="py-2 px-2 font-medium text-foreground">{row.department}</td>
                <td className="py-2 px-2 text-foreground">{row.specialization}</td>
                <td className="py-2 px-2 text-right">{row.qualified}</td>
                <td className="py-2 px-2 text-right">{row.present}</td>
                <td className="py-2 px-2 text-right text-muted-foreground">{row.presentPct.toFixed(0)}%</td>
                <td className="py-2 px-2 text-right">{row.absent}</td>
                <td className="py-2 px-2 text-right text-muted-foreground">{row.absentPct.toFixed(0)}%</td>
                <td className="py-2 px-2 text-right text-success">{row.passed}</td>
                <td className="py-2 px-2 text-right text-muted-foreground">{row.passedPct.toFixed(0)}%</td>
                <td className="py-2 px-2 text-right text-destructive">{row.failed}</td>
                <td className="py-2 px-2 text-right text-muted-foreground">{row.failedPct.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/20 font-semibold">
              <td className="py-2.5 px-2" colSpan={2}>Total</td>
              <td className="py-2.5 px-2 text-right">{totals.qualified}</td>
              <td className="py-2.5 px-2 text-right">{totals.present}</td>
              <td className="py-2.5 px-2 text-right text-muted-foreground">{totals.presentPct.toFixed(0)}%</td>
              <td className="py-2.5 px-2 text-right">{totals.absent}</td>
              <td className="py-2.5 px-2 text-right text-muted-foreground">{totals.absentPct.toFixed(0)}%</td>
              <td className="py-2.5 px-2 text-right text-success">{totals.passed}</td>
              <td className="py-2.5 px-2 text-right text-muted-foreground">{totals.passedPct.toFixed(0)}%</td>
              <td className="py-2.5 px-2 text-right text-destructive">{totals.failed}</td>
              <td className="py-2.5 px-2 text-right text-muted-foreground">{totals.failedPct.toFixed(0)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pies Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Attendance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={attendancePie} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                dataKey="value" nameKey="name"
                label={({ name, value }) => `${name}: ${value}`} labelLine={false}
              >
                <Cell fill="hsl(160,84%,39%)" />
                <Cell fill="hsl(0,84%,60%)" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Results</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={resultPie} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                dataKey="value" nameKey="name"
                label={({ name, value }) => `${name}: ${value}`} labelLine={false}
              >
                <Cell fill="hsl(160,84%,39%)" />
                <Cell fill="hsl(0,84%,60%)" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coding + Aptitude Bands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coding Band */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Coding Band Distribution</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <table className="text-sm w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Band</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Count</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">%</th>
                </tr>
              </thead>
              <tbody>
                {codingBands.map((b) => (
                  <tr key={b.band} className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-medium">{b.band}</td>
                    <td className="py-1.5 px-2 text-right">{b.count}</td>
                    <td className="py-1.5 px-2 text-right text-muted-foreground">{b.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={codingBands} cx="50%" cy="50%" outerRadius={70}
                  dataKey="count" nameKey="band"
                  label={({ band }) => band} labelLine={false}
                >
                  {codingBands.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aptitude Band */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Aptitude Band Distribution</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <table className="text-sm w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Band</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Count</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">%</th>
                </tr>
              </thead>
              <tbody>
                {aptitudeBands.map((b) => (
                  <tr key={b.band} className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-medium">{b.band}</td>
                    <td className="py-1.5 px-2 text-right">{b.count}</td>
                    <td className="py-1.5 px-2 text-right text-muted-foreground">{b.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={aptitudeBands} cx="50%" cy="50%" outerRadius={70}
                  dataKey="count" nameKey="band"
                  label={({ band }) => band} labelLine={false}
                >
                  {aptitudeBands.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* R2 Categories (if applicable) */}
      {hasR2 && selectedRound === "2" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">R2 Performance Categories</h3>
            <table className="text-sm w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Category</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Count</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">%</th>
                </tr>
              </thead>
              <tbody>
                {r2Categories.map((c) => (
                  <tr key={c.category} className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-medium">{c.category}</td>
                    <td className="py-1.5 px-2 text-right">{c.count}</td>
                    <td className="py-1.5 px-2 text-right text-muted-foreground">{c.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">R2 Category Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={r2Categories.filter((c) => c.count > 0)} cx="50%" cy="50%" outerRadius={80}
                  dataKey="count" nameKey="category"
                  label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`} labelLine={false}
                >
                  {r2Categories.filter((c) => c.count > 0).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
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
          round={selectedRound}
          onClose={() => setExportCtx(null)}
        />
      )}
    </div>
  );
}

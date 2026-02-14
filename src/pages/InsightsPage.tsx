import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import YearFilter from "@/components/YearFilter";
import MultiSelectFilter from "@/components/MultiSelectFilter";
import ExportDialog from "@/components/ExportDialog";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import {
  ArrowLeft, FileText, BarChart3, PieChart as PieChartIcon,
  Users, UserCheck, UserX, Code2, Brain, Award, TrendingUp,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  isActive, PIE_COLORS,
  computeDeptSpecTable, computeBandDistribution,
  computeR2Categories,
} from "@/lib/analyticsUtils";
import type { StudentRecord } from "@/types/database";

/* ─── Premium Chart Tooltip ─── */
function ChartTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl px-4 py-3 text-xs">
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.payload?.fill || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-3 sm:px-4 py-1.5 rounded-full bg-muted/60 border border-border/60 uppercase tracking-widest whitespace-nowrap">
        {icon}
        {title}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
    </div>
  );
}

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

  const studentsByDept = useMemo(() => {
    if (selectedDepts.length === 0) return [];
    return allStudents.filter((s) => selectedDepts.includes(s.department));
  }, [allStudents, selectedDepts]);

  useEffect(() => { setSelectedDepts(departments); }, [departments]);

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    departments.forEach((dept) => {
      counts[dept] = allStudents.filter((s) => s.department === dept).length;
    });
    return counts;
  }, [departments, allStudents]);

  const specializations = useMemo(() => {
    const specs = Array.from(new Set(studentsByDept.map((s) => s.specialization)));
    return specs.sort();
  }, [studentsByDept]);

  useEffect(() => { setSelectedSpecs(specializations); }, [specializations]);

  const specCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    specializations.forEach((spec) => {
      counts[spec] = studentsByDept.filter((s) => s.specialization === spec).length;
    });
    return counts;
  }, [specializations, studentsByDept]);

  const students = useMemo(() => {
    let data = allStudents;
    if (selectedDepts.length > 0 && selectedDepts.length < departments.length)
      data = data.filter((s) => selectedDepts.includes(s.department));
    if (selectedSpecs.length > 0 && selectedSpecs.length < specializations.length)
      data = data.filter((s) => selectedSpecs.includes(s.specialization));
    return data;
  }, [allStudents, selectedDepts, selectedSpecs, departments, specializations]);

  const total = students.length;
  const activeCount = students.filter(isActive).length;
  const inactiveCount = total - activeCount;

  const { rows, totals } = useMemo(
    () => computeDeptSpecTable(students, selectedRound),
    [students, selectedRound]
  );

  const attendancePie = useMemo(() => {
    if (selectedRound === "1") {
      const present = students.filter((s) => s.r1_attendance === "Present").length;
      return [{ name: "Present", value: present }, { name: "Absent", value: total - present }];
    }
    return [{ name: "Present", value: totals.present }, { name: "Absent", value: totals.absent }];
  }, [students, total, totals, selectedRound]);

  const resultPie = useMemo(() => [
    { name: "Passed", value: totals.passed },
    { name: "Failed", value: totals.failed },
  ], [totals]);

  const codingBands = useMemo(() => computeBandDistribution(students, "coding_band"), [students]);
  const aptitudeBands = useMemo(() => computeBandDistribution(students, "aptitude_band"), [students]);
  const r2Categories = useMemo(() => computeR2Categories(students), [students]);
  const hasR2 = students.some((s) => s.r2_status != null);

  if (loading) return <LoadingState message="Loading insights data…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const openExport = (label: string, filteredStudents: StudentRecord[]) => setExportCtx({ label, students: filteredStudents });

  const handleReportClick = () => {
    const params = new URLSearchParams({
      year: selectedYear, round: selectedRound,
      dept: selectedDepts.join(","), spec: selectedSpecs.join(","),
    });
    window.open(`/report?${params.toString()}`, "_blank");
  };

  const isR2 = selectedRound === "2";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-md shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">Deep Insights</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Detailed analytics & breakdowns</p>
          </div>
        </div>
        <button
          onClick={handleReportClick}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-md hover:shadow-lg transition-all"
        >
          <FileText className="w-4 h-4" />
          PDF Report
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />
      </div>

      {/* Quick Stats Bar */}
      <div className="kpi-card flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-foreground">{total.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total</div>
          </div>
        </div>
        <div className="w-px h-10 bg-border hidden sm:block" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-success" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-success">{activeCount.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Active</div>
          </div>
        </div>
        <div className="w-px h-10 bg-border hidden sm:block" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <UserX className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-destructive">{inactiveCount.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Inactive</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <MultiSelectFilter
          label="Departments"
          items={departments}
          selected={selectedDepts}
          onChange={setSelectedDepts}
          itemCounts={deptCounts}
          hideAllButton={true}
          onSelectAll={() => {
            setSelectedDepts([...departments]);
            setSelectedSpecs([...specializations]);
          }}
        />
        <MultiSelectFilter
          label="Specializations"
          items={specializations}
          selected={selectedSpecs}
          onChange={setSelectedSpecs}
          itemCounts={specCounts}
          hideAllButton={true}
        />
      </div>

      {/* Round Toggle */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm w-fit">
        <button
          onClick={() => setSelectedRound("1")}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-semibold transition-all ${
            selectedRound === "1"
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Round 1
        </button>
        <button
          onClick={() => setSelectedRound("2")}
          disabled={!hasR2}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-semibold transition-all ${
            selectedRound === "2"
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          } ${!hasR2 ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          Round 2
        </button>
      </div>

      {/* Main Table */}
      <div className="kpi-card overflow-x-auto">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Department × Specialization Breakdown
        </h3>
        <p className="text-xs text-muted-foreground mb-4">{isR2 ? "Round 2 — In-Person Monitored Coding Assessment" : "Round 1 — Aptitude + Coding Online Assessment"}</p>
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-muted/30">
              <th className="text-left py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Dept</th>
              <th className="text-left py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Spec</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Qual</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Pres</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">%</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Abs</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">%</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Pass</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">%</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Fail</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              // Filter students matching this row for export
              const rowStudents = students.filter(
                (s) => s.department === row.department && s.specialization === row.specialization
              );
              return (
                <tr
                  key={i}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer group"
                  onClick={() => openExport(`${row.department} – ${row.specialization}`, rowStudents)}
                >
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-semibold text-foreground">{row.department}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-foreground hidden sm:table-cell">{row.specialization}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right font-medium">{row.qualified}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right font-medium text-success">{row.present}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right text-muted-foreground hidden sm:table-cell">{row.presentPct.toFixed(0)}%</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right font-medium text-destructive hidden md:table-cell">{row.absent}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right text-muted-foreground hidden md:table-cell">{row.absentPct.toFixed(0)}%</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right font-medium text-success">{row.passed}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right text-muted-foreground hidden sm:table-cell">{row.passedPct.toFixed(0)}%</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right font-medium text-destructive hidden md:table-cell">{row.failed}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right text-muted-foreground hidden md:table-cell">{row.failedPct.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30 font-bold">
              <td className="py-2 sm:py-3 px-2 sm:px-3" colSpan={2}>Total</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right hidden sm:table-cell">{/* spacer for collapsed spec col */}</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right">{totals.qualified}</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-success">{totals.present}</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-muted-foreground hidden sm:table-cell">{totals.presentPct.toFixed(0)}%</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-destructive hidden md:table-cell">{totals.absent}</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-muted-foreground hidden md:table-cell">{totals.absentPct.toFixed(0)}%</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-success">{totals.passed}</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-muted-foreground hidden sm:table-cell">{totals.passedPct.toFixed(0)}%</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-destructive hidden md:table-cell">{totals.failed}</td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-muted-foreground hidden md:table-cell">{totals.failedPct.toFixed(0)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Attendance + Result Pies */}
      <SectionHeader title={isR2 ? "R2 Attendance & Results" : "R1 Attendance & Results"} icon={<PieChartIcon className="w-3.5 h-3.5" />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PieCard title="Attendance" data={attendancePie} colors={["hsl(var(--success))", "hsl(var(--destructive))"]} />
        <PieCard title="Results" data={resultPie} colors={["hsl(var(--success))", "hsl(var(--destructive))"]} />
      </div>

      {/* Band Distributions */}
      <SectionHeader
        title={isR2 ? "R2 Coding Performance" : "R1 Band Distributions"}
        icon={isR2 ? <Code2 className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
      />

      {isR2 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BandCard title="R2 Performance Categories" icon={<Award className="w-4 h-4 text-accent" />} data={r2Categories.map(c => ({ band: c.category, count: c.count, percentage: c.percentage }))} />
          <PieCard
            title="R2 Category Distribution"
            data={r2Categories.filter(c => c.count > 0).map(c => ({ name: c.category, value: c.count }))}
            colors={PIE_COLORS}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BandCard title="Coding Band Distribution" icon={<Code2 className="w-4 h-4 text-primary" />} data={codingBands} />
          <BandCard title="Aptitude Band Distribution" icon={<Brain className="w-4 h-4 text-accent" />} data={aptitudeBands} />
        </div>
      )}

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

/* ─── Reusable Premium Components ─── */

function PieCard({ title, data, colors }: { title: string; data: { name: string; value: number }[]; colors: string[] }) {
  return (
    <div className="kpi-card">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <PieChartIcon className="w-4 h-4 text-accent" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data.filter(d => d.value > 0)}
            cx="50%" cy="50%" innerRadius={40} outerRadius={75}
            dataKey="value" nameKey="name"
            strokeWidth={2} stroke="hsl(var(--card))"
            label={({ name, value }) => `${name}: ${value}`} labelLine={false}
          >
            {data.filter(d => d.value > 0).map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [value.toLocaleString(), "Students"]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BandCard({ title, icon, data }: { title: string; icon: React.ReactNode; data: { band: string; count: number; percentage: number }[] }) {
  return (
    <div className="kpi-card">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="text-sm w-full">
          <thead>
            <tr className="border-b-2 border-border bg-muted/20">
              <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Band</th>
              <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Count</th>
              <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Share</th>
              <th className="py-2.5 px-3 text-xs text-muted-foreground w-24 hidden sm:table-cell"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.band} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-foreground">{b.band}</td>
                <td className="py-2.5 px-3 text-right font-medium text-foreground">{b.count}</td>
                <td className="py-2.5 px-3 text-right text-muted-foreground">{b.percentage.toFixed(1)}%</td>
                <td className="py-2.5 px-3 hidden sm:table-cell">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${Math.min(b.percentage, 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

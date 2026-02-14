import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import StatCard from "@/components/StatCard";
import MultiSelectFilter from "@/components/MultiSelectFilter";
import YearFilter from "@/components/YearFilter";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ExportDialog from "@/components/ExportDialog";
import {
  Lightbulb, Users, BookOpen, UserCheck, UserX,
  CheckCircle, XCircle, Eye, EyeOff, Award, ShieldCheck, ShieldX, UserPlus,
  AlertCircle, HelpCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  isActive, isR1Passed, isR2Present, getR2Category,
  R2_CATEGORIES_ORDER, PIE_COLORS, computeR2Categories,
} from "@/lib/analyticsUtils";
import type { StudentRecord } from "@/types/database";

/* ─── Premium Chart Tooltip ─── */
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const values = payload.map((p: any) => (typeof p.value === 'number' ? p.value : 0));
  const total = values.reduce((s: number, v: number) => s + v, 0);

  return (
    <div className="bg-card border border-border rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => {
        const pct = total > 0 && typeof p.value === 'number' ? ((p.value / total) * 100).toFixed(1) : null;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill || p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-semibold text-foreground">
              {p.value !== undefined ? (typeof p.value === 'number' ? p.value.toLocaleString() : String(p.value)) : "-"}
              {pct ? ` (${pct}%)` : null}
            </span>
          </div>
        );
      })}
      <div className="mt-2 pt-2 border-t border-border/50 text-muted-foreground">
        Total: <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [exportCtx, setExportCtx] = useState<{ label: string; students: StudentRecord[] } | null>(null);

  const { students: allStudents, loading, error, refetch } = useStudents(
    selectedYear !== "all" ? { year: selectedYear } : {}
  );

  const departments = useMemo(() => Array.from(new Set(allStudents.map((s) => s.department))).sort(), [allStudents]);
  
  // Filter students by selected departments first
  const studentsByDept = useMemo(() => {
    if (selectedDepts.length === 0) return [];
    return allStudents.filter((s) => selectedDepts.includes(s.department));
  }, [allStudents, selectedDepts]);

  // Specializations based on selected departments
  const specializations = useMemo(() => {
    const specs = Array.from(new Set(studentsByDept.map((s) => s.specialization)));
    return specs.sort();
  }, [studentsByDept]);
  
  useEffect(() => { setSelectedDepts(departments); }, [departments]);
  useEffect(() => { setSelectedSpecs(specializations); }, [specializations]);

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    departments.forEach((dept) => {
      counts[dept] = allStudents.filter((s) => s.department === dept).length;
    });
    return counts;
  }, [departments, allStudents]);

  const specCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    specializations.forEach((spec) => {
      counts[spec] = studentsByDept.filter((s) => s.specialization === spec).length;
    });
    return counts;
  }, [specializations, studentsByDept]);

  const students = useMemo(() => {
    let filtered = allStudents;
    if (selectedDepts.length > 0 && selectedDepts.length < departments.length) {
      filtered = filtered.filter((s) => selectedDepts.includes(s.department));
    }
    if (selectedSpecs.length > 0 && selectedSpecs.length < specializations.length) {
      filtered = filtered.filter((s) => selectedSpecs.includes(s.specialization));
    }
    return filtered;
  }, [allStudents, selectedDepts, departments, selectedSpecs, specializations]);

  const stats = useMemo(() => {
    const total = students.length;
    const specs = new Set(students.map((s) => s.specialization)).size;
    const activeCount = students.filter((s) => s.r1_attendance === "Present").length;
    const inactiveCount = students.filter((s) => s.r1_attendance === "Absent").length;
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

    const deptBands = departments
      .filter((d) => selectedDepts.includes(d))
      .map((dept) => {
        const ds = students.filter((s) => s.department === dept && s.r1_attendance === "Present");
        const c1Count = ds.filter((s) => s.coding_band === "C1").length;
        const c2Count = ds.filter((s) => s.coding_band === "C2").length;
        const c5Count = ds.filter((s) => s.coding_band === "C5").length;
        const c6Count = ds.filter((s) => s.coding_band === "C6").length;
        return {
          department: dept,
          "C1+C2": c1Count + c2Count,
          "C5+C6": c5Count + c6Count,
          total: c1Count + c2Count + c5Count + c6Count,
        };
      })
      .filter((d) => d.total > 0)
      .sort((a, b) => {
        const totalDiff = (b["C1+C2"] + b["C5+C6"]) - (a["C1+C2"] + a["C5+C6"]);
        return totalDiff !== 0 ? totalDiff : b["C1+C2"] - a["C1+C2"];
      });

    // Calculate new cards: HCE, LCE, NCE, UNRATED
    const hceCount = r2PresentStudents.filter((s) => {
      const cat = getR2Category(s.r2_status!);
      return cat === "T3" || cat === "High Potential";
    }).length;

    const r2AverageCount = r2PresentStudents.filter((s) => getR2Category(s.r2_status!) === "Average").length;
    const r1HighBands = students.filter((s) => s.r1_attendance === "Present" && (s.coding_band === "C1" || s.coding_band === "C2")).length;
    const lceCount = r2AverageCount + r1HighBands;

    const nceCount = r1Failed + r2FailedCount;
    const unratedCount = r1Absent;

    const pct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(0) : "0");

    return {
      total, specs, activeCount, inactiveCount,
      activePct: pct(activeCount, total > 0 ? total : activeCount + inactiveCount), inactivePct: pct(inactiveCount, total > 0 ? total : activeCount + inactiveCount),
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
      hceCount,
      lceCount,
      nceCount,
      unratedCount,
    };
  }, [students, departments, selectedDepts]);

  if (loading) return <LoadingState message="Loading dashboard data…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const openExport = (label: string, filtered?: StudentRecord[]) => {
    setExportCtx({ label, students: filtered || students });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Executive Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time analytics across <span className="font-semibold text-foreground">{stats.total.toLocaleString()}</span> student records
            </p>
          </div>
        </div>
        <Link
          to={`/insights?year=${selectedYear}`}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-warning to-warning/80 text-warning-foreground font-semibold text-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all"
        >
          <Lightbulb className="w-4 h-4" />
          Deep Insights
        </Link>
      </div>

      <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />
      
      {/* Filters Section - Compact Layout */}
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

      {/* ─── Batch Overview ─── */}
      <div>
        <SectionHeader title="Batch Overview" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <StatCard icon={<Users className="w-5 h-5" />} value={stats.total} label="Total Students" onClick={() => openExport("Total Students")} />
          <StatCard icon={<BookOpen className="w-5 h-5" />} value={stats.specs} label="Specializations" variant="info" />
          <StatCard icon={<UserCheck className="w-5 h-5" />} value={stats.activeCount} label="Active Students" percentage={`${stats.activePct}%`} variant="success" onClick={() => openExport("Active Students", students.filter((s) => s.r1_attendance === "Present"))} />
          <StatCard icon={<UserX className="w-5 h-5" />} value={stats.inactiveCount} label="Inactive Students" percentage={`${stats.inactivePct}%`} variant="danger" onClick={() => openExport("Inactive Students", students.filter((s) => s.r1_attendance === "Absent"))} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <StatCard icon={<Award className="w-5 h-5" />} value={stats.hceCount} label="HCE" percentage={stats.total > 0 ? `${((stats.hceCount / stats.total) * 100).toFixed(0)}%` : "0%"} variant="success" subtitle="R2 C2.1-C3" />
          <StatCard icon={<Award className="w-5 h-5" />} value={stats.lceCount} label="LCE" percentage={stats.total > 0 ? `${((stats.lceCount / stats.total) * 100).toFixed(0)}%` : "0%"} variant="warning" subtitle="R2 C4 & R1 C1-C2" />
          <StatCard icon={<AlertCircle className="w-5 h-5" />} value={stats.nceCount} label="NCE" percentage={stats.total > 0 ? `${((stats.nceCount / stats.total) * 100).toFixed(0)}%` : "0%"} variant="danger" subtitle="R1 & R2 Failed" />
          <StatCard icon={<HelpCircle className="w-5 h-5" />} value={stats.unratedCount} label="UNRATED" percentage={stats.total > 0 ? `${((stats.unratedCount / stats.total) * 100).toFixed(0)}%` : "0%"} variant="default" subtitle="R1 Absent" />
        </div>
      </div>

      {/* ─── Round 1 Cards ─── */}
      <div>
        <SectionHeader title="Round 1 Assessment" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <StatCard icon={<Eye className="w-5 h-5" />} value={stats.r1Present} label="R1 Present" percentage={`${stats.r1PresentPct}%`} variant="success" onClick={() => openExport("R1 Present", students.filter((s) => s.r1_attendance === "Present"))} />
          <StatCard icon={<EyeOff className="w-5 h-5" />} value={stats.r1Absent} label="R1 Absent" percentage={`${stats.r1AbsentPct}%`} variant="danger" onClick={() => openExport("R1 Absent", students.filter((s) => s.r1_attendance === "Absent"))} />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} value={stats.r1Passed} label="R1 Passed" percentage={`${stats.r1PassedPct}%`} variant="success" onClick={() => openExport("R1 Passed", students.filter(isR1Passed))} />
          <StatCard icon={<XCircle className="w-5 h-5" />} value={stats.r1Failed} label="R1 Failed" percentage={`${stats.r1FailedPct}%`} variant="danger" onClick={() => openExport("R1 Failed", students.filter((s) => s.r1_attendance === "Present" && s.r1_result !== "PASS"))} />
        </div>
      </div>

      {/* ─── R1 Department Charts (right after R1 cards) ─── */}
      {stats.deptBands.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <BarChartIcon className="w-4 h-4 text-primary" />
              R1 Upper Bands (C1+C2) by Department
            </h3>
            <p className="text-xs text-muted-foreground mb-5">Combined count of C1 and C2 coding bands per department</p>
            <ResponsiveContainer width="100%" height={Math.max(280, stats.deptBands.length * 48)}>
              <BarChart data={stats.deptBands} layout="vertical" barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} width={100} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--muted))", radius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16, display: "flex", flexDirection: "row" }} />
                <Bar dataKey="C1+C2" fill="hsl(var(--success))" radius={[0, 6, 6, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <BarChartIcon className="w-4 h-4 text-destructive" />
              R1 Lower Bands (C5+C6) by Department
            </h3>
            <p className="text-xs text-muted-foreground mb-5">Combined count of C5 and C6 coding bands per department</p>
            <ResponsiveContainer width="100%" height={Math.max(280, stats.deptBands.length * 48)}>
              <BarChart data={stats.deptBands} layout="vertical" barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} width={100} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--muted))", radius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16, display: "flex", flexDirection: "row" }} />
                <Bar dataKey="C5+C6" fill="hsl(var(--destructive))" radius={[0, 6, 6, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Round 2 Section ─── */}
      {stats.r2Conducted && (
        <div>
          <SectionHeader title="Round 2 Assessment" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            <StatCard icon={<ShieldCheck className="w-5 h-5" />} value={stats.r2Qualified} label="R2 Qualified" percentage={`${stats.r2QualifiedPct}%`} variant="info" />
            <StatCard icon={<UserPlus className="w-5 h-5" />} value={stats.r2PresentCount} label="R2 Present" percentage={`${stats.r2PresentPct}%`} variant="success" />
            <StatCard icon={<CheckCircle className="w-5 h-5" />} value={stats.r2PassedCount} label="R2 Passed" percentage={`${stats.r2PassedPct}%`} variant="success" />
            <StatCard icon={<ShieldX className="w-5 h-5" />} value={stats.r2FailedCount} label="R2 Failed" percentage={`${stats.r2FailedPct}%`} variant="danger" />
          </div>

          {/* R2 Category Table + Pie (right after R2 cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="kpi-card">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" />
                R2 Performance Categories
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Category</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Count</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.r2Categories.map((cat, i) => (
                    <tr key={cat.category} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-foreground flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {cat.category}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-foreground">{cat.count}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{cat.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="kpi-card flex flex-col">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-accent" />
                R2 Distribution
              </h3>
              <div className="flex-1 flex items-center justify-center w-full">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={stats.r2Categories.filter((c) => c.count > 0)}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                      dataKey="count" nameKey="category"
                      strokeWidth={2} stroke="hsl(var(--card))"
                      label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats.r2Categories.filter((c) => c.count > 0).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full mt-6 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
                {stats.r2Categories.filter((c) => c.count > 0).map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-foreground">
                      {cat.category}: <span className="font-semibold">{cat.count}</span> ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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

/* ─── Helpers ─── */
import { BarChart3 as BarChartIcon, PieChart as PieChartIcon } from "lucide-react";

function SectionHeader({ title }: { title: string }) {
  return (
    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
      {title}
    </span>
  );
}
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import StatCard from "@/components/StatCard";
import MultiSelectFilter from "@/components/MultiSelectFilter";
import YearFilter from "@/components/YearFilter";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ExportConfigDialog from "@/components/ExportConfigDialog";

import {
  Lightbulb, Users, BookOpen, UserCheck, UserX,
  CheckCircle, XCircle, Eye, EyeOff, Award, ShieldCheck, ShieldX, UserPlus,
  AlertCircle, HelpCircle, BarChart as BarChartIcon, PieChart as PieChartIcon,
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

/* ─── Case-Insensitive Comparison Helper ─── */
const compareCI = (value: string | null | undefined, target: string): boolean => {
  if (!value) return false;
  return value.toUpperCase().trim() === target.toUpperCase().trim();
};

const includesCI = (value: string | null | undefined, targets: string[]): boolean => {
  if (!value) return false;
  const normalizedValue = value.toUpperCase().trim();
  return targets.map(t => t.toUpperCase().trim()).includes(normalizedValue);
};

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
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [exportCtx, setExportCtx] = useState<{ label: string; students: StudentRecord[] } | null>(null);
  const [dataPreview, setDataPreview] = useState<{ title: string; description?: string; data: StudentRecord[] } | null>(null);

  const { students: allStudents, loading, error, refetch } = useStudents(
    selectedYear !== "all" ? { year: selectedYear } : {}
  );

  const departments = useMemo(() => Array.from(new Set(allStudents.map((s) => s.department))).sort(), [allStudents]);
  const programs = useMemo(() => Array.from(new Set(allStudents.map((s) => s.program))).filter(Boolean) as string[], [allStudents]);
  
  // Filter students by selected departments first
  const studentsByDept = useMemo(() => {
    if (selectedDepts.length === 0) return allStudents;
    return allStudents.filter((s) => selectedDepts.includes(s.department));
  }, [allStudents, selectedDepts]);

  // Specializations based on selected departments
  const specializations = useMemo(() => {
    const specs = Array.from(new Set(studentsByDept.map((s) => s.specialization)));
    return specs.sort();
  }, [studentsByDept]);
  
  useEffect(() => { setSelectedDepts(departments); }, [departments]);
  useEffect(() => { setSelectedPrograms(programs); }, [programs]);
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
    if (selectedPrograms.length > 0 && selectedPrograms.length < programs.length) filtered = filtered.filter((s) => selectedPrograms.includes(String(s.program)));
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
    
    // Active Students = R1 Attendance = "Present" (case-insensitive)
    const activeCount = students.filter((s) => compareCI(s.r1_attendance, "Present")).length;
    const inactiveCount = students.filter((s) => compareCI(s.r1_attendance, "Absent")).length;
    const r1Present = students.filter((s) => compareCI(s.r1_attendance, "Present")).length;
    const r1Absent = total - r1Present;
    const r1Passed = students.filter(isR1Passed).length;
    
    // R1 Fail = COUNT(R1 Result = 'FAIL') (case-insensitive)
    const r1Failed = students.filter((s) => compareCI(s.r1_result, "FAIL")).length;

    // R2 Qualified = R2 PASS + R2 FAIL + R2-ABSENT + R2-PENDING (case-insensitive)
    const r2Qualified = students.filter((s) => 
      compareCI(s.r2_result, "R2 PASS") || 
      compareCI(s.r2_result, "R2 FAIL") || 
      compareCI(s.r2_result, "R2-ABSENT") ||
      compareCI(s.r2_result, "R2-PENDING")
    ).length;
    const r2Conducted = r2Qualified > 0;
    
    // R2 Present = R2 PASS + R2 FAIL (those who appeared and got results) (case-insensitive)
    const r2PresentCount = students.filter((s) => compareCI(s.r2_result, "R2 PASS") || compareCI(s.r2_result, "R2 FAIL")).length;
    
    // R2 Pass = R2 PASS (case-insensitive)
    const r2PassedCount = students.filter((s) => compareCI(s.r2_result, "R2 PASS")).length;
    
    // R2 Fail = R2 FAIL (case-insensitive)
    const r2FailedCount = students.filter((s) => compareCI(s.r2_result, "R2 FAIL")).length;
    
    const r2Categories = computeR2Categories(students);

    const deptBands = departments
      .filter((d) => selectedDepts.includes(d))
      .map((dept) => {
        const ds = students.filter((s) => s.department === dept && compareCI(s.r1_attendance, "Present"));
        // Upper Bands: C1 (C1.1, C1.2, C1.3) + C2 (C2.1, C2.2, C2.3)
        const c1UpperBands = ["C1.1", "C1.2", "C1.3"];
        const c2UpperBands = ["C2.1", "C2.2", "C2.3"];
        const c1Count = ds.filter((s) => includesCI(s.r1_band, c1UpperBands)).length;
        const c2Count = ds.filter((s) => includesCI(s.r1_band, c2UpperBands)).length;
        
        // Lower Bands: C5 (C5.1, C5.2, C5.3) + C6 (C6.1, C6.2, C6.3)
        const c5LowerBands = ["C5.1", "C5.2", "C5.3"];
        const c6LowerBands = ["C6.1", "C6.2", "C6.3"];
        const c5Count = ds.filter((s) => includesCI(s.r1_band, c5LowerBands)).length;
        const c6Count = ds.filter((s) => includesCI(s.r1_band, c6LowerBands)).length;
        
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
    // Use overall_category column for direct counts (case-insensitive)
    const hceCount = students.filter((s) => compareCI(s.overall_category, "HCE")).length;
    const lceCount = students.filter((s) => compareCI(s.overall_category, "LCE")).length;
    const nceCount = students.filter((s) => compareCI(s.overall_category, "NCE")).length;
    const unratedCount = students.filter((s) => compareCI(s.overall_category, "UNRATED")).length;

    const pct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(0) : "0");

    return {
      total, specs, activeCount, inactiveCount,
      activePct: pct(activeCount, total > 0 ? total : activeCount + inactiveCount), inactivePct: pct(inactiveCount, total > 0 ? total : activeCount + inactiveCount),
      r1Present, r1Absent,
      r1PresentPct: pct(r1Present, total), r1AbsentPct: pct(r1Absent, total),
      r1Passed, r1Failed,
      r1PassedPct: pct(r1Passed, r1Present), r1FailedPct: pct(r1Failed, r1Present),
      r2Conducted, r2Qualified, r2PresentCount, r2PassedCount, r2FailedCount,
      r2QualifiedPct: pct(r2Qualified, total),
      r2PresentPct: pct(r2PresentCount, r2Qualified),
      r2PassedPct: pct(r2PassedCount, r2PresentCount),
      r2FailedPct: pct(r2FailedCount, r2PresentCount),
      r2Categories,
      deptBands,
      hceCount,
      hcePct: pct(hceCount, total),
      lceCount,
      lcePct: pct(lceCount, total),
      nceCount,
      ncePct: pct(nceCount, total),
      unratedCount,
      unratedPct: pct(unratedCount, total),
    };
  }, [students, departments, selectedDepts]);

  if (loading) return <LoadingState message="Loading dashboard data…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const openPreview = (title: string, data: StudentRecord[], description?: string) => {
    setDataPreview({ title, data, description });
  };

  const openExport = (label: string, filtered?: StudentRecord[]) => {
    setExportCtx({ label, students: filtered || students });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Executive Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Real-time analytics across <span className="font-semibold text-foreground">{stats.total.toLocaleString()}</span> student records
            </p>
          </div>
        </div>
        <Link
          to={`/insights?year=${selectedYear}`}
          className="inline-flex items-center gap-2 px-3 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-warning to-warning/80 text-warning-foreground font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all w-full sm:w-auto justify-center sm:justify-normal"
        >
          <Lightbulb className="w-4 h-4" />
          <span className="hidden sm:inline">Deep Insights</span>
          <span className="sm:hidden">Insights</span>
        </Link>
      </div>

      <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />
      
      {/* Filters Section - Responsive Layout */}
      <div className="space-y-3 lg:space-y-2 bg-card border border-border rounded-xl p-4 sm:p-5">
        <div className="space-y-3 lg:space-y-2">
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
            itemCounts={deptCounts}
            hideAllButton={true}
            onSelectAll={() => {
              setSelectedDepts([...departments]);
              setSelectedSpecs([...specializations]);
            }}
            onItemClick={(dept) => {
              const deptStudents = students.filter((s) => s.department === dept);
              openExport(`${dept} Department`);
            }}
          />
          <MultiSelectFilter
            label="Specializations"
            items={specializations}
            selected={selectedSpecs}
            onChange={setSelectedSpecs}
            itemCounts={specCounts}
            hideAllButton={true}
            onItemClick={(spec) => {
              const specStudents = students.filter((s) => s.specialization === spec);
              openExport(`${spec} Specialization`);
            }}
          />
        </div>
      </div>

      {/* ─── Batch Overview ─── */}
      <div>
        <SectionHeader title="Batch Overview" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-3">
          <StatCard icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.total} label="Total Students" onClick={() => openExport("Total Students", students)} />
          <StatCard icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.specs} label="Specializations" variant="info" />
          <StatCard icon={<UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.activeCount} label="Active Students" percentage={`${stats.activePct}%`} variant="success" onClick={() => openExport("Active Students (R1 Present)", students.filter((s) => compareCI(s.r1_attendance, "Present")))} />
          <StatCard icon={<UserX className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.inactiveCount} label="Inactive Students" percentage={`${stats.inactivePct}%`} variant="danger" onClick={() => openExport("Inactive Students (R1 Absent)", students.filter((s) => compareCI(s.r1_attendance, "Absent")))} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-3">
          <StatCard icon={<Award className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.hceCount} label="HCE" percentage={`${stats.hcePct}%`} variant="success" onClick={() => openExport("HCE (High Competency)", students.filter((s) => compareCI(s.overall_category, "HCE")))} />
          <StatCard icon={<Award className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.lceCount} label="LCE" percentage={`${stats.lcePct}%`} variant="warning" onClick={() => openExport("LCE (Low Competency)", students.filter((s) => compareCI(s.overall_category, "LCE")))} />
          <StatCard icon={<AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.nceCount} label="NCE" percentage={`${stats.ncePct}%`} variant="danger" onClick={() => openExport("NCE (Not Competent)", students.filter((s) => compareCI(s.overall_category, "NCE")))} />
          <StatCard icon={<HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.unratedCount} label="UNRATED" percentage={`${stats.unratedPct}%`} variant="default" onClick={() => openExport("Unrated Students", students.filter((s) => compareCI(s.overall_category, "UNRATED")))} />
        </div>
      </div>

      {/* ─── Round 1 Cards ─── */}
      <div>
        <SectionHeader title="Round 1 Assessment" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-3">
          <StatCard icon={<Eye className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.r1Present} label="R1 Present" percentage={`${stats.r1PresentPct}%`} variant="success" onClick={() => openExport("R1 Present Students", students.filter((s) => compareCI(s.r1_attendance, "Present")))} />
          <StatCard icon={<EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.r1Absent} label="R1 Absent" percentage={`${stats.r1AbsentPct}%`} variant="danger" onClick={() => openExport("R1 Absent Students", students.filter((s) => compareCI(s.r1_attendance, "Absent")))} />
          <StatCard icon={<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.r1Passed} label="R1 Passed" percentage={`${stats.r1PassedPct}%`} variant="success" onClick={() => openExport("R1 Passed Students", students.filter(isR1Passed))} />
          <StatCard icon={<XCircle className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.r1Failed} label="R1 Failed" percentage={`${stats.r1FailedPct}%`} variant="danger" onClick={() => openExport("R1 Failed Students", students.filter((s) => compareCI(s.r1_result, "FAIL")))} />
        </div>
      </div>

      {/* ─── R1 Department Charts (right after R1 cards) ─── */}
      {stats.deptBands.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
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
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: "hsl(var(--foreground))", fontWeight: 500 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--muted))", radius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16, display: "flex", flexDirection: "row" }} />
                <Bar dataKey="C1+C2" fill="hsl(var(--success))" radius={[0, 6, 6, 0]} maxBarSize={32} label={{ position: "right", fontSize: 11, fill: "hsl(var(--foreground))" }} />
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
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: "hsl(var(--foreground))", fontWeight: 500 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--muted))", radius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16, display: "flex", flexDirection: "row" }} />
                <Bar dataKey="C5+C6" fill="hsl(var(--destructive))" radius={[0, 6, 6, 0]} maxBarSize={32} label={{ position: "right", fontSize: 11, fill: "hsl(var(--foreground))" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Round 2 Section ─── */}
      {stats.r2Conducted && (
        <div>
          <SectionHeader title="Round 2 Assessment" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-3">
            <StatCard icon={<ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.r2Qualified} label="R2 Qualified" percentage={`${stats.r2QualifiedPct}%`} variant="info" onClick={() => openExport("R2 Qualified", students.filter((s) => compareCI(s.r2_result, "R2 PASS") || compareCI(s.r2_result, "R2 FAIL") || compareCI(s.r2_result, "R2-ABSENT") || compareCI(s.r2_result, "R2-PENDING")))} />
            <StatCard icon={<UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.r2PresentCount} label="R2 Present" percentage={`${stats.r2PresentPct}%`} variant="success" onClick={() => openExport("R2 Present", students.filter((s) => compareCI(s.r2_result, "R2 PASS") || compareCI(s.r2_result, "R2 FAIL")))} />
            <StatCard icon={<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.r2PassedCount} label="R2 Passed" percentage={`${stats.r2PassedPct}%`} variant="success" onClick={() => openExport("R2 Passed", students.filter((s) => compareCI(s.r2_result, "R2 PASS")))} />
            <StatCard icon={<ShieldX className="w-4 h-4 sm:w-5 sm:h-5" />} value={stats.r2FailedCount} label="R2 Failed" percentage={`${stats.r2FailedPct}%`} variant="danger" onClick={() => openExport("R2 Failed", students.filter((s) => compareCI(s.r2_result, "R2 FAIL")))} />
          </div>

          {/* R2 Category Table + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 mt-4">
            <div className="kpi-card">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" />
                R2 Performance Categories
              </h3>
              <div className="overflow-x-auto">
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
                      <tr key={cat.category} className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => openExport(`R2 - ${cat.category}`, students.filter((s) => compareCI(s.r2_category, cat.category)))}>
                        <td className="py-3 px-3 font-medium text-foreground flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="truncate text-xs sm:text-sm">{cat.category}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-foreground text-xs sm:text-sm">{cat.count}</td>
                        <td className="py-3 px-3 text-right text-muted-foreground text-xs sm:text-sm">{cat.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <div className="w-full mt-6 pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {stats.r2Categories.filter((c) => c.count > 0).map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-foreground truncate">
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
        <ExportConfigDialog
          open={!!exportCtx}
          title={exportCtx.label}
          data={exportCtx.students}
          onClose={() => setExportCtx(null)}
        />
      )}
    </div>
  );
}

/* ─── Helpers ─── */

function SectionHeader({ title }: { title: string }) {
  return (
    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
      {title}
    </span>
  );
}
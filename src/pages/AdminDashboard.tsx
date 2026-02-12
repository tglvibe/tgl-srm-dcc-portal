import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useAnalytics } from "@/hooks/useAnalytics";
import KPICard from "@/components/KPICard";
import BandBadge from "@/components/BandBadge";
import YearFilter from "@/components/YearFilter";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import {
  Users, TrendingUp, CheckCircle, XCircle, BarChart3, BookOpen,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = [
  "hsl(160,84%,39%)", "hsl(199,89%,48%)", "hsl(224,76%,33%)",
  "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(270,70%,50%)",
  "hsl(150,60%,40%)", "hsl(30,90%,55%)",
];

export default function AdminDashboard() {
  const [selectedYear, setSelectedYear] = useState("all");

  const { students, loading, error, refetch, totalCount } = useStudents(
    selectedYear !== "all" ? { year: selectedYear } : {}
  );

  const analytics = useAnalytics(students);

  if (loading) return <LoadingState message="Loading dashboard data..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { kpis, r1BandDistribution, codingBandDistribution, aptitudeBandDistribution, departmentBreakdown } = analytics;

  // Prepare chart data
  const r1BandChart = r1BandDistribution.filter(b => b.band !== "Absent");
  const deptChart = departmentBreakdown.slice(0, 10).map(d => ({
    name: d.department.length > 12 ? d.department.slice(0, 12) + "…" : d.department,
    total: d.total,
    present: d.present,
    pass: d.pass,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time analytics across {totalCount.toLocaleString()} student records
          </p>
        </div>
      </div>

      {/* Year Filter */}
      <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Students"
          value={kpis.totalStudents.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          accent="primary"
        />
        <KPICard
          title="Present (R1)"
          value={`${kpis.presentCount.toLocaleString()} (${kpis.attendanceRate}%)`}
          icon={<CheckCircle className="w-5 h-5" />}
          accent="success"
        />
        <KPICard
          title="Absent (R1)"
          value={`${kpis.absentCount.toLocaleString()}`}
          icon={<XCircle className="w-5 h-5" />}
          accent="destructive"
        />
        <KPICard
          title="R1 Pass Rate"
          value={`${kpis.passRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle={`${kpis.passCount} passed`}
          accent="accent"
        />
        <KPICard
          title="Avg Aptitude %"
          value={`${kpis.avgAptitudePercentage}%`}
          icon={<BookOpen className="w-5 h-5" />}
          accent="primary"
        />
        <KPICard
          title="Avg Coding %"
          value={`${kpis.avgCodingPercentage}%`}
          icon={<BarChart3 className="w-5 h-5" />}
          accent="accent"
        />
        <KPICard
          title="Departments"
          value={kpis.uniqueDepartments}
          icon={<Users className="w-5 h-5" />}
          accent="primary"
        />
        <KPICard
          title="Specializations"
          value={kpis.uniqueSpecializations}
          icon={<BookOpen className="w-5 h-5" />}
          accent="accent"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* R1 Band Distribution */}
        <div className="kpi-card lg:col-span-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">R1 Band Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={r1BandChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="band" type="category" tick={{ fontSize: 10 }} width={50} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                formatter={(value: number, _name: string, entry: any) => [
                  `${value} (${entry.payload.percentage.toFixed(1)}%)`,
                  "Count",
                ]}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Coding Band Pie */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Coding Band Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={codingBandDistribution}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={85}
                dataKey="count" nameKey="band"
                label={({ band, percentage }) => `${band} ${percentage.toFixed(0)}%`}
                labelLine={false}
              >
                {codingBandDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, "Students"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department Breakdown */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Department Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" angle={-20} />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Present" />
              <Bar dataKey="pass" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Pass" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aptitude Band + Cross Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aptitude Band */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Aptitude Band Distribution</h3>
          <div className="space-y-3">
            {aptitudeBandDistribution.map((item) => (
              <div key={item.band} className="flex items-center gap-3">
                <BandBadge band={item.band} />
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground w-20 text-right">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cross Tabulation */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Coding × Aptitude Cross-Tab</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-2 py-2 font-medium text-muted-foreground">Coding Band</th>
                  <th className="text-center px-2 py-2 font-medium text-muted-foreground">.1</th>
                  <th className="text-center px-2 py-2 font-medium text-muted-foreground">.2</th>
                  <th className="text-center px-2 py-2 font-medium text-muted-foreground">.3</th>
                  <th className="text-center px-2 py-2 font-medium text-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {analytics.crossTab.map((row) => (
                  <tr key={row.codingBand} className="border-b border-border/50">
                    <td className="px-2 py-2"><BandBadge band={row.codingBand} /></td>
                    <td className="text-center px-2 py-2 text-muted-foreground">{row.aptitude1}</td>
                    <td className="text-center px-2 py-2 text-muted-foreground">{row.aptitude2}</td>
                    <td className="text-center px-2 py-2 text-muted-foreground">{row.aptitude3}</td>
                    <td className="text-center px-2 py-2 font-semibold text-foreground">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* R2 Status Distribution */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">R2 Status Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {analytics.r2Distribution.map((item) => (
            <div key={item.band} className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-1">{item.band}</div>
              <div className="text-lg font-bold text-foreground">{item.count}</div>
              <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

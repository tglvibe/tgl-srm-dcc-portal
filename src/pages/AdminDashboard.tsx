import { useState } from "react";
import { MOCK_KPI, MOCK_STUDENTS, PLACEMENT_CHART_DATA, SCORE_TREND } from "@/data/mockData";
import KPICard from "@/components/KPICard";
import BandBadge from "@/components/BandBadge";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Briefcase, TrendingUp, BookOpen, ClipboardCheck, BarChart3,
  Award, DollarSign, Search, Download, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { BAND_DISTRIBUTION } from "@/data/mockData";

const PIE_COLORS = [
  "hsl(160,84%,39%)", "hsl(199,89%,48%)", "hsl(224,76%,33%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)",
];

type SortKey = "name" | "employabilityScore" | "highestPackage" | "year";

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [assessmentView, setAssessmentView] = useState<"band" | "percentage">("band");

  const filtered = MOCK_STUDENTS.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.regNumber.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || s.department === deptFilter;
    const matchStatus = statusFilter === "all" || s.placementStatus === statusFilter;
    return matchSearch && matchDept && matchStatus;
  }).sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const kpi = MOCK_KPI;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of university metrics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Active Students" value={kpi.totalStudents.toLocaleString()} icon={<Users className="w-5 h-5" />} trend={{ value: 3.2, label: "vs last semester" }} accent="primary" />
        <KPICard title="Students Placed" value={`${kpi.studentsPlaced.toLocaleString()} (${kpi.placementRate}%)`} icon={<Briefcase className="w-5 h-5" />} trend={{ value: 5.1, label: "" }} accent="success" />
        <KPICard title="Avg Employability Score" value={kpi.avgEmployability} icon={<TrendingUp className="w-5 h-5" />} trend={{ value: 1.8, label: "" }} accent="accent" />
        <KPICard title="Active Programs" value={kpi.activePrograms} icon={<BookOpen className="w-5 h-5" />} accent="primary" />
        <KPICard title="Pending Approvals" value={kpi.pendingApprovals} icon={<ClipboardCheck className="w-5 h-5" />} accent="warning" subtitle="Attendance validation required" />
        <KPICard title="Assessment Completion" value={`${kpi.assessmentCompletion}%`} icon={<BarChart3 className="w-5 h-5" />} accent="accent" />
        <KPICard title="Avg Package (LPA)" value={`₹${kpi.avgPackage}`} icon={<DollarSign className="w-5 h-5" />} trend={{ value: 8.2, label: "" }} accent="success" />
        <KPICard title="Highest Package" value={`₹${kpi.highestPackage.value} LPA`} icon={<Award className="w-5 h-5" />} subtitle={kpi.highestPackage.name} accent="success" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="kpi-card lg:col-span-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Placement by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PLACEMENT_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="placed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Band Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={BAND_DISTRIBUTION} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="band" label={({ band, percent }) => `${band} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {BAND_DISTRIBUTION.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Avg Employability Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={SCORE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[50, 70]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student Table */}
      <div className="kpi-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Student Directory</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search name or reg no..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-52 text-sm" />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Information Technology">Info Technology</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Placed">Placed</SelectItem>
                <SelectItem value="Offer Received">Offer Received</SelectItem>
                <SelectItem value="Not Placed">Not Placed</SelectItem>
                <SelectItem value="Multiple Offers">Multiple Offers</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
              <button onClick={() => setAssessmentView("band")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${assessmentView === "band" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Bands</button>
              <button onClick={() => setAssessmentView("percentage")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${assessmentView === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>%</button>
            </div>
            <button className="h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reg No.</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("name")}>
                  <span className="flex items-center gap-1">Name <SortIcon col="name" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("year")}>
                  <span className="flex items-center justify-center gap-1">Year <SortIcon col="year" /></span>
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tech Band</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs">R1A Aptitude</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs">R1B Coding</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs">R1 Overall</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs">R2 In-Person</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("employabilityScore")}>
                  <span className="flex items-center justify-center gap-1">Score <SortIcon col="employabilityScore" /></span>
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("highestPackage")}>
                  <span className="flex items-center justify-end gap-1">Package <SortIcon col="highestPackage" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.regNumber}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.department}</td>
                  <td className="px-4 py-3 text-center">{s.year}</td>
                  <td className="px-4 py-3 text-center"><BandBadge band={s.techBand} /></td>
                  <td className="px-3 py-3 text-center">
                    {assessmentView === "band" ? <BandBadge band={s.r1aAptitude.band} /> : <span className="text-sm font-medium">{s.r1aAptitude.score}%</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {assessmentView === "band" ? <BandBadge band={s.r1bCoding.band} /> : <span className="text-sm font-medium">{s.r1bCoding.score}%</span>}
                  </td>
                  <td className="px-3 py-3 text-center"><BandBadge band={s.r1Overall} /></td>
                  <td className="px-3 py-3 text-center">
                    {s.r2InPerson === "—" ? <span className="text-xs text-muted-foreground">—</span> : <BandBadge band={s.r2InPerson} />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${s.employabilityScore >= 80 ? "text-success" : s.employabilityScore >= 60 ? "text-accent" : s.employabilityScore >= 40 ? "text-warning" : "text-destructive"}`}>
                      {s.employabilityScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={s.placementStatus} /></td>
                  <td className="px-4 py-3 text-right font-medium">{s.highestPackage > 0 ? `₹${s.highestPackage} LPA` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length} of {MOCK_STUDENTS.length} students</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}

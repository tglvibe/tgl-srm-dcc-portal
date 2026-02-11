import { useState } from "react";
import { MOCK_STUDENTS } from "@/data/mockData";
import BandBadge from "@/components/BandBadge";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ChevronUp, ChevronDown, Filter } from "lucide-react";

type SortKey = "name" | "employabilityScore" | "highestPackage" | "year";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [assessmentView, setAssessmentView] = useState<"band" | "percentage">("band");

  const filtered = MOCK_STUDENTS.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.regNumber.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || s.department === deptFilter;
    const matchStatus = statusFilter === "all" || s.placementStatus === statusFilter;
    const matchYear = yearFilter === "all" || s.year.toString() === yearFilter;
    return matchSearch && matchDept && matchStatus && matchYear;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and view all student records</p>
        </div>
        <button className="h-9 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="kpi-card !p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search name or reg no..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
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
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-9 w-28 text-sm"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="1">Year 1</SelectItem>
              <SelectItem value="2">Year 2</SelectItem>
              <SelectItem value="3">Year 3</SelectItem>
              <SelectItem value="4">Year 4</SelectItem>
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
            <button
              onClick={() => setAssessmentView("band")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${assessmentView === "band" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Bands
            </button>
            <button
              onClick={() => setAssessmentView("percentage")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${assessmentView === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Percentage
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="kpi-card !p-0 overflow-hidden">
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
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
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

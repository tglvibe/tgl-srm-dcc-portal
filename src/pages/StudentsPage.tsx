import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import BandBadge from "@/components/BandBadge";
import YearFilter from "@/components/YearFilter";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ChevronUp, ChevronDown } from "lucide-react";

type SortKey = "student_name" | "aptitude_score" | "coding_gained" | "s_no";

export default function StudentsPage() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("s_no");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [assessmentView, setAssessmentView] = useState<"band" | "percentage">("band");
  const navigate = useNavigate();

  const { students, loading, error, refetch, totalCount } = useStudents(
    selectedYear !== "all" ? { year: selectedYear } : {}
  );

  const departments = useMemo(() => {
    const depts = new Set(students.map((s) => s.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [students]);

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        const matchSearch = !search ||
          s.student_name.toLowerCase().includes(search.toLowerCase()) ||
          s.registration_number.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase());
        const matchDept = deptFilter === "all" || s.department === deptFilter;
        const matchAtt = attendanceFilter === "all" || s.r1_attendance === attendanceFilter;
        const matchResult = resultFilter === "all" || s.r1_result === resultFilter;
        return matchSearch && matchDept && matchAtt && matchResult;
      })
      .sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null || bVal == null) return 0;
        if (typeof aVal === "string" && typeof bVal === "string")
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
  }, [students, search, deptFilter, attendanceFilter, resultFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  if (loading) return <LoadingState message="Loading student directory..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">Student Directory</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {totalCount.toLocaleString()} total records
          </p>
        </div>
        <button className="h-9 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors self-start sm:self-auto">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />
      </div>

      {/* Filters */}
      <div className="kpi-card !p-3 sm:!p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, reg no, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="h-9 w-full sm:w-44 text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
              <SelectTrigger className="h-9 w-full sm:w-36 text-sm"><SelectValue placeholder="Attendance" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="h-9 w-full sm:w-32 text-sm"><SelectValue placeholder="R1 Result" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PASS">Pass</SelectItem>
                <SelectItem value="FAIL">Fail</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setAssessmentView("band")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${assessmentView === "band" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >Bands</button>
              <button
                onClick={() => setAssessmentView("percentage")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${assessmentView === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >%</button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="kpi-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none text-xs" onClick={() => toggleSort("s_no")}>
                  <span className="flex items-center gap-1">S.No <SortIcon col="s_no" /></span>
                </th>
                <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Reg No.</th>
                <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none text-xs" onClick={() => toggleSort("student_name")}>
                  <span className="flex items-center gap-1">Name <SortIcon col="student_name" /></span>
                </th>
                <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Dept / Spec</th>
                <th className="text-center px-3 sm:px-4 py-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Section</th>
                <th className="text-center px-3 sm:px-4 py-3 font-medium text-muted-foreground text-xs">R1</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Aptitude</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Coding</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">R1 Band</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Result</th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">R2</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/students/${s.registration_number}`)}
                >
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted-foreground">{s.s_no}</td>
                  <td className="px-3 sm:px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">{s.registration_number}</td>
                  <td className="px-3 sm:px-4 py-3 font-medium text-primary hover:underline text-xs sm:text-sm">{s.student_name}</td>
                  <td className="px-3 sm:px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                    <div>{s.department}</div>
                    <div className="text-[10px] opacity-70">{s.specialization}</div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center text-xs hidden lg:table-cell">{s.section}</td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${
                      s.r1_attendance === "Present"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {s.r1_attendance === "Present" ? "P" : "A"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center hidden md:table-cell">
                    {s.r1_attendance === "Present" ? (
                      assessmentView === "band"
                        ? <BandBadge band={s.aptitude_band || "—"} />
                        : <span className="text-sm font-medium">{s.aptitude_percentage || "—"}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center hidden md:table-cell">
                    {s.r1_attendance === "Present" ? (
                      assessmentView === "band"
                        ? <BandBadge band={s.coding_band || "—"} />
                        : <span className="text-sm font-medium">{s.coding_percentage || "—"}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    {s.r1_band ? <BandBadge band={s.r1_band} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    {s.r1_result ? (
                      <span className={`text-xs font-semibold ${s.r1_result === "PASS" ? "text-success" : "text-destructive"}`}>
                        {s.r1_result}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    {s.r2_status ? <BandBadge band={s.r2_status} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Showing {Math.min(filtered.length, 200)} of {filtered.length} filtered ({totalCount.toLocaleString()} total)</span>
          {filtered.length > 200 && <span className="text-warning">Refine filters to see more results</span>}
        </div>
      </div>
    </div>
  );
}

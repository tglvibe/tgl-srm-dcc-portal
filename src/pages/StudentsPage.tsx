import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import BandBadge from "@/components/BandBadge";
import YearFilter from "@/components/YearFilter";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ExportConfigDialog from "@/components/ExportConfigDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ChevronUp, ChevronDown, ChevronDown as ChevronDownIcon } from "lucide-react";

type SortKey =
  | "s_no"
  | "registration_number"
  | "student_name"
  | "department"
  | "section"
  | "r1_attendance"
  | "aptitude_score"
  | "coding_gained"
  | "r1_band"
  | "r1_result"
  | "r2_bands"
  | "r2_result";

export default function StudentsPage() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [r2ResultFilter, setR2ResultFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("s_no");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [assessmentView, setAssessmentView] = useState<"band" | "percentage">("band");
  const [exportOpen, setExportOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const { students, loading, error, refetch, totalCount } = useStudents(
    selectedYear !== "all" ? { year: selectedYear } : {}
  );

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(students.map((s) => s.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [students]);

  // Client-side filtering & sorting
  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        const matchSearch = !search ||
          s.student_name.toLowerCase().includes(search.toLowerCase()) ||
          s.registration_number.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase());
        const matchDept = deptFilter === "all" || s.department === deptFilter;
        const matchAtt = attendanceFilter === "all" || s.r1_attendance === attendanceFilter;
        const matchResult = resultFilter === "all" || (s.r1_result && s.r1_result.replace(/^=+/, "").trim().toUpperCase() === resultFilter.toUpperCase());
        const matchR2 = r2ResultFilter === "all" || (s.r2_result && s.r2_result.replace(/^=+/, "").replace(/^R2\s*-?/i, "").trim().toUpperCase() === r2ResultFilter.toUpperCase());
        return matchSearch && matchDept && matchAtt && matchResult && matchR2;
      })
      .sort((a, b) => {
        const aVal: any = (a as any)[sortKey];
        const bVal: any = (b as any)[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        const strA = String(aVal);
        const strB = String(bVal);
        return sortDir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
  }, [students, search, deptFilter, attendanceFilter, resultFilter, r2ResultFilter, sortKey, sortDir]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setCurrentPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const capitalize = (s?: string | null) => {
    if (!s) return "—";
    const t = String(s).trim();
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  };

  const r2ResultClass = (raw?: string | null) => {
    if (!raw) return "text-muted-foreground";
    const v = String(raw).replace(/^=+/, "").replace(/^R2\s*-?/i, "").trim().toUpperCase();
    if (v === "PASS") return "text-success";
    if (v === "FAIL") return "text-destructive";
    if (v === "ABSENT") return "text-amber-600";
    if (v === "PENDING") return "text-warning";
    if (v === "UNRATED" || v === "NA" || v === "N/A") return "text-yellow-400";
    return "text-muted-foreground";
  };

  const r1ResultClass = (raw?: string | null) => {
    if (!raw) return "text-muted-foreground";
    const v = String(raw).replace(/^=+/, "").trim().toUpperCase();
    if (v === "PASS") return "text-success";
    if (v === "FAIL") return "text-destructive";
    if (v === "ABSENT") return "text-amber-600";
    if (v === "PENDING") return "text-warning";
    if (v === "UNRATED" || v === "NA" || v === "N/A") return "text-yellow-400";
    return "text-muted-foreground";
  };

  const renderResultBadge = (raw?: string | null) => {
    if (!raw) return <span className="text-xs text-muted-foreground">—</span>;
    const norm = String(raw).replace(/^=+/, "").replace(/^R2\s*-?/i, "").trim();
    const up = norm.toUpperCase();
    if (up === "PASS") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">{capitalize(norm)}</span>;
    if (up === "FAIL") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">{capitalize(norm)}</span>;
    if (up === "ABSENT") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">{capitalize(norm)}</span>;
    if (up === "PENDING") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">{capitalize(norm)}</span>;
    if (up === "UNRATED" || up === "NA" || up === "N/A") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-400">{capitalize(norm)}</span>;
    return <span className="text-xs font-medium">{norm}</span>;
  };

  const renderBandOrAbsent = (band?: string | null) => {
    if (!band) return <span className="text-xs text-muted-foreground">—</span>;
    const up = String(band).replace(/^=+/, "").trim().toUpperCase();
    if (up === "ABSENT" || up === "R1-ABSENT" || up === "R2-ABSENT") {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">{band}</span>;
    }
    // fallback to BandBadge for normal band strings
    return <BandBadge band={band} />;
  };

  if (loading) return <LoadingState message="Loading student directory..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Student Directory</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {totalCount.toLocaleString()} total records
          </p>
        </div>
        <button 
          onClick={() => setExportOpen(true)}
          className="h-9 px-3 sm:px-4 rounded-lg border border-border text-xs sm:text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center sm:justify-normal">
          <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Year Filter */}
      <div className="hidden sm:block">
        <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />
      </div>

      {/* Mobile Filter Toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full h-9 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted flex items-center justify-between transition-colors"
        >
          <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
          <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className={`kpi-card !p-3 sm:!p-4 ${!showFilters && "md:block hidden"}`}>
        <div className="flex flex-col gap-3">
          {/* Year Filter - Mobile only, at top of filter section */}
          <div className="md:hidden">
            <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-[200px] sm:min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, reg no, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-9 w-full sm:w-44 text-xs sm:text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
            <SelectTrigger className="h-9 w-full sm:w-36 text-xs sm:text-sm"><SelectValue placeholder="Attendance" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Present">Present</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">R1</span>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="h-9 w-full sm:w-24 text-xs sm:text-sm"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PASS">Pass</SelectItem>
              <SelectItem value="FAIL">Fail</SelectItem>
            </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">R2</span>
            <Select value={r2ResultFilter} onValueChange={setR2ResultFilter}>
              <SelectTrigger className="h-9 w-full sm:w-24 text-xs sm:text-sm"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PASS">R2 Pass</SelectItem>
              <SelectItem value="FAIL">R2 Fail</SelectItem>
              <SelectItem value="ABSENT">R2-Absent</SelectItem>
              <SelectItem value="PENDING">R2-Pending</SelectItem>
              <SelectItem value="UNRATED">Unrated</SelectItem>
            </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden w-full sm:w-auto">
            <button
              onClick={() => setAssessmentView("band")}
              className={`px-2 sm:px-3 py-1.5 text-xs font-medium transition-colors flex-1 sm:flex-none ${assessmentView === "band" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >Bands</button>
            <button
              onClick={() => setAssessmentView("percentage")}
              className={`px-2 sm:px-3 py-1.5 text-xs font-medium transition-colors flex-1 sm:flex-none ${assessmentView === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("s_no")}>
                  <span className="flex items-center gap-1">S.No <SortIcon col="s_no" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("registration_number")}>
                  <span className="flex items-center gap-1">Reg No. <SortIcon col="registration_number" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("student_name")}>
                  <span className="flex items-center gap-1">Name <SortIcon col="student_name" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("department")}>
                  <span className="flex items-center gap-1">Dept / Spec <SortIcon col="department" /></span>
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("section")}>
                  <span className="flex items-center gap-1">Section <SortIcon col="section" /></span>
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("r1_attendance")}>
                  <span className="flex items-center gap-1">R1 Att. <SortIcon col="r1_attendance" /></span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs cursor-pointer select-none" onClick={() => toggleSort("aptitude_score")}>
                  <span className="flex items-center gap-1">Aptitude <SortIcon col="aptitude_score" /></span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs cursor-pointer select-none" onClick={() => toggleSort("coding_gained")}>
                  <span className="flex items-center gap-1">Coding <SortIcon col="coding_gained" /></span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs cursor-pointer select-none" onClick={() => toggleSort("r1_band")}>
                  <span className="flex items-center gap-1">R1 Band <SortIcon col="r1_band" /></span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs cursor-pointer select-none" onClick={() => toggleSort("r1_result")}>
                  <span className="flex items-center gap-1">R1 Result <SortIcon col="r1_result" /></span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs cursor-pointer select-none" onClick={() => toggleSort("r2_bands")}>
                  <span className="flex items-center gap-1">R2 Band <SortIcon col="r2_bands" /></span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground text-xs cursor-pointer select-none" onClick={() => toggleSort("r2_result")}>
                  <span className="flex items-center gap-1">R2 Result <SortIcon col="r2_result" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/students/${s.registration_number}`)}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.s_no}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.registration_number}</td>
                  <td className="px-4 py-3 font-medium text-primary hover:underline">{s.student_name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    <div>{s.department}</div>
                    <div className="text-[10px] opacity-70">{s.specialization}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs">{s.section}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.r1_attendance === "Present"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {s.r1_attendance}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {s.r1_attendance === "Present" ? (
                      assessmentView === "band"
                        ? <BandBadge band={s.aptitude_band || "—"} />
                        : <span className="text-sm font-medium">{s.aptitude_percentage || "—"}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {s.r1_attendance === "Present" ? (
                      assessmentView === "band"
                        ? <BandBadge band={s.coding_band || "—"} />
                        : <span className="text-sm font-medium">{s.coding_percentage || "—"}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {renderBandOrAbsent(s.r1_band)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {renderResultBadge(s.r1_result)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {renderBandOrAbsent(s.r2_bands)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {renderResultBadge(s.r2_result)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} filtered ({totalCount.toLocaleString()} total)</span>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <label className="text-muted-foreground">Per page:</label>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="text-xs bg-transparent">
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded border border-border text-xs disabled:opacity-50"
            >Prev</button>
            <span className="text-xs">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 rounded border border-border text-xs disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>

      {exportOpen && (
        <ExportConfigDialog
          open={exportOpen}
          title="Student Directory Export"
          description={`Export ${filtered.length} filtered student records with selected columns`}
          data={filtered}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}

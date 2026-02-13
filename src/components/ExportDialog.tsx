import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Search, ChevronUp, ChevronDown, X, Eye } from "lucide-react";
import BandBadge from "@/components/BandBadge";
import type { StudentRecord } from "@/types/database";

interface ExportDialogProps {
  open: boolean;
  label: string;
  students: StudentRecord[];
  year: string;
  round?: string;
  onClose: () => void;
}

type SortKey = "student_name" | "s_no" | "department" | "coding_percentage";

function exportCSV(students: StudentRecord[], filename: string) {
  const headers = [
    "S.No", "Name", "Registration Number", "Email", "Department",
    "Specialization", "R1 Attendance", "R1 Result", "Coding %",
    "Coding Band", "Aptitude %", "R1 Band", "R2 Result", "R2 Band",
  ];
  const rows = students.map((s, i) => [
    i + 1, s.student_name, s.registration_number, s.email,
    s.department, s.specialization, s.r1_attendance,
    s.r1_result || "", s.coding_percentage || "",
    s.coding_band || "", s.aptitude_percentage || "",
    s.r1_band || "", s.r2_result || "", s.r2_bands || "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(students: StudentRecord[], filename: string) {
  // Export as TSV which Excel opens natively
  const headers = [
    "S.No", "Name", "Registration Number", "Email", "Department",
    "Specialization", "R1 Attendance", "R1 Result", "Coding %",
    "Coding Band", "Aptitude %", "R1 Band", "R2 Result", "R2 Band",
  ];
  const rows = students.map((s, i) => [
    i + 1, s.student_name, s.registration_number, s.email,
    s.department, s.specialization, s.r1_attendance,
    s.r1_result || "", s.coding_percentage || "",
    s.coding_band || "", s.aptitude_percentage || "",
    s.r1_band || "", s.r2_result || "", s.r2_bands || "",
  ]);
  const tsv = [headers, ...rows].map((r) => r.join("\t")).join("\n");
  const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(".csv", ".xls");
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportDialog({ open, label, students, year, round = "1", onClose }: ExportDialogProps) {
  const [mode, setMode] = useState<"confirm" | "preview">("confirm");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [r2ResultFilter, setR2ResultFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("s_no");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();

  const departments = useMemo(() => {
    const depts = new Set(students.map((s) => s.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [students]);

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        const matchSearch = !search ||
          s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
          s.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
          s.email?.toLowerCase().includes(search.toLowerCase());
        const matchDept = deptFilter === "all" || s.department === deptFilter;
        const matchAtt = attendanceFilter === "all" || s.r1_attendance === attendanceFilter;
        const matchResult = resultFilter === "all" || s.r1_result === resultFilter;
        const matchR2Result = r2ResultFilter === "all" || s.r2_result === r2ResultFilter;
        return matchSearch && matchDept && matchAtt && matchResult && (round === "2" ? matchR2Result : true);
      })
      .sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null || bVal == null) return 0;
        if (typeof aVal === "string" && typeof bVal === "string")
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
  }, [students, search, deptFilter, attendanceFilter, resultFilter, r2ResultFilter, sortKey, sortDir, round]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const handleClose = () => {
    setMode("confirm");
    setSearch("");
    setDeptFilter("all");
    setAttendanceFilter("all");
    setResultFilter("all");
    setR2ResultFilter("all");
    onClose();
  };

  const handleReport = () => {
    const params = new URLSearchParams({ year, round });
    window.open(`/report?${params.toString()}`, "_blank");
  };

  if (mode === "confirm") {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export: {label}</DialogTitle>
            <DialogDescription>
              {students.length.toLocaleString()} student records found. Would you like to preview them?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => setMode("preview")} className="justify-start gap-3 h-14">
              <Eye className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Preview & Export</div>
                <div className="text-xs opacity-80">View students with search, sort & filter, then export</div>
              </div>
            </Button>
            <Button onClick={handleReport} variant="outline" className="justify-start gap-3 h-14">
              <FileText className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">Full PDF Report</div>
                <div className="text-xs text-muted-foreground">Open printable report with charts & analysis</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{label} — Student Preview</DialogTitle>
              <DialogDescription>
                {filtered.length.toLocaleString()} of {students.length.toLocaleString()} records
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center flex-shrink-0 py-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, reg no, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-9 w-44 text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d!}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
            <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Attendance" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Present">Present</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="h-9 w-32 text-sm"><SelectValue placeholder="R1 Result" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PASS">Pass</SelectItem>
              <SelectItem value="FAIL">Fail</SelectItem>
            </SelectContent>
          </Select>
          {round === "2" && (
            <Select value={r2ResultFilter} onValueChange={setR2ResultFilter}>
              <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="R2 Result" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All R2 Results</SelectItem>
                <SelectItem value="R2 PASS">R2 Pass</SelectItem>
                <SelectItem value="R2 FAIL">R2 Fail</SelectItem>
                <SelectItem value="R2-ABSENT">R2 Absent</SelectItem>
                <SelectItem value="R2-PENDING">R2 Pending</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none text-xs" onClick={() => toggleSort("s_no")}>
                  <span className="flex items-center gap-1">S.No <SortIcon col="s_no" /></span>
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Reg No.</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none text-xs" onClick={() => toggleSort("student_name")}>
                  <span className="flex items-center gap-1">Name <SortIcon col="student_name" /></span>
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Email</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none text-xs" onClick={() => toggleSort("department")}>
                  <span className="flex items-center gap-1">Dept <SortIcon col="department" /></span>
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Spec</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">R1 Status</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">R1 Result</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">Coding%</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">Cod Band</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">Apt%</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">Overall</th>
                {round === "2" && (
                  <>
                    <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">R2 Result</th>
                    <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">R2 Band</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 300).map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/students/${s.registration_number}`)}
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.registration_number}</td>
                  <td className="px-3 py-2 font-medium text-primary text-xs">{s.student_name}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[180px]">{s.email}</td>
                  <td className="px-3 py-2 text-xs">{s.department}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{s.specialization}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.r1_attendance === "Present"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {s.r1_attendance === "Present" ? "P" : "A"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {s.r1_result ? (
                      <span className={`text-xs font-semibold ${s.r1_result === "PASS" ? "text-success" : "text-destructive"}`}>
                        {s.r1_result === "PASS" ? "P" : "F"}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">–</span>}
                  </td>
                  <td className="px-3 py-2 text-center text-xs">{s.coding_percentage || "–"}</td>
                  <td className="px-3 py-2 text-center">
                    {s.coding_band ? <BandBadge band={s.coding_band} /> : <span className="text-xs text-muted-foreground">–</span>}
                  </td>
                  <td className="px-3 py-2 text-center text-xs">{s.aptitude_percentage || "–"}</td>
                  <td className="px-3 py-2 text-center">
                    {s.r1_band ? <BandBadge band={s.r1_band} /> : <span className="text-xs text-muted-foreground">–</span>}
                  </td>
                  {round === "2" && (
                    <>
                      <td className="px-3 py-2 text-center text-xs">{s.r2_result || "–"}</td>
                      <td className="px-3 py-2 text-center">
                        {s.r2_bands ? <BandBadge band={s.r2_bands} /> : <span className="text-xs text-muted-foreground">–</span>}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No students match the current filters.</div>
          )}
        </div>

        {/* Footer with count + export buttons */}
        <div className="flex items-center justify-between pt-3 flex-shrink-0 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Showing {Math.min(filtered.length, 300)} of {filtered.length} filtered ({students.length.toLocaleString()} total)
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode("confirm")} className="gap-1.5">
              <X className="w-3.5 h-3.5" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(filtered, `${label.replace(/\s+/g, "_")}_export.csv`)} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(filtered, `${label.replace(/\s+/g, "_")}_export.xls`)} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Excel
            </Button>
            <Button size="sm" onClick={handleReport} className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> PDF Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
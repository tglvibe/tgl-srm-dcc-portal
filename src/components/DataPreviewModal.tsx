import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, Search, ChevronUp, ChevronDown, Eye, Copy } from "lucide-react";
import BandBadge from "@/components/BandBadge";
import type { StudentRecord } from "@/types/database";

interface DataPreviewModalProps {
  open: boolean;
  title: string;
  description?: string;
  data: StudentRecord[];
  onClose: () => void;
}

type SortKey = keyof StudentRecord;

function exportCSV(data: StudentRecord[], filename: string) {
  const headers = [
    "S.No", "Name", "Registration Number", "Email", "Department",
    "Specialization", "R1 Attendance", "R1 Result", "Coding %",
    "Coding Band", "Aptitude %", "R1 Band", "R2 Status",
  ];
  const rows = data.map((s, i) => [
    i + 1, s.student_name, s.registration_number, s.email,
    s.department, s.specialization, s.r1_attendance,
    s.r1_result || "", s.coding_percentage || "",
    s.coding_band || "", s.aptitude_percentage || "",
    s.r1_band || "", s.r2_status || "",
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

export default function DataPreviewModal({
  open,
  title,
  description,
  data,
  onClose,
}: DataPreviewModalProps) {
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("student_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = [...data];
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter((s) =>
        s.student_name?.toLowerCase().includes(search) ||
        s.registration_number?.toLowerCase().includes(search) ||
        s.department?.toLowerCase().includes(search) ||
        s.specialization?.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search)
      );
    }
    result.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [data, searchText, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          <div className="text-sm text-muted-foreground mt-2">
            Showing <span className="font-semibold">{filtered.length}</span> of{" "}
            <span className="font-semibold">{data.length}</span> records
          </div>
        </DialogHeader>

        {/* Controls */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name, email, department..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-9"
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button
            onClick={() => exportCSV(filtered, `${title}.csv`)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              const text = filtered.map((s) => `${s.student_name} (${s.registration_number})`).join("\n");
              navigator.clipboard.writeText(text);
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto border border-border rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-muted/50 border-b border-border">
              <tr>
                <th
                  className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-muted text-xs whitespace-nowrap"
                  onClick={() => toggleSort("student_name")}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortKey === "student_name" && (
                      sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-muted text-xs whitespace-nowrap"
                  onClick={() => toggleSort("registration_number")}
                >
                  <div className="flex items-center gap-1">
                    Reg #
                    {sortKey === "registration_number" && (
                      sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-muted text-xs whitespace-nowrap"
                  onClick={() => toggleSort("department")}
                >
                  <div className="flex items-center gap-1">
                    Department
                    {sortKey === "department" && (
                      sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className="px-3 py-2 text-left font-semibold text-xs whitespace-nowrap">Specialization</th>
                <th className="px-3 py-2 text-left font-semibold text-xs whitespace-nowrap">Email</th>
                <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">R1 Attendance</th>
                <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">Coding %</th>
                <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">Coding Band</th>
                <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">R2 Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((student, idx) => (
                  <tr key={student.id || idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-sm font-medium">{student.student_name}</td>
                    <td className="px-3 py-2 text-sm text-muted-foreground font-mono">
                      {student.registration_number}
                    </td>
                    <td className="px-3 py-2 text-sm">{student.department}</td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">{student.specialization}</td>
                    <td className="px-3 py-2 text-sm text-muted-foreground truncate max-w-[180px]">
                      {student.email}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        student.r1_attendance === "Present"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {student.r1_attendance}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-sm font-semibold">
                      {student.coding_percentage ? `${student.coding_percentage}%` : "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {student.coding_band && <BandBadge band={student.coding_band} />}
                    </td>
                    <td className="px-3 py-2 text-center text-sm">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        student.r2_status === "Present"
                          ? "bg-blue-100 text-blue-700"
                          : student.r2_status === "Absent"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {student.r2_status || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end pt-2">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

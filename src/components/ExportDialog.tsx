import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import type { StudentRecord } from "@/types/database";

interface ExportDialogProps {
  open: boolean;
  label: string;
  students: StudentRecord[];
  year: string;
  round?: string;
  onClose: () => void;
}

function exportCSV(students: StudentRecord[], filename: string) {
  const headers = [
    "S.No", "Name", "Registration Number", "Email", "Department",
    "Specialization", "R1 Attendance", "R1 Result", "Coding %",
    "Coding Band", "Aptitude %", "R1 Band", "R2 Status",
  ];
  const rows = students.map((s, i) => [
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

export default function ExportDialog({ open, label, students, year, round = "1", onClose }: ExportDialogProps) {
  const handleCSV = () => {
    exportCSV(students, `${label.replace(/\s+/g, "_")}_export.csv`);
    onClose();
  };

  const handleReport = () => {
    const params = new URLSearchParams({ year, round });
    window.open(`/report?${params.toString()}`, "_blank");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export: {label}</DialogTitle>
          <DialogDescription>
            Choose how you'd like to export the {label.toLowerCase()} data ({students.length.toLocaleString()} records).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleCSV} variant="outline" className="justify-start gap-3 h-14">
            <Download className="w-5 h-5 text-success" />
            <div className="text-left">
              <div className="font-medium">Export Data (CSV)</div>
              <div className="text-xs text-muted-foreground">Download student records as spreadsheet</div>
            </div>
          </Button>
          <Button onClick={handleReport} variant="outline" className="justify-start gap-3 h-14">
            <FileText className="w-5 h-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">View Full Report</div>
              <div className="text-xs text-muted-foreground">Open printable report with charts & analysis</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

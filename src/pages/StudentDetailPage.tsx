import { useParams, useNavigate } from "react-router-dom";
import { useStudent } from "@/hooks/useStudents";
import BandBadge from "@/components/BandBadge";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Mail, Building, GraduationCap, User, BookOpen,
} from "lucide-react";
import { YEAR_YOP_MAP } from "@/types/database";

export default function StudentDetailPage() {
  const { regNumber } = useParams<{ regNumber: string }>();
  const navigate = useNavigate();
  const { student, loading, error } = useStudent(regNumber || "");

  if (loading) return <LoadingState message="Loading student profile..." />;
  if (error || !student) return <ErrorState message={error || "Student not found"} onRetry={() => navigate("/students")} />;

  const aptPct = parseFloat(student.aptitude_percentage?.replace("%", "") || "0");
  const codPct = parseFloat(student.coding_percentage?.replace("%", "") || "0");

  const hasR2 = student.r2_status != null && student.r2_status !== "R2-PENDING";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/students")} className="gap-1.5 text-muted-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </Button>

      {/* Profile Header */}
      <div className="kpi-card !p-4 sm:!p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-xl sm:text-2xl font-bold text-primary shrink-0">
            {student.student_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">{student.student_name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono">{student.registration_number}</p>
            </div>

            <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{student.email}</span></span>
              <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 shrink-0" />{student.department}</span>
              <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 shrink-0" />{student.specialization}</span>
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 shrink-0" />{student.program} — {student.year} (YOP {YEAR_YOP_MAP[student.year] || "—"})</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 shrink-0" />Section {student.section}</span>
            </div>

            <div className="flex gap-2 sm:gap-3 items-center flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                student.r1_attendance === "Present"
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}>
                R1: {student.r1_attendance}
              </span>
              {student.r1_band && <BandBadge band={student.r1_band} />}
              {student.r1_result && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  student.r1_result === "PASS" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {student.r1_result}
                </span>
              )}
              {student.r2_status && <BandBadge band={student.r2_status} />}
            </div>
          </div>
        </div>
      </div>

      {/* R1 Assessment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aptitude */}
        <div className="kpi-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground">R1 — Aptitude Assessment</h3>
          {student.r1_attendance === "Present" ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-base sm:text-lg font-bold text-foreground">
                  {student.aptitude_score} / {student.aptitude_max}
                </span>
              </div>
              <Progress value={aptPct} className="h-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Percentage</span>
                <span className="text-base sm:text-lg font-semibold text-accent">{student.aptitude_percentage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Band</span>
                <BandBadge band={student.aptitude_band || "—"} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Student was absent for R1</p>
          )}
        </div>

        {/* Coding */}
        <div className="kpi-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground">R1 — Coding Assessment</h3>
          {student.r1_attendance === "Present" ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-base sm:text-lg font-bold text-foreground">
                  {student.coding_gained} / {student.coding_max}
                </span>
              </div>
              <Progress value={codPct} className="h-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Percentage</span>
                <span className="text-base sm:text-lg font-semibold text-accent">{student.coding_percentage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Band</span>
                <BandBadge band={student.coding_band || "—"} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Student was absent for R1</p>
          )}
        </div>
      </div>

      {/* R1 & R2 Summary */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Round Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground mb-2">R1 Overall Band</div>
            {student.r1_band ? <BandBadge band={student.r1_band} /> : <span className="text-sm text-muted-foreground">—</span>}
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground mb-2">R1 Result</div>
            <span className={`text-base sm:text-lg font-bold ${student.r1_result === "PASS" ? "text-success" : "text-destructive"}`}>
              {student.r1_result || "—"}
            </span>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground mb-2">R2 Status</div>
            {student.r2_status ? <BandBadge band={student.r2_status} /> : <span className="text-sm text-muted-foreground">—</span>}
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground mb-2">R1 Attendance</div>
            <span className={`text-base sm:text-lg font-bold ${student.r1_attendance === "Present" ? "text-success" : "text-destructive"}`}>
              {student.r1_attendance}
            </span>
          </div>
        </div>
      </div>

      {/* R2 Detailed Assessment */}
      {hasR2 && (
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Round 2 — In-Person Assessment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-2">R2 Status</div>
              <BandBadge band={student.r2_status!} />
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-2">R2 Result</div>
              {student.r2_result ? (
                <span className={`text-base sm:text-lg font-bold ${student.r2_result === "PASS" ? "text-success" : "text-destructive"}`}>
                  {student.r2_result}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-2">R2 Category</div>
              {student.r2_category ? (
                <span className="text-sm font-semibold text-foreground">{student.r2_category}</span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useAuth } from "@/contexts/AuthContext";
import { useStudent } from "@/hooks/useStudents";
import BandBadge from "@/components/BandBadge";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Progress } from "@/components/ui/progress";
import {
  User, Mail, Building, GraduationCap, BookOpen,
} from "lucide-react";
import { YEAR_YOP_MAP } from "@/types/database";

export default function StudentProfile() {
  const { user } = useAuth();
  const { student, loading, error } = useStudent(user?.regNumber || "");

  if (loading) return <LoadingState message="Loading your profile..." />;
  if (error || !student) {
    return (
      <ErrorState
        message={error || "Could not find your student record. Make sure your registration number is linked."}
      />
    );
  }

  const aptPct = parseFloat(student.aptitude_percentage?.replace("%", "") || "0");
  const codPct = parseFloat(student.coding_percentage?.replace("%", "") || "0");

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="kpi-card !p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {student.student_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">{student.student_name}</h1>
              <p className="text-sm text-muted-foreground font-mono">{student.registration_number}</p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{student.email}</span>
              <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />{student.department}</span>
              <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />{student.specialization}</span>
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{student.program} — {student.year} Year (YOP {YEAR_YOP_MAP[student.year] || "—"})</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Section {student.section}</span>
            </div>

            <div className="flex gap-3 items-center flex-wrap">
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
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aptitude */}
        <div className="kpi-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Aptitude Assessment (R1A)</h3>
          {student.r1_attendance === "Present" ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-lg font-bold text-foreground">{student.aptitude_score} / {student.aptitude_max}</span>
              </div>
              <Progress value={aptPct} className="h-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Percentage</span>
                <span className="text-lg font-semibold text-accent">{student.aptitude_percentage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Band</span>
                <BandBadge band={student.aptitude_band || "—"} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">You were marked absent for R1</p>
          )}
        </div>

        {/* Coding */}
        <div className="kpi-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Coding Assessment (R1B)</h3>
          {student.r1_attendance === "Present" ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-lg font-bold text-foreground">{student.coding_gained} / {student.coding_max}</span>
              </div>
              <Progress value={codPct} className="h-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Percentage</span>
                <span className="text-lg font-semibold text-accent">{student.coding_percentage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Band</span>
                <BandBadge band={student.coding_band || "—"} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">You were marked absent for R1</p>
          )}
        </div>
      </div>

      {/* Round Summary */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Round Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground mb-2">R1 Overall Band</div>
            {student.r1_band ? <BandBadge band={student.r1_band} /> : <span className="text-sm text-muted-foreground">—</span>}
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground mb-2">R1 Result</div>
            <span className={`text-lg font-bold ${student.r1_result ? "text-success" : "text-destructive"}`}>
              {student.r1_result || "—"}
            </span>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground mb-2">R2 Result</div>
            <span className="text-lg font-bold text-foreground">
              {student.r2_result || "—"}
            </span>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground mb-2">R2 Status</div>
            {student.r2_bands ? <BandBadge band={student.r2_bands} /> : <span className="text-sm text-muted-foreground">—</span>}
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground mb-2">R1 Attendance</div>
            <span className={`text-lg font-bold ${student.r1_attendance === "Present" ? "text-success" : "text-destructive"}`}>
              {student.r1_attendance}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

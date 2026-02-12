import { useAuth } from "@/contexts/AuthContext";
import { useStudent } from "@/hooks/useStudents";
import BandBadge from "@/components/BandBadge";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Progress } from "@/components/ui/progress";

export default function StudentAssessments() {
  const { user } = useAuth();
  const { student, loading, error } = useStudent(user?.regNumber || "");

  if (loading) return <LoadingState message="Loading assessments..." />;
  if (error || !student) return <ErrorState message={error || "Could not load assessment data"} />;

  const aptPct = parseFloat(student.aptitude_percentage?.replace("%", "") || "0");
  const codPct = parseFloat(student.coding_percentage?.replace("%", "") || "0");

  const assessments = [
    {
      round: "Round 1A — Aptitude",
      score: student.aptitude_score,
      max: student.aptitude_max,
      percentage: student.aptitude_percentage,
      band: student.aptitude_band,
      progress: aptPct,
      status: student.r1_attendance === "Present" ? "Completed" : "Absent",
    },
    {
      round: "Round 1B — Coding",
      score: student.coding_gained,
      max: student.coding_max,
      percentage: student.coding_percentage,
      band: student.coding_band,
      progress: codPct,
      status: student.r1_attendance === "Present" ? "Completed" : "Absent",
    },
    {
      round: "Round 1 — Overall",
      score: null,
      max: null,
      percentage: null,
      band: student.r1_band,
      progress: null,
      status: student.r1_result ? "Completed" : "Pending",
    },
    {
      round: "Round 2 — In-Person",
      score: null,
      max: null,
      percentage: null,
      band: student.r2_status,
      progress: null,
      status: student.r2_status === "R2-ABSENT" ? "Absent" : student.r2_status === "R2-PENDING" ? "Pending" : student.r2_status ? "Completed" : "Pending",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Assessments</h1>
        <p className="text-sm text-muted-foreground mt-1">Talent Discovery Assessment results</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card text-center">
          <div className="text-xs text-muted-foreground mb-1">R1 Attendance</div>
          <span className={`text-lg font-bold ${student.r1_attendance === "Present" ? "text-success" : "text-destructive"}`}>
            {student.r1_attendance}
          </span>
        </div>
        <div className="kpi-card text-center">
          <div className="text-xs text-muted-foreground mb-1">R1 Result</div>
          <span className={`text-lg font-bold ${student.r1_result === "PASS" ? "text-success" : "text-destructive"}`}>
            {student.r1_result || "—"}
          </span>
        </div>
        <div className="kpi-card text-center">
          <div className="text-xs text-muted-foreground mb-1">R1 Band</div>
          {student.r1_band ? <BandBadge band={student.r1_band} /> : <span className="text-sm text-muted-foreground">—</span>}
        </div>
        <div className="kpi-card text-center">
          <div className="text-xs text-muted-foreground mb-1">R2 Status</div>
          {student.r2_status ? <BandBadge band={student.r2_status} /> : <span className="text-sm text-muted-foreground">—</span>}
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="space-y-4">
        {assessments.map((a) => (
          <div key={a.round} className="kpi-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">{a.round}</h3>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                a.status === "Completed" ? "bg-success/10 text-success" :
                a.status === "Absent" ? "bg-destructive/10 text-destructive" :
                "bg-warning/10 text-warning"
              }`}>
                {a.status}
              </span>
            </div>

            {a.score != null && a.max != null ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-bold text-foreground">{a.score} / {a.max}</span>
                </div>
                {a.progress != null && <Progress value={a.progress} className="h-3" />}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Percentage</span>
                  <span className="font-semibold text-accent">{a.percentage}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Band</span>
                  {a.band ? <BandBadge band={a.band} /> : <span className="text-muted-foreground">—</span>}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Band</span>
                {a.band ? <BandBadge band={a.band} /> : <span className="text-muted-foreground">—</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

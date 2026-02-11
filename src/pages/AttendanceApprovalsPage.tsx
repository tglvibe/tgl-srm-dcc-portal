import { useState } from "react";
import { MOCK_ATTENDANCE_QUEUE } from "@/data/mockData";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AttendanceApprovalsPage() {
  const { toast } = useToast();
  const [queue, setQueue] = useState(MOCK_ATTENDANCE_QUEUE.filter(a => a.status === "validated" || a.status === "approved"));

  const handleApprove = (id: string) => {
    setQueue(q => q.map(item => item.id === id ? { ...item, status: "approved" as const } : item));
    toast({ title: "Approved", description: "Attendance record has been approved." });
  };

  const handleReject = (id: string) => {
    setQueue(q => q.filter(item => item.id !== id));
    toast({ title: "Rejected", description: "Attendance record has been rejected.", variant: "destructive" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve validated attendance records</p>
      </div>

      <div className="kpi-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Pending Admin Approval</h3>
        </div>
        <div className="divide-y divide-border/50">
          {queue.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No records pending approval.</div>
          )}
          {queue.map((item) => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
              <div className="space-y-1">
                <div className="font-medium text-foreground text-sm">{item.program}</div>
                <div className="text-xs text-muted-foreground">{item.session} · {item.date} · {item.studentCount} students</div>
                {item.validatedBy && <div className="text-xs text-muted-foreground">Validated by: {item.validatedBy}</div>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                {item.status === "validated" && (
                  <>
                    <Button size="sm" variant="default" className="h-8 text-xs gap-1" onClick={() => handleApprove(item.id)}>
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10" onClick={() => handleReject(item.id)}>
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

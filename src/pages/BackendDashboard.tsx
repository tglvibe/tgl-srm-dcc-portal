import { MOCK_ATTENDANCE_QUEUE, MOCK_STUDENTS } from "@/data/mockData";
import KPICard from "@/components/KPICard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { FileCheck, Database, Settings, Shield, Users, AlertTriangle, CheckCircle } from "lucide-react";

export default function BackendDashboard() {
  const pending = MOCK_ATTENDANCE_QUEUE.filter(a => a.status === "pending");
  const validated = MOCK_ATTENDANCE_QUEUE.filter(a => a.status === "validated");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Backend Operations</h1>
        <p className="text-sm text-muted-foreground mt-1">Validation, configuration & data management</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Pending Validation" value={pending.length} icon={<AlertTriangle className="w-5 h-5" />} accent="warning" />
        <KPICard title="Validated (Awaiting Approval)" value={validated.length} icon={<FileCheck className="w-5 h-5" />} accent="accent" />
        <KPICard title="Total Students" value={MOCK_STUDENTS.length} icon={<Users className="w-5 h-5" />} accent="primary" />
        <KPICard title="Config Health" value="OK" icon={<CheckCircle className="w-5 h-5" />} accent="success" />
      </div>

      {/* Attendance Validation Queue */}
      <div className="kpi-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Attendance Validation Queue</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cross-verify attendance against session & billing records</p>
        </div>
        <div className="divide-y divide-border/50">
          {MOCK_ATTENDANCE_QUEUE.map((item) => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
              <div className="space-y-1">
                <div className="font-medium text-foreground text-sm">{item.program}</div>
                <div className="text-xs text-muted-foreground">{item.session} · {item.date} · {item.studentCount} students</div>
                {item.validatedBy && <div className="text-xs text-muted-foreground">Validated by: {item.validatedBy}</div>}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                {item.status === "pending" && (
                  <Button size="sm" variant="default" className="h-8 text-xs gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" /> Validate
                  </Button>
                )}
                {item.status === "validated" && (
                  <span className="text-xs text-muted-foreground">Awaiting admin approval</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Database, title: "Data Management", desc: "Import/export student data, bulk operations", action: "Manage Data" },
          { icon: Settings, title: "Score Configuration", desc: "Adjust employability score weights", action: "Configure" },
          { icon: Shield, title: "Audit Logs", desc: "View all system changes and actions", action: "View Logs" },
        ].map((card) => (
          <div key={card.title} className="kpi-card flex flex-col justify-between">
            <div className="mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <card.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs h-8">{card.action}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

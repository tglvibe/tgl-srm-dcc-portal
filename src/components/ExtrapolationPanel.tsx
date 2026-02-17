import { useExtrapolation, type ExtrapolatedBand } from "@/hooks/useExtrapolation";
import { useState } from "react";
import type { StudentRecord } from "@/types/database";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, ShieldCheck, Info, CheckCircle, XCircle } from "lucide-react";
import BandBadge from "@/components/BandBadge";

function ProjectionChart({ data, title }: { data: ExtrapolatedBand[]; title: string }) {
  const chartData = data.map(d => ({
    band: d.band,
    "Present (Actual)": d.presentCount,
    "Absent (Projected)": d.extrapolatedAbsent,
  }));

  return (
    <div className="kpi-card">
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="band" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Present (Actual)" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Absent (Projected)" stackId="a" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProjectionTable({ data, label }: { data: ExtrapolatedBand[]; label: string }) {
  return (
    <div className="kpi-card">
      <h4 className="text-sm font-semibold text-foreground mb-3">{label} — Projected Distribution</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-2 py-2 font-medium text-muted-foreground">Band</th>
              <th className="text-center px-2 py-2 font-medium text-muted-foreground">Present</th>
              <th className="text-center px-2 py-2 font-medium text-muted-foreground">Present %</th>
              <th className="text-center px-2 py-2 font-medium text-accent">+ Projected</th>
              <th className="text-center px-2 py-2 font-medium text-foreground">Total</th>
              <th className="text-center px-2 py-2 font-medium text-foreground">Total %</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.band} className="border-b border-border/50">
                <td className="px-2 py-2"><BandBadge band={row.band} /></td>
                <td className="text-center px-2 py-2 text-muted-foreground">{row.presentCount}</td>
                <td className="text-center px-2 py-2 text-muted-foreground">{row.presentPct.toFixed(1)}%</td>
                <td className="text-center px-2 py-2 text-accent font-medium">+{row.extrapolatedAbsent}</td>
                <td className="text-center px-2 py-2 font-semibold text-foreground">{row.totalProjected}</td>
                <td className="text-center px-2 py-2 text-foreground">{row.totalPct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ExtrapolationPanel({ students }: { students: StudentRecord[] }) {
  const [round, setRound] = useState<"1" | "2">("1");
  const ext = useExtrapolation(students, { round });

  const confidenceColor = ext.confidenceLevel === "High"
    ? "text-success" : ext.confidenceLevel === "Medium"
    ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-6">
      {/* Methodology banner */}
      <div className="kpi-card border-accent/30 bg-accent/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Extrapolation Methodology</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{ext.methodology}</p>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card text-center">
          <TrendingUp className="w-5 h-5 text-primary mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">Projected Pass Rate</div>
          <div className="text-xl font-bold text-foreground">{ext.projectedPassRate}%</div>
          <div className="text-[10px] text-muted-foreground">Actual: {ext.actualPassRate}%</div>
        </div>
        <div className="kpi-card text-center">
          <CheckCircle className="w-5 h-5 text-success mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">Projected Pass</div>
          <div className="text-xl font-bold text-foreground">{ext.projectedPassCount.toLocaleString()} {ext.projectedPassRate ? `(${ext.projectedPassRate}%)` : null}</div>
          <div className="text-[10px] text-muted-foreground">of {ext.totalStudents.toLocaleString()}</div>
        </div>
        <div className="kpi-card text-center">
          <XCircle className="w-5 h-5 text-destructive mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">Projected Fail</div>
          <div className="text-xl font-bold text-foreground">{ext.projectedFailCount.toLocaleString()}</div>
        </div>
        <div className="kpi-card text-center">
          <ShieldCheck className={`w-5 h-5 ${confidenceColor} mx-auto mb-2`} />
          <div className="text-xs text-muted-foreground">Confidence</div>
          <div className={`text-xl font-bold ${confidenceColor}`}>{ext.confidenceLevel}</div>
          <div className="text-[10px] text-muted-foreground">
            {ext.presentCount}/{ext.totalStudents} sampled
          </div>
        </div>
      </div>

      {/* Projected averages */}
      <div className="grid grid-cols-2 gap-4">
        <div className="kpi-card">
          <div className="text-xs text-muted-foreground mb-1">Projected Avg Aptitude %</div>
          <div className="text-2xl font-bold text-foreground">{ext.projectedAvgAptitude}%</div>
          <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${ext.projectedAvgAptitude}%` }} />
          </div>
        </div>
        <div className="kpi-card">
          <div className="text-xs text-muted-foreground mb-1">Projected Avg Coding %</div>
          <div className="text-2xl font-bold text-foreground">{ext.projectedAvgCoding}%</div>
          <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${ext.projectedAvgCoding}%` }} />
          </div>
        </div>
      </div>

      {/* Round Toggle */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm w-fit">
        <button
          onClick={() => setRound("1")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            round === "1"
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Round 1
        </button>
        <button
          onClick={() => setRound("2")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            round === "2"
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Round 2
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectionChart data={ext.codingBandProjection} title={`Coding Band — Actual vs Projected (${round === "1" ? "R1" : "R2"})`} />
        <ProjectionChart data={ext.aptitudeBandProjection} title={`Aptitude Band — Actual vs Projected (${round === "1" ? "R1" : "R2"})`} />
      </div>

      {/* Band / Category full chart */}
      {round === "1" ? (
        <ProjectionChart data={ext.r1BandProjection} title="R1 Band — Full Batch Projection" />
      ) : (
        <ProjectionChart data={ext.r2CategoryProjection || []} title="R2 Category — Full Batch Projection" />
      )}

      {/* Detail tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectionTable data={ext.codingBandProjection} label={`Coding Band (${round === "1" ? "R1" : "R2"})`} />
        <ProjectionTable data={ext.aptitudeBandProjection} label={`Aptitude Band (${round === "1" ? "R1" : "R2"})`} />
      </div>

      {round === "1" ? (
        <ProjectionTable data={ext.r1BandProjection} label="R1 Band" />
      ) : (
        <ProjectionTable data={ext.r2CategoryProjection || []} label="R2 Category" />
      )}
    </div>
  );
}

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon: ReactNode;
  accent?: "primary" | "accent" | "success" | "warning" | "destructive";
}

const accentStyles = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export default function KPICard({ title, value, subtitle, trend, icon, accent = "primary" }: KPICardProps) {
  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentStyles[accent]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend.value > 0 ? "text-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
          }`}>
            {trend.value > 0 ? <TrendingUp className="w-3 h-3" /> : trend.value < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground animate-count-up">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{title}</div>
      {subtitle && <div className="text-[10px] text-muted-foreground/70 mt-1">{subtitle}</div>}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  value: string | number;
  label: string;
  percentage?: string;
  subtitle?: string;
  onClick?: () => void;
  variant?: "default" | "success" | "danger" | "info" | "warning";
  icon?: ReactNode;
}

const variantStyles = {
  default: {
    border: "border-l-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    pctColor: "text-primary",
  },
  success: {
    border: "border-l-success",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    pctColor: "text-success",
  },
  danger: {
    border: "border-l-destructive",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    pctColor: "text-destructive",
  },
  info: {
    border: "border-l-accent",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    pctColor: "text-accent",
  },
  warning: {
    border: "border-l-warning",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    pctColor: "text-warning",
  },
};

export default function StatCard({ value, label, percentage, subtitle, onClick, variant = "default", icon }: StatCardProps) {
  const style = variantStyles[variant];

  return (
    <div
      className={cn(
        "kpi-card border-l-4 select-none group",
        style.border,
        onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", style.iconBg, style.iconColor)}>
            {icon}
          </div>
        )}
        {percentage && (
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", style.iconBg, style.pctColor)}>
            {percentage}
          </span>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">{label}</div>
      {subtitle && <div className="text-[10px] text-muted-foreground/70 mt-1">{subtitle}</div>}
    </div>
  );
}

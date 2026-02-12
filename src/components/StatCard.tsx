import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  percentage?: string;
  onClick?: () => void;
  variant?: "default" | "success" | "danger" | "info";
}

const variantBorder = {
  default: "border-l-primary/60",
  success: "border-l-success/60",
  danger: "border-l-destructive/60",
  info: "border-l-accent/60",
};

export default function StatCard({ value, label, percentage, onClick, variant = "default" }: StatCardProps) {
  return (
    <div
      className={cn(
        "kpi-card text-center border-l-4 select-none",
        variantBorder[variant],
        onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
      )}
      onClick={onClick}
    >
      <div className="text-2xl md:text-3xl font-bold text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">{label}</div>
      {percentage && (
        <div className="text-sm font-semibold text-primary mt-1">{percentage}</div>
      )}
    </div>
  );
}

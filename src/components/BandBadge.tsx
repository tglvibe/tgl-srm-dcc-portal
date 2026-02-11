import { cn } from "@/lib/utils";

type BandType = "B" | "C1" | "C2" | "D1" | "D2";

const bandStyles: Record<BandType, string> = {
  B: "bg-success/15 text-success border-success/30",
  C1: "bg-accent/15 text-accent border-accent/30",
  C2: "bg-primary/15 text-primary border-primary/30",
  D1: "bg-warning/15 text-warning border-warning/30",
  D2: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function BandBadge({ band, className }: { band: string; className?: string }) {
  const style = bandStyles[band as BandType] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", style, className)}>
      {band}
    </span>
  );
}

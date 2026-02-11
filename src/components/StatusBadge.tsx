import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  "Placed": "bg-success/15 text-success",
  "Multiple Offers": "bg-accent/15 text-accent",
  "Offer Received": "bg-warning/15 text-warning",
  "Not Placed": "bg-muted text-muted-foreground",
  "pending": "bg-warning/15 text-warning",
  "validated": "bg-accent/15 text-accent",
  "approved": "bg-success/15 text-success",
};

export default function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = statusStyles[status] || "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize", style, className)}>
      {status}
    </span>
  );
}

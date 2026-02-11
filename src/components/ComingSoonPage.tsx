import { Construction } from "lucide-react";

interface ComingSoonPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="kpi-card flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          {icon || <Construction className="w-8 h-8 text-primary" />}
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This module is under development and will be available in the next release.
        </p>
      </div>
    </div>
  );
}

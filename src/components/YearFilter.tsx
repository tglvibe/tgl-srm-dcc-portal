import { YEAR_OPTIONS } from "@/types/database";

interface YearFilterProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export default function YearFilter({ selectedYear, onYearChange }: YearFilterProps) {
  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm">
      <button
        onClick={() => onYearChange("all")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          selectedYear === "all"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        All Years
      </button>
      {YEAR_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onYearChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            selectedYear === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span className="hidden sm:inline">{opt.label}</span>
          <span className="sm:hidden">Y{opt.value === "First" ? "1" : opt.value === "Second" ? "2" : opt.value === "Third" ? "3" : "4"}</span>
          <span className="text-xs opacity-70 ml-1.5">YOP {opt.yop}</span>
        </button>
      ))}
    </div>
  );
}

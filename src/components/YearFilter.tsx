import { YEAR_OPTIONS } from "@/types/database";

interface YearFilterProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export default function YearFilter({ selectedYear, onYearChange }: YearFilterProps) {
  return (
    <div className="w-full">
      {/* Mobile: Vertical Stack */}
      <div className="md:hidden flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onYearChange("all")}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap min-h-9 flex-1 sm:flex-none ${
              selectedYear === "all"
                ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            All Years
          </button>
          {YEAR_OPTIONS.slice(0, 2).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onYearChange(opt.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap min-h-9 flex-1 sm:flex-none ${
                selectedYear === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <span>Y{opt.value === "First" ? "1" : opt.value === "Second" ? "2" : opt.value === "Third" ? "3" : "4"}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {YEAR_OPTIONS.slice(2).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onYearChange(opt.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap min-h-9 flex-1 sm:flex-none ${
                selectedYear === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <span>Y{opt.value === "First" ? "1" : opt.value === "Second" ? "2" : opt.value === "Third" ? "3" : "4"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tablet & Desktop: Horizontal Layout */}
      <div className="hidden md:flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm overflow-x-auto">
        <button
          onClick={() => onYearChange("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-9 ${
            selectedYear === "all"
              ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          All Years
        </button>
        {YEAR_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onYearChange(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-9 ${
              selectedYear === opt.value
                ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {opt.label}
            <span className="text-xs opacity-70 ml-1.5">YOP {opt.yop}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

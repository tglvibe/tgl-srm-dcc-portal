interface DepartmentFilterProps {
  departments: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  deptCounts?: Record<string, number>;
}

export default function DepartmentFilter({
  departments,
  selected,
  onChange,
  label = "Departments",
  deptCounts = {},
}: DepartmentFilterProps) {
  const allSelected = selected.length === departments.length && departments.length > 0;
  const noneSelected = selected.length === 0;

  const toggleAll = () => {
    onChange(allSelected ? [] : [...departments]);
  };

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((d) => d !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 sm:p-2 shadow-sm flex-wrap">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1 whitespace-nowrap">{label}</span>
      <div className="h-6 w-px bg-border/50 hidden sm:block" />
      <button
        onClick={toggleAll}
        className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-8 ${
          allSelected
            ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        }`}
      >
        {allSelected ? "All" : "Select All"}
      </button>
      {allSelected && (
        <button
          onClick={() => onChange([])}
          className="px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/60 whitespace-nowrap min-h-8"
        >
          Clear
        </button>
      )}
      {noneSelected && (
        <span className="px-2 sm:px-3 py-1.5 text-xs text-muted-foreground">No departments selected</span>
      )}
      {!allSelected && !noneSelected && (
        <>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => toggleItem(dept)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1 min-h-8 ${
                selected.includes(dept)
                  ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {dept}
              {deptCounts[dept] !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  selected.includes(dept)
                    ? "bg-primary-foreground/20"
                    : "bg-muted"
                }`}>
                  {deptCounts[dept]}
                </span>
              )}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

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
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm flex-wrap">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">{label}</span>
      <div className="h-6 w-px bg-border/50" />
      <button
        onClick={toggleAll}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          allSelected
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        {allSelected ? "All" : "Select All"}
      </button>
      {allSelected && (
        <button
          onClick={() => onChange([])}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          Clear
        </button>
      )}
      {noneSelected && (
        <span className="px-3 py-2 text-xs text-muted-foreground">No departments selected</span>
      )}
      {!allSelected && !noneSelected && (
        <>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => toggleItem(dept)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                selected.includes(dept)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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

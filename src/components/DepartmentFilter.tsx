interface DepartmentFilterProps {
  departments: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
}

export default function DepartmentFilter({
  departments,
  selected,
  onChange,
  label = "Departments",
}: DepartmentFilterProps) {
  const allSelected = selected.length === departments.length && departments.length > 0;

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
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm flex-wrap">
        <button
          onClick={toggleAll}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            allSelected
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          All
        </button>
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => toggleItem(dept)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              selected.includes(dept)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {dept}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface MultiSelectFilterProps {
  label: string;
  items: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  itemCounts?: Record<string, number>;
}

export default function MultiSelectFilter({
  label,
  items,
  selected,
  onChange,
  itemCounts = {},
}: MultiSelectFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const allSelected = selected.length === items.length && items.length > 0;
  const noneSelected = selected.length === 0;

  const toggleAll = () => {
    onChange(allSelected ? [] : [...items]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((d) => d !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header with controls */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 hover:opacity-75 transition-opacity"
        >
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              isExpanded ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          {!isExpanded && (
            <span className="text-xs text-muted-foreground ml-auto">
              {noneSelected ? "None" : allSelected ? "All" : `${selected.length}/${items.length}`}
            </span>
          )}
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleAll}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              allSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            All
          </button>
          <button
            onClick={clearAll}
            disabled={noneSelected}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              noneSelected
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No items available
            </div>
          ) : (
            items.map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(item)}
                  onChange={() => toggleItem(item)}
                  className="w-4 h-4 rounded border-border checked:bg-primary checked:border-primary"
                />
                <span className="flex-1 text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                  {item}
                </span>
                {itemCounts[item] !== undefined && (
                  <span className="text-xs font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded whitespace-nowrap">
                    {itemCounts[item]}
                  </span>
                )}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

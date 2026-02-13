import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface MultiSelectFilterProps {
  label: string;
  items: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  itemCounts?: Record<string, number>;
  hideAllButton?: boolean;
  onSelectAll?: () => void;
}

export default function MultiSelectFilter({
  label,
  items,
  selected,
  onChange,
  itemCounts = {},
  hideAllButton = false,
  onSelectAll,
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
    <div className="flex flex-col gap-2">
      {/* Collapsed View - Header Row */}
      {!isExpanded ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group flex-1 text-left"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {noneSelected ? "None" : allSelected ? "All" : `${selected.length}/${items.length}`}
            </span>
          </button>
          {onSelectAll && (
            <button
              onClick={onSelectAll}
              className="px-2 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 bg-primary text-primary-foreground shadow-sm hover:shadow-md whitespace-nowrap"
            >
              All
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Expanded Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-muted/50 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-0 transition-transform" />
            </button>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
          </div>

          {/* Expanded Filters Row - Inline Chips */}
          <div className="flex flex-wrap items-center gap-2 pl-6">
            {/* All Button - Only if not hidden */}
            {!hideAllButton && (
              <button
                onClick={toggleAll}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  allSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/50"
                }`}
              >
                All
              </button>
            )}

            {/* Individual Filter Items */}
            {items.map((item) => (
              <button
                key={item}
                onClick={() => toggleItem(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  selected.includes(item)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/50"
                }`}
              >
                {item}
                {itemCounts[item] !== undefined && (
                  <span className="ml-1 text-xs opacity-75">
                    ({itemCounts[item]})
                  </span>
                )}
              </button>
            ))}

            {/* Clear Button */}
            {!noneSelected && (
              <button
                onClick={clearAll}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ml-auto text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/50"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

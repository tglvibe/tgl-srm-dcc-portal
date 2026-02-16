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
  onItemClick?: (item: string) => void;
}

export default function MultiSelectFilter({
  label,
  items,
  selected,
  onChange,
  itemCounts = {},
  hideAllButton = false,
  onSelectAll,
  onItemClick,
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group flex-1 sm:flex-none text-left min-h-10"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
              {label}
            </span>
            <span className="text-xs text-muted-foreground ml-auto flex-shrink-0 whitespace-nowrap">
              {noneSelected ? "None" : allSelected ? "All" : `${selected.length}/${items.length}`}
            </span>
          </button>
          {onSelectAll && (
            <button
              onClick={onSelectAll}
              className="px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 bg-primary text-primary-foreground shadow-sm hover:shadow-md whitespace-nowrap hover:brightness-110 min-h-9"
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
              className="p-1 hover:bg-muted/50 rounded transition-colors min-h-9 min-w-9 flex items-center justify-center flex-shrink-0"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-0 transition-transform" />
            </button>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
              {label}
            </span>
          </div>

          {/* Expanded Filters Row - Inline Chips */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pl-0 sm:pl-6">
            {/* All Button - Only if not hidden */}
            {!hideAllButton && (
              <button
                onClick={toggleAll}
                className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap min-h-8 ${
                  allSelected
                    ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/50"
                }`}
              >
                All
              </button>
            )}

            {/* Individual Filter Items */}
            {items.map((item) => (
              <div key={item} className="relative group">
                <button
                  onClick={() => toggleItem(item)}
                  className={`px-2 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap min-h-8 ${
                    selected.includes(item)
                      ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
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
                {onItemClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                    }}
                    className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full bg-info text-info-foreground flex items-center justify-center text-xs font-bold"
                    title="View all students in this category"
                  >
                    👁️
                  </button>
                )}
              </div>
            ))}

            {/* Clear Button */}
            {!noneSelected && (
              <button
                onClick={clearAll}
                className="px-2 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ml-auto text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/50 min-h-8 whitespace-nowrap"
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

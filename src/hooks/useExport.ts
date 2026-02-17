import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { StudentRecord } from "@/types/database";
import {
  DEFAULT_EXPORT_COLUMNS,
  ExportColumn,
  exportToCSV,
  exportToExcel,
  exportToJSON,
  getExportSummary,
} from "@/lib/exportUtils";

export interface UseExportOptions {
  defaultFilename?: string;
  title?: string;
  selectedData: StudentRecord[];
}

type SortKey = keyof StudentRecord | null;

export function useExport(options: UseExportOptions) {
  const { defaultFilename = "export", title, selectedData } = options;

  // State management
  const [columns, setColumns] = useState<ExportColumn[]>(DEFAULT_EXPORT_COLUMNS);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;
  const [columnValueFilters, setColumnValueFilters] = useState<Partial<Record<keyof StudentRecord, Set<string>>>>({});

  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page on search change
    }, 150);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [search]);

  // Filter data based on search and per-column value filters
  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim() && Object.keys(columnValueFilters).length === 0) return selectedData;

    const lowerSearch = debouncedSearch.toLowerCase();
    return selectedData.filter((record) => {
      const baseMatch = (
        record.student_name?.toLowerCase().includes(lowerSearch) ||
        record.registration_number?.toLowerCase().includes(lowerSearch) ||
        record.email?.toLowerCase().includes(lowerSearch) ||
        record.department?.toLowerCase().includes(lowerSearch)
      );

      // Apply column value filters (multi-select exact matches)
      const columnFiltersActive = Object.keys(columnValueFilters).length > 0;
      if (!columnFiltersActive) return baseMatch;

      const passesColumnFilters = Object.entries(columnValueFilters).every(([k, set]) => {
        if (!set || set.size === 0) return true;
        const val = String((record as any)[k] ?? "");
        return set.has(val);
      });

      return baseMatch && passesColumnFilters;
    });
  }, [selectedData, debouncedSearch, columnValueFilters]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";

      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal);
      const strB = String(bVal);
      const cmp = strA.localeCompare(strB);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [filteredData, sortKey, sortDir]);

  // Paginate data for display
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const totalPages = useMemo(() => Math.ceil(sortedData.length / pageSize), [sortedData]);

  // Get exportable records (selected or all sorted)
  const exportData = useMemo(() => {
    if (selectedRows.size === 0) return sortedData;
    return sortedData.filter((_, idx) => selectedRows.has(idx));
  }, [sortedData, selectedRows]);

  // Summary statistics
  const summary = useMemo(() => getExportSummary(exportData), [exportData]);

  // Visible columns
  const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);

  // Toggle column visibility
  const toggleColumn = useCallback((key: keyof StudentRecord) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

  // Show/hide all columns
  const toggleAllColumns = useCallback((show: boolean) => {
    setColumns((prev) =>
      prev.map((col) => ({ ...col, visible: show }))
    );
  }, []);

  // Toggle row selection
  const toggleRow = useCallback((index: number) => {
    setSelectedRows((prev) => {
      const updated = new Set(prev);
      if (updated.has(index)) {
        updated.delete(index);
      } else {
        updated.add(index);
      }
      return updated;
    });
    setSelectAll(false);
  }, []);

  // Toggle select all
  const toggleSelectAll = useCallback(() => {
    if (selectAll || selectedRows.size > 0) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      const all = new Set(sortedData.map((_, idx) => idx));
      setSelectedRows(all);
      setSelectAll(true);
    }
  }, [selectAll, selectedRows.size, sortedData]);

  // Sort toggle
  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  }, [sortKey]);

  // Export functions
  const handleExportCSV = useCallback(() => {
    exportToCSV(
      exportData,
      columns,
      defaultFilename.replace(/\s+/g, "_"),
      true
    );
  }, [exportData, columns, defaultFilename]);

  const handleExportExcel = useCallback(() => {
    exportToExcel(
      exportData,
      columns,
      defaultFilename.replace(/\s+/g, "_")
    );
  }, [exportData, columns, defaultFilename]);

  const handleExportJSON = useCallback(() => {
    exportToJSON(
      exportData,
      columns,
      defaultFilename.replace(/\s+/g, "_")
    );
  }, [exportData, columns, defaultFilename]);

  // Distinct values per column for filter menus
  const columnDistinctValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    columns.forEach((col) => {
      const key = col.key as keyof StudentRecord;
      const values = Array.from(new Set(selectedData.map((r) => {
        const v = r[key];
        return v == null ? "" : String(v);
      })));
      map[String(col.key)] = values.filter((v) => v !== "").sort();
    });
    return map;
  }, [selectedData, columns]);

  const toggleColumnValueFilter = useCallback((key: keyof StudentRecord, value: string) => {
    setColumnValueFilters((prev) => {
      const next = { ...(prev as any) } as Partial<Record<keyof StudentRecord, Set<string>>>;
      const set = next[key] ? new Set(next[key]) : new Set<string>();
      if (set.has(value)) set.delete(value);
      else set.add(value);
      next[key] = set;
      return next;
    });
    setCurrentPage(1);
  }, []);

  const clearColumnFilter = useCallback((key: keyof StudentRecord) => {
    setColumnValueFilters((prev) => {
      const next = { ...(prev as any) } as Partial<Record<keyof StudentRecord, Set<string>>>;
      delete next[key];
      return next;
    });
  }, []);

  const setColumnFilter = useCallback((key: keyof StudentRecord, values: Set<string>) => {
    setColumnValueFilters((prev) => {
      const next = { ...(prev as any) } as Partial<Record<keyof StudentRecord, Set<string>>>;
      next[key] = new Set(values);
      return next;
    });
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setDebouncedSearch("");
    setSearch("");
    setColumnValueFilters({});
    setSelectedRows(new Set());
    setSelectAll(false);
    setCurrentPage(1);
  }, []);

  return {
    // State
    columns,
    search,
    selectedRows,
    selectAll,
    sortKey,
    sortDir,
    currentPage,
    totalPages,
    pageSize,

    // Data
    filteredData: sortedData,
    paginatedData,
    exportData,
    visibleColumns,
    summary,
    columnDistinctValues,
    columnValueFilters,
    setColumnFilter,
    clearAllFilters,

    // Actions
    setSearch,
    toggleColumn,
    toggleAllColumns,
    toggleRow,
    toggleSelectAll,
    setColumns,
    toggleSort,
    setCurrentPage,
    toggleColumnValueFilter,
    clearColumnFilter,
    setColumnFilter,
    clearAllFilters,

    // Exports
    handleExportCSV,
    handleExportExcel,
    handleExportJSON,
  };
}

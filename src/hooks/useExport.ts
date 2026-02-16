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

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return selectedData;

    const lowerSearch = debouncedSearch.toLowerCase();
    return selectedData.filter((record) => {
      return (
        record.student_name?.toLowerCase().includes(lowerSearch) ||
        record.registration_number?.toLowerCase().includes(lowerSearch) ||
        record.email?.toLowerCase().includes(lowerSearch) ||
        record.department?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [selectedData, debouncedSearch]);

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

    // Actions
    setSearch,
    toggleColumn,
    toggleAllColumns,
    toggleRow,
    toggleSelectAll,
    setColumns,
    toggleSort,
    setCurrentPage,

    // Exports
    handleExportCSV,
    handleExportExcel,
    handleExportJSON,
  };
}

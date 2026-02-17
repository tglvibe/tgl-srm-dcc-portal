import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Search, Eye, EyeOff, FileJson, ChevronUp, ChevronDown, Zap, X, Grid3x3, LayoutList } from "lucide-react";
import BandBadge from "@/components/BandBadge";
import type { StudentRecord } from "@/types/database";
import { useExport } from "@/hooks/useExport";

function ColumnFilterMenu<T extends string | number | symbol>(props: {
  colKey: keyof StudentRecord;
  label: string;
  options: string[];
  active?: Set<string> | undefined;
  onApply: (values: Set<string>) => void;
  onClear: () => void;
}) {
  const { colKey, label, options, active, onApply, onClear } = props;
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setStaged(active ? new Set(active) : new Set());
  }, [active]);

  const toggle = (v: string) => {
    setStaged((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="p-1 rounded hover:bg-muted/60" aria-label={`Filter ${label}`}>
        <Search className="w-3 h-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={6} className="w-56 max-h-64 flex flex-col">
        <div className="sticky top-0 z-20 bg-popover/90 backdrop-blur-sm border-b border-border p-2 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold">Filter {label}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStaged(new Set()); onClear(); setOpen(false); }}
              className="text-xs text-muted-foreground"
            >
              Clear
            </button>
            <button
              onClick={() => { const s = new Set(options); setStaged(s); onApply(s); setOpen(false); }}
              className="text-xs text-muted-foreground"
            >
              Select All
            </button>
            <button
              onClick={() => { onApply(staged); setOpen(false); }}
              className="text-xs font-medium px-2 py-0.5 bg-primary text-primary-foreground rounded"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="overflow-auto px-1 py-1">{
          options.map((val) => (
            <div key={val} className="px-2 py-1">
              <label
                onPointerDown={(e) => e.preventDefault()}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={staged.has(val)}
                  onChange={() => toggle(val)}
                  className="w-3 h-3"
                />
                <span className="truncate">{val}</span>
              </label>
            </div>
          ))
        }</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ExportConfigDialogProps {
  open: boolean;
  title: string;
  description?: string;
  data: StudentRecord[];
  onClose: () => void;
}

type ExportMode = "quick" | "preview";
type ViewMode = "card" | "table";

export default function ExportConfigDialog({
  open,
  title,
  description,
  data,
  onClose,
}: ExportConfigDialogProps) {
  const [mode, setMode] = useState<ExportMode>("quick");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const {
    columns,
    search,
    selectedRows,
    selectAll,
    sortKey,
    sortDir,
    currentPage,
    totalPages,
    pageSize,
    paginatedData,
    exportData,
    visibleColumns,
    summary,
    columnDistinctValues,
    columnValueFilters,
    setColumnFilter,
    setSearch,
    toggleColumn,
    toggleAllColumns,
    toggleRow,
    toggleSelectAll,
    toggleSort,
    setCurrentPage,
    handleExportCSV,
    handleExportExcel,
    handleExportJSON,
    toggleColumnValueFilter,
    clearColumnFilter,
    clearAllFilters,
  } = useExport({
    defaultFilename: title,
    selectedData: data,
  });

  // clearAllFilters is exported by the hook; call if available
  const clearAll = ((): void => {
    // intentionally empty, will be replaced if hook provides function
  }) as unknown as () => void;

  const visibleColumnKeys = useMemo(
    () => visibleColumns.map((c) => c.key),
    [visibleColumns]
  );

  const navigate = useNavigate();

  // Render cell value
  const renderCellValue = (record: StudentRecord, key: keyof StudentRecord) => {
    const value = record[key];

    if (value === null || value === undefined) return "–";

    if (
      key === "coding_band" ||
      key === "r1_band" ||
      key === "r2_bands" ||
      key === "aptitude_band"
    ) {
      return value ? <BandBadge band={String(value)} /> : "–";
    }

    if (key === "r1_attendance") {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            String(value).toUpperCase() === "PRESENT"
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {String(value).charAt(0)}
        </span>
      );
    }

    return String(value);
  };

  const SortIcon = ({ colKey }: { colKey: keyof StudentRecord }) => {
    if (sortKey !== colKey) return null;
    return sortDir === "asc" ? 
      <ChevronUp className="w-3 h-3 inline ml-1" /> : 
      <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col overflow-hidden p-2 sm:p-3 md:p-4 w-[95vw] sm:w-auto">
        <DialogHeader className="flex-shrink-0 pb-1 sm:pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-base">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-xs mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-1.5 flex-shrink-0">
              <button
                onClick={() => setMode("quick")}
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 justify-center sm:justify-start whitespace-nowrap ${
                  mode === "quick"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Zap className="w-3 h-3" /> <span className="hidden sm:inline">Quick Export</span><span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={() => setMode("preview")}
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 justify-center sm:justify-start whitespace-nowrap ${
                  mode === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Eye className="w-3 h-3" /> <span className="hidden sm:inline">Preview & Edit</span><span className="sm:hidden">Preview</span>
              </button>
              <Button variant="ghost" size="sm" onClick={() => clearAllFilters()} className="text-xs ml-2 hidden sm:inline">
                Clear Filters
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Export Mode */}
        {mode === "quick" && (
          <div className="flex-1 flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-8">
            <div className="text-center space-y-1 sm:space-y-2">
              <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-4">⚡</div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Export Ready</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {data.length.toLocaleString()} records • {summary.departments} departments
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-center w-full">
              <div className="p-2 sm:p-3 bg-muted rounded-lg">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold">{summary.totalRecords}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="p-2 sm:p-3 bg-muted rounded-lg">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold">{summary.presentCount}</div>
                <div className="text-xs text-muted-foreground">Present</div>
              </div>
              <div className="p-2 sm:p-3 bg-muted rounded-lg">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold">{summary.r1PassCount}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                className="text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="gap-1.5 text-xs sm:text-sm"
              >
                <FileJson className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">JSON</span>
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="gap-1.5 text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button
                onClick={handleExportExcel}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          </div>
        )}

        {/* Preview & Edit Mode */}
        {mode === "preview" && (
          <>
            {/* Summary Stats - Compact */}
            <div className="flex-shrink-0 flex flex-wrap items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/40 rounded text-[10px] sm:text-xs border border-border/30">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold">{summary.totalRecords.toLocaleString()}</span>
                </div>
                <div className="hidden sm:flex items-baseline gap-0.5">
                  <span className="text-muted-foreground">Depts:</span>
                  <span className="font-bold">{summary.departments}</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-muted-foreground">Present:</span>
                  <span className="font-bold">{summary.presentCount}</span>
                </div>
                <div className="hidden sm:flex items-baseline gap-0.5">
                  <span className="text-muted-foreground">Passed:</span>
                  <span className="font-bold">{summary.r1PassCount}</span>
                </div>
              </div>
            </div>

            {/* Controls Section - Compact */}
            <div className="flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/20 rounded space-y-1">
              {/* Search Bar + View Toggle */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search student…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-7 h-7 sm:h-8 text-[10px] sm:text-xs"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>

                {/* View Toggle & Controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                {/* View Mode Toggle */}
                <div className="flex gap-0 bg-muted rounded p-0">
                  <button
                    onClick={() => setViewMode("card")}
                    className={`p-1 rounded-l transition-all text-[10px] sm:text-xs ${
                      viewMode === "card"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Card view"
                  >
                    <Grid3x3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1 rounded-r transition-all text-[10px] sm:text-xs ${
                      viewMode === "table"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Table view"
                  >
                    <LayoutList className="w-3 h-3" />
                  </button>
                </div>

                {/* Column Toggle (only for table view) */}
                {viewMode === "table" && (
                  <div className="flex items-center gap-0 ml-1 pl-1 border-l border-border/50">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 hover:bg-muted rounded text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors" aria-label="Columns">
                        <Eye className="w-3 h-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent sideOffset={6} className="w-56">
                        <DropdownMenuLabel>Columns</DropdownMenuLabel>
                        {columns.map((col) => (
                          <DropdownMenuCheckboxItem
                            key={col.key}
                            checked={col.visible}
                            onCheckedChange={() => toggleColumn(col.key)}
                          >
                            {col.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <div className="p-2 flex gap-2">
                          <button onClick={() => toggleAllColumns(true)} className="text-xs text-muted-foreground">Show all</button>
                          <button onClick={() => toggleAllColumns(false)} className="text-xs text-muted-foreground">Hide all</button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Card View - Mobile Optimized Student Preview */}
            {viewMode === "card" && (
              <div className="flex-1 overflow-auto min-h-0 space-y-1 p-1 sm:p-2">
                {paginatedData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center py-8">
                      <div className="text-3xl mb-2">🔍</div>
                      <p className="text-sm text-muted-foreground font-medium">No records found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search criteria</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2">
                    {paginatedData.map((record, idx) => (
                      <div
                        key={`${record.id}-${idx}`}
                        className="bg-card border border-border rounded-lg p-2 sm:p-3 hover:border-primary/50 hover:shadow-sm transition-all group"
                      >
                        {/* Checkbox */}
                        <div className="flex items-start justify-between mb-2">
                          <Checkbox
                            checked={selectedRows.has(idx)}
                            onCheckedChange={() => toggleRow(idx)}
                            className="w-4 h-4 mt-0.5"
                          />
                          <div className="text-xs text-muted-foreground">#{record.s_no || idx + 1}</div>
                        </div>

                        {/* Student Info */}
                        <div className="space-y-1.5">
                          {/* Name */}
                          <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="text-sm font-semibold text-foreground truncate">{record.student_name || "—"}</p>
                          </div>

                          {/* Registration & Email */}
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <p className="text-xs text-muted-foreground">Reg. No</p>
                              <p className="text-xs font-medium text-foreground truncate">{record.registration_number || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Department</p>
                              <p className="text-xs font-medium text-foreground truncate">{record.department || "—"}</p>
                            </div>
                          </div>

                          {/* R1 Attendance & Result */}
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <p className="text-xs text-muted-foreground">R1 Att.</p>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  record.r1_attendance === "Present"
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {record.r1_attendance ? record.r1_attendance[0] : "—"}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">R1 Result</p>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  record.r1_result === "PASS"
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {record.r1_result || "—"}
                              </span>
                            </div>
                          </div>

                          {/* Bands */}
                          <div className="grid grid-cols-2 gap-1">
                            {record.r1_band && (
                              <div>
                                <p className="text-xs text-muted-foreground">R1 Band</p>
                                <BandBadge band={record.r1_band} />
                              </div>
                            )}
                            {record.r2_status && (
                              <div>
                                <p className="text-xs text-muted-foreground">R2 Status</p>
                                <BandBadge band={record.r2_status} />
                              </div>
                            )}
                          </div>

                          {/* Aptitude & Coding Scores */}
                          {(record.aptitude_percentage || record.coding_percentage) && (
                            <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-border/50">
                              {record.aptitude_percentage && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Apt. %</p>
                                  <p className="text-sm font-semibold text-amber-600">{record.aptitude_percentage}</p>
                                </div>
                              )}
                              {record.coding_percentage && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Code %</p>
                                  <p className="text-sm font-semibold text-blue-600">{record.coding_percentage}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Table View - For Desktop */}
            {viewMode === "table" && (
              <div className="flex-1 overflow-auto border border-border rounded min-h-0 bg-card hidden md:block">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 border-b border-border">
                    <tr>
                      <th className="px-2 py-1.5 w-8 text-left">
                        <Checkbox
                          checked={
                            selectAll ||
                            (selectedRows.size > 0 &&
                              selectedRows.size === data.length)
                          }
                          onCheckedChange={toggleSelectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      {visibleColumns.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => col.sortable && toggleSort(col.key)}
                          className={`px-2 py-1.5 text-left font-medium text-muted-foreground text-xs whitespace-nowrap ${
                            col.sortable ? "cursor-pointer hover:bg-muted/70 transition-colors" : ""
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="flex items-center gap-0.5">
                              {col.label}
                              {col.sortable && <SortIcon colKey={col.key} />}
                            </span>
                            <ColumnFilterMenu
                              colKey={col.key}
                              label={col.label}
                              options={columnDistinctValues[String(col.key)] || []}
                              active={columnValueFilters[col.key as keyof StudentRecord]}
                              onApply={(set) => setColumnFilter(col.key, set)}
                              onClear={() => clearColumnFilter(col.key)}
                            />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((record, idx) => (
                      <tr
                        key={`${record.id}-${idx}`}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-2 py-1">
                          <Checkbox
                            checked={selectedRows.has(idx)}
                            onCheckedChange={() => toggleRow(idx)}
                            className="w-4 h-4"
                          />
                        </td>
                        {visibleColumns.map((col) => (
                          <td
                            key={`${record.id}-${col.key}`}
                            className="px-2 py-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                          >
                            {col.key === "student_name" ? (
                              <button
                                onClick={() => navigate(`/students/${record.registration_number}`)}
                                className="text-primary font-medium text-xs hover:underline"
                                title={`Open ${record.student_name}`}
                              >
                                {String(record.student_name || "–")}
                              </button>
                            ) : (
                              renderCellValue(record, col.key)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {paginatedData.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground text-xs">
                    No records match your search criteria.
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex-shrink-0 space-y-1 pt-1.5 border-t border-border">
              {/* Pagination & Export Count Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10px] sm:text-xs text-muted-foreground px-1">
                <div>
                  {exportData.length > 0
                    ? `📊 ${exportData.length}/${data.length} records`
                    : "No records selected"}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-5 px-1 text-[10px]"
                      title="Previous page"
                    >
                      ←
                    </Button>
                    <span className="px-1">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="h-5 px-1 text-[10px]"
                      title="Next page"
                    >
                      →
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                <Button variant="outline" size="sm" onClick={onClose} className="text-[10px] sm:text-xs h-7 px-2 flex-1 sm:flex-none">
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  disabled={exportData.length === 0}
                  className="gap-1 text-[10px] sm:text-xs h-7 px-2 flex-1 sm:flex-none"
                  title="Export as JSON format"
                >
                  <FileJson className="w-3 h-3" />
                  <span className="hidden sm:inline">JSON</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={exportData.length === 0}
                  className="gap-1 text-[10px] sm:text-xs h-7 px-2 flex-1 sm:flex-none"
                  title="Export as CSV format"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={exportData.length === 0}
                  className="gap-1 text-[10px] sm:text-xs h-7 px-2 flex-1 sm:flex-none font-semibold"
                  title="Export as Excel spreadsheet"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
import { useMemo, useState } from "react";
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
import { Download, Search, Eye, EyeOff, FileJson, ChevronUp, ChevronDown, Zap } from "lucide-react";
import BandBadge from "@/components/BandBadge";
import type { StudentRecord } from "@/types/database";
import { useExport } from "@/hooks/useExport";

interface ExportConfigDialogProps {
  open: boolean;
  title: string;
  description?: string;
  data: StudentRecord[];
  onClose: () => void;
}

type ExportMode = "quick" | "preview";

export default function ExportConfigDialog({
  open,
  title,
  description,
  data,
  onClose,
}: ExportConfigDialogProps) {
  const [mode, setMode] = useState<ExportMode>("quick");
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
  } = useExport({
    defaultFilename: title,
    selectedData: data,
  });

  const visibleColumnKeys = useMemo(
    () => visibleColumns.map((c) => c.key),
    [visibleColumns]
  );

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
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col overflow-hidden p-4">
        <DialogHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-base">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-xs mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setMode("quick")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                  mode === "quick"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Zap className="w-3 h-3" /> Quick Export
              </button>
              <button
                onClick={() => setMode("preview")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                  mode === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Eye className="w-3 h-3" /> Preview & Edit
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Export Mode */}
        {mode === "quick" && (
          <div className="flex-1 flex flex-col justify-center items-center gap-6 p-8">
            <div className="text-center space-y-2">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold">Export Ready</h3>
              <p className="text-muted-foreground text-sm">
                {data.length.toLocaleString()} records • {summary.departments} departments
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{summary.totalRecords}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{summary.presentCount}</div>
                <div className="text-xs text-muted-foreground">Present</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{summary.r1PassCount}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="gap-1.5"
              >
                <FileJson className="w-4 h-4" />
                JSON
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="gap-1.5"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button
                onClick={handleExportExcel}
                className="gap-1.5"
              >
                <Download className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </div>
        )}

        {/* Preview & Edit Mode */}
        {mode === "preview" && (
          <>
            {/* Summary Stats */}
            <div className="flex-shrink-0 flex items-center gap-4 px-3 py-2 bg-muted/40 rounded text-xs border border-border/30">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-muted-foreground text-xs">Total:</span>
                  <div className="font-bold text-sm">{summary.totalRecords.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Depts:</span>
                  <div className="font-bold text-sm">{summary.departments}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Specs:</span>
                  <div className="font-bold text-sm">{summary.specializations}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Present:</span>
                  <div className="font-bold text-sm">{summary.presentCount}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Passed:</span>
                  <div className="font-bold text-sm">{summary.r1PassCount}</div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-shrink-0 px-3 py-2 bg-muted/20 rounded">
              {/* Search & Column Selection & Pagination */}
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <div className="relative min-w-[150px] max-w-xs">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-7 h-7 text-xs"
                    />
                  </div>

                  {/* Column Toggle */}
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs text-muted-foreground px-1">Cols:</span>
                    <button
                      onClick={() => toggleAllColumns(true)}
                      className="p-1 hover:bg-muted rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Show all columns"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => toggleAllColumns(false)}
                      className="p-1 hover:bg-muted rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Hide all columns"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Column Dropdown */}
                  <div className="flex gap-0.5">
                    {columns.slice(0, 6).map((col) => (
                      <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                          col.visible
                            ? "bg-primary text-primary-foreground text-xs"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                    {columns.length > 6 && (
                      <div className="relative group">
                        <button className="px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors">
                          +{columns.length - 6}
                        </button>
                        <div className="absolute hidden group-hover:flex flex-col gap-0.5 bg-popover border border-border rounded-lg p-1.5 right-0 mt-1 z-20 shadow-lg">
                          {columns.slice(6).map((col) => (
                            <button
                              key={col.key}
                              onClick={() => toggleColumn(col.key)}
                              className={`px-1.5 py-0.5 rounded text-xs text-left transition-colors ${
                                col.visible
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {col.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-6 px-1.5 text-xs"
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="h-6 px-1.5 text-xs"
                    >
                      →
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Table Preview */}
            <div className="flex-1 overflow-auto border border-border rounded min-h-0 bg-card">
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
                        <span className="flex items-center gap-0.5">
                          {col.label}
                          {col.sortable && <SortIcon colKey={col.key} />}
                        </span>
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
                          {renderCellValue(record, col.key)}
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

            {/* Footer Actions */}
            <div className="flex-shrink-0 space-y-1.5 pt-2 border-t border-border">
              {/* Pagination Info */}
              {totalPages > 1 && (
                <div className="text-xs text-muted-foreground px-1">
                  Page {currentPage} of {totalPages} • {data.length} total records
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {exportData.length > 0
                    ? `Exporting ${exportData.length} of ${data.length} records`
                    : "No records selected for export"}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                    disabled={exportData.length === 0}
                    className="gap-1.5 text-xs"
                    title="Export as JSON"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={exportData.length === 0}
                    className="gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={exportData.length === 0}
                    className="gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Excel
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>  );
}
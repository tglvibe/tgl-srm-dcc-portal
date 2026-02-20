import type { StudentRecord } from "@/types/database";

export interface ExportColumn {
  key: keyof StudentRecord;
  label: string;
  visible: boolean;
  sortable?: boolean;
}

export interface ExportConfig {
  columns: ExportColumn[];
  filename: string;
  title?: string;
  includeMetadata?: boolean;
}

export const DEFAULT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "s_no", label: "S.No", visible: true, sortable: true },
  { key: "registration_number", label: "Registration Number", visible: true, sortable: true },
  { key: "student_name", label: "Name", visible: true, sortable: true },
  { key: "email", label: "Email", visible: true, sortable: false },
  { key: "department", label: "Department", visible: true, sortable: true },
  { key: "specialization", label: "Specialization", visible: true, sortable: true },
  { key: "section", label: "Section", visible: false, sortable: false },
  { key: "r1_attendance", label: "R1 Attendance", visible: true, sortable: true },
  { key: "r1_result", label: "R1 Result", visible: true, sortable: true },
  { key: "coding_percentage", label: "Coding %", visible: true, sortable: true },
  { key: "coding_band", label: "Coding Band", visible: true, sortable: true },
  { key: "aptitude_percentage", label: "Aptitude %", visible: true, sortable: true },
  { key: "r1_band", label: "R1 Overall Band", visible: true, sortable: true },
  { key: "r2_result", label: "R2 Result", visible: true, sortable: true },
  { key: "r2_bands", label: "R2 Band", visible: true, sortable: true },
  { key: "overall_category", label: "Overall Category", visible: false, sortable: true },
];

/**
 * Format cell value for export
 */
export function formatCellValue(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).trim();
}

/**
 * Generate CSV content from student records
 */
export function generateCSVContent(
  records: StudentRecord[],
  columns: ExportColumn[],
  includeMetadata = false,
): string {
  const visibleColumns = columns.filter((c) => c.visible);
  const headers = visibleColumns.map((c) => c.label);
  
  const metadata = includeMetadata
    ? [
        `Export Date: ${new Date().toLocaleString()}`,
        `Total Records: ${records.length}`,
        "",
      ]
    : [];

  const rows = records.map((record) =>
    visibleColumns.map((col) => {
      const value = formatCellValue(record[col.key]);
      // Escape quotes and wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
    })
  );

  const csvRows = [
    ...metadata,
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((r) => r.join(",")),
  ];

  return csvRows.join("\n");
}

/**
 * Generate TSV content for Excel
 */
export function generateTSVContent(
  records: StudentRecord[],
  columns: ExportColumn[],
): string {
  const visibleColumns = columns.filter((c) => c.visible);
  const headers = visibleColumns.map((c) => c.label);

  const rows = records.map((record) =>
    visibleColumns.map((col) => formatCellValue(record[col.key]))
  );

  const tsvRows = [headers, ...rows];
  return tsvRows.map((r) => r.join("\t")).join("\n");
}

/**
 * Generate JSON content
 */
export function generateJSONContent(
  records: StudentRecord[],
  columns: ExportColumn[],
): string {
  const visibleColumns = columns.filter((c) => c.visible);
  const data = records.map((record) => {
    const obj: Record<string, any> = {};
    visibleColumns.forEach((col) => {
      obj[col.label] = record[col.key];
    });
    return obj;
  });
  return JSON.stringify(data, null, 2);
}

/**
 * Download file from blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export to CSV
 */
export function exportToCSV(
  records: StudentRecord[],
  columns: ExportColumn[],
  filename: string,
  includeMetadata = false,
): void {
  const csv = generateCSVContent(records, columns, includeMetadata);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, `${filename}.csv`);
}

/**
 * Export to Excel (as TSV)
 */
export function exportToExcel(
  records: StudentRecord[],
  columns: ExportColumn[],
  filename: string,
): void {
  const tsv = generateTSVContent(records, columns);
  const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
  downloadFile(blob, `${filename}.xls`);
}

/**
 * Export to JSON
 */
export function exportToJSON(
  records: StudentRecord[],
  columns: ExportColumn[],
  filename: string,
): void {
  const json = generateJSONContent(records, columns);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  downloadFile(blob, `${filename}.json`);
}

/**
 * Get summary statistics for records
 */
export function getExportSummary(records: StudentRecord[]): {
  totalRecords: number;
  departments: number;
  specializations: number;
  presentCount: number;
  r1PassCount: number;
} {
  const depts = new Set(records.map((r) => r.department).filter(Boolean));
  const specs = new Set(records.map((r) => r.specialization).filter(Boolean));
  const present = records.filter(
    (r) => r.r1_attendance?.toUpperCase() === "PRESENT"
  ).length;
  const passed = records.filter(
    (r) => r.r1_result?.toUpperCase() === "PASS"
  ).length;

  return {
    totalRecords: records.length,
    departments: depts.size,
    specializations: specs.size,
    presentCount: present,
    r1PassCount: passed,
  };
}

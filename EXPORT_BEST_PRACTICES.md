# Export System - Implementation Best Practices

## File Structure

```
src/
├── lib/
│   └── exportUtils.ts           # Low-level export functions & types
├── hooks/
│   └── useExport.ts             # Export state management hook
├── components/
│   ├── ExportConfigDialog.tsx   # New export UI component
│   └── ExportDialog.tsx         # Legacy component (deprecated)
└── pages/
    ├── AdminDashboard.tsx       # Updated to use ExportConfigDialog
    ├── StudentsPage.tsx         # Updated to use ExportConfigDialog
    └── ...
```

## Component Integration Pattern

### Pattern 1: Simple Export Button

```tsx
import { useState } from "react";
import ExportConfigDialog from "@/components/ExportConfigDialog";
import type { StudentRecord } from "@/types/database";

export default function MyPage() {
  const [exportOpen, setExportOpen] = useState(false);
  const [exportData, setExportData] = useState<StudentRecord[]>([]);

  const handleOpenExport = (data: StudentRecord[]) => {
    setExportData(data);
    setExportOpen(true);
  };

  return (
    <>
      <button onClick={() => handleOpenExport(students)}>
        Export Students
      </button>

      {exportOpen && (
        <ExportConfigDialog
          open={exportOpen}
          title="Export Students"
          data={exportData}
          onClose={() => setExportOpen(false)}
        />
      )}
    </>
  );
}
```

### Pattern 2: Context-Based Export (Recommended)

```tsx
import { useState } from "react";
import ExportConfigDialog from "@/components/ExportConfigDialog";
import type { StudentRecord } from "@/types/database";

interface ExportContext {
  label: string;
  students: StudentRecord[];
}

export default function Dashboard() {
  const [exportCtx, setExportCtx] = useState<ExportContext | null>(null);
  const students = useStudents();

  const openExport = (label: string, data: StudentRecord[]) => {
    setExportCtx({ label, students: data });
  };

  return (
    <>
      {/* Multiple export points */}
      <StatCard 
        onClick={() => openExport("Active Students", activeStudents)}
      />
      
      <button 
        onClick={() => openExport("All Students", students)}
      >
        Export All
      </button>

      {exportCtx && (
        <ExportConfigDialog
          open={!!exportCtx}
          title={exportCtx.label}
          data={exportCtx.students}
          description={`${exportCtx.students.length} records`}
          onClose={() => setExportCtx(null)}
        />
      )}
    </>
  );
}
```

### Pattern 3: Filtered Export with Metadata

```tsx
import { useState, useMemo } from "react";
import ExportConfigDialog from "@/components/ExportConfigDialog";
import type { StudentRecord } from "@/types/database";

export default function FilteredPage() {
  const [exportOpen, setExportOpen] = useState(false);
  const [filters, setFilters] = useState({ dept: "", year: "" });
  
  const students = useStudents();

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filters.dept && s.department !== filters.dept) return false;
      if (filters.year && s.year !== filters.year) return false;
      return true;
    });
  }, [students, filters]);

  const exportDesc = `${filteredStudents.length} students${
    filters.dept ? ` from ${filters.dept}` : ""
  }${filters.year ? ` in ${filters.year}` : ""}`;

  return (
    <>
      {/* Filters */}
      <Select value={filters.dept} onValueChange={(v) => setFilters({...filters, dept: v})}>
        {/* Options */}
      </Select>

      <button onClick={() => setExportOpen(true)}>
        Export Filtered
      </button>

      {exportOpen && (
        <ExportConfigDialog
          open={exportOpen}
          title="Filtered Export"
          description={exportDesc}
          data={filteredStudents}
          onClose={() => setExportOpen(false)}
        />
      )}
    </>
  );
}
```

## State Management Best Practices

### ✅ DO: Derive export data from filters

```tsx
const filteredStudents = useMemo(() => {
  return students.filter(/* filters */);
}, [students, searchTerm, selectedDept]);

const handleExport = () => {
  openExport("Export", filteredStudents);  // ✅ Pass filtered data
};
```

### ❌ DON'T: Store export data separately

```tsx
// ❌ Avoid this - redundant state
const [exportData, setExportData] = useState([]);

const handleExport = () => {
  setExportData(filteredStudents);  // ❌ Unnecessary state
  setExportOpen(true);
};
```

### ✅ DO: Use context for multiple export points

```tsx
const [exportCtx, setExportCtx] = useState<ExportContext | null>(null);

// Multiple sources, single export dialog
<button onClick={() => openExport("Active", activeStudents)} />
<button onClick={() => openExport("Inactive", inactiveStudents)} />
<button onClick={() => openExport("All", allStudents)} />
```

## Performance Optimization

### 1. Memoize Filtered Data

```tsx
import { useMemo } from "react";

const filteredStudents = useMemo(() => {
  return students.filter(/* expensive filter */);
}, [students, filters]);  // Only recalculate when dependencies change

// Export uses memoized data - no recalculation
<button onClick={() => openExport("Export", filteredStudents)} />
```

### 2. Avoid Inline Filtering in Export Handlers

```tsx
// ❌ Bad: Filtering happens every time button is clicked
<button 
  onClick={() => openExport(
    "Active", 
    students.filter(s => s.r1_attendance === "Present")  // ❌ Inline
  )}
/>

// ✅ Good: Use memoized computed value
const activeStudents = useMemo(
  () => students.filter(s => s.r1_attendance === "Present"),
  [students]
);
<button onClick={() => openExport("Active", activeStudents)} />
```

### 3. Lazy Load Export Data

```tsx
import { useCallback } from "react";

// For pages with very large datasets
const [exportCtx, setExportCtx] = useState<ExportContext | null>(null);

const openExport = useCallback((label: string, dataGetter: () => StudentRecord[]) => {
  // Data is computed only when dialog opens
  setExportCtx({ label, students: dataGetter() });
}, []);

// Usage: Pass function, not data
<button onClick={() => openExport("Export", () => computeExpensiveFilter())} />
```

## Column Management

### Default Column Configuration

```tsx
import { DEFAULT_EXPORT_COLUMNS } from "@/lib/exportUtils";

// Use standard columns
const columns = DEFAULT_EXPORT_COLUMNS;

// Customize visibility
const customColumns = DEFAULT_EXPORT_COLUMNS.map(col => ({
  ...col,
  visible: ["name", "email", "department"].includes(col.key)
}));
```

### Create Presets for Common Exports

```tsx
// In exportUtils.ts
export const EXPORT_PRESETS = {
  QUICK_REPORT: [
    { key: "student_name", label: "Name", visible: true },
    { key: "registration_number", label: "Reg No", visible: true },
    { key: "department", label: "Dept", visible: true },
    { key: "r1_result", label: "Result", visible: true },
  ],
  
  DETAILED: DEFAULT_EXPORT_COLUMNS.map(c => ({ ...c, visible: true })),
  
  R2_FOCUS: DEFAULT_EXPORT_COLUMNS.map(c => ({
    ...c,
    visible: !["section", "coding_percentage"].includes(c.key)
  })),
};

// Usage in component
const [columns, setColumns] = useState(EXPORT_PRESETS.QUICK_REPORT);
```

## Error Handling

### Handle Export Errors

```tsx
const handleExportCSV = () => {
  try {
    if (exportData.length === 0) {
      alert("No data to export. Please apply filters and try again.");
      return;
    }
    
    exportToCSV(exportData, columns, filename);
    
    // Show success feedback
    toast.success("Export completed successfully");
  } catch (error) {
    console.error("Export failed:", error);
    toast.error("Export failed. Please try again.");
  }
};
```

### Validate Data Before Export

```tsx
import { getExportSummary } from "@/lib/exportUtils";

const handleExport = (data: StudentRecord[]) => {
  if (data.length === 0) {
    console.warn("Export with empty dataset");
    return;
  }

  const summary = getExportSummary(data);
  console.log("Export summary:", summary);
  
  openExport("Export", data);
};
```

## User Experience

### Show Export Count

```tsx
{exportCtx && (
  <ExportConfigDialog
    open={!!exportCtx}
    title={exportCtx.label}
    description={`${exportCtx.students.length} records ready to export`}
    data={exportCtx.students}
    onClose={() => setExportCtx(null)}
  />
)}
```

### Disable Export When No Data

```tsx
const hasData = students.length > 0 && filteredStudents.length > 0;

<button 
  onClick={() => openExport("Export", filteredStudents)}
  disabled={!hasData}
  title={!hasData ? "No data to export" : "Export selected data"}
>
  Export
</button>
```

### Provide Context in Description

```tsx
{exportOpen && (
  <ExportConfigDialog
    open={exportOpen}
    title="Department Export"
    description={`Exporting ${dept} department students (${
      students.filter(s => s.department === dept).length
    } records). Current filters: ${
      [filter1 && "Filter 1", filter2 && "Filter 2"]
        .filter(Boolean)
        .join(", ")
    }`}
    data={filteredStudents}
    onClose={() => setExportOpen(false)}
  />
)}
```

## Testing Export Functionality

### Unit Test Example

```tsx
import { renderHook, act } from "@testing-library/react";
import { useExport } from "@/hooks/useExport";
import { mockStudents } from "@/test/fixtures";

describe("useExport", () => {
  it("should filter data by search", () => {
    const { result } = renderHook(() => 
      useExport({ selectedData: mockStudents })
    );

    act(() => {
      result.current.setSearch("John");
    });

    expect(result.current.filteredData).toEqual(
      mockStudents.filter(s => 
        s.student_name.includes("John")
      )
    );
  });

  it("should toggle column visibility", () => {
    const { result } = renderHook(() => 
      useExport({ selectedData: mockStudents })
    );

    act(() => {
      result.current.toggleColumn("student_name");
    });

    const nameCol = result.current.columns.find(
      c => c.key === "student_name"
    );
    expect(nameCol?.visible).toBe(false);
  });
});
```

### Integration Test Example

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import ExportConfigDialog from "@/components/ExportConfigDialog";
import { mockStudents } from "@/test/fixtures";

describe("ExportConfigDialog", () => {
  it("should render with data", () => {
    render(
      <ExportConfigDialog
        open={true}
        title="Test Export"
        data={mockStudents}
        onClose={() => {}}
      />
    );

    expect(screen.getByText("Test Export")).toBeInTheDocument();
    expect(screen.getByText(/\d+ of \d+ records/)).toBeInTheDocument();
  });

  it("should search within preview", () => {
    render(
      <ExportConfigDialog
        open={true}
        title="Test"
        data={mockStudents}
        onClose={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search records...");
    fireEvent.change(searchInput, { target: { value: "John" } });

    // Verify filtering works
    expect(screen.getByText(/1 of 1 records/)).toBeInTheDocument();
  });
});
```

## Accessibility

### ARIA Labels

```tsx
<button
  onClick={() => setExportOpen(true)}
  aria-label="Open export dialog to download student data"
  title="Export students as CSV, Excel, or JSON"
>
  <Download className="w-4 h-4" aria-hidden="true" />
  <span>Export</span>
</button>
```

### Keyboard Navigation

ExportConfigDialog supports:
- Tab: Navigate through buttons and inputs
- Enter: Activate buttons
- Escape: Close dialog
- Space: Toggle checkboxes

### Screen Reader Support

```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Exporting {exportData.length} records
</div>
```

## Security Considerations

### Data Validation

```tsx
// Validate data before export
if (!Array.isArray(exportData)) {
  console.error("Invalid export data");
  return;
}

if (exportData.some(item => !item.id)) {
  console.error("Incomplete records detected");
  return;
}
```

### CSV Injection Prevention

The `formatCellValue` function in exportUtils handles escaping:

```tsx
// Already implemented - dangerous characters are escaped
export function formatCellValue(value: any): string {
  // Converts =" to =""  (prevents formula injection)
  // Wraps in quotes and escapes internal quotes
  return `"${value.replace(/"/g, '""')}"`;
}
```

### Content Security Policy

Ensure CSP allows Blob objects:
```tsx
// In your CSP header
"default-src": "'self' blob:"
```

---

**Version**: 1.0
**Last Updated**: 2026-02-16
**Author**: Development Team

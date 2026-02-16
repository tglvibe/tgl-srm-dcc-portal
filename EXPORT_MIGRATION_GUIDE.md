# Export System Migration Guide

## Overview
This guide helps migrate from the legacy `ExportDialog` to the new `ExportConfigDialog` component. The new system provides better UX, real-time previews, and improved performance.

## Key Differences

| Feature | ExportDialog | ExportConfigDialog |
|---------|-------------|-------------------|
| **Preview** | Full table + filters | Inline with real-time updates |
| **Column Selection** | Fixed columns | Dynamic show/hide |
| **Row Selection** | Full dataset or nothing | Individual row + select-all |
| **Search in Export** | Yes | Yes (improved) |
| **Export Formats** | CSV, Excel, PDF | CSV, Excel, JSON |
| **Props** | label, students, year, round | title, data, description |
| **Performance** | Good | Excellent (optimized) |
| **UX** | Good | Excellent (modern) |

## Migration Steps

### Step 1: Update Imports

**Before:**
```tsx
import ExportDialog from "@/components/ExportDialog";
```

**After:**
```tsx
import ExportConfigDialog from "@/components/ExportConfigDialog";
```

### Step 2: Update State Management

**Before:**
```tsx
const [exportCtx, setExportCtx] = useState<{
  label: string;
  students: StudentRecord[];
} | null>(null);

const openExport = (label: string, filtered?: StudentRecord[]) => {
  setExportCtx({ label, students: filtered || students });
};
```

**After:**
```tsx
const [exportCtx, setExportCtx] = useState<{
  label: string;
  students: StudentRecord[];
} | null>(null);

const openExport = (label: string, filtered?: StudentRecord[]) => {
  setExportCtx({ label, students: filtered || students });
};

// No changes needed to state management!
```

### Step 3: Update Component Usage

**Before:**
```tsx
{exportCtx && (
  <ExportDialog
    open={!!exportCtx}
    label={exportCtx.label}
    students={exportCtx.students}
    year={selectedYear}
    round="1"
    onClose={() => setExportCtx(null)}
  />
)}
```

**After:**
```tsx
{exportCtx && (
  <ExportConfigDialog
    open={!!exportCtx}
    title={exportCtx.label}
    data={exportCtx.students}
    description={`Export ${exportCtx.students.length} records`}  // Optional
    onClose={() => setExportCtx(null)}
  />
)}
```

## Property Mapping

| ExportDialog | ExportConfigDialog | Notes |
|--------|--------|-------|
| `open` | `open` | No change |
| `label` | `title` | Renamed for clarity |
| `students` | `data` | Renamed for consistency |
| `year` | - | Removed (metadata added to CSV) |
| `round` | - | Removed (not needed) |
| `onClose` | `onClose` | No change |
| - | `description` | Optional, shows in dialog |

## Migration Examples

### Example 1: Admin Dashboard

**Before:**
```tsx
import ExportDialog from "@/components/ExportDialog";

// In component
{exportCtx && (
  <ExportDialog
    open={!!exportCtx}
    label={exportCtx.label}
    students={exportCtx.students}
    year={selectedYear}
    round="1"
    onClose={() => setExportCtx(null)}
  />
)}
```

**After:**
```tsx
import ExportConfigDialog from "@/components/ExportConfigDialog";

// In component - state remains the same
{exportCtx && (
  <ExportConfigDialog
    open={!!exportCtx}
    title={exportCtx.label}
    data={exportCtx.students}
    onClose={() => setExportCtx(null)}
  />
)}
```

### Example 2: Student Directory

**Before:**
```tsx
const [exportOpen, setExportOpen] = useState(false);

<ExportDialog
  open={exportOpen}
  label="Student Directory Export"
  students={filtered}
  year={selectedYear}
  round="1"
  onClose={() => setExportOpen(false)}
/>
```

**After:**
```tsx
const [exportOpen, setExportOpen] = useState(false);

<ExportConfigDialog
  open={exportOpen}
  title="Student Directory Export"
  data={filtered}
  description={`Export ${filtered.length} filtered records`}
  onClose={() => setExportOpen(false)}
/>
```

### Example 3: Dynamic Export Button

**Before:**
```tsx
const handleExport = (query: string, records: StudentRecord[]) => {
  setExportCtx({
    label: query,
    students: records
  });
};

// Click handler
onClick={() => handleExport("HCE Students", hceRecords)}
```

**After:**
```tsx
const handleExport = (query: string, records: StudentRecord[]) => {
  setExportCtx({
    label: query,
    students: records
  });
};

// Click handler - same
onClick={() => handleExport("HCE Students", hceRecords)}

// But rendering might include description
{exportCtx && (
  <ExportConfigDialog
    open={!!exportCtx}
    title={exportCtx.label}
    data={exportCtx.students}
    description={`Exporting ${exportCtx.students.length} student records with current filters`}
    onClose={() => setExportCtx(null)}
  />
)}
```

## New Capabilities

After migration, you can take advantage of:

### User Capabilities
- **Column Visibility**: Users can show/hide columns before export
- **Row Selection**: Select specific rows instead of all-or-nothing
- **Better Preview**: Real-time summary statistics
- **Multiple Formats**: JSON export in addition to CSV/Excel
- **Improved Search**: Better search filtering in preview

### Developer Capabilities
- **useExport Hook**: Reusable export logic
- **exportUtils**: Low-level export functions
- **Custom Formats**: Easy to add XML, PDF, etc.
- **Presets**: Define column configurations
- **Extensibility**: Hook into export process

## Removed Features

The following ExportDialog features are removed (usually not critical):

1. **PDF Preview**: Use DataPreviewModal for that
2. **Round-specific Filters**: Now explicit in data selection
3. **Custom Report Generation**: Separate feature

**Note**: If you need PDF reports, use the Report feature or DataPreviewModal.

## Configuration Options

### With Description

```tsx
<ExportConfigDialog
  open={open}
  title="Active Students Export"
  description="All students marked as present in R1 assessment"
  data={activeStudents}
  onClose={onClose}
/>
```

### Minimal

```tsx
<ExportConfigDialog
  open={open}
  title="Export"
  data={students}
  onClose={onClose}
/>
```

### Detailed Count

```tsx
{exportCtx && (
  <ExportConfigDialog
    open={!!exportCtx}
    title={exportCtx.label}
    description={`${exportCtx.students.length} records ready for export - respecting current filters and sort order`}
    data={exportCtx.students}
    onClose={() => setExportCtx(null)}
  />
)}
```

## Backward Compatibility

The old `ExportDialog` component will be deprecated in future versions. Timeline:
- **v2.0**: New system actively used (current)
- **v2.5**: Deprecation warning added
- **v3.0**: ExportDialog removed

**Action Required**: Migrate all usages before v3.0

## Testing Migration

After migration, verify:

1. ✅ Export dialog opens on click
2. ✅ Preview shows correct data
3. ✅ Filters are respected in export
4. ✅ CSV download works
5. ✅ Excel download works
6. ✅ JSON export available
7. ✅ Column toggles work
8. ✅ Row selection works
9. ✅ Search in preview works
10. ✅ Summary stats display correctly

## Troubleshooting

### Dialog doesn't open
- Verify state is set: `console.log(exportCtx)`
- Check `open` prop is correctly passed
- Ensure data is not empty

### Data looks wrong
- Verify `data` prop receives StudentRecord[]
- Check filters are applied before passing data
- Confirm field names in columns match StudentRecord

### Export fails
- Check browser console for errors
- Verify columns have `visible: true` set
- Ensure record has required fields

### Performance issues
- Check if exporting 10,000+ records
- Reduce column count
- Filter data before export

## Support

For issues with migration:
1. Check this guide first
2. Review examples for your use case
3. Check EXPORT_FUNCTIONALITY_GUIDE.md for features
4. Review EXPORT_SYSTEM_TECHNICAL.md for architecture

## FAQ

**Q: Do I need to change all my export calls?**
A: Only update the component rendering. State management can stay the same.

**Q: Will old CSV exports still work?**
A: Old CSVs work fine. New CSVs include metadata, which is backward compatible.

**Q: Can I use both dialogs?**
A: Not recommended. Migrate completely for best experience.

**Q: Do I lose any functionality?**
A: Not critical functions. PDF reports use a separate system.

**Q: How long until ExportDialog is removed?**
A: Planned for v3.0. Current version is v2.0+.

---

**Migration Difficulty**: ⭐ Easy (1-2 lines per usage)
**Estimated Time**: 5-15 minutes per page
**Risk Level**: Low (additive changes)

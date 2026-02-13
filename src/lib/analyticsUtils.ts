import type { StudentRecord } from "@/types/database";

/* ─── Case-Insensitive Comparison Helpers ─── */
export const compareCI = (value: string | null | undefined, target: string): boolean => {
  if (!value) return false;
  return value.toUpperCase().trim() === target.toUpperCase().trim();
};

export const R2_CATEGORY_MAP: Record<string, string> = {
  "C2.1": "T3",
  "C2.2": "T3",
  "C3": "High Potential",
  "C4": "Average",
  "C5": "Below Average",
  "C6": "Poor",
};

export const R2_CATEGORIES_ORDER = ["T3", "High Potential", "Average Potential", "Below Average", "Poor"];

export const PIE_COLORS = [
  "hsl(199,89%,48%)",
  "hsl(160,84%,39%)",
  "hsl(38,92%,50%)",
  "hsl(270,70%,50%)",
  "hsl(0,84%,60%)",
  "hsl(224,76%,33%)",
  "hsl(150,60%,40%)",
  "hsl(30,90%,55%)",
];

export function isActive(s: StudentRecord): boolean {
  return compareCI(s.r1_attendance, "Present") || s.r2_status != null;
}

export function isR1Passed(s: StudentRecord): boolean {
  return compareCI(s.r1_result, "PASS");
}

export function isR2Present(s: StudentRecord): boolean {
  return s.r2_status != null && !compareCI(s.r2_status, "R2-ABSENT") && !compareCI(s.r2_status, "R2-PENDING");
}

export function getR2Category(r2Status: string): string | null {
  return R2_CATEGORY_MAP[r2Status] || null;
}

export function computeR2Categories(students: StudentRecord[]) {
  // R2 Present = R2 PASS + R2 FAIL (case-insensitive)
  const r2Present = students.filter((s) => compareCI(s.r2_result, "R2 PASS") || compareCI(s.r2_result, "R2 FAIL"));
  
  const r2Total = r2Present.length;
  
  // Count students by r2_category
  const categoryMap = new Map<string, number>();
  r2Present.forEach((s) => {
    if (s.r2_category) {
      const normalized = s.r2_category.toUpperCase().trim();
      categoryMap.set(normalized, (categoryMap.get(normalized) || 0) + 1);
    }
  });
  
  // Return all categories in consistent order, including 0-count categories
  return R2_CATEGORIES_ORDER.map((cat) => {
    const normalized = cat.toUpperCase();
    const count = categoryMap.get(normalized) || 0;
    return {
      category: cat,
      count,
      percentage: r2Total > 0 ? (count / r2Total) * 100 : 0,
    };
  });
}

export interface DeptSpecRow {
  department: string;
  specialization: string;
  qualified: number;
  present: number;
  presentPct: number;
  absent: number;
  absentPct: number;
  passed: number;
  passedPct: number;
  failed: number;
  failedPct: number;
}

export function computeDeptSpecTable(
  students: StudentRecord[],
  round: "1" | "2"
): { rows: DeptSpecRow[]; totals: DeptSpecRow } {
  const groups = new Map<string, StudentRecord[]>();
  students.forEach((s) => {
    const key = `${s.department}|||${s.specialization}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  });

  const rows: DeptSpecRow[] = [];

  groups.forEach((groupStudents, key) => {
    const [department, specialization] = key.split("|||");

    if (round === "1") {
      const qualified = groupStudents.length;
      const present = groupStudents.filter((s) => compareCI(s.r1_attendance, "Present")).length;
      const absent = qualified - present;
      const passed = groupStudents.filter((s) => compareCI(s.r1_result, "PASS")).length;
      const failed = present - passed;
      rows.push({
        department,
        specialization,
        qualified,
        present,
        presentPct: qualified > 0 ? (present / qualified) * 100 : 0,
        absent,
        absentPct: qualified > 0 ? (absent / qualified) * 100 : 0,
        passed,
        passedPct: present > 0 ? (passed / present) * 100 : 0,
        failed,
        failedPct: present > 0 ? (failed / present) * 100 : 0,
      });
    } else {
      // R2 Logic per formula:
      // Qualified = Present + Absent (students with R2 data)
      // Present = R2 PASS + R2 FAIL
      // Absent = R2-ABSENT
      // Passed = R2 PASS
      // Failed = R2 FAIL
      
      // R2 Present = R2 PASS + R2 FAIL
      const present = groupStudents.filter((s) => compareCI(s.r2_result, "R2 PASS") || compareCI(s.r2_result, "R2 FAIL")).length;
      
      // R2 Absent = R2-ABSENT
      const absent = groupStudents.filter((s) => compareCI(s.r2_result, "R2-ABSENT")).length;
      
      // R2 Pending = R2-PENDING
      const pending = groupStudents.filter((s) => compareCI(s.r2_result, "R2-PENDING")).length;
      
      // R2 Qualified = Present + Absent + Pending
      const qualified = present + absent + pending;
      
      // R2 Passed = R2 PASS
      const passed = groupStudents.filter((s) => compareCI(s.r2_result, "R2 PASS")).length;
      
      // R2 Failed = R2 FAIL
      const failed = groupStudents.filter((s) => compareCI(s.r2_result, "R2 FAIL")).length;
      
      rows.push({
        department,
        specialization,
        qualified,
        present,
        presentPct: qualified > 0 ? (present / qualified) * 100 : 0,
        absent,
        absentPct: qualified > 0 ? (absent / qualified) * 100 : 0,
        passed,
        passedPct: present > 0 ? (passed / present) * 100 : 0,
        failed,
        failedPct: present > 0 ? (failed / present) * 100 : 0,
      });
    }
  });

  rows.sort((a, b) => a.department.localeCompare(b.department) || a.specialization.localeCompare(b.specialization));

  const totals: DeptSpecRow = {
    department: "Total",
    specialization: "",
    qualified: rows.reduce((s, r) => s + r.qualified, 0),
    present: rows.reduce((s, r) => s + r.present, 0),
    presentPct: 0,
    absent: rows.reduce((s, r) => s + r.absent, 0),
    absentPct: 0,
    passed: rows.reduce((s, r) => s + r.passed, 0),
    passedPct: 0,
    failed: rows.reduce((s, r) => s + r.failed, 0),
    failedPct: 0,
  };
  totals.presentPct = totals.qualified > 0 ? (totals.present / totals.qualified) * 100 : 0;
  totals.absentPct = totals.qualified > 0 ? (totals.absent / totals.qualified) * 100 : 0;
  totals.passedPct = totals.present > 0 ? (totals.passed / totals.present) * 100 : 0;
  totals.failedPct = totals.present > 0 ? (totals.failed / totals.present) * 100 : 0;

  return { rows, totals };
}

export function computeBandDistribution(
  students: StudentRecord[],
  field: "coding_band" | "aptitude_band",
  presentOnly = true
) {
  const filtered = presentOnly ? students.filter((s) => compareCI(s.r1_attendance, "Present")) : students;
  const map = new Map<string, number>();
  filtered.forEach((s) => {
    const val = s[field];
    if (val) map.set(val, (map.get(val) || 0) + 1);
  });
  const total = filtered.length;
  return Array.from(map.entries())
    .map(([band, count]) => ({
      band,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => a.band.localeCompare(b.band));
}

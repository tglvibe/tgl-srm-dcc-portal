import { useMemo } from "react";
import type { StudentRecord } from "@/types/database";

export interface BandCount {
  band: string;
  count: number;
  percentage: number;
}

export interface CrossTab {
  codingBand: string;
  aptitude1: number;
  aptitude2: number;
  aptitude3: number;
  total: number;
}

export interface R2Analysis {
  band: string;
  count: number;
  percentage: number;
}

export interface CategoryAnalysis {
  category: string;
  oCount: number;
  oPercent: number;
  aCount: number;
  aPercent: number;
  eCount: number;
  ePercent: number;
}

export function useAnalytics(students: StudentRecord[]) {
  return useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.r1_attendance === "Present");
    const absent = students.filter((s) => s.r1_attendance === "Absent");

    // R1 Band distribution (including Absent)
    const r1BandMap = new Map<string, number>();
    r1BandMap.set("Absent", absent.length);
    present.forEach((s) => {
      if (s.r1_band) {
        r1BandMap.set(s.r1_band, (r1BandMap.get(s.r1_band) || 0) + 1);
      }
    });
    const r1BandDistribution: BandCount[] = Array.from(r1BandMap.entries())
      .map(([band, count]) => ({
        band,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => a.band.localeCompare(b.band));

    // Coding Band distribution (present only)
    const codingBandMap = new Map<string, number>();
    present.forEach((s) => {
      if (s.coding_band) {
        codingBandMap.set(s.coding_band, (codingBandMap.get(s.coding_band) || 0) + 1);
      }
    });
    const codingBandDistribution: BandCount[] = Array.from(codingBandMap.entries())
      .map(([band, count]) => ({
        band,
        count,
        percentage: present.length > 0 ? (count / present.length) * 100 : 0,
      }))
      .sort((a, b) => a.band.localeCompare(b.band));

    // Aptitude Band distribution (present only)
    const aptBandMap = new Map<string, number>();
    present.forEach((s) => {
      if (s.aptitude_band) {
        aptBandMap.set(s.aptitude_band, (aptBandMap.get(s.aptitude_band) || 0) + 1);
      }
    });
    const aptitudeBandDistribution: BandCount[] = Array.from(aptBandMap.entries())
      .map(([band, count]) => ({
        band,
        count,
        percentage: present.length > 0 ? (count / present.length) * 100 : 0,
      }))
      .sort((a, b) => a.band.localeCompare(b.band));

    // Cross-tabulation: Coding Band vs Aptitude Band
    const crossTab: CrossTab[] = [];
    const codingBands = Array.from(codingBandMap.keys()).sort();
    codingBands.forEach((cb) => {
      const studentsWithCB = present.filter((s) => s.coding_band === cb);
      crossTab.push({
        codingBand: cb,
        aptitude1: studentsWithCB.filter((s) => s.aptitude_band === ".1").length,
        aptitude2: studentsWithCB.filter((s) => s.aptitude_band === ".2").length,
        aptitude3: studentsWithCB.filter((s) => s.aptitude_band === ".3").length,
        total: studentsWithCB.length,
      });
    });

    // R2 Status distribution
    const r2Map = new Map<string, number>();
    students.forEach((s) => {
      const status = s.r2_status || "N/A";
      r2Map.set(status, (r2Map.get(status) || 0) + 1);
    });
    const r2Distribution: R2Analysis[] = Array.from(r2Map.entries())
      .map(([band, count]) => ({
        band,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => a.band.localeCompare(b.band));

    // R1 Result distribution
    const passCount = students.filter((s) => s.r1_result === "PASS").length;
    const failCount = present.length - passCount;

    // Department-wise breakdown
    const deptMap = new Map<string, { total: number; present: number; pass: number }>();
    students.forEach((s) => {
      const dept = s.department || "Unknown";
      const entry = deptMap.get(dept) || { total: 0, present: 0, pass: 0 };
      entry.total++;
      if (s.r1_attendance === "Present") entry.present++;
      if (s.r1_result === "PASS") entry.pass++;
      deptMap.set(dept, entry);
    });
    const departmentBreakdown = Array.from(deptMap.entries())
      .map(([dept, data]) => ({ department: dept, ...data }))
      .sort((a, b) => b.total - a.total);

    // Section-wise breakdown
    const sectionMap = new Map<string, number>();
    students.forEach((s) => {
      const sec = s.section || "Unknown";
      sectionMap.set(sec, (sectionMap.get(sec) || 0) + 1);
    });
    const sectionBreakdown = Array.from(sectionMap.entries())
      .map(([section, count]) => ({ section, count }))
      .sort((a, b) => a.section.localeCompare(b.section));

    // Specialization breakdown
    const specMap = new Map<string, number>();
    students.forEach((s) => {
      const spec = s.specialization || "Unknown";
      specMap.set(spec, (specMap.get(spec) || 0) + 1);
    });
    const specializationBreakdown = Array.from(specMap.entries())
      .map(([specialization, count]) => ({ specialization, count }))
      .sort((a, b) => b.count - a.count);

    // KPIs
    const kpis = {
      totalStudents: total,
      presentCount: present.length,
      absentCount: absent.length,
      attendanceRate: total > 0 ? ((present.length / total) * 100).toFixed(1) : "0",
      passCount,
      failCount,
      passRate: present.length > 0 ? ((passCount / present.length) * 100).toFixed(1) : "0",
      avgAptitudePercentage: present.length > 0
        ? (present.reduce((sum, s) => {
            const pct = parseFloat(s.aptitude_percentage?.replace("%", "") || "0");
            return sum + pct;
          }, 0) / present.length).toFixed(1)
        : "0",
      avgCodingPercentage: present.length > 0
        ? (present.reduce((sum, s) => {
            const pct = parseFloat(s.coding_percentage?.replace("%", "") || "0");
            return sum + pct;
          }, 0) / present.length).toFixed(1)
        : "0",
      uniqueDepartments: deptMap.size,
      uniqueSections: sectionMap.size,
      uniqueSpecializations: specMap.size,
    };

    return {
      kpis,
      r1BandDistribution,
      codingBandDistribution,
      aptitudeBandDistribution,
      crossTab,
      r2Distribution,
      departmentBreakdown,
      sectionBreakdown,
      specializationBreakdown,
    };
  }, [students]);
}

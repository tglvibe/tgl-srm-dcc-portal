import { useMemo } from "react";
import type { StudentRecord } from "@/types/database";

export interface ExtrapolatedBand {
  band: string;
  presentCount: number;
  presentPct: number;
  extrapolatedAbsent: number;
  totalProjected: number;
  totalPct: number;
}

export interface ExtrapolationResult {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  r1BandProjection: ExtrapolatedBand[];
  r2CategoryProjection?: ExtrapolatedBand[];
  codingBandProjection: ExtrapolatedBand[];
  aptitudeBandProjection: ExtrapolatedBand[];
  projectedPassCount: number;
  projectedFailCount: number;
  projectedPassRate: string;
  actualPassRate: string;
  projectedAvgAptitude: string;
  projectedAvgCoding: string;
  confidenceLevel: string;
  methodology: string;
}

export function useExtrapolation(students: StudentRecord[], options: { round?: "1" | "2" } = {}): ExtrapolationResult {
  const round = options.round || "1";
  return useMemo(() => {
    const total = students.length;
    const normalizeAttendance = (v: any) => (v === null || v === undefined ? "" : String(v).trim().toLowerCase());
    let present: StudentRecord[] = [];
    let absent: StudentRecord[] = [];
    if (round === "1") {
      present = students.filter(s => {
        const a = normalizeAttendance(s.r1_attendance);
        return a.includes("pres") || a === "p" || a === "present";
      });
      absent = students.filter(s => {
        const a = normalizeAttendance(s.r1_attendance);
        return a.includes("absen") || a === "a" || a === "absent";
      });
    } else {
      // Round 2 presence based on r2_status/result
      present = students.filter(s => {
        const r = s.r2_result ? String(s.r2_result).trim().toLowerCase() : "";
        // treat explicit R2 PASS/FAIL as present
        return r.includes("r2 pass") || r.includes("r2 fail") || (!!s.r2_status && !String(s.r2_status).toLowerCase().includes("absent") && !String(s.r2_status).toLowerCase().includes("pending"));
      });
      absent = students.filter(s => {
        const r = s.r2_result ? String(s.r2_result).trim().toLowerCase() : "";
        const status = s.r2_status ? String(s.r2_status).trim().toLowerCase() : "";
        return r.includes("r2-absent") || status.includes("r2-absent") || status.includes("absent");
      });
    }
    const pCount = present.length;
    const aCount = absent.length;

    // --- Extrapolation: apply present distribution ratios to absent count ---

    function extrapolateBands(
      getBand: (s: StudentRecord) => string | null
    ): ExtrapolatedBand[] {
      const bandMap = new Map<string, number>();
      // Use present as sample; if no present students, fall back to all students
      const sample = pCount > 0 ? present : students;
      sample.forEach(s => {
        const b = getBand(s);
        if (b) bandMap.set(b, (bandMap.get(b) || 0) + 1);
      });

      const sampleCount = sample.length;
      const bands = Array.from(bandMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      return bands.map(([band, count]) => {
        const presentPct = sampleCount > 0 ? (count / sampleCount) * 100 : 0;
        const extrapolatedAbsent = Math.round((presentPct / 100) * aCount);
        const totalProjected = count + extrapolatedAbsent;
        const totalPct = total > 0 ? (totalProjected / total) * 100 : 0;
        return { band, presentCount: count, presentPct, extrapolatedAbsent, totalProjected, totalPct };
      });
    }

    const r1BandProjection = extrapolateBands(s => s.r1_band);
    const codingBandProjection = extrapolateBands(s => s.coding_band);
    const aptitudeBandProjection = extrapolateBands(s => s.aptitude_band);
    // R2 category projection (if present)
    const r2CategoryProjection = extrapolateBands(s => (s.r2_category || s.r2_bands) as string | null);

    // Pass/fail extrapolation
    // Pass count depends on round
    const passCount = present.filter(s => {
      if (round === "1") {
        const r = s.r1_result ? String(s.r1_result).trim().toLowerCase() : "";
        return r === "pass" || r === "p" || r.startsWith("pass");
      }
      const r2 = s.r2_result ? String(s.r2_result).trim().toLowerCase() : "";
      return r2.includes("r2 pass") || r2.includes("pass") || r2 === "pass";
    }).length;
    const passRate = pCount > 0 ? passCount / pCount : 0;
    const projectedPassCount = passCount + Math.round(passRate * aCount);
    const projectedFailCount = total - projectedPassCount;

    // Average scores extrapolation (assume absent follow same distribution)
    const avgApt = pCount > 0
      ? present.reduce((s, st) => s + parseFloat(String(st.aptitude_percentage || "").replace("%", "") || "0"), 0) / pCount
      : (total > 0 ? students.reduce((s, st) => s + parseFloat(String(st.aptitude_percentage || "").replace("%", "") || "0"), 0) / (total || 1) : 0);
    const avgCod = pCount > 0
      ? present.reduce((s, st) => s + parseFloat(String(st.coding_percentage || "").replace("%", "") || "0"), 0) / pCount
      : (total > 0 ? students.reduce((s, st) => s + parseFloat(String(st.coding_percentage || "").replace("%", "") || "0"), 0) / (total || 1) : 0);

    // Confidence: based on sample size (present/total ratio)
    const sampleRatio = pCount / (total || 1);
    const confidenceLevel = sampleRatio >= 0.6 ? "High" : sampleRatio >= 0.4 ? "Medium" : "Low";

    const methodology = `Proportional extrapolation (${round === "1" ? "R1" : "R2"}): Present student distributions (n=${pCount}) projected onto ${aCount} absentees. If no present students are available, distribution falls back to full batch. Assumes absentees follow similar performance patterns. Confidence: ${confidenceLevel} (${(sampleRatio * 100).toFixed(0)}% sample).`;

    return {
      totalStudents: total,
      presentCount: pCount,
      absentCount: aCount,
      r1BandProjection,
      r2CategoryProjection,
      codingBandProjection,
      aptitudeBandProjection,
      projectedPassCount,
      projectedFailCount,
      projectedPassRate: total > 0 ? ((projectedPassCount / total) * 100).toFixed(1) : "0",
      actualPassRate: pCount > 0 ? ((passCount / pCount) * 100).toFixed(1) : "0",
      projectedAvgAptitude: isFinite(avgApt) ? avgApt.toFixed(1) : "0",
      projectedAvgCoding: isFinite(avgCod) ? avgCod.toFixed(1) : "0",
      confidenceLevel,
      methodology,
    };
  }, [students, round]);
}

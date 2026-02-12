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

export function useExtrapolation(students: StudentRecord[]): ExtrapolationResult {
  return useMemo(() => {
    const total = students.length;
    const present = students.filter(s => s.r1_attendance === "Present");
    const absent = students.filter(s => s.r1_attendance === "Absent");
    const pCount = present.length;
    const aCount = absent.length;

    // --- Extrapolation: apply present distribution ratios to absent count ---

    function extrapolateBands(
      getBand: (s: StudentRecord) => string | null
    ): ExtrapolatedBand[] {
      const bandMap = new Map<string, number>();
      present.forEach(s => {
        const b = getBand(s);
        if (b) bandMap.set(b, (bandMap.get(b) || 0) + 1);
      });

      const bands = Array.from(bandMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      return bands.map(([band, count]) => {
        const presentPct = pCount > 0 ? (count / pCount) * 100 : 0;
        const extrapolatedAbsent = Math.round((presentPct / 100) * aCount);
        const totalProjected = count + extrapolatedAbsent;
        const totalPct = total > 0 ? (totalProjected / total) * 100 : 0;
        return { band, presentCount: count, presentPct, extrapolatedAbsent, totalProjected, totalPct };
      });
    }

    const r1BandProjection = extrapolateBands(s => s.r1_band);
    const codingBandProjection = extrapolateBands(s => s.coding_band);
    const aptitudeBandProjection = extrapolateBands(s => s.aptitude_band);

    // Pass/fail extrapolation
    const passCount = present.filter(s => s.r1_result === "PASS").length;
    const passRate = pCount > 0 ? passCount / pCount : 0;
    const projectedPassCount = passCount + Math.round(passRate * aCount);
    const projectedFailCount = total - projectedPassCount;

    // Average scores extrapolation (assume absent follow same distribution)
    const avgApt = pCount > 0
      ? present.reduce((s, st) => s + parseFloat(st.aptitude_percentage?.replace("%", "") || "0"), 0) / pCount
      : 0;
    const avgCod = pCount > 0
      ? present.reduce((s, st) => s + parseFloat(st.coding_percentage?.replace("%", "") || "0"), 0) / pCount
      : 0;

    // Confidence: based on sample size (present/total ratio)
    const sampleRatio = pCount / (total || 1);
    const confidenceLevel = sampleRatio >= 0.6 ? "High" : sampleRatio >= 0.4 ? "Medium" : "Low";

    return {
      totalStudents: total,
      presentCount: pCount,
      absentCount: aCount,
      r1BandProjection,
      codingBandProjection,
      aptitudeBandProjection,
      projectedPassCount,
      projectedFailCount,
      projectedPassRate: (passRate * 100).toFixed(1),
      actualPassRate: pCount > 0 ? ((passCount / pCount) * 100).toFixed(1) : "0",
      projectedAvgAptitude: avgApt.toFixed(1),
      projectedAvgCoding: avgCod.toFixed(1),
      confidenceLevel,
      methodology: `Proportional extrapolation: Present student distributions (n=${pCount}) projected onto ${aCount} absentees. Assumes absentees follow similar performance patterns. Confidence: ${confidenceLevel} (${(sampleRatio * 100).toFixed(0)}% sample).`,
    };
  }, [students]);
}

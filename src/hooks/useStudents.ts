import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { StudentRecord } from "@/types/database";
import { YEAR_YOP_MAP } from "@/types/database";

const PAGE_SIZE = 1000;

// Simple in-memory cache to avoid re-fetching the entire table on every render/click.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const studentsCache = new Map<
  string,
  { ts: number; students: StudentRecord[]; totalCount: number }
>();

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && key && !url.includes("placeholder") && !key.includes("placeholder");
};

const toNumber = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.-]+/g, ""));
  return Number.isNaN(n) ? null : n;
};

const ensurePct = (v: any) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.endsWith("%") ? s : `${s}%`;
};

const normalizeStr = (v: any) => {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  s = s.replace(/^=+/, "").replace(/^\"|\"$/g, "").trim();
  return s === "" ? null : s;
};

interface UseStudentsOptions {
  year?: string;
  department?: string;
  section?: string;
  search?: string;
  r1Attendance?: string;
  r1Result?: string;
}

interface UseStudentsReturn {
  students: StudentRecord[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => void;
}

export function useStudents(options: UseStudentsOptions = {}): UseStudentsReturn {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // No mock data: if Supabase is not configured, we stop with an error state
  const mockFiltered = null;

  const fetchAllStudents = useCallback(async () => {
    // If Supabase isn't configured, bail out with an informative error (no mock data)
    if (!isSupabaseConfigured()) {
      setError("Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
      setStudents([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Try cache first
    try {
      const key = JSON.stringify(options || {});
      const cached = studentsCache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        setStudents(cached.students);
        setTotalCount(cached.totalCount);
        setLoading(false);
        return;
      }
    } catch (e) {
      // ignore cache errors and continue fetching
    }

    try {
      let countQuery = supabase
        .from("staging_student_assessments")
        .select("*", { count: "exact", head: true });

      if (options.year) {
        const yop = YEAR_YOP_MAP[options.year as keyof typeof YEAR_YOP_MAP];
        if (yop) countQuery = countQuery.eq("yop", String(yop));
      }
      if (options.department) countQuery = countQuery.eq("department", options.department);
      if (options.section) countQuery = countQuery.eq("section", options.section);
      if (options.r1Attendance) countQuery = countQuery.eq("r1_attendance", options.r1Attendance);
      if (options.r1Result) countQuery = countQuery.eq("r1_result", options.r1Result);
      if (options.search) {
        countQuery = countQuery.or(
          `student_name.ilike.%${options.search}%,registration_number.ilike.%${options.search}%,email.ilike.%${options.search}%`
        );
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      const total = count || 0;
      setTotalCount(total);

      const allRecords: StudentRecord[] = [];

      // Cursor-based pagination (efficient for large tables)
      let lastId: number | null = null;
      while (true) {
        let query = supabase
          .from("staging_student_assessments")
          .select("*")
          .order("id", { ascending: true })
          .limit(PAGE_SIZE);

        if (lastId) query = query.gt("id", lastId);

        if (options.year) {
          const yop = YEAR_YOP_MAP[options.year as keyof typeof YEAR_YOP_MAP];
          if (yop) query = query.eq("yop", String(yop));
        }
        if (options.department) query = query.eq("department", options.department);
        if (options.section) query = query.eq("section", options.section);
        if (options.r1Attendance) query = query.eq("r1_attendance", options.r1Attendance);
        if (options.r1Result) query = query.eq("r1_result", options.r1Result);
        if (options.search) {
          query = query.or(
            `student_name.ilike.%${options.search}%,registration_number.ilike.%${options.search}%,email.ilike.%${options.search}%`
          );
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        if (data && (data as any[]).length > 0) {
          // Map DB rows to StudentRecord shape used by the UI
          const mapped = (data as any[]).map((r) => {
            const toNumber = (v: any) => {
              if (v === null || v === undefined || v === "") return null;
              const n = Number(String(v).replace(/[^0-9.-]+/g, ""));
              return Number.isNaN(n) ? null : n;
            };

            const ensurePct = (v: any) => {
              if (v === null || v === undefined) return null;
              const s = String(v).trim();
              return s.endsWith("%") ? s : `${s}%`;
            };

            const normalizeStr = (v: any) => {
              if (v === null || v === undefined) return null;
              let s = String(v).trim();
              // remove any leading '=' or stray quotes
              s = s.replace(/^=+/, "").replace(/^\"|\"$/g, "").trim();
              return s === "" ? null : s;
            };

            // derive year label from yop if mapping exists
            let yearLabel: string | null = null;
            try {
              const yopVal = r.yop ? String(r.yop).trim() : null;
              if (yopVal) {
                const numeric = Number(yopVal);
                for (const k of Object.keys(YEAR_YOP_MAP)) {
                  if (YEAR_YOP_MAP[k as keyof typeof YEAR_YOP_MAP] === numeric) {
                    yearLabel = k;
                    break;
                  }
                }
              }
            } catch (e) {
              yearLabel = null;
            }

            return {
              id: Number(r.id),
              s_no: r.id,
              program: r.program || null,
              yop: r.yop || null,
              year: yearLabel,
              registration_number: r.registration_number,
              student_name: r.student_name,
              email: r.email || null,
              department: r.department || null,
              specialization: r.specialization || null,
              section: r.section || null,
              r1_attendance: r.r1_attendance || null,
              aptitude_score: toNumber(r.aptitude_score),
              aptitude_max: toNumber(r.aptitude_max),
              aptitude_percentage: ensurePct(r.aptitude_percentage),
              coding_gained: toNumber(r.coding_gained),
              coding_max: toNumber(r.coding_max),
              coding_percentage: ensurePct(r.coding_percentage),
              aptitude_band: normalizeStr(r.aptitude_band),
              coding_band: normalizeStr(r.coding_band),
              r1_band: normalizeStr(r.r1_band),
              r1_result: normalizeStr(r.r1_result),
              r2_status: normalizeStr(r.r2_status),
              r2_bands: normalizeStr(r.r2_bands ?? r.r2_band),
              r2_result: normalizeStr(r.r2_result),
              r2_category: normalizeStr(r.r2_category),
              overall_category: normalizeStr(r.overall_category),
            } as StudentRecord;
          });

          allRecords.push(...mapped);

          // set lastId to the last row's id for next cursor
          const lastRow = (data as any[])[(data as any[]).length - 1];
          lastId = lastRow?.id ?? null;

          // if returned less than page size, we've reached the end
          if ((data as any[]).length < PAGE_SIZE) break;
        } else {
          break;
        }
      }

      setStudents(allRecords);

      // store in cache
      try {
        const key = JSON.stringify(options || {});
        studentsCache.set(key, { ts: Date.now(), students: allRecords, totalCount: total });
      } catch (e) {
        // ignore cache set errors
      }
    } catch (err: any) {
      console.error("Failed to fetch students:", err);
      setError(err.message || "Failed to fetch student data");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [options.year, options.department, options.section, options.search, options.r1Attendance, options.r1Result, mockFiltered]);

  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  // Real-time subscription (only when Supabase is configured)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel("staging-students-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staging_student_assessments" },
        () => {
          // Invalidate cache on DB changes and refresh
          try { studentsCache.clear(); } catch (e) { /* ignore */ }
          fetchAllStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllStudents]);

  return { students, loading, error, totalCount, refetch: fetchAllStudents };
}

// Hook for single student
export function useStudent(registrationNumber: string) {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationNumber) return;

    if (!isSupabaseConfigured()) {
      setError("Supabase not configured — cannot lookup student");
      setStudent(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("staging_student_assessments")
        .select("*")
        .eq("registration_number", registrationNumber)
        .single();

      if (err) {
        setError(err.message);
        setStudent(null);
      } else if (data) {
        // map row
        const r: any = data;
        const toNumber = (v: any) => {
          if (v === null || v === undefined || v === "") return null;
          const n = Number(String(v).replace(/[^0-9.-]+/g, ""));
          return Number.isNaN(n) ? null : n;
        };
        const ensurePct = (v: any) => {
          if (v === null || v === undefined) return null;
          const s = String(v).trim();
          return s.endsWith("%") ? s : `${s}%`;
        };

        let yearLabel: string | null = null;
        try {
          const yopVal = r.yop ? String(r.yop).trim() : null;
          if (yopVal) {
            const numeric = Number(yopVal);
            for (const k of Object.keys(YEAR_YOP_MAP)) {
              if ((YEAR_YOP_MAP as any)[k] === numeric) {
                yearLabel = k;
                break;
              }
            }
          }
        } catch (e) {
          yearLabel = null;
        }

        const mapped: StudentRecord = {
          id: Number(r.id),
          s_no: r.id,
          program: r.program || null,
          yop: r.yop || null,
          year: yearLabel,
          registration_number: r.registration_number,
          student_name: r.student_name,
          email: r.email || null,
          department: r.department || null,
          specialization: r.specialization || null,
          section: r.section || null,
          r1_attendance: r.r1_attendance || null,
          aptitude_score: toNumber(r.aptitude_score),
          aptitude_max: toNumber(r.aptitude_max),
          aptitude_percentage: ensurePct(r.aptitude_percentage),
          coding_gained: toNumber(r.coding_gained),
          coding_max: toNumber(r.coding_max),
          coding_percentage: ensurePct(r.coding_percentage),
          aptitude_band: normalizeStr(r.aptitude_band),
          coding_band: normalizeStr(r.coding_band),
          r1_band: normalizeStr(r.r1_band),
          r1_result: normalizeStr(r.r1_result),
          r2_status: normalizeStr(r.r2_status),
          r2_bands: normalizeStr(r.r2_bands ?? r.r2_band),
          r2_result: normalizeStr(r.r2_result),
          r2_category: normalizeStr(r.r2_category),
          overall_category: normalizeStr(r.overall_category),
        };

        setStudent(mapped);
      } else {
        setStudent(null);
      }
      setLoading(false);
    };

    fetch();

    // Real-time for this student
    const channel = supabase
      .channel(`student-${registrationNumber}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "staging_student_assessments",
          filter: `registration_number=eq.${registrationNumber}`,
        },
        (payload) => {
          const r = payload.new;
          if (!r) return;
          const mapped: StudentRecord = {
            id: Number(r.id),
            s_no: r.id,
            program: r.program || null,
            yop: r.yop || null,
            year: null,
            registration_number: r.registration_number,
            student_name: r.student_name,
            email: r.email || null,
            department: r.department || null,
            specialization: r.specialization || null,
            section: r.section || null,
            r1_attendance: r.r1_attendance || null,
            aptitude_score: toNumber(r.aptitude_score),
            aptitude_max: toNumber(r.aptitude_max),
            aptitude_percentage: ensurePct(r.aptitude_percentage),
            coding_gained: toNumber(r.coding_gained),
            coding_max: toNumber(r.coding_max),
            coding_percentage: ensurePct(r.coding_percentage),
            aptitude_band: normalizeStr(r.aptitude_band),
            coding_band: normalizeStr(r.coding_band),
            r1_band: normalizeStr(r.r1_band),
            r1_result: normalizeStr(r.r1_result),
            r2_status: normalizeStr(r.r2_status),
            r2_bands: normalizeStr(r.r2_bands ?? r.r2_band),
            r2_result: normalizeStr(r.r2_result),
            r2_category: normalizeStr(r.r2_category),
            overall_category: normalizeStr(r.overall_category),
          };
          setStudent(mapped);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [registrationNumber]);

  return { student, loading, error };
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { StudentRecord } from "@/types/database";

const PAGE_SIZE = 1000;

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

  const fetchAllStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First get total count
      let countQuery = supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (options.year) countQuery = countQuery.eq("year", options.year);
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

      // Fetch in batches of PAGE_SIZE
      const allRecords: StudentRecord[] = [];
      const pages = Math.ceil(total / PAGE_SIZE);

      for (let page = 0; page < pages; page++) {
        let query = supabase
          .from("students")
          .select("*")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
          .order("s_no", { ascending: true });

        if (options.year) query = query.eq("year", options.year);
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
        if (data) allRecords.push(...(data as StudentRecord[]));
      }

      setStudents(allRecords);
    } catch (err: any) {
      console.error("Failed to fetch students:", err);
      setError(err.message || "Failed to fetch student data");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [options.year, options.department, options.section, options.search, options.r1Attendance, options.r1Result]);

  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("students-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        () => {
          // Refetch on any change
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

    const fetch = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("students")
        .select("*")
        .eq("registration_number", registrationNumber)
        .single();

      if (err) {
        setError(err.message);
        setStudent(null);
      } else {
        setStudent(data as StudentRecord);
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
          table: "students",
          filter: `registration_number=eq.${registrationNumber}`,
        },
        (payload) => {
          setStudent(payload.new as StudentRecord);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [registrationNumber]);

  return { student, loading, error };
}

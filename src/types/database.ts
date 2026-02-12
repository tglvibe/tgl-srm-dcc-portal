export interface StudentRecord {
  id: number;
  s_no: number;
  program: string;
  year: string; // "First", "Second", "Third", "Fourth"
  registration_number: string;
  student_name: string;
  email: string;
  department: string;
  specialization: string;
  section: string;
  r1_attendance: string; // "Present" | "Absent"
  aptitude_score: number | null;
  aptitude_max: number | null;
  aptitude_percentage: string | null; // e.g. "58%"
  coding_gained: number | null;
  coding_max: number | null;
  coding_percentage: string | null;
  aptitude_band: string | null; // ".1", ".2", ".3"
  coding_band: string | null; // "C1"–"C6"
  r1_band: string | null; // e.g. "C2.2"
  r1_result: string | null; // "PASS" | "FAIL"
  r2_status: string | null; // e.g. "C2.1", "R2-ABSENT", "R2-PENDING"
}

export interface Database {
  public: {
    Tables: {
      students: {
        Row: StudentRecord;
        Insert: Omit<StudentRecord, "id">;
        Update: Partial<Omit<StudentRecord, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Year mapping for filters
export const YEAR_YOP_MAP: Record<string, number> = {
  First: 2029,
  Second: 2028,
  Third: 2027,
  Fourth: 2026,
};

export const YEAR_OPTIONS = [
  { value: "First", label: "First Year", yop: 2029 },
  { value: "Second", label: "Second Year", yop: 2028 },
  { value: "Third", label: "Third Year", yop: 2027 },
  { value: "Fourth", label: "Fourth Year", yop: 2026 },
];

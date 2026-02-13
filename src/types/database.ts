export interface StudentRecord {
  id: number;
  // original DB identity / sequence number
  s_no?: number;
  // program and year/yop from DB
  program?: string | null;
  yop?: string | null; // year of passing (as stored in DB)
  year?: string | null; // derived label (First/Second/Third/Fourth) if available
  registration_number: string;
  student_name: string;
  email?: string | null;
  department?: string | null;
  specialization?: string | null;
  section?: string | null;
  r1_attendance?: string | null; // "Present" | "Absent"
  aptitude_score?: number | null;
  aptitude_max?: number | null;
  aptitude_percentage?: string | null; // e.g. "58%"
  coding_gained?: number | null;
  coding_max?: number | null;
  coding_percentage?: string | null;
  aptitude_band?: string | null; // ".1", ".2", ".3"
  coding_band?: string | null; // "C1"–"C6"
  r1_band?: string | null; // e.g. "C2.2"
  r1_result?: string | null; // "PASS" | "FAIL"
  r2_status?: string | null; // e.g. "C2.1", "R2-ABSENT", "R2-PENDING"
  r2_bands?: string | null; // R2 performance bands (e.g., "T3", "High Potential", etc.)
  r2_result?: string | null;
  r2_category?: string | null;
  overall_category?: string | null; // "HCE" | "LCE" | "NCE" | "UNRATED"
}

export interface Database {
  public: {
    Tables: {
      students: {
        Row: StudentRecord;
        Insert: Omit<StudentRecord, "id">;
        Update: Partial<Omit<StudentRecord, "id">>;
      };
      staging_student_assessments: {
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

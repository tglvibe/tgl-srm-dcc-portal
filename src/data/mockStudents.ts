import type { StudentRecord } from "@/types/database";

// Helper to generate realistic mock data
function generateStudents(): StudentRecord[] {
  const departments = ["C.Tech", "ECE", "Mech", "Civil", "EEE", "IT", "AIDS", "AIML", "CSE-BS", "Biotech"];
  const specializations = ["CSE", "CSE-AI", "CSE-DS", "CSE-Cyber", "ECE", "Mech", "Civil", "EEE", "IT", "AIDS", "AIML", "Biotech"];
  const sections = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2"];
  const years: Array<"First" | "Second" | "Third" | "Fourth"> = ["First", "Second", "Third", "Fourth"];
  const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Sai", "Arnav", "Dhruv", "Kabir", "Ananya", "Diya", "Saanvi", "Isha", "Myra", "Priya", "Riya", "Neha", "Kavya", "Tanya", "Saswata", "Rohit", "Amit", "Deepak", "Suresh", "Rajesh", "Vikram", "Karthik", "Harsha", "Pranav"];
  const lastNames = ["Thakur", "Sharma", "Patel", "Kumar", "Singh", "Reddy", "Nair", "Iyer", "Das", "Gupta", "Joshi", "Mishra", "Rao", "Verma", "Shah", "Mehta", "Pillai", "Menon", "Bhat", "Chopra"];

  const aptitudeMax = 40;
  const codingMax = 48;
  const r1Bands = ["C1.1", "C1.2", "C1.3", "C2.1", "C2.2", "C2.3", "C3.1", "C3.2", "C3.3", "C4.1", "C4.2", "C4.3", "C5.1", "C5.2", "C5.3", "C6.1", "C6.2", "C6.3"];
  const codingBands = ["C1", "C2", "C3", "C4", "C5", "C6"];
  const aptitudeBands = [".1", ".2", ".3"];
  const r2Statuses = ["C2.1", "C2.2", "C3", "C4", "C5", "C6", "R2-ABSENT", "R2-PENDING"];

  // Distribution weights matching the provided analytics
  const r1BandWeights: Record<string, number> = {
    "C1.1": 28, "C1.2": 23, "C1.3": 17, "C2.1": 29, "C2.2": 60, "C2.3": 39,
    "C3.1": 38, "C3.2": 84, "C3.3": 63, "C4.1": 47, "C4.2": 139, "C4.3": 132,
    "C5.1": 56, "C5.2": 196, "C5.3": 159, "C6.1": 70, "C6.2": 361, "C6.3": 610,
  };

  function weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  function pickR1Band(): string {
    return weightedRandom(
      Object.keys(r1BandWeights),
      Object.values(r1BandWeights)
    );
  }

  const students: StudentRecord[] = [];
  let id = 1;

  for (const year of years) {
    const yearCount = year === "First" ? 5832 : year === "Second" ? 800 : year === "Third" ? 600 : 400;
    const absentRate = year === "First" ? 0.63 : 0.55;

    for (let i = 0; i < yearCount; i++) {
      const isPresent = Math.random() > absentRate;
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const spec = specializations[Math.floor(Math.random() * specializations.length)];
      const section = sections[Math.floor(Math.random() * sections.length)];
      const regNum = `RA25${Math.floor(10000000000 + Math.random() * 90000000000)}`;

      let aptScore: number | null = null;
      let codScore: number | null = null;
      let aptPct: string | null = null;
      let codPct: string | null = null;
      let aptBand: string | null = null;
      let codBand: string | null = null;
      let r1Band: string | null = null;
      let r1Result: string | null = null;
      let r2Status: string | null = null;

      if (isPresent) {
        aptScore = Math.floor(Math.random() * (aptitudeMax + 1));
        codScore = Math.floor(Math.random() * (codingMax + 1));
        aptPct = `${Math.round((aptScore / aptitudeMax) * 100)}%`;
        codPct = `${Math.round((codScore / codingMax) * 100)}%`;

        const aptPctNum = (aptScore / aptitudeMax) * 100;
        aptBand = aptPctNum >= 70 ? ".1" : aptPctNum >= 40 ? ".2" : ".3";

        const codPctNum = (codScore / codingMax) * 100;
        codBand = codPctNum >= 90 ? "C1" : codPctNum >= 75 ? "C2" : codPctNum >= 60 ? "C3" : codPctNum >= 45 ? "C4" : codPctNum >= 25 ? "C5" : "C6";

        r1Band = pickR1Band();
        r1Result = ["C1", "C2", "C3", "C4"].includes(codBand) ? "PASS" : "FAIL";

        if (r1Result === "PASS") {
          r2Status = weightedRandom(
            ["C2.1", "C2.2", "C3", "C4", "C5", "C6", "R2-ABSENT", "R2-PENDING"],
            [34, 60, 59, 8, 10, 19, 121, 388]
          );
        }
      }

      students.push({
        id,
        s_no: id,
        program: "B.Tech",
        year,
        registration_number: regNum,
        student_name: name,
        email: `${firstName.toLowerCase()}${id}@srmist.edu.in`,
        department: dept,
        specialization: spec,
        section,
        r1_attendance: isPresent ? "Present" : "Absent",
        aptitude_score: aptScore,
        aptitude_max: isPresent ? aptitudeMax : null,
        aptitude_percentage: aptPct,
        coding_gained: codScore,
        coding_max: isPresent ? codingMax : null,
        coding_percentage: codPct,
        aptitude_band: aptBand,
        coding_band: codBand,
        r1_band: r1Band,
        r1_result: r1Result,
        r2_status: r2Status,
      });

      id++;
    }
  }

  // Ensure the demo student exists (matches auth credentials)
  students[0] = {
    id: 1,
    s_no: 1,
    program: "B.Tech",
    year: "First",
    registration_number: "RA2511003011512",
    student_name: "Saswata Thakur",
    email: "st1540@srmist.edu.in",
    department: "C.Tech",
    specialization: "CSE",
    section: "D2",
    r1_attendance: "Present",
    aptitude_score: 23,
    aptitude_max: 40,
    aptitude_percentage: "58%",
    coding_gained: 37,
    coding_max: 48,
    coding_percentage: "77%",
    aptitude_band: ".2",
    coding_band: "C2",
    r1_band: "C2.2",
    r1_result: "PASS",
    r2_status: "C2.1",
  };

  return students;
}

// Generate once and cache
let _cachedStudents: StudentRecord[] | null = null;

export function getMockStudents(): StudentRecord[] {
  if (!_cachedStudents) {
    _cachedStudents = generateStudents();
  }
  return _cachedStudents;
}

export const MOCK_STUDENTS = [
  { id: "1", regNumber: "RA2211003010234", name: "Arjun Sharma", email: "arjun@srmist.edu.in", department: "Computer Science", year: 3, techBand: "C1", assessmentBand: "C2", employabilityScore: 76, placementStatus: "Placed", highestPackage: 12.5, activePrograms: 3, lastUpdate: "2026-02-10", r1aAptitude: { score: 72, band: "C2" }, r1bCoding: { score: 80, band: "C1" }, r1Overall: "C2", r2InPerson: "C1" },
  { id: "2", regNumber: "RA2211003010112", name: "Sneha Patel", email: "sneha@srmist.edu.in", department: "Computer Science", year: 4, techBand: "B", assessmentBand: "C1", employabilityScore: 84, placementStatus: "Multiple Offers", highestPackage: 18.0, activePrograms: 2, lastUpdate: "2026-02-09", r1aAptitude: { score: 88, band: "B" }, r1bCoding: { score: 85, band: "C1" }, r1Overall: "C1", r2InPerson: "B" },
  { id: "3", regNumber: "RA2211003010456", name: "Ravi Kumar", email: "ravi@srmist.edu.in", department: "Information Technology", year: 3, techBand: "C2", assessmentBand: "D1", employabilityScore: 52, placementStatus: "Not Placed", highestPackage: 0, activePrograms: 4, lastUpdate: "2026-02-08", r1aAptitude: { score: 45, band: "D1" }, r1bCoding: { score: 50, band: "D1" }, r1Overall: "D1", r2InPerson: "—" },
  { id: "4", regNumber: "RA2211003010789", name: "Meera Iyer", email: "meera@srmist.edu.in", department: "Electronics", year: 4, techBand: "C1", assessmentBand: "C1", employabilityScore: 71, placementStatus: "Offer Received", highestPackage: 8.5, activePrograms: 1, lastUpdate: "2026-02-11", r1aAptitude: { score: 70, band: "C1" }, r1bCoding: { score: 75, band: "C1" }, r1Overall: "C1", r2InPerson: "C2" },
  { id: "5", regNumber: "RA2211003010321", name: "Vikram Singh", email: "vikram@srmist.edu.in", department: "Computer Science", year: 2, techBand: "D1", assessmentBand: "D2", employabilityScore: 38, placementStatus: "Not Placed", highestPackage: 0, activePrograms: 5, lastUpdate: "2026-02-07", r1aAptitude: { score: 35, band: "D2" }, r1bCoding: { score: 30, band: "D2" }, r1Overall: "D2", r2InPerson: "—" },
  { id: "6", regNumber: "RA2211003010654", name: "Ananya Rao", email: "ananya@srmist.edu.in", department: "Mechanical", year: 3, techBand: "C2", assessmentBand: "C2", employabilityScore: 63, placementStatus: "Not Placed", highestPackage: 0, activePrograms: 2, lastUpdate: "2026-02-06", r1aAptitude: { score: 60, band: "C2" }, r1bCoding: { score: 58, band: "C2" }, r1Overall: "C2", r2InPerson: "—" },
  { id: "7", regNumber: "RA2211003010987", name: "Karthik Menon", email: "karthik@srmist.edu.in", department: "Information Technology", year: 4, techBand: "B", assessmentBand: "B", employabilityScore: 91, placementStatus: "Placed", highestPackage: 24.0, activePrograms: 1, lastUpdate: "2026-02-10", r1aAptitude: { score: 92, band: "B" }, r1bCoding: { score: 95, band: "B" }, r1Overall: "B", r2InPerson: "B" },
  { id: "8", regNumber: "RA2211003010135", name: "Divya Nair", email: "divya@srmist.edu.in", department: "Computer Science", year: 3, techBand: "C1", assessmentBand: "C2", employabilityScore: 68, placementStatus: "Offer Received", highestPackage: 10.0, activePrograms: 3, lastUpdate: "2026-02-09", r1aAptitude: { score: 65, band: "C2" }, r1bCoding: { score: 70, band: "C1" }, r1Overall: "C2", r2InPerson: "C1" },
  { id: "9", regNumber: "RA2211003010246", name: "Aditya Joshi", email: "aditya@srmist.edu.in", department: "Electronics", year: 2, techBand: "D1", assessmentBand: "D1", employabilityScore: 45, placementStatus: "Not Placed", highestPackage: 0, activePrograms: 4, lastUpdate: "2026-02-05", r1aAptitude: { score: 42, band: "D1" }, r1bCoding: { score: 40, band: "D1" }, r1Overall: "D1", r2InPerson: "—" },
  { id: "10", regNumber: "RA2211003010579", name: "Priyanka Das", email: "priyanka@srmist.edu.in", department: "Computer Science", year: 4, techBand: "C1", assessmentBand: "C1", employabilityScore: 79, placementStatus: "Placed", highestPackage: 14.0, activePrograms: 2, lastUpdate: "2026-02-11", r1aAptitude: { score: 78, band: "C1" }, r1bCoding: { score: 82, band: "C1" }, r1Overall: "C1", r2InPerson: "C1" },
];

export const MOCK_KPI = {
  totalStudents: 20147,
  studentsPlaced: 8234,
  placementRate: 40.9,
  avgEmployability: 64.1,
  activePrograms: 47,
  pendingApprovals: 12,
  assessmentCompletion: 78.3,
  avgPackage: 8.7,
  highestPackage: { value: 42.0, name: "Karthik Menon" },
};

export const MOCK_ATTENDANCE_QUEUE = [
  { id: "ATT001", program: "Data Science Bootcamp", session: "Session 12", date: "2026-02-10", studentCount: 45, validatedBy: null, status: "pending" as const },
  { id: "ATT002", program: "Java Full Stack Workshop", session: "Session 8", date: "2026-02-09", studentCount: 38, validatedBy: null, status: "pending" as const },
  { id: "ATT003", program: "Cloud Computing Virtual Class", session: "Session 15", date: "2026-02-08", studentCount: 52, validatedBy: "Rahul Verma", status: "validated" as const },
  { id: "ATT004", program: "Python ML Bootcamp", session: "Session 6", date: "2026-02-07", studentCount: 41, validatedBy: "Rahul Verma", status: "approved" as const },
];

export const PLACEMENT_CHART_DATA = [
  { name: "CSE", placed: 3200, total: 6500 },
  { name: "IT", placed: 1800, total: 4200 },
  { name: "ECE", placed: 1400, total: 3800 },
  { name: "MECH", placed: 900, total: 3200 },
  { name: "CIVIL", placed: 500, total: 2447 },
];

export const BAND_DISTRIBUTION = [
  { band: "B", count: 1200 },
  { band: "C1", count: 4500 },
  { band: "C2", count: 6800 },
  { band: "D1", count: 4900 },
  { band: "D2", count: 2747 },
];

export const SCORE_TREND = [
  { month: "Sep", score: 58 },
  { month: "Oct", score: 60 },
  { month: "Nov", score: 61 },
  { month: "Dec", score: 62 },
  { month: "Jan", score: 63 },
  { month: "Feb", score: 64.1 },
];

export const SKILLS_LIST = [
  "Java", "Python", "JavaScript", "TypeScript", "React", "Angular", "Node.js", "Spring Boot",
  "Django", "Flask", "SQL", "MongoDB", "PostgreSQL", "AWS", "Azure", "Docker", "Kubernetes",
  "TensorFlow", "PyTorch", "Machine Learning", "Data Science", "REST API", "GraphQL",
  "Git", "CI/CD", "Linux", "C++", "Go", "Rust", "Swift", "Kotlin", "Flutter", "React Native",
];

import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import { YEAR_YOP_MAP } from "@/types/database";
import LoadingState from "@/components/LoadingState";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  isActive, PIE_COLORS,
  computeDeptSpecTable, computeBandDistribution,
  computeR2Categories,
} from "@/lib/analyticsUtils";

export default function ReportPage() {
  const [searchParams] = useSearchParams();
  const year = searchParams.get("year") || "all";
  const round = (searchParams.get("round") || "1") as "1" | "2";
  const [bw, setBw] = useState(false);

  const { students: allStudents, loading } = useStudents(
    year !== "all" ? { year } : {}
  );

  // Apply dept/spec filters from params
  const students = useMemo(() => {
    let data = allStudents;
    const deptParam = searchParams.get("dept");
    const specParam = searchParams.get("spec");
    if (deptParam) {
      const depts = deptParam.split(",").filter(Boolean);
      if (depts.length > 0) data = data.filter((s) => depts.includes(s.department));
    }
    if (specParam) {
      const specs = specParam.split(",").filter(Boolean);
      if (specs.length > 0) data = data.filter((s) => specs.includes(s.specialization));
    }
    return data;
  }, [allStudents, searchParams]);

  const total = students.length;
  const activeCount = students.filter(isActive).length;
  const inactiveCount = total - activeCount;
  const { rows, totals } = useMemo(() => computeDeptSpecTable(students, round), [students, round]);
  const codingBands = useMemo(() => computeBandDistribution(students, "coding_band"), [students]);
  const aptitudeBands = useMemo(() => computeBandDistribution(students, "aptitude_band"), [students]);
  const r2Categories = useMemo(() => computeR2Categories(students), [students]);
  const hasR2 = students.some((s) => s.r2_status != null);

  const presentStudents = students.filter((s) => s.r1_attendance === "Present");
  const attendancePie = [
    { name: "Present", value: presentStudents.length },
    { name: "Absent", value: total - presentStudents.length },
  ];
  const resultPie = [
    { name: "Passed", value: totals.passed },
    { name: "Failed", value: totals.failed },
  ];

  const yearLabel = year === "all" ? "All Years" : `Year ${year === "First" ? "1" : year === "Second" ? "2" : year === "Third" ? "3" : "4"} (${YEAR_YOP_MAP[year] || ""})`;

  if (loading) return <LoadingState message="Generating report…" />;

  return (
    <div className={`min-h-screen bg-white text-gray-900 ${bw ? "grayscale" : ""}`}>
      {/* Controls - hidden in print */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <h2 className="font-bold text-lg">Report Preview</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={bw} onChange={(e) => setBw(e.target.checked)} className="rounded" />
            Black & White
          </label>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-[1100px] mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold">SRM IST – Assessment Report</h1>
          <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{yearLabel}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${round === "1" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
              Round {round}
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-3xl font-bold">{total.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Total Students</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-3xl font-bold text-green-700">{activeCount.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Active Students</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-3xl font-bold text-red-700">{inactiveCount.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Inactive Students</div>
          </div>
        </div>

        {/* Summary Table */}
        <div>
          <h2 className="text-lg font-bold mb-3">Department × Specialization Summary</h2>
          <table className="w-full text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-2 text-left">Department</th>
                <th className="border border-gray-300 px-2 py-2 text-left">Specialization</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Qualified</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Present</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Present%</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Absent</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Absent%</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Passed</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Passed%</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Failed</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Failed%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-2 py-1.5">{r.department}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{r.specialization}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{r.qualified}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{r.present}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{r.presentPct.toFixed(0)}%</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{r.absent}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{r.absentPct.toFixed(0)}%</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{r.passed}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{r.passedPct.toFixed(0)}%</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{r.failed}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{r.failedPct.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td className="border border-gray-300 px-2 py-2" colSpan={2}>Total</td>
                <td className="border border-gray-300 px-2 py-2 text-right">{totals.qualified}</td>
                <td className="border border-gray-300 px-2 py-2 text-right">{totals.present}</td>
                <td className="border border-gray-300 px-2 py-2 text-right">{totals.presentPct.toFixed(0)}%</td>
                <td className="border border-gray-300 px-2 py-2 text-right">{totals.absent}</td>
                <td className="border border-gray-300 px-2 py-2 text-right">{totals.absentPct.toFixed(0)}%</td>
                <td className="border border-gray-300 px-2 py-2 text-right">{totals.passed}</td>
                <td className="border border-gray-300 px-2 py-2 text-right">{totals.passedPct.toFixed(0)}%</td>
                <td className="border border-gray-300 px-2 py-2 text-right">{totals.failed}</td>
                <td className="border border-gray-300 px-2 py-2 text-right">{totals.failedPct.toFixed(0)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Detailed Student Table */}
        <div>
          <h2 className="text-lg font-bold mb-3">Detailed Student Records</h2>
          <table className="w-full text-[10px] border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-1 py-1.5">Sl No</th>
                <th className="border border-gray-300 px-1 py-1.5 text-left">Name</th>
                <th className="border border-gray-300 px-1 py-1.5 text-left">RA Number</th>
                <th className="border border-gray-300 px-1 py-1.5 text-left">Email</th>
                <th className="border border-gray-300 px-1 py-1.5">Dept</th>
                <th className="border border-gray-300 px-1 py-1.5">Spec</th>
                <th className="border border-gray-300 px-1 py-1.5">R1 Status</th>
                <th className="border border-gray-300 px-1 py-1.5">R1 Result</th>
                <th className="border border-gray-300 px-1 py-1.5">R1 Coding%</th>
                <th className="border border-gray-300 px-1 py-1.5">R1 Cod Band</th>
                <th className="border border-gray-300 px-1 py-1.5">R1 Apt%</th>
                <th className="border border-gray-300 px-1 py-1.5">Overall Band</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 500).map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-1 py-1 text-center">{i + 1}</td>
                  <td className="border border-gray-300 px-1 py-1">{s.student_name}</td>
                  <td className="border border-gray-300 px-1 py-1">{s.registration_number}</td>
                  <td className="border border-gray-300 px-1 py-1">{s.email}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center">{s.department}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center">{s.specialization}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center">{s.r1_attendance === "Present" ? "P" : "A"}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center">{s.r1_result === "PASS" ? "P" : s.r1_result === "FAIL" ? "F" : "–"}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center">{s.coding_percentage || "–"}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center">{s.coding_band || "–"}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center">{s.aptitude_percentage || "–"}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center">{s.r1_band || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length > 500 && (
            <p className="text-xs text-gray-400 mt-2">Showing first 500 of {students.length.toLocaleString()} records</p>
          )}
        </div>

        {/* Pies */}
        <div className="grid grid-cols-2 gap-8 page-break-before">
          <div>
            <h3 className="text-sm font-bold mb-2">Attendance Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={attendancePie} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name"
                  label={({ name, value }) => {
                    const total = attendancePie.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${name}: ${percentage}%`;
                  }} labelLine={false}>
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-bold mb-2">Result Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={resultPie} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name"
                  label={({ name, value }) => {
                    const total = resultPie.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${name}: ${percentage}%`;
                  }} labelLine={false}>
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Band Tables */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-bold mb-2">Coding Band Distribution</h3>
            <table className="w-full text-xs border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left">Band</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Count</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {codingBands.map((b) => (
                  <tr key={b.band}>
                    <td className="border border-gray-300 px-2 py-1">{b.band}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{b.count}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{b.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height={180} className="mt-3">
              <PieChart>
                <Pie data={codingBands} cx="50%" cy="50%" outerRadius={60} dataKey="count" nameKey="band"
                  label={({ band }) => band} labelLine={false}>
                  {codingBands.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-bold mb-2">Aptitude Band Distribution</h3>
            <table className="w-full text-xs border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left">Band</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Count</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {aptitudeBands.map((b) => (
                  <tr key={b.band}>
                    <td className="border border-gray-300 px-2 py-1">{b.band}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{b.count}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{b.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height={180} className="mt-3">
              <PieChart>
                <Pie data={aptitudeBands} cx="50%" cy="50%" outerRadius={60} dataKey="count" nameKey="band"
                  label={({ band }) => band} labelLine={false}>
                  {aptitudeBands.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* R2 Section */}
        {hasR2 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Round 2 – Performance Categories</h2>
            <table className="w-full text-xs border border-gray-300 max-w-md">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left">Category</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Count</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {r2Categories.map((c) => (
                  <tr key={c.category}>
                    <td className="border border-gray-300 px-2 py-1 font-medium">{c.category}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{c.count}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{c.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 text-xs text-gray-400 text-center">
          SRM IST Executive Portal – Generated {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

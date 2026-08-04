import React, { useMemo } from "react";
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  FileCheck2,
  Upload,
  Download,
  Building,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Megaphone,
  ClipboardList,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  SchoolStats,
  PerformanceTrendPoint,
  Teacher,
  Student,
  AiSettings,
  UserSession,
} from "../types";

interface DashboardViewProps {
  currentUser?: UserSession;
  stats: SchoolStats;
  performanceTrend: PerformanceTrendPoint[];
  teachers: Teacher[];
  students: Student[];
  aiSettings?: AiSettings;
  onNavigate: (tab: string) => void;
  onSelectStudent: (student: Student) => void;
  onSelectTeacher: (teacher: Teacher) => void;
  onOpenAiInsights: () => void;
  onOpenAiNotice?: () => void;
  onOpenCopilot?: () => void;
  onOpenQuizGen?: () => void;
  onOpenLessonPlan?: () => void;
  onOpenPromoteModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  stats,
  performanceTrend: rawPerformanceTrend,
  teachers,
  students,
  aiSettings,
  onNavigate,
  onSelectStudent,
  onSelectTeacher,
  onOpenAiInsights,
  onOpenAiNotice,
  onOpenCopilot,
  onOpenQuizGen,
  onOpenLessonPlan,
  onOpenPromoteModal,
}) => {
  // Dynamically attach configured target benchmark from stats to graph data
  const performanceTrend = useMemo(() => {
    const target = stats.targetBenchmark || 80;
    if (!rawPerformanceTrend || rawPerformanceTrend.length === 0) {
      return [
        { year: "2020", passRate: 82, targetRate: target, topAchievers: 45 },
        { year: "2021", passRate: 85, targetRate: target, topAchievers: 52 },
        { year: "2022", passRate: 88, targetRate: target, topAchievers: 60 },
        { year: "2023", passRate: 91, targetRate: target, topAchievers: 74 },
        {
          year: "2024",
          passRate: stats.passPercentage || 94,
          targetRate: target,
          topAchievers: 88,
        },
      ];
    }
    return rawPerformanceTrend.map((pt) => ({
      ...pt,
      targetRate: target,
    }));
  }, [rawPerformanceTrend, stats.targetBenchmark, stats.passPercentage]);
  // Compute top performing classes dynamically from real DB student records & teacher assignments
  const topClasses = useMemo(() => {
    if (!students || students.length === 0) return [];

    const classMap = new Map<
      string,
      {
        grade: string;
        section: string;
        totalObtained: number;
        totalMax: number;
        passedCount: number;
        studentCount: number;
      }
    >();

    // Allowed grades helper: matches 9th, 10th, 11th, 12th or numerical 9, 10, 11, 12
    const isTargetGrade = (gradeStr: string) => {
      const num = parseInt(gradeStr.replace(/\D/g, ""), 10);
      return num >= 9 && num <= 12;
    };

    // 1. Group students by Grade & Section
    students.forEach((s) => {
      const normGrade = s.grade?.trim() || "";
      const normSec = s.section?.trim() || "";

      // Filter out grades outside of 9th to 12th
      if (!normGrade || !normSec || !isTargetGrade(normGrade)) return;

      const key = `${normGrade} - ${normSec}`;

      if (!classMap.has(key)) {
        classMap.set(key, {
          grade: normGrade,
          section: normSec,
          totalObtained: 0,
          totalMax: 0,
          passedCount: 0,
          studentCount: 0,
        });
      }

      const item = classMap.get(key)!;

      if (typeof s.entryTestMarks === "number" && !isNaN(s.entryTestMarks)) {
        const maxMarks = (s as any).entryTestMaxMarks || 100;

        item.totalObtained += s.entryTestMarks;
        item.totalMax += maxMarks;
        item.studentCount += 1;

        const studentPct = (s.entryTestMarks / maxMarks) * 100;
        if (studentPct >= 60) {
          item.passedCount += 1;
        }
      }
    });

    // 2. Map groups into class summary objects
    const list = Array.from(classMap.entries())
      .filter(([_, data]) => data.studentCount > 0 && data.totalMax > 0)
      .map(([key, data]) => {
        const classPercentage =
          Math.round((data.totalObtained / data.totalMax) * 1000) / 10;
        const passPct = ((data.passedCount / data.studentCount) * 100).toFixed(
          1,
        );

        const clean = (str?: string) =>
          str?.replace(/grade/i, "").trim().toLowerCase() || "";

        const targetGrade = clean(data.grade);
        const targetSec = clean(data.section);

        // Find assigned in-charge teacher
        const inChargeTeacher = teachers?.find((t) => {
          const inChargeClean = clean(t.classInChargeOf);
          const matchesInCharge =
            inChargeClean.includes(targetGrade) &&
            inChargeClean.includes(targetSec);

          const matchesClassesTaught = t.classesTaught?.some(
            (c) =>
              clean(c.grade) === targetGrade && clean(c.section) === targetSec,
          );

          return matchesInCharge || matchesClassesTaught;
        });

        return {
          key,
          grade: data.grade,
          section: data.section,
          inCharge: inChargeTeacher ? inChargeTeacher.name : "Unassigned",
          classPercentage,
          passRate: `${passPct}%`,
          studentCount: data.studentCount,
        };
      });

    // 3. Sort by overall Class Percentage descending & pick top 5
    return list
      .sort((a, b) => b.classPercentage - a.classPercentage)
      .slice(0, 5);
  }, [students, teachers]);
  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner Header */}
      <div className="  rounded-2xl p-6 bg-white relative  overflow-hidden border border-slate-200/80 shadow-xs    flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2  text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-300   px-2.5 py-0.5 rounded-full w-fit font-bold uppercase tracking-wider mb-1">
            <span className="size-30 bg-green-200 blur-3xl absolute right-10 bottom-0 "></span>
            <Building className="w-3.5 h-3.5" />
            <span>{stats.campusName}</span>
          </div>
          <h1 className="text-2xl font-bold ">
            Welcome,{" "}
            <span className="text-emerald-800">{currentUser?.userName}</span>
          </h1>
          <p className="text-xs  mt-1 max-w-xl">
            Academic Performance Overview & Staff Activity Control Center for
            Session {new Date().getFullYear() }-{ new Date().getFullYear()+1}.
          </p>
        </div>
        <GraduationCap className="w-32 absolute right-10 h-32 rotate-12 fill-emerald-200/80 text-emerald-200/80 " />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Enrolled Students
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-['Playfair_Display']">
              {stats.totalStudents.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{stats.studentGrowthPercentage}% vs last term</span>
            </div>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faculty & Staff
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-['Playfair_Display']">
              {stats.totalTeachers}
            </div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-sky-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.activeTeachers} Active in Campus</span>
            </div>
          </div>
        </div>

        {/* Pass Percentage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Board Pass Rate
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-['Playfair_Display']">
              {stats.passPercentage}%
            </div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-amber-600">
              <span>{stats.passPercentageTier}</span>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Campus Alerts
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-['Playfair_Display']">
              {stats.criticalAlerts < 10
                ? `0${stats.criticalAlerts}`
                : stats.criticalAlerts}
            </div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-rose-600">
              <span>Attention required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Trend Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                School Performance Trend ({new Date().getFullYear()})
              </h2>
              <p className="text-xs text-slate-500">
                Annual Board Examinations Pass Percentage & Target Achievements
              </p>
            </div>
            <span className="bg-blue-50 text-blue-800 text-xs font-bold hidden md:block px-3  py-1 rounded-full border border-blue-200">
              Annual Audit Passed
            </span>
          </div>

          <div className="h-64 w-full">
            {!performanceTrend || performanceTrend.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
                No annual performance trend records found in database.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="year"
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    domain={[75, 100]}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "0.75rem",
                      color: "#111111",
                      border: "1.1px dashed #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                  <Bar
                    dataKey="passRate"
                    name="Actual Pass Rate (%)"
                    fill="#047857"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="targetRate"
                    name="Target Benchmark (%)"
                    fill="#074fb5"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Academic Quick Actions
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Core operations & administrative shortcuts
            </p>

            <div className="space-y-2">
              {/* Student Dossiers */}
              <button
                type="button"
                onClick={() => onNavigate("students")}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-950 border border-slate-200/80 rounded-xl font-semibold text-xs transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-xs text-slate-900 group-hover:text-emerald-950">
                      Student Dossiers & Records
                    </span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      Attendance logs & profile directory
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Faculty Directory */}
              <button
                type="button"
                onClick={() => onNavigate("faculty")}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-950 border border-slate-200/80 rounded-xl font-semibold text-xs transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-xs text-slate-900 group-hover:text-teal-950">
                      Faculty & Staff Directory
                    </span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      Manage teacher assignments & workloads
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Assessment Schedules */}
              <button
                type="button"
                onClick={() => onNavigate("assessments")}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-950 border border-slate-200/80 rounded-xl font-semibold text-xs transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-sky-100 text-sky-800 group-hover:bg-sky-700 group-hover:text-white transition-colors">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-xs text-slate-900 group-hover:text-sky-950">
                      Assessment Schedules
                    </span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      Exam dates, syllabi & marksheets
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-700 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* System Settings & Circulars */}
              <button
                type="button"
                onClick={() => onNavigate("settings")}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-800 hover:text-indigo-950 border border-slate-200/80 rounded-xl font-semibold text-xs transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-xs text-slate-900 group-hover:text-indigo-950">
                      Campus Circulars & Portal Settings
                    </span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      System preferences & database sync
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Performing Classes & Active Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Classes */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Top Performing Classes
              </h2>
              <p className="text-xs text-slate-500">
                Top Performing class between <strong>9th</strong> and{" "}
                <strong>12th</strong>
              </p>
            </div>
            <button
              onClick={() => onNavigate("students")}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              View All Classes →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Grade & Section</th>
                  <th className="pb-3 font-semibold">Class In-Charge</th>
                  <th className="pb-3 font-semibold">Pass %</th>
                  <th className="pb-3 font-semibold text-right">
                    {" "}
                    Avg Class Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topClasses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-xs text-slate-400 font-medium"
                    >
                      No class performance records found in database between{" "}
                      <strong>9th</strong> and <strong> 12th</strong> . Register
                      students or upload test results to view class analytics.
                    </td>
                  </tr>
                ) : (
                  topClasses.map((cls) => (
                    <tr
                      key={cls.key}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 font-bold text-slate-900">
                        {cls.grade} - {cls.section}
                      </td>
                      <td className="py-3 text-slate-600">{cls.inCharge}</td>
                      <td className="py-3 text-emerald-600 font-bold">
                        {cls.passRate}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        {cls.classPercentage} / 100
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Activity */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Active Senior Faculty
              </h2>
              <p className="text-xs text-slate-500">
                Department heads & section leads
              </p>
            </div>
            <button
              onClick={() => onNavigate("faculty")}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Faculty Directory →
            </button>
          </div>

          <div className="space-y-3">
            {teachers.slice(0, 3).map((teacher, idx) => (
              <div
                key={`${teacher.id}-${idx}`}
                onClick={() => onSelectTeacher(teacher)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      teacher.photoUrl ||
                      "https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    }
                    alt={teacher.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {teacher.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {teacher.designation}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700">
                    {teacher.peerRating} / 5.0
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {teacher.classesTaught.length} Classes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

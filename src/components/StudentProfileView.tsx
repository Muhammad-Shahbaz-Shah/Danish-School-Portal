import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  GraduationCap,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  ShieldCheck,
  User,
  Home,
  Phone,
  FileText,
  Edit,
  Pencil,
  X,
  Plus,
  Tag,
  Save,
  Loader2,
  Upload,
  Star,
  Building,
  AlertCircle,
  UserCheck,
  Bot,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Student,
  Assessment,
  AiSettings,
  UserSession,
  StudentStatus,
} from "../types";
import { useToast } from "../context/ToastContext";

interface StudentProfileViewProps {
  student: Student;
  assessments?: Assessment[];
  aiSettings?: AiSettings;
  currentUser?: UserSession;
  onBack: () => void;
  onOpenAiInsights: (student: Student) => void;
  onUpdateStudent?: (updated: Student) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student: initialStudent,
  assessments = [],
  aiSettings,
  currentUser,
  onBack,
  onOpenAiInsights,
  onUpdateStudent,
}) => {
  const { addToast } = useToast();
  const [student, setStudent] = useState<Student>(initialStudent);
  const [activeTab, setActiveTab] = useState<
    "overview" | "results" | "details"
  >("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if initialStudent prop changes
  useEffect(() => {
    setStudent(initialStudent);
  }, [initialStudent]);

  // Settings for dynamic dropdowns (Houses, Grades, Sections)
  const [housesOptions, setHousesOptions] = useState<string[]>([
    "Chenab",
    "Ravi",
    "Jhelum",
    "Indus",
    "Jinnah",
    "Liaquat",
  ]);
  const [gradesOptions, setGradesOptions] = useState<string[]>([
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
  ]);
  const [sectionsOptions, setSectionsOptions] = useState<string[]>([
    "Section A",
    "Section B",
    "Section C",
  ]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (Array.isArray(data.houses) && data.houses.length > 0)
            setHousesOptions(data.houses);
          if (Array.isArray(data.grades) && data.grades.length > 0)
            setGradesOptions(data.grades);
          if (Array.isArray(data.sections) && data.sections.length > 0)
            setSectionsOptions(data.sections);
        }
      })
      .catch(() => {});
  }, []);

  // Form edit state
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    guardianName: "",
    dob: "",
    gender: "Male" as "Male" | "Female" | "Other",
    grade: "",
    section: "",
    house: "",
    enrollmentDate: "",
    photoUrl: "",
    entryTestMarks: 85,
    status: "Active" as StudentStatus,
    address: "",
    contactPhone: "",
    extracurriculars: [] as string[],
    badges: [] as string[],
  });

  const [newBadgeInput, setNewBadgeInput] = useState("");

  const handleOpenEditModal = () => {
    setFormData({
      name: student.name || "",
      rollNo: student.rollNo || "",
      guardianName: student.guardianName || "",
      dob: student.dob || "2008-01-01",
      gender: student.gender || "Male",
      grade: student.grade || "10th",
      section: student.section || "Section A",
      house: student.house || "Chenab",
      enrollmentDate:
        student.enrollmentDate || new Date().toISOString().split("T")[0],
      photoUrl:
        student.photoUrl ||
        "https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      entryTestMarks: student.entryTestMarks || 85,
      status: student.status || "Active",
      address: student.address || "Punjab Daanish School Residence",
      contactPhone: student.contactPhone || "+92 300 0000000",
      extracurriculars: Array.isArray(student.extracurriculars)
        ? [...student.extracurriculars]
        : [],
      badges: Array.isArray(student.badges)
        ? [...student.badges]
        : [
            `${student.house || "Chenab"} House Captain`,
            "1st Position in STEM Olympiad",
          ],
    });
    setNewBadgeInput("");
    setIsEditModalOpen(true);
  };

  const handleAddBadge = (badgeName: string) => {
    const trimmed = badgeName.trim();
    if (!trimmed) return;
    if (formData.badges.includes(trimmed)) return;
    setFormData((prev) => ({
      ...prev,
      badges: [...prev.badges, trimmed],
    }));
    setNewBadgeInput("");
  };

  const handleRemoveBadge = (badgeToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      badges: prev.badges.filter((b) => b !== badgeToRemove),
    }));
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("Validation Error", "error", "Student full name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const updated: Student = {
        ...student,
        name: formData.name.trim(),
        rollNo: formData.rollNo.trim(),
        guardianName: formData.guardianName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        grade: formData.grade,
        section: formData.section,
        house: formData.house,
        enrollmentDate: formData.enrollmentDate,
        photoUrl:
          formData.photoUrl.trim() ||
          "https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        entryTestMarks: Number(formData.entryTestMarks) || 85,
        status: formData.status,
        address: formData.address.trim(),
        contactPhone: formData.contactPhone.trim(),
        extracurriculars: formData.extracurriculars,
        badges: formData.badges,
      };

      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        throw new Error("Failed to update student profile on server.");
      }

      const savedData = await res.json();
      setStudent(savedData);
      if (onUpdateStudent) onUpdateStudent(savedData);

      addToast(
        "Profile Saved",
        "success",
        `Successfully updated record for ${savedData.name} (${savedData.house} House).`,
      );
      setIsEditModalOpen(false);
    } catch (err: any) {
      addToast(
        "Update Failed",
        "error",
        err.message || "Could not save student changes.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const [selectedSubjectFilter, setSelectedSubjectFilter] =
    useState<string>("All");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("All");

  const resultHistory = useMemo(() => {
    const matched: {
      id: string;
      title: string;
      subject: string;
      marks: number;
      maxMarks: number;
      pct: number;
      grade: string;
      date: string;
      category: string;
    }[] = [];

    if (assessments && assessments.length > 0) {
      assessments.forEach((asm) => {
        if (asm.marks && asm.marks.length > 0) {
          const studentMark = asm.marks.find(
            (m) =>
              (m.studentRoll &&
                m.studentRoll.toUpperCase() === student.rollNo.toUpperCase()) ||
              m.studentId === student.id ||
              m.studentName.toLowerCase() === student.name.toLowerCase(),
          );
          if (studentMark) {
            const pct = Math.round(
              (studentMark.marksObtained / asm.maxMarks) * 100,
            );
            const letterGrade =
              pct >= 90
                ? "A+"
                : pct >= 80
                  ? "A"
                  : pct >= 70
                    ? "B"
                    : pct >= 60
                      ? "C"
                      : "F";

            const titleLower = (asm.title || "").toLowerCase();
            let cat = "Class Test";
            if (titleLower.includes("weekly")) cat = "Weekly Test";
            else if (titleLower.includes("monthly")) cat = "Monthly Test";
            else if (titleLower.includes("mid"))
              cat = "Mid Term Exam";
            else if(titleLower.includes("series")|| titleLower.includes("mock")) cat = "Mock Test" 
            else if (
              titleLower.includes("annual") ||
              titleLower.includes("final")
            )
              cat = "Annual Exam";
            else if (titleLower.includes("quiz")) cat = "Quiz";

            matched.push({
              id: asm.id,
              title: asm.title,
              subject: asm.subject,
              marks: studentMark.marksObtained,
              maxMarks: asm.maxMarks,
              pct,
              grade: letterGrade,
              date:
                (asm as any).date ||
                (asm as any).testDate ||
                ((asm as any).createdAt
                  ? new Date((asm as any).createdAt).toISOString().split("T")[0]
                  : "2024-10-15"),
              category: cat,
            });
          }
        }
      });
    }

    return matched;
  }, [student, assessments]);

  // Extract dynamic subjects and categories present in this student's exam history
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    resultHistory.forEach((r) => {
      if (r.subject) set.add(r.subject);
    });
    return ["All", ...Array.from(set).sort()];
  }, [resultHistory]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    resultHistory.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [resultHistory]);

  const filteredResultHistory = useMemo(() => {
    return resultHistory.filter((r) => {
      const matchSubject =
        selectedSubjectFilter === "All" ||
        r.subject.toLowerCase() === selectedSubjectFilter.toLowerCase();
      const matchCategory =
        selectedCategoryFilter === "All" ||
        r.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
      return matchSubject && matchCategory;
    });
  }, [resultHistory, selectedSubjectFilter, selectedCategoryFilter]);

  const chartData = useMemo(() => {
    const list: {
      name: string;
      fullTitle: string;
      subject: string;
      score: number;
      date?: string;
      marksDisplay?: string;
    }[] = [];

    if (
      student.entryTestMarks !== undefined &&
      student.entryTestMarks !== null
    ) {
      list.push({
        name: "Entry Test",
        fullTitle: "Initial Entrance Benchmark Exam",
        subject: "General Knowledge & Aptitude",
        score: student.entryTestMarks,
        marksDisplay: `${student.entryTestMarks} / 100`,
      });
    }

    if (resultHistory.length > 0) {
      resultHistory.forEach((r) => {
        list.push({
          name: r.title.length > 12 ? r.title.substring(0, 12) + "…" : r.title,
          fullTitle: r.title,
          subject: r.subject,
          score: r.pct,
          date: r.date,
          marksDisplay: `${r.marks} / ${r.maxMarks}`,
        });
      });
    }

    return list;
  }, [resultHistory, student]);

  // Badges list to render
  const activeBadges = useMemo(() => {
    if (Array.isArray(student.badges) && student.badges.length > 0) {
      return student.badges;
    }
    return [
      `1st Position in STEM Olympiad`,
      `${student.house || "Chenab"} House Captain`,
    ];
  }, [student.badges, student.house]);

  const canEdit =
    currentUser?.userType === "principal" ||
    currentUser?.userType === "teacher" ||
    !currentUser;

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Records</span>
        </button>

        <div className="flex items-center space-x-2.5">
          {aiSettings?.aiEnabled !== false && (
            <button
              onClick={() => onOpenAiInsights(student)}
              className="flex items-center space-x-2 bg-linear-to-r from-teal-800 to-emerald-900 hover:from-teal-900 hover:to-emerald-950 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>AI Academic Appraisal</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Marksheet</span>
          </button>
        </div>
      </div>

      {/* Main Dossier Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <img
              src={
                student.photoUrl ||
                "https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              }
              alt={student.name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-700/20 shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 font-['Playfair_Display']">
                  {student.name}
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {student.rollNo}
                </span>
                {canEdit && (
                  <button
                    onClick={handleOpenEditModal}
                    className="p-1 text-slate-400 hover:text-emerald-800 rounded transition-colors cursor-pointer"
                    title="Edit Details & Badges"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-emerald-800 mt-0.5">
                {student.grade} ({student.section})
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center space-x-1">
                  <Home className="w-3.5 h-3.5 text-amber-600" />
                  <strong className="text-slate-800">
                    {student.house} House
                  </strong>
                </span>
                <span>•</span>
                <span>Enrolled: {student.enrollmentDate}</span>
                {student.contactPhone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{student.contactPhone}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8">
            <div className="text-center p-2 bg-emerald-50 rounded-xl">
              <div className="text-xl font-extrabold text-emerald-900 font-['Playfair_Display']">
                {student.entryTestMarks || 85}
              </div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase">
                Entry Test Marks
              </div>
            </div>

            <div className="text-center p-2 bg-slate-50 rounded-xl">
              <div className="text-xl font-extrabold text-slate-900 font-['Playfair_Display']">
                {resultHistory.length}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                Assessments Taken
              </div>
            </div>

            <div className="text-center p-2 bg-amber-50 rounded-xl">
              <div className="text-lg font-extrabold text-amber-900 font-['Playfair_Display'] truncate">
                {student.house || "Chenab"}
              </div>
              <div className="text-[10px] font-bold text-amber-700 uppercase">
                House
              </div>
            </div>

            <div className="text-center p-2 bg-slate-50 rounded-xl">
              <div className="text-xl font-extrabold text-emerald-700 font-['Playfair_Display']">
                {student.status}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                Status
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-emerald-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Academic Overview
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "results"
              ? "bg-emerald-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Test History
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "details"
              ? "bg-emerald-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Personal & Guardian Info
        </button>
      </div>

      {/* Content Area */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Performance Trend Chart */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">
              Academic Performance Trend
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Percentage trajectory across consecutive tests & entry benchmark
            </p>

            <div className="h-48 w-full flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    {/* <XAxis
                      dataKey="name"
                      hide
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    /> */}
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5">
                              <div className="font-bold text-amber-300 border-b border-slate-800 pb-1">
                                {data.fullTitle || data.name}
                              </div>
                              {data.subject && (
                                <div className="flex items-center justify-between gap-4 text-slate-300">
                                  <span className="text-slate-400">
                                    Subject:
                                  </span>
                                  <span className="font-semibold text-emerald-400">
                                    {data.subject}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-4 text-slate-300">
                                <span className="text-slate-400">Score:</span>
                                <span className="font-extrabold text-white">
                                  {data.score}%
                                </span>
                              </div>
                              {data.marksDisplay && (
                                <div className="flex items-center justify-between gap-4 text-slate-300 text-[11px]">
                                  <span className="text-slate-400">
                                    Marks Obtained:
                                  </span>
                                  <span className="font-medium text-slate-200">
                                    {data.marksDisplay}
                                  </span>
                                </div>
                              )}
                              {data.date && (
                                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
                                  Date: {data.date}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#047857"
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        fill: "#047857",
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                      activeDot={{ r: 7 }}
                      name="Percentage %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-500">
                    No test results recorded yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Entry test marks or term assessment scores will appear here
                    once published.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Key Achievements & Badges */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-800" />
                <span>Extracurricular & House Badges</span>
              </h2>
              {canEdit && (
                <button
                  onClick={handleOpenEditModal}
                  className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {activeBadges.map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center space-x-3 ${
                    idx % 2 === 0
                      ? "bg-emerald-50/80 border-emerald-100 text-emerald-950"
                      : "bg-amber-50/80 border-amber-100 text-amber-950"
                  }`}
                >
                  {idx % 2 === 0 ? (
                    <Award className="w-7 h-7 text-emerald-700 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-7 h-7 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {badge}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Official Campus Recognition Badge
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results History */}
      {(activeTab === "overview" || activeTab === "results") && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Examination Results Record
              </h2>
              <p className="text-[11px] text-slate-500">
                Filter records by subject or assessment category
              </p>
            </div>

            {/* Dynamic Dual Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs w-full md:w-auto">
              {/* Subject Filter */}
              <div className="flex items-center space-x-1.5  p-1 overflow-x-auto w-full sm:w-auto  rounded-lg sm:pb-0">
                <span className="font-bold text-slate-400 uppercase text-[10px] shrink-0 mr-1">
                  Subject:
                </span>
                <div className="overflow-x-auto p-1 border bg-zinc-200 border-slate-400 rounded-lg w-full flex items-center gap-1.5 scrollbar-none ">
                  {availableSubjects.map((sbj) => (
                    <button
                      key={sbj}
                      type="button"
                      onClick={() => setSelectedSubjectFilter(sbj)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shrink-0 cursor-pointer ${
                        selectedSubjectFilter.toLowerCase() ===
                        sbj.toLowerCase()
                          ? "bg-emerald-800 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {sbj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
                <span className="font-bold text-slate-400 uppercase text-[10px] shrink-0 mr-1">
                  Type:
                </span>
                 <div className="overflow-x-auto p-1 bg-zinc-200 border border-slate-400 rounded-lg w-full flex items-center gap-1.5 scrollbar-none ">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shrink-0 cursor-pointer ${
                      selectedCategoryFilter.toLowerCase() === cat.toLowerCase()
                        ? "bg-amber-800 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                  <th className="p-3">Exam Date</th>
                  <th className="p-3">Examination Title</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Marks Obtained</th>
                  <th className="p-3">Percentage</th>
                  <th className="p-3 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResultHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-slate-400 italic"
                    >
                      No examination records matching selected filters (Subject:{" "}
                      {selectedSubjectFilter}, Type: {selectedCategoryFilter}).
                    </td>
                  </tr>
                ) : (
                  filteredResultHistory.map((res, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-slate-500 text-[11px] whitespace-nowrap">
                        {res.date}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {res.title}
                      </td>
                      <td className="p-3 font-semibold text-emerald-800">
                        {res.subject}
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-200">
                          {res.category}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        {res.marks} / {res.maxMarks}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {res.pct}%
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`${
                            res.grade == "A+"
                              ? "bg-emerald-100 text-emerald-800"
                              : res.grade == "A"
                                ? "bg-teal-100 text-teal-800"
                                : res.grade == "B"
                                  ? "bg-blue-100 text-blue-800"
                                  : res.grade == "C"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                          } px-2 py-0.5 rounded font-bold text-[10px]`}
                        >
                          {res.grade}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Personal Info */}
      {activeTab === "details" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Personal Profile
              </h3>
              {canEdit && (
                <button
                  onClick={handleOpenEditModal}
                  className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Edit Information
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 font-semibold">Full Name:</span>{" "}
                <strong className="text-slate-800">{student.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">
                  Roll Number:
                </span>{" "}
                <strong className="text-slate-800">{student.rollNo}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">
                  Date of Birth:
                </span>{" "}
                <strong className="text-slate-800">{student.dob}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Gender:</span>{" "}
                <strong className="text-slate-800">{student.gender}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">
                  Class / Section:
                </span>{" "}
                <strong className="text-slate-800">
                  {student.grade} - {student.section}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">House:</span>{" "}
                <strong className="text-slate-800">
                  {student.house} House
                </strong>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Guardian & Contact Dossier
              </h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 font-semibold">
                  Guardian Name:
                </span>{" "}
                <strong className="text-slate-800">
                  {student.guardianName}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">
                  Contact Phone:
                </span>{" "}
                <strong className="text-slate-800">
                  {student.contactPhone || "+92 300 0000000"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">
                  Residence Address:
                </span>{" "}
                <strong className="text-slate-800">
                  {student.address || "Punjab Daanish School Campus"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">
                  Academic Status:
                </span>{" "}
                <strong className="text-emerald-800">{student.status}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl">
                  <UserCheck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-['Playfair_Display']">
                    Edit Student Dossier & Badges
                  </h3>
                  <p className="text-[11px] text-emerald-200/80 font-normal">
                    Update student demographics, house allocation, contact
                    numbers & extracurricular badges.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form
              onSubmit={handleSaveStudent}
              className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs"
            >
              {/* Basic Info Grid */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center space-x-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Student Identity & Demographics</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.rollNo}
                      onChange={(e) =>
                        setFormData({ ...formData, rollNo: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardianName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Academic Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Graduated">Graduated</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Academic & House Allocation */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center space-x-1.5 text-xs">
                  <Home className="w-3.5 h-3.5 text-amber-600" />
                  <span>Class & Academic House Allocation</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Class Level / Grade
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) =>
                        setFormData({ ...formData, grade: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    >
                      {gradesOptions.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Class Section
                    </label>
                    <select
                      value={formData.section}
                      onChange={(e) =>
                        setFormData({ ...formData, section: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    >
                      {sectionsOptions.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Academic House
                    </label>
                    <select
                      value={formData.house}
                      onChange={(e) =>
                        setFormData({ ...formData, house: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl font-bold focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    >
                      {housesOptions.map((h) => (
                        <option key={h} value={h}>
                          {h} House
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Entry Test Marks (/100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.entryTestMarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entryTestMarks: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Photo URL
                    </label>
                    <input
                      type="text"
                      value={formData.photoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, photoUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Dossier */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center space-x-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-sky-700" />
                  <span>Contact Phone & Residence Address</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPhone: e.target.value,
                        })
                      }
                      placeholder="+92 300 0000000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Residence Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="District / Tehsil, Punjab"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Extracurricular & House Badges Manager */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Assign Extracurricular & House Badges</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Add custom honors & roles
                  </span>
                </div>

                {/* Badges List */}
                <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {formData.badges.length === 0 ? (
                    <span className="text-slate-400 text-[11px] italic">
                      No badges assigned yet. Add custom badges below.
                    </span>
                  ) : (
                    formData.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-950 rounded-lg font-bold text-[11px] shadow-2xs"
                      >
                        <Award className="w-3 h-3 text-amber-700" />
                        <span>{badge}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBadge(badge)}
                          className="p-0.5 text-amber-700 hover:text-rose-700 rounded transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Custom Badge Form & Presets */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. STEM Olympiad Winner, Debate Captain, Science Exhibition Winner"
                      value={newBadgeInput}
                      onChange={(e) => setNewBadgeInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddBadge(newBadgeInput)}
                      className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Badge</span>
                    </button>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">
                      Quick Suggestions:
                    </span>
                    {[
                      `${formData.house || "Chenab"} House Captain`,
                      "STEM Olympiad Winner",
                      "Debate Team Captain",
                      "Cricket Captain",
                      "Science Fair 1st Prize",
                      "Excellence Discipline Award",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddBadge(preset)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded text-[10px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Record...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile & Badges</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

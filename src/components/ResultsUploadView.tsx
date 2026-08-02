import React, { useState, useEffect, useMemo } from "react";
import {
  Upload,
  FileCheck2,
  Plus,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Save,
  FileSpreadsheet,
  BookOpen,
  UserCheck,
  GraduationCap,
  Layers,
  Trash2,
  Edit3,
  X,
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
  Assessment,
  Student,
  StudentMark,
  Teacher,
  UserSession,
  AiSettings,
} from "../types";
import { useToast } from "../context/ToastContext";

interface ResultsUploadViewProps {
  currentUser?: UserSession;
  teachers?: Teacher[];
  assessments: Assessment[];
  students: Student[];
  aiSettings?: AiSettings;
  onAddAssessment: (asm: Partial<Assessment>) => void;
  onUpdateAssessment?: (id: string, updatedFields: Partial<Assessment>) => void;
  onSubmitMarks: (assessmentId: string, marks: StudentMark[]) => void;
  onDeleteAssessment?: (id: string) => void;
  onOpenAiInsights: (student: Student) => void;
  onOpenClassAiInsights?: (assessment: Assessment) => void;
}

export const ResultsUploadView: React.FC<ResultsUploadViewProps> = ({
  currentUser,
  teachers = [],
  assessments,
  students,
  aiSettings,
  onAddAssessment,
  onUpdateAssessment,
  onSubmitMarks,
  onDeleteAssessment,
  onOpenAiInsights,
  onOpenClassAiInsights,
}) => {
  const { addToast } = useToast();

  // Find active logged-in teacher if role is teacher
  const currentTeacher = useMemo(() => {
    if (currentUser?.userType === "teacher" && teachers.length > 0) {
      return (
        teachers.find(
          (t) =>
            t.email.toLowerCase() === currentUser.userEmail.toLowerCase() ||
            t.name.toLowerCase().includes(currentUser.userName.toLowerCase()),
        ) || teachers[0]
      );
    }
    return null;
  }, [currentUser, teachers]);

  const teacherClasses = useMemo(() => {
    return currentTeacher?.classesTaught || [];
  }, [currentTeacher]);

  // Filter assessments created strictly by this teacher
  const teacherAssessments = useMemo(() => {
    if (currentUser?.userType === "teacher") {
      const email = (currentUser.userEmail || "").toLowerCase().trim();
      const name = (currentUser.userName || "").toLowerCase().trim();
      const tEmail = (currentTeacher?.email || "").toLowerCase().trim();
      const tName = (currentTeacher?.name || "").toLowerCase().trim();
      const tId = (currentTeacher?.id || "").toLowerCase().trim();

      const filtered = assessments.filter((asm) => {
        if (!asm.createdBy) return false;
        const creator = asm.createdBy.toLowerCase().trim();
        return (
          (email && creator === email) ||
          (name && creator === name) ||
          (tEmail && creator === tEmail) ||
          (tName && creator === tName) ||
          (tId && creator === tId)
        );
      });
      return filtered;
    }
    return assessments;
  }, [currentUser, assessments, currentTeacher]);

  const [selectedAsmId, setSelectedAsmId] = useState<string>(
    teacherAssessments[0]?.id || assessments[0]?.id || "asm-1",
  );

  useEffect(() => {
    if (
      teacherAssessments.length > 0 &&
      !teacherAssessments.some((a) => a.id === selectedAsmId)
    ) {
      setSelectedAsmId(teacherAssessments[0].id);
    }
  }, [teacherAssessments]);

  const activeAsm =
    teacherAssessments.find((a) => a.id === selectedAsmId) ||
    teacherAssessments[0] ||
    assessments[0];
  const [titleInput, setTitleInput] = useState("");
  const [selectedAssignedIndex, setSelectedAssignedIndex] = useState<number>(0);

  // Default values
  const [gradeInput, setGradeInput] = useState("10th");
  const [sectionInput, setSectionInput] = useState("Section A");
  const [subjectInput, setSubjectInput] = useState("");
  const [maxMarksInput, setMaxMarksInput] = useState(100);
  const [testDateInput, setTestDateInput] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Edit Assessment Modal State
  const [isEditingAsm, setIsEditingAsm] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editMaxMarks, setEditMaxMarks] = useState(100);
  const [editTestDate, setEditTestDate] = useState("");


  

  const handleOpenEditModal = () => {
    if (!activeAsm) return;
    setEditTitle(activeAsm.title);
    setEditGrade(activeAsm.grade);
    setEditSection(activeAsm.section || "Section A");
    setEditSubject(activeAsm.subject);
    setEditMaxMarks(activeAsm.maxMarks || 100);
    setEditTestDate(
      activeAsm.testDate || new Date().toISOString().split("T")[0],
    );
    setIsEditingAsm(true);
  };

  const handleSaveEditedAsm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsm) return;
    if (!editTitle.trim()) {
      addToast("Validation Error", "error", "Please enter a valid test title.");
      return;
    }

    const updatedFields: Partial<Assessment> = {
      title: editTitle.trim(),
      grade: editGrade.trim(),
      section: editSection.trim(),
      subject: editSubject.trim(),
      maxMarks: editMaxMarks,
      testDate: editTestDate,
    };

    if (onUpdateAssessment) {
      onUpdateAssessment(activeAsm.id, updatedFields);
      addToast(
        "Assignment Updated",
        "success",
        `Updated details for "${editTitle.trim()}".`,
      );
    } else {
      addToast(
        "Update Failed",
        "error",
        "Updating assessment is not supported.",
      );
    }
    setIsEditingAsm(false);
  };

  // Auto-detect subject and assigned class when teacher or selected class changes
  useEffect(() => {
    if (currentUser?.userType === "teacher" && teacherClasses.length > 0) {
      const cls = teacherClasses[selectedAssignedIndex] || teacherClasses[0];
      if (cls) {
        const normGrade = cls.grade.replace(/ Grade/i, "").trim();
        setGradeInput(normGrade);
        setSectionInput(cls.section || " ");
        setSubjectInput(cls.subject || " ");
      }
    } else {
      // Principal default or auto-detect based on grade
      if (gradeInput === "10th") setSubjectInput("Mathematics");
      else if (gradeInput === "11th") setSubjectInput("Chemistry");
      else if (gradeInput === "8th") setSubjectInput("English Literature");
      else if (gradeInput === "12th") setSubjectInput("Physics");
      else setSubjectInput("General Science");
    }
  }, [currentUser, selectedAssignedIndex, teacherClasses, gradeInput]);

  // Filter students relative to the active assessment's grade & section ONLY
  const relativeStudents = useMemo(() => {
    if (!activeAsm) return [];

    const asmGradeNorm = activeAsm.grade
      .replace(/ Grade/i, "")
      .trim()
      .toLowerCase();
    const asmSecNorm = (activeAsm.section || "")
      .replace(/Section /i, "")
      .trim()
      .toLowerCase();

    // Exact grade + section matches
    const exactMatches = students.filter((s) => {
      const stdGradeNorm = s.grade
        .replace(/ Grade/i, "")
        .trim()
        .toLowerCase();
      const stdSecNorm = (s.section || "")
        .replace(/Section /i, "")
        .trim()
        .toLowerCase();

      const gradeMatches = stdGradeNorm === asmGradeNorm;
      const secMatches =
        !asmSecNorm ||
        !stdSecNorm ||
        stdSecNorm === asmSecNorm ||
        stdSecNorm.includes(asmSecNorm) ||
        asmSecNorm.includes(stdSecNorm);

      return gradeMatches && secMatches;
    });

    if (exactMatches.length > 0) return exactMatches;

    // Fallback: match by grade if exact section has no students
    return students.filter(
      (s) =>
        s.grade
          .replace(/ Grade/i, "")
          .trim()
          .toLowerCase() === asmGradeNorm,
    );
  }, [activeAsm, students]);

  // Local state for editing marks table
  const [localMarks, setLocalMarks] = useState<
    Record<string, { marksObtained: number }>
  >({});
  const [tableSearch, setTableSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<"all" | "top" | "failed">(
    "all",
  );

  // Quick Bulk Mark Setter
  const handleBulkSetMarks = (type: "full" | "pass" | "clear") => {
    if (!activeAsm) return;
    const max = activeAsm.maxMarks || 100;
    const updated: Record<string, { marksObtained: number }> = {
      ...localMarks,
    };

    relativeStudents.forEach((s) => {
      if (type === "full") updated[s.id] = { marksObtained: max };
      else if (type === "pass")
        updated[s.id] = { marksObtained: Math.round(max * 0.5) };
      else updated[s.id] = { marksObtained: 0 };
    });

    setLocalMarks(updated);
    addToast(
      "Bulk Marks Updated",
      "info",
      type === "full"
        ? `Applied full marks (${max}) to all ${relativeStudents.length} students.`
        : type === "pass"
          ? `Applied passing marks (${Math.round(max * 0.5)}) to all ${relativeStudents.length} students.`
          : `Reset marks to 0.`,
    );
  };

  // Filtered roster based on search and score filter
  const displayedStudents = useMemo(() => {
    return relativeStudents.filter((s) => {
      const matchSearch =
        !tableSearch.trim() ||
        s.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(tableSearch.toLowerCase());

      if (!matchSearch) return false;

      const marks = localMarks[s.id]?.marksObtained || 0;
      const max = activeAsm?.maxMarks || 100;
      const pct = Math.round((marks / max) * 100);

      if (tableFilter === "top") return pct >= 80;
      if (tableFilter === "failed") return pct < 50;

      return true;
    });
  }, [relativeStudents, tableSearch, tableFilter, localMarks, activeAsm]);

  // Sync local marks when activeAsm or relativeStudents change
  useEffect(() => {
    if (!activeAsm) return;
    const initial: Record<string, { marksObtained: number }> = {};

    relativeStudents.forEach((s) => {
      const existing = activeAsm?.marks?.find((m) => m.studentId === s.id);
      initial[s.id] = {
        marksObtained: existing ? existing.marksObtained : 0,
      };
    });

    setLocalMarks(initial);
  }, [activeAsm, relativeStudents]);

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      addToast("Validation Error", "error", "Please enter a test title.");
      return;
    }

    const creator =
      currentUser?.userEmail ||
      currentTeacher?.email ||
      currentUser?.userName ||
      "teacher";

    const createdAsm: Partial<Assessment> = {
      title: titleInput.trim(),
      grade: gradeInput,
      section: sectionInput,
      subject: subjectInput,
      maxMarks: maxMarksInput,
      testDate: testDateInput,
      createdBy: creator,
    };

    onAddAssessment(createdAsm);

    addToast(
      "Assessment Created!",
      "success",
      `Registered "${titleInput}" for Grade ${gradeInput} (${sectionInput}) in ${subjectInput}.`,
    );

    setTitleInput("");
  };

  const handleSaveAll = () => {
    if (!activeAsm) return;
    if (relativeStudents.length === 0) {
      addToast(
        "No Students",
        "error",
        "No enrolled students relative to this test to submit.",
      );
      return;
    }

    const formattedMarks: StudentMark[] = relativeStudents.map((s) => {
      const entry = localMarks[s.id] || { marksObtained: 0 };
      const percentage = Math.round(
        (entry.marksObtained / activeAsm.maxMarks) * 100,
      );
      let grade = "F";
      if (percentage >= 90) grade = "A+";
      else if (percentage >= 80) grade = "A";
      else if (percentage >= 70) grade = "B";
      else if (percentage >= 60) grade = "C";
      else if (percentage >= 50) grade = "D";

      return {
        id: "m-" + s.id + "-" + activeAsm.id,
        assessmentId: activeAsm.id,
        studentId: s.id,
        studentRoll: s.rollNo,
        studentName: s.name,
        marksObtained: entry.marksObtained,
        maxMarks: activeAsm.maxMarks,
        percentage,
        grade,
      };
    });

    onSubmitMarks(activeAsm.id, formattedMarks);
    addToast(
      "Marks Submitted & Published!",
      "success",
      `Exam marks for ${relativeStudents.length} relative student(s) published to Daanish Portal.`,
    );
  };

  const sampleTrend = useMemo(() => {
    if (!activeAsm) return [];

    const asmGradeNorm = activeAsm.grade
      .replace(/ Grade/i, "")
      .trim()
      .toLowerCase();
    const asmSubNorm = activeAsm.subject.trim().toLowerCase();

    // Find all assessments for the same grade & subject
    const related = assessments.filter(
      (a) =>
        a.grade
          .replace(/ Grade/i, "")
          .trim()
          .toLowerCase() === asmGradeNorm &&
        a.subject.trim().toLowerCase() === asmSubNorm,
    );

    const list = related.length > 0 ? related : [activeAsm];

    return list
      .map((a) => {
        let avg = 0;
        let hasMarks = false;

        // 1. Calculate average for the active assessment using local inputs
        if (a.id === activeAsm.id && relativeStudents.length > 0) {
          let totalObtained = 0;
          let enteredCount = 0;

          relativeStudents.forEach((s) => {
            const entry = localMarks[s.id];
            if (entry !== undefined && entry.marksObtained !== undefined) {
              totalObtained += entry.marksObtained;
              enteredCount++;
            }
          });

          const totalMax = relativeStudents.length * (a.maxMarks || 100);
          if (totalMax > 0 && enteredCount > 0) {
            avg = Math.round((totalObtained / totalMax) * 100);
            hasMarks = true;
          }
        }
        // 2. Calculate average for saved/past assessments from DB marks
        else if (a.marks && a.marks.length > 0) {
          let totalObtained = 0;
          let totalMax = 0;

          a.marks.forEach((m) => {
            totalObtained += m.marksObtained || 0;
            totalMax += m.maxMarks || a.maxMarks || 100;
          });

          if (totalMax > 0) {
            avg = Math.round((totalObtained / totalMax) * 100);
            hasMarks = true;
          }
        }

        // If no marks/results exist for this assessment, return null to filter it out
        if (!hasMarks) return null;

        return {
          name: a.title,
          date: a.testDate || "N/A",
          avg,
        };
      })
      .filter(Boolean); // Filters out any null entries (assessments without results)
  }, [activeAsm, assessments, localMarks, relativeStudents]);

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Playfair_Display'] mt-1">
            Test Results & Marks Entry Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-detects subject curriculum & isolates test marks strictly to
            enrolled relative students.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveAll}
            className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Submit Marks</span>
          </button>
        </div>
      </div>

      {/* Grid: Register Test & Teacher Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form 01: Register Test */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
              <Plus className="w-4 h-4" />
              <span>Form 01: Register New Test / Exam</span>
            </div>
          </div>

          <form onSubmit={handleCreateTest} className="space-y-3 text-xs">
            {/* Teacher Assigned Class Selection */}
            {currentUser?.userType === "teacher" &&
            teacherClasses.length > 0 ? (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2">
                <label className="flex items-center space-x-1.5 font-bold text-emerald-900 text-xs">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>
                    Select from Assigned Classes (
                    {currentTeacher?.name || "Faculty"}):
                  </span>
                </label>
                <select
                  value={selectedAssignedIndex}
                  onChange={(e) =>
                    setSelectedAssignedIndex(Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {teacherClasses.map((cls, idx) => (
                    <option key={idx} value={idx}>
                      {cls.grade} — {cls.section}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Grade, Section, and Subject auto-filled from teacher&apos;s
                  assigned schedule.
                </p>
              </div>
            ) : null}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Test Title / Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mid-term Assessment - Calculus"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>

            {/* Subject Auto-Detection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Subject
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                    Auto-Detected
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-lg font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Maximum Marks
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  max={200}
                  value={maxMarksInput}
                  onChange={(e) => setMaxMarksInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 mt-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Create & Register Test</span>
            </button>
          </form>
        </div>

        {/* Chart & Auto-Detected Test Summary */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Class Performance Trend
              </h2>
              <p className="text-xs text-slate-500">
                Average marks % across consecutive terms
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {activeAsm?.grade} — {activeAsm?.subject}
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sampleTrend}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  domain={[50, 100]}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;

                    const data = payload[0].payload;
                    // Use payload[0].value as a fallback for the plotted value
                    const displayScore =
                      data.avg ?? data.score ?? payload[0].value;

                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5">
                        <div className="font-bold text-amber-300 border-b border-slate-800 pb-1">
                          {data.fullTitle || data.name}
                        </div>

                        {data.subject && (
                          <div className="flex items-center justify-between gap-4 text-slate-300">
                            <span className="text-slate-400">Subject:</span>
                            <span className="font-semibold text-emerald-400">
                              {data.subject}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-4 text-slate-300">
                          <span className="text-slate-400">Score:</span>
                          <span className="font-extrabold text-white">
                            {displayScore}%
                          </span>
                        </div>

                        {data.date && (
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
                            Date: {data.date}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: "#059669",
                    strokeWidth: 2,
                    stroke: "#ffffff",
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#047857",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                  name="Class Average (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Active Test Details Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Active Selected Assessment:</span>
              <span className="text-emerald-800 font-extrabold">
                {activeAsm?.title}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                  Class : {activeAsm?.grade} ({activeAsm?.section})
                </span>
               
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                  Max Marks: {activeAsm?.maxMarks}
                </span>
                <span
                  className={` px-2 py-0.5 ${activeAsm?.status == "Published" ? "bg-blue-100 text-blue-900" : "bg-rose-100 text-rose-900"} rounded  font-semibold`}
                >
                  Result Status: {activeAsm?.status}
                </span>
              </div>

              {aiSettings?.aiEnabled !== false &&
                onOpenClassAiInsights &&
                activeAsm && (
                  <button
                    type="button"
                    onClick={() => onOpenClassAiInsights(activeAsm)}
                    className="flex items-center space-x-1.5 bg-indigo-900 hover:bg-indigo-950 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                  >
                    <Bot className="w-3.5 h-3.5  animate-pulse" />
                    <span>Class AI Insights & Strategy</span>
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Marks Entry Table & Assessment Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ACTIVE TEST ENTRY SHEET
            </span>
            <div
              className="flex flex-col  md:items-stretch
             md:flex-row items-center justify-center md:justify-between gap-3 lg:gap-8 w-full mt-1"
            >
              {teacherAssessments.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-amber-900 text-xs font-semibold w-full lg:w-auto">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    No assignments created by you yet. Use{" "}
                    <strong>Form 01</strong> above to register your first
                    test/assignment!
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2  w-full lg:w-auto">
                  <select
                    value={selectedAsmId}
                    onChange={(e) => setSelectedAsmId(e.target.value)}
                    className="text-sm font-bold lg:w-fit w-full text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none"
                  >
                    {teacherAssessments.map((a, idx) => (
                      <option key={`${a.id}-${idx}`} value={a.id}>
                        {a.title} — {a.grade} ({a.section})
                      </option>
                    ))}
                  </select>

                  {activeAsm && (
                    <button
                      type="button"
                      onClick={handleOpenEditModal}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors shrink-0 flex items-center space-x-1 cursor-pointer font-bold text-xs"
                      title="Edit assignment details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onDeleteAssessment && activeAsm && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${activeAsm.title}"?`,
                          )
                        ) {
                          onDeleteAssessment(activeAsm.id);
                          addToast(
                            "Assignment Deleted",
                            "info",
                            `Deleted assignment ${activeAsm.title}`,
                          );
                        }
                      }}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
                      title="Delete this assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Right group: Max Marks + Import Button */}
              <div className="flex gap-4 lg:gap-6 items-center justify-center">
                <span className="text-xs font-semibold text-slate-500">
                  Max Marks:{" "}
                  <strong className="text-slate-900">
                    {activeAsm?.maxMarks || 100}
                  </strong>
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Result Status:{" "}
                  <strong className="text-slate-900">
                    {activeAsm?.status || "Undefined"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Performance Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by student name or roll no..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Filter Grade:
            </span>
            <button
              type="button"
              onClick={() => setTableFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                tableFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              All ({relativeStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setTableFilter("top")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                tableFilter === "top"
                  ? "bg-emerald-800 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              ≥80%
            </button>
            <button
              type="button"
              onClick={() => setTableFilter("failed")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                tableFilter === "failed"
                  ? "bg-rose-700 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              &lt;50%
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {relativeStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="font-bold text-slate-700 text-sm">
                No relative students enrolled in Grade {activeAsm?.grade}{" "}
                {activeAsm?.section}
              </p>
              <p className="text-slate-500 mt-1">
                To enter marks for this test, make sure students are registered
                in Grade {activeAsm?.grade}.
              </p>
            </div>
          ) : displayedStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p className="font-bold text-slate-700 text-sm">
                No students match current search filter.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                  <th className="p-3">Roll No.</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3 hidden md:block">Grade & Section</th>
                  <th className="p-3">Marks Obtained</th>
                  <th className="p-3">Percentage</th>
                  <th className="p-3">Grade</th>
                  {aiSettings?.aiEnabled !== false && (
                    <th className="p-3 text-right">AI Assistant</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.map((student, idx) => {
                  const cur = localMarks[student.id] || { marksObtained: 0 };
                  const max = activeAsm?.maxMarks || 100;
                  const pct = Math.round((cur.marksObtained / max) * 100);

                  let gradeBadge = "bg-emerald-100 text-emerald-800";
                  let grade = "A+";
                  if (pct >= 90) {
                    grade = "A+";
                    gradeBadge = "bg-emerald-100 text-emerald-800";
                  } else if (pct >= 80) {
                    grade = "A";
                    gradeBadge = "bg-teal-100 text-teal-800";
                  } else if (pct >= 70) {
                    grade = "B";
                    gradeBadge = "bg-blue-100 text-blue-800";
                  } else if (pct >= 60) {
                    grade = "C";
                    gradeBadge = "bg-amber-100 text-amber-800";
                  } else {
                    grade = "F";
                    gradeBadge = "bg-rose-100 text-rose-800";
                  }

                  return (
                    <tr
                      key={`${student.id}-${idx}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {student.rollNo?.replace(/^PDS(-\d+)?-/i, "") ||
                          student.rollNo}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {student.name}
                      </td>
                      <td className="p-3 font-medium text-slate-600 hidden md:block">
                        {student.grade} ({student.section})
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          max={max} // 1. Changed maxLength to max
                          value={cur.marksObtained}
                          onChange={(e) => {

                            const rawVal = e.target.value;
                            if (rawVal === "") {
                              setLocalMarks((prev) => ({
                                ...prev,
                                [student.id]: {
                                  ...cur,
                                  marksObtained: 0,
                                },
                              }));
                              return;
                            }

                            // 2. Clamp the value between 0 and max
                            const numericVal = Number(rawVal);
                            const clampedVal = Math.min(
                              Math.max(0, numericVal),
                              max,
                            );

                            setLocalMarks((prev) => ({
                              ...prev,
                              [student.id]: {
                                ...cur,
                                marksObtained: clampedVal,
                              },
                            }));
                          }}
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                        />
                        <span className="text-slate-400 font-medium ml-1">
                          / {max}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{pct}%</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${gradeBadge}`}
                        >
                          {grade}
                        </span>
                      </td>
                      {aiSettings?.aiEnabled !== false && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onOpenAiInsights(student)}
                            className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-semibold text-xs hover:underline"
                          >
                            <Bot className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                            <span>AI Review</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Assignment Modal */}
      {isEditingAsm && activeAsm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-emerald-700" />
                <span>Edit Assignment Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingAsm(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedAsm} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Test Title / Name
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    required
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    required
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={500}
                    value={editMaxMarks}
                    onChange={(e) => setEditMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Test Date
                </label>
                <input
                  type="date"
                  required
                  value={editTestDate}
                  onChange={(e) => setEditTestDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingAsm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  Users,
  BookOpen,
  Search,
  UserCheck,
  Filter,
  School,
  Plus,
  UserPlus,
  PencilLine,
  Building2,
  Pencil,
} from "lucide-react";
import { Teacher, Student, Assessment } from "../types";

interface TeacherAssignmentMatrixViewProps {
  teachers: Teacher[];
  students: Student[];
  assessments?: Assessment[];
  grades?: string[];
  sections?: string[];
  onOpenAssignClassModal?: (teacher?: Teacher) => void;
  onOpenAssignInChargeModal?: (teacher?: Teacher) => void;
  onSelectTeacher?: (teacher: Teacher) => void;
}

const FALLBACK_GRADES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th"];

const normalizeGrade = (g: string): string => {
  if (!g) return "";
  return g.toLowerCase().replace(/grade/g, "").replace(/class/g, "").trim();
};

const normalizeSection = (s: string): string => {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/section\s*/g, "")
    .replace(/sec\s*/g, "")
    .trim();
};

export const TeacherAssignmentMatrixView: React.FC<
  TeacherAssignmentMatrixViewProps
> = ({
  teachers,
  students,
  assessments = [],
  grades: propGrades,
  sections: propSections,
  onOpenAssignClassModal,
  onOpenAssignInChargeModal,
  onSelectTeacher,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("All");

  // DB Settings State (Grades and Sections defined by Principal in Settings)
  const [dbGrades, setDbGrades] = useState<string[]>(propGrades || []);
  const [dbSections, setDbSections] = useState<string[]>(propSections || []);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (Array.isArray(data.grades) && data.grades.length > 0) {
            setDbGrades(data.grades);
          }
          if (Array.isArray(data.sections) && data.sections.length > 0) {
            setDbSections(data.sections);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Active section tab selected per grade
  const [activeSectionPerGrade, setActiveSectionPerGrade] = useState<{
    [grade: string]: string;
  }>({});

  const handleSectionTabChange = (grade: string, section: string) => {
    setActiveSectionPerGrade((prev) => ({ ...prev, [grade]: section }));
  };

  // 1. Dynamically extract all available grades from Principal DB settings + records
  const dynamicGrades = useMemo(() => {
    const gradeMap = new Map<string, string>(); // norm -> display string

    const addGrade = (raw?: string) => {
      if (!raw) return;
      const trimmed = raw.trim();
      if (!trimmed) return;
      const norm = normalizeGrade(trimmed);
      if (norm && !gradeMap.has(norm)) {
        gradeMap.set(norm, trimmed);
      }
    };

    // 1. Include Principal-selected grades from DB settings first
    if (dbGrades && dbGrades.length > 0) {
      dbGrades.forEach((g) => addGrade(g));
    }

    // 2. Include any grades present in student/teacher/assessment records
    students.forEach((s) => addGrade(s.grade));
    teachers.forEach((t) => {
      if (t.classInChargeOf) {
        const parts = t.classInChargeOf.split(",");
        parts.forEach((part) => {
          const match = part.match(
            /(?:Grade|Class)?\s*([0-9]+(?:st|nd|rd|th)?|[A-Za-z0-9\s]+?)(?:\s*-|\s*\(|\s*$)/i,
          );
          if (match && match[1]) {
            addGrade(match[1]);
          } else {
            addGrade(part);
          }
        });
      }
      if (Array.isArray(t.classesTaught)) {
        t.classesTaught.forEach((c) => addGrade(c.grade));
      }
    });
    assessments.forEach((a) => addGrade(a.grade));

    if (gradeMap.size === 0) {
      FALLBACK_GRADES.forEach((g) => gradeMap.set(normalizeGrade(g), g));
    }

    const list = Array.from(gradeMap.values());

    // Sort numerically/alphabetically
    list.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    return list;
  }, [dbGrades, students, teachers, assessments]);

  // 2. Compute matrix data for each grade taking sections from DB settings + records
  const gradeMatrixData = useMemo(() => {
    return dynamicGrades.map((grade) => {
      const normGrade = normalizeGrade(grade);

      // Filter real students for this grade
      const gradeStudents = students.filter(
        (s) => normalizeGrade(s.grade) === normGrade,
      );

      // Filter real assessments for this grade
      const gradeAssessments = assessments.filter(
        (a) => normalizeGrade(a.grade) === normGrade,
      );

      // Dynamically extract sections for this grade (starting with Principal DB settings selection)
      const secMap = new Map<string, string>(); // norm -> display string

      const addSec = (raw?: string) => {
        if (!raw) return;
        const trimmed = raw.trim();
        if (!trimmed) return;
        const norm = normalizeSection(trimmed);
        if (norm && !secMap.has(norm)) {
          let display = trimmed;
          if (!display.toLowerCase().startsWith("section")) {
            display = `Section ${display}`;
          }
          secMap.set(norm, display);
        }
      };

      // 1. Add Principal-selected sections from DB settings
      if (dbSections && dbSections.length > 0) {
        dbSections.forEach((s) => addSec(s));
      }

      // 2. Add sections found in students/teachers/assessments for this grade
      gradeStudents.forEach((s) => {
        if (s.section) addSec(s.section);
      });
      teachers.forEach((t) => {
        if (t.classInChargeOf) {
          const parts = t.classInChargeOf.split(",");
          parts.forEach((part) => {
            if (normalizeGrade(part) === normGrade) {
              const match = part.match(/Section\s*([A-Z0-9]+)/i);
              if (match && match[1]) {
                addSec(`Section ${match[1].toUpperCase()}`);
              }
            }
          });
        }
        if (Array.isArray(t.classesTaught)) {
          t.classesTaught.forEach((c) => {
            if (normalizeGrade(c.grade) === normGrade && c.section) {
              addSec(c.section);
            }
          });
        }
      });
      gradeAssessments.forEach((a) => {
        if (a.section) addSec(a.section);
      });

      if (secMap.size === 0) {
        addSec("Section A");
        addSec("Section B");
        addSec("Section C");
      }

      const availableSections = Array.from(secMap.values()).sort();

      // Sections mapping
      const sections = availableSections.map((secName) => {
        const normSec = normalizeSection(secName);

        // Real Student Count
        const secStudents = gradeStudents.filter(
          (s) => normalizeSection(s.section || "Section A") === normSec,
        );
        const studentCount = secStudents.length;

        // Real Class In-Charge Teacher
        const inCharge = teachers.find((t) => {
          if (!t.classInChargeOf) return false;
          const target = t.classInChargeOf.toLowerCase();
          const matchGrade = target.includes(normGrade);
          const matchSec =
            target.includes(secName.toLowerCase()) ||
            target.includes(`section ${normSec}`) ||
            target.includes(`-${normSec}`) ||
            target.includes(` ${normSec}`);
          return matchGrade && matchSec;
        });

        // Real Section Class Average (Percentage)
        const secAssessments = gradeAssessments.filter(
          (a) => normalizeSection(a.section || "Section A") === normSec,
        );

        let secAvgPct: number | null = null;
        if (secAssessments.length > 0) {
          let totalObtained = 0;
          let totalMax = 0;
          secAssessments.forEach((asm) => {
            const marksList = asm.marks || (asm as any).studentMarks;
            if (marksList && marksList.length > 0) {
              marksList.forEach((m: any) => {
                totalObtained += m.marksObtained;
                totalMax += asm.maxMarks;
              });
            } else if (
              asm.classAverage !== undefined &&
              asm.classAverage !== null
            ) {
              totalObtained += asm.classAverage;
              totalMax += 100;
            }
          });
          if (totalMax > 0) {
            secAvgPct = Math.round((totalObtained / totalMax) * 100);
          }
        }

        // Real Assigned Subject Teachers ONLY for this Grade & Section
        const appointedTeachers: {
          subject: string;
          teacher: Teacher;
          period?: string;
          room?: string;
        }[] = [];

        teachers.forEach((t) => {
          if (Array.isArray(t.classesTaught)) {
            t.classesTaught.forEach((c) => {
              if (
                normalizeGrade(c.grade) === normGrade &&
                normalizeSection(c.section || "Section A") === normSec
              ) {
                appointedTeachers.push({
                  subject: c.subject,
                  teacher: t,
                  period: c.period,
                  room: c.room,
                });
              }
            });
          }
        });

        return {
          section: secName,
          studentCount,
          secAvgPct,
          inCharge,
          appointedTeachers,
        };
      });

      // Grade aggregates
      const totalStudents = sections.reduce(
        (acc, s) => acc + s.studentCount,
        0,
      );
      const validPcts = sections
        .map((s) => s.secAvgPct)
        .filter((p): p is number => p !== null);

      const gradeAvgPct =
        validPcts.length > 0
          ? Math.round(
              (validPcts.reduce((a, b) => a + b, 0) / validPcts.length) * 10,
            ) / 10
          : null;

      const totalGradeAllocations = sections.reduce(
        (acc, s) => acc + s.appointedTeachers.length,
        0,
      );

      const uniqueTeachersInGrade = new Set<string>();
      sections.forEach((s) => {
        s.appointedTeachers.forEach((ap) => {
          uniqueTeachersInGrade.add(ap.teacher.id);
        });
      });
      const uniqueAssignedTeachersCount = uniqueTeachersInGrade.size;

      return {
        grade,
        totalStudents,
        gradeAvgPct,
        totalGradeAllocations,
        uniqueAssignedTeachersCount,
        sections,
      };
    });
  }, [dynamicGrades, dbSections, teachers, students, assessments]);

  // Filter grade matrix by search term & selected grade
  const filteredGradeMatrix = useMemo(() => {
    return gradeMatrixData.filter((gm) => {
      const matchesGradeFilter =
        gradeFilter === "All" ||
        normalizeGrade(gm.grade) === normalizeGrade(gradeFilter);

      const term = searchTerm.toLowerCase();
      if (!term) return matchesGradeFilter;

      const matchesTerm =
        gm.grade.toLowerCase().includes(term) ||
        gm.sections.some(
          (sec) =>
            sec.section.toLowerCase().includes(term) ||
            (sec.inCharge && sec.inCharge.name.toLowerCase().includes(term)) ||
            sec.appointedTeachers.some(
              (ap) =>
                ap.subject.toLowerCase().includes(term) ||
                ap.teacher.name.toLowerCase().includes(term) ||
                ap.teacher.department.toLowerCase().includes(term),
            ),
        );

      return matchesGradeFilter && matchesTerm;
    });
  }, [gradeMatrixData, gradeFilter, searchTerm]);

  // Overall Statistics
  const totalStudentsAll = gradeMatrixData.reduce(
    (acc, g) => acc + g.totalStudents,
    0,
  );
  const totalAllocatedTeachers = gradeMatrixData.reduce(
    (acc, g) => acc + g.totalGradeAllocations,
    0,
  );

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-emerald-800 font-bold uppercase tracking-wider">
            <School className="w-4 h-4 text-emerald-700" />
            <span>Academic Administration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Playfair_Display'] mt-1">
            Teacher Assignment Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Class In-Charge appointments & active subject teacher assignments
            fetched directly from records.
          </p>
        </div>
      </div>

      {/* Overview Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-['Playfair_Display']">
              {totalStudentsAll}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              Enrolled Students
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-['Playfair_Display']">
              {teachers.length} Active Faculty
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              Teaching Staff
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-['Playfair_Display']">
              {totalAllocatedTeachers}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              Active Subject Assignments
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search grade, section, teacher or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
          />
        </div>

        {/* Dynamic Grade Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="font-bold text-slate-400 uppercase text-[10px] mr-1 flex items-center space-x-1 shrink-0">
            <Filter className="w-3 h-3" />
            <span>Grade:</span>
          </span>
          {["All", ...dynamicGrades].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                gradeFilter === g
                  ? "bg-emerald-800 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Full-Width Grade Cards Stack */}
       <div className="space-y-8">
        {filteredGradeMatrix.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
            <School className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No assignment records matching search filter.</p>
            <p className="text-xs">Try selecting &quot;All&quot; grade filter or clearing search.</p>
          </div>
        ) : (
          filteredGradeMatrix.map((gm) => {
            const activeSectionName =
              activeSectionPerGrade[gm.grade] || gm.sections[0]?.section || 'Section A';

            const activeSecObj =
              gm.sections.find((s) => s.section === activeSectionName) || gm.sections[0];

            return (
              <div key={gm.grade} className="space-y-4">
                {/* 1. Header Section Card */}
                <header className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    {/* Grade Badge Icon */}
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800 shrink-0 border border-emerald-100/90 shadow-2xs">
                      <GraduationCap className="w-8 h-8 text-emerald-800" />
                    </div>

                    {/* Header Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Playfair_Display']">
                          Grade {gm.grade.toLowerCase().includes('th') || gm.grade.toLowerCase().includes('st') || gm.grade.toLowerCase().includes('nd') || gm.grade.toLowerCase().includes('rd') ? gm.grade : `${gm.grade}th`}
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>Students: <strong className="text-slate-800 font-bold">{gm.totalStudents}</strong></span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-slate-400" />
                          <span>Teachers: <strong className="text-slate-800 font-bold">{gm.totalGradeAllocations > 0 ? gm.totalGradeAllocations : teachers.length}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Switcher */}
                  <div className="bg-slate-50 p-1 rounded-xl border border-slate-200/90 inline-flex shadow-2xs">
                    {gm.sections.map((sec) => {
                      const isActive = sec.section === activeSectionName;
                      return (
                        <button
                          key={sec.section}
                          type="button"
                          onClick={() => handleSectionTabChange(gm.grade, sec.section)}
                          className={`px-5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-800 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 font-semibold hover:bg-slate-100'
                          }`}
                        >
                          {sec.section}
                        </button>
                      );
                    })}
                  </div>
                </header>

                {/* 2. Grid Cards (Active Section & Class In-Charge) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* BEGIN: Active Section Details Card */}
                  <section className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 p-6 flex items-center justify-between">
                    <div className="space-y-2">
                      <div>
                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Active Section
                        </h2>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight font-['Playfair_Display']">
                          Grade {gm.grade.toLowerCase().includes('th') || gm.grade.toLowerCase().includes('st') || gm.grade.toLowerCase().includes('nd') || gm.grade.toLowerCase().includes('rd') ? gm.grade : `${gm.grade}th`} — {activeSecObj.section.replace(/section\s*/i, '')}
                        </h3>
                      </div>
                      <div className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 gap-2 font-medium">
                        <Users className="w-4 h-4 text-emerald-800" />
                        <span>Enrolled: <strong className="text-slate-900 font-bold">{activeSecObj.studentCount}</strong> Students</span>
                      </div>
                    </div>

                    {/* Right Class Average Ring */}
                    <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
                      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                        {/* Circular Progress Gauge */}
                        <svg className="transform -rotate-90 w-20 h-20">
                          <circle
                            className="text-slate-100"
                            cx="40"
                            cy="40"
                            fill="transparent"
                            r="34"
                            stroke="currentColor"
                            strokeWidth="6"
                          />
                          <circle
                            className="text-emerald-700 transition-all duration-500"
                            cx="40"
                            cy="40"
                            fill="transparent"
                            r="34"
                            stroke="currentColor"
                            strokeDasharray="213"
                            strokeDashoffset={213 - (213 * (activeSecObj.secAvgPct || 0)) / 100}
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-slate-900 tracking-tighter font-['Playfair_Display']">
                            {activeSecObj.secAvgPct || 0}<span className="text-xs text-slate-500 font-sans font-semibold ml-0.5">%</span>
                          </span>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Class Average
                        </h2>
                        <div className="text-xs text-slate-600 font-semibold">Exam Performance</div>
                      </div>
                    </div>
                  </section>

                  {/* BEGIN: Class In-Charge Card */}
                  <section className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {activeSecObj.inCharge ? (
                        <>
                          <div className="relative shrink-0">
                            <img
                              src={activeSecObj.inCharge.photoUrl}
                              alt={activeSecObj.inCharge.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs ring-1 ring-slate-200"
                            />
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              Class In-Charge
                            </h2>
                            <h3 className="text-lg font-bold text-slate-900 truncate">
                              {activeSecObj.inCharge.name}
                            </h3>
                            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{activeSecObj.inCharge.designation || 'Lecturer'}</span>
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-400 shrink-0">
                            <UserCheck className="w-8 h-8" />
                          </div>
                          <div>
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              Class In-Charge
                            </h2>
                            <h3 className="text-base font-bold text-slate-700 ">
                              Not Appointed
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Assign in-charge for {gm.grade} ({activeSecObj.section})
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenAssignInChargeModal && onOpenAssignInChargeModal(activeSecObj.inCharge)}
                      className="px-4 py-2.5 bg-white text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl text-xs transition-colors border border-slate-200 hover:border-emerald-200 shadow-2xs flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-800" />
                      <span>{activeSecObj.inCharge ? 'Change' : 'Assign'}</span>
                    </button>
                  </section>
                </div>

                {/* 3. Appointed Subjects Table */}
                <section className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden">
                  {/* Table Header Area */}
                  <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        Appointed Subject Teachers
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage teachers assigned to Grade {gm.grade} — {activeSecObj.section}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-700 font-bold shadow-2xs">
                        {activeSecObj.appointedTeachers.length} Active
                      </span>
                      {onOpenAssignClassModal && (
                        <button
                          type="button"
                          onClick={() => onOpenAssignClassModal()}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4 text-emerald-200" />
                          <span>Assign Teacher</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-white border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                        <tr>
                          <th className="px-6 py-4" scope="col">Assigned Teacher</th>
                          <th className="px-6 py-4" scope="col">Subject Taught</th>
                          <th className="px-6 py-4" scope="col">Designation</th>
                          <th className="px-6 py-4" scope="col">Status</th>
                          <th className="px-6 py-4 text-right" scope="col">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeSecObj.appointedTeachers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                              <p className="font-semibold text-slate-600 text-xs">
                                No subject teachers currently assigned to Grade {gm.grade} ({activeSecObj.section}).
                              </p>
                              {onOpenAssignClassModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenAssignClassModal()}
                                  className="mt-2 text-xs font-bold text-emerald-800 hover:underline cursor-pointer inline-flex items-center space-x-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Assign a teacher now</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          activeSecObj.appointedTeachers.map((ap, idx) => (
                            <tr
                              key={`${ap.teacher.id}-${ap.subject}-${idx}`}
                              className="hover:bg-slate-50/70 transition-colors bg-white group"
                            >
                              <td className="px-6 py-4">
                                <div
                                  onClick={() => onSelectTeacher && onSelectTeacher(ap.teacher)}
                                  className="flex items-center gap-3.5 cursor-pointer"
                                >
                                  <img
                                    src={ap.teacher.photoUrl}
                                    alt={ap.teacher.name}
                                    className="w-10 h-10 rounded-full object-cover shadow-2xs ring-1 ring-slate-200"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                                      {ap.teacher.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-medium">
                                      ID: {ap.teacher.employeeId || `DS-2024-${ap.teacher.id}`}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                                  {ap.subject}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-slate-600 font-semibold">
                                {ap.teacher.designation || 'Lecturer'}
                              </td>

                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  Active
                                </span>
                              </td>

                              <td className="px-6 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => onOpenAssignClassModal && onOpenAssignClassModal(ap.teacher)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 transition-colors inline-flex border border-transparent hover:border-emerald-200 cursor-pointer"
                                  title="Edit assignment details"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

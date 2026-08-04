import React, { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { Teacher, Student, Assessment } from '../types';

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

const FALLBACK_GRADES = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const normalizeGrade = (g: string): string => {
  if (!g) return '';
  return g
    .toLowerCase()
    .replace(/grade/g, '')
    .replace(/class/g, '')
    .trim();
};

const normalizeSection = (s: string): string => {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/section\s*/g, '')
    .replace(/sec\s*/g, '')
    .trim();
};

export const TeacherAssignmentMatrixView: React.FC<TeacherAssignmentMatrixViewProps> = ({
  teachers,
  students,
  assessments = [],
  grades: propGrades,
  sections: propSections,
  onOpenAssignClassModal,
  onOpenAssignInChargeModal,
  onSelectTeacher,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  // DB Settings State (Grades and Sections defined by Principal in Settings)
  const [dbGrades, setDbGrades] = useState<string[]>(propGrades || []);
  const [dbSections, setDbSections] = useState<string[]>(propSections || []);

  useEffect(() => {
    fetch('/api/settings')
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
  const [activeSectionPerGrade, setActiveSectionPerGrade] = useState<{ [grade: string]: string }>({});

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
        const parts = t.classInChargeOf.split(',');
        parts.forEach((part) => {
          const match = part.match(/(?:Grade|Class)?\s*([0-9]+(?:st|nd|rd|th)?|[A-Za-z0-9\s]+?)(?:\s*-|\s*\(|\s*$)/i);
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
        (s) => normalizeGrade(s.grade) === normGrade
      );

      // Filter real assessments for this grade
      const gradeAssessments = assessments.filter(
        (a) => normalizeGrade(a.grade) === normGrade
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
          if (!display.toLowerCase().startsWith('section')) {
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
          const parts = t.classInChargeOf.split(',');
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
        addSec('Section A');
        addSec('Section B');
        addSec('Section C');
      }

      const availableSections = Array.from(secMap.values()).sort();

      // Sections mapping
      const sections = availableSections.map((secName) => {
        const normSec = normalizeSection(secName);

        // Real Student Count
        const secStudents = gradeStudents.filter(
          (s) => normalizeSection(s.section || 'Section A') === normSec
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
          (a) => normalizeSection(a.section || 'Section A') === normSec
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
            } else if (asm.classAverage !== undefined && asm.classAverage !== null) {
              totalObtained += asm.classAverage;
              totalMax += 100;
            }
          });
          if (totalMax > 0) {
            secAvgPct = Math.round((totalObtained / totalMax) * 100) ;
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
                normalizeSection(c.section || 'Section A') === normSec
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
      const totalStudents = sections.reduce((acc, s) => acc + s.studentCount, 0);
      const validPcts = sections
        .map((s) => s.secAvgPct)
        .filter((p): p is number => p !== null);

      const gradeAvgPct =
        validPcts.length > 0
          ? Math.round((validPcts.reduce((a, b) => a + b, 0) / validPcts.length) * 10) / 10
          : null;

      const totalGradeAllocations = sections.reduce(
        (acc, s) => acc + s.appointedTeachers.length,
        0
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
        gradeFilter === 'All' ||
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
                ap.teacher.department.toLowerCase().includes(term)
            )
        );

      return matchesGradeFilter && matchesTerm;
    });
  }, [gradeMatrixData, gradeFilter, searchTerm]);

  // Overall Statistics
  const totalStudentsAll = gradeMatrixData.reduce((acc, g) => acc + g.totalStudents, 0);
  const totalAllocatedTeachers = gradeMatrixData.reduce(
    (acc, g) => acc + g.totalGradeAllocations,
    0
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
            Class In-Charge appointments & active subject teacher assignments fetched directly from records.
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
            <div className="text-[11px] font-semibold text-slate-500">Enrolled Students</div>
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
            <div className="text-[11px] font-semibold text-slate-500">Teaching Staff</div>
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
            <div className="text-[11px] font-semibold text-slate-500">Active Subject Assignments</div>
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
          {['All', ...dynamicGrades].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                gradeFilter === g
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Full-Width Grade Cards Stack */}
      <div className="space-y-6">
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
              <div
                key={gm.grade}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
              >
                {/* Full-Width Grade Header Banner */}
                <div className="  bg-white p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left Title */}
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-800 border border-emerald-600/40 flex flex-col items-center justify-center font-bold text-white shadow-xs">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-200">Grade</span>
                      <span className="text-lg font-bold leading-none">{gm.grade}</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold  font-['Playfair_Display']">
                        Grade {gm.grade}
                      </h2>
                      <div className="flex items-center space-x-3 text-xs  mt-0.5">
                        <span>Total Students: <strong className="">{gm.totalStudents}</strong></span>
                        <span>•</span>
                        <span>Assigned Teachers: <strong className="text-sky-600">{gm.uniqueAssignedTeachersCount}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Section Tabs */}
                  <div className="flex items-center  p-1.5 rounded-xl border  bg-slate-50 gap-1 w-full md:w-auto overflow-x-auto">
                    {gm.sections.map((sec) => {
                      const isActive = sec.section === activeSectionName;
                      return (
                        <button
                          key={sec.section}
                          type="button"
                          onClick={() => handleSectionTabChange(gm.grade, sec.section)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-2 ${
                            isActive
                              ? 'bg-emerald-800 text-white shadow-2xs'
                              : ' '
                          }`}
                        >
                          <span>{sec.section}</span>
                         
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section View Content */}
                {activeSecObj && (
                  <div className="p-6 space-y-6">
                    {/* Top Section Summary & Class In-Charge */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Section Stats Card */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Active Section
                          </div>
                          <div className="text-base font-bold text-slate-900 mt-0.5 font-['Playfair_Display']">
                            Grade {gm.grade} — {activeSecObj.section}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Enrolled: <strong className="text-amber-600">{activeSecObj.studentCount}</strong> Students
                          </div>
                        </div>

                        {/* Clean Percentage Display */}
                        <div className="text-right border-l border-slate-200 pl-4">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Class Average
                          </div>
                          <div className="text-2xl font-bold text-slate-900 font-['Playfair_Display'] mt-0.5">
                            {activeSecObj.secAvgPct !== null ? `${activeSecObj.secAvgPct}%` : '—'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {activeSecObj.secAvgPct !== null ? 'Exam Performance' : 'No test records'}
                          </div>
                        </div>
                      </div>

                      {/* Class In-Charge Card */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                              CLASS IN-CHARGE TEACHER
                            </span>
                          </div>

                          {activeSecObj.inCharge ? (
                            <div
                              onClick={() =>
                                onSelectTeacher &&
                                activeSecObj.inCharge &&
                                onSelectTeacher(activeSecObj.inCharge)
                              }
                              className="flex items-center space-x-3 cursor-pointer pt-1"
                            >
                              <img
                                src={activeSecObj.inCharge.photoUrl}
                                alt={activeSecObj.inCharge.name}
                                className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-300"
                              />
                              <div>
                                <div className="font-bold text-slate-900 text-xs hover:text-emerald-800">
                                  {activeSecObj.inCharge.name}
                                </div>
                                <div className="text-[11px] text-emerald-800 font-semibold">
                                  {activeSecObj.inCharge.designation}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic pt-1">
                              No In-Charge appointed for {activeSecObj.section}
                            </div>
                          )}
                        </div>

                        {onOpenAssignInChargeModal && (
                          <button
                            type="button"
                            onClick={() => onOpenAssignInChargeModal(activeSecObj.inCharge)}
                            className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
                          >
                            {activeSecObj.inCharge ? 'Change' : '+ Appoint'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Appointed Teachers List ONLY */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Appointed Subject Teachers 
                        </h3>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-semibold text-slate-500">
                            {activeSecObj.appointedTeachers.length} Appointed
                          </span>
                          {onOpenAssignClassModal && (
                            <button
                              type="button"
                              onClick={() => onOpenAssignClassModal()}
                              className="text-xs font-bold text-sky-800 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Assign Teacher</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {activeSecObj.appointedTeachers.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 space-y-2">
                          <p className="text-xs font-semibold text-slate-600">
                            No subject teachers currently appointed for {gm.grade} ({activeSecObj.section}).
                          </p>
                          {onOpenAssignClassModal && (
                            <button
                              type="button"
                              onClick={() => onOpenAssignClassModal()}
                              className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:underline cursor-pointer pt-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Appoint a subject teacher now</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50">
                                <th className="p-3">Assigned Teacher</th>
                                <th className="p-3">Subject Taught</th>
                                <th className="p-3 hidden md:block">Designation</th>
                                <th className="p-3">Qualification</th>
                                <th className="p-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeSecObj.appointedTeachers.map((ap, idx) => (
                                <tr
                                  key={`${ap.teacher.id}-${ap.subject}-${idx}`}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  <td className="p-3">
                                    <div
                                      onClick={() =>
                                        onSelectTeacher && onSelectTeacher(ap.teacher)
                                      }
                                      className="flex items-center space-x-2.5 cursor-pointer group"
                                    >
                                      <img
                                        src={ap.teacher.photoUrl}
                                        alt={ap.teacher.name}
                                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                                      />
                                      <div>
                                        <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                                          {ap.teacher.name}
                                        </div>
                                        <div className="text-[10px] hidden md:block text-slate-400">
                                          ID: {ap.teacher.employeeId || ap.teacher.id}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 font-bold text-emerald-900">
                                    <span className="bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/80">
                                      {ap.subject}
                                    </span>
                                  </td>
                                  <td className="p-3 font-medium hidden md:block text-slate-600">
                                    {ap.teacher.designation}
                                  </td>
                                  <td className="p-3 font-medium text-slate-500">
                                    {ap.teacher.qualification || '—'}
                                  </td>
                                  <td className="p-3 text-right">
                                    {onOpenAssignClassModal && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenAssignClassModal(ap.teacher)}
                                        className="text-emerald-800 hover:text-emerald-950 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                                      >
                                        
                                        <PencilLine  className='w-4 h-4 '/>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

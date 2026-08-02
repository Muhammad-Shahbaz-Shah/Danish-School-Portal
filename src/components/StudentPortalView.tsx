import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Eye,
  GraduationCap,
  Loader2,
  Search,
  Trash2
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AiSettings, Student, UserSession } from '../types';

interface StudentPortalViewProps {
  students: Student[];
  currentUser?: UserSession;
  aiSettings?: AiSettings;
  onSelectStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onOpenAiInsights: (student: Student) => void;
  onOpenPromoteModal?: () => void;
}

const PAGE_LIMIT = 12;

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  students: initialStudentsList,
  currentUser,
  aiSettings,
  onSelectStudent,
  onDeleteStudent,
  onOpenAiInsights,
  onOpenPromoteModal,
}) => {
  const [rollSearch, setRollSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [dbGrades, setDbGrades] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.grades) && data.grades.length > 0) {
          setDbGrades(data.grades);
        }
      })
      .catch(() => {});
  }, []);

  // Infinite Scroll State
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Function to load a specific page
  const fetchStudents = useCallback(
    async (targetPage: number, resetList = false, searchVal = rollSearch, gradeVal = gradeFilter) => {
      try {
        if (targetPage === 1) {
          if (resetList) setInitialLoading(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: PAGE_LIMIT.toString(),
        });
        if (gradeVal && gradeVal !== 'All') {
          params.append('grade', gradeVal);
        }
        if (searchVal.trim()) {
          params.append('search', searchVal.trim());
        }

        const res = await fetch(`/api/students?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch students');

        const data = await res.json();

        let newItems: Student[] = [];
        let total = 0;
        let more = false;

        if (data && Array.isArray(data.students)) {
          newItems = data.students;
          total = data.total || 0;
          more = !!data.hasMore;
        } else if (Array.isArray(data)) {
          newItems = data;
          total = data.length;
          more = false;
        }

        setTotalCount(total);

        setStudents((prev) => {
          if (resetList || targetPage === 1) {
            return newItems;
          }
          // Deduplicate by student ID
          const existingIds = new Set(prev.map((s) => s.id));
          const filteredNew = newItems.filter((s) => !existingIds.has(s.id));
          return [...prev, ...filteredNew];
        });

        setHasMore(more);
        setPage(targetPage + 1);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [rollSearch, gradeFilter]
  );

  // Handle Search input change with debounce or immediate trigger on grade filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchStudents(1, true, rollSearch, gradeFilter);
    }, 300);

    return () => clearTimeout(handler);
  }, [rollSearch, gradeFilter, fetchStudents]);

  // Infinite Scroll IntersectionObserver Setup
  useEffect(() => {
    if (loading || initialLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !initialLoading) {
          fetchStudents(page, false, rollSearch, gradeFilter);
        }
      },
      { threshold: 0.2, rootMargin: '100px' }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, initialLoading, page, fetchStudents, rollSearch, gradeFilter]);

  const handleDelete = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
    onDeleteStudent(id);
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className=" p-6 rounded-2xl shadow-xs  bg-white  border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-white bg-amber-600   px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              STUDENT DIRECTORY & SEARCH PORTAL
            </span>
            
          </div>
          <h1 className="text-2xl font-bold font-['Playfair_Display'] mt-1">
            Student Records & Roll Number Lookup
          </h1>
         
        </div>

        {/* Actions & Search Box in Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {onOpenPromoteModal && currentUser?.userType === 'principal' && (
            <button
              onClick={onOpenPromoteModal}
              className="flex items-center justify-center space-x-2 bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all border border-amber-500/30 shrink-0 cursor-pointer"
              title="Promote classes and graduate 12th Grade with Principal authorization"
            >
              <GraduationCap className="w-4 h-4 text-amber-200" />
              <span>Promote Classes & Graduate 12th</span>
            </button>
          )}

          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={rollSearch}
              onChange={(e) => setRollSearch(e.target.value)}
              placeholder="Type Roll No or Name..."
              className="w-full pl-9 pr-4 py-2.5  border bg-slate-50  border-slate-200   rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Grade Filters */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center space-x-2 shrink-0">
          {['All', ...dbGrades].map((grade) => (
            <button
              key={grade}
              onClick={() => setGradeFilter(grade)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                gradeFilter === grade
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {grade === 'All' ? 'All Grades' : `${grade} Grade`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-semibold shrink-0">
          Records Loaded: <span className="text-slate-900 font-bold">{students.length}</span> / {totalCount}
        </div>
      </div>

      {/* Initial Loading Skeletons */}
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-5 bg-slate-200 rounded"></div>
                <div className="w-16 h-4 bg-slate-100 rounded"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
                  <div className="w-1/2 h-3 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <div className="h-10 bg-slate-100 rounded-lg"></div>
                <div className="h-10 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Student Records Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No students matched your search filter "{rollSearch}" for grade {gradeFilter}. Try adjusting your criteria or clearing search.
          </p>
        </div>
      ) : (
        <>
          {/* Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student, idx) => (
              <div
                key={`${student.id}-${idx}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      {student.rollNo}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {student.house} House
                    </span>
                  </div>

                  <div className="flex items-center space-x-3.5 mb-4">
                    <img
                      src={student.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                      alt={student.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-600/20"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                        {student.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{student.grade} - {student.section}</p>
                      <p className="text-[11px] text-slate-400">Guardian: {student.guardianName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-emerald-50 p-2 rounded-lg text-center col-span-2">
                      <span className="text-[10px] text-emerald-800 font-bold block uppercase">ENTRY TEST MARKS</span>
                      <span className="font-extrabold text-emerald-950 text-sm">{student.entryTestMarks || 85} / 100</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  {aiSettings?.aiEnabled !== false ? (
                    <button
                      onClick={() => onOpenAiInsights(student)}
                      className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-bold text-xs"
                    >
                      <Bot className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                      <span>AI Insights</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Record Active</span>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSelectStudent(student)}
                      className="flex items-center space-x-1 bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Dossier</span>
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sentinel Element & Infinite Scroll Status Bar */}
          <div ref={observerRef} className="pt-6 pb-2 text-center">
            {loading && (
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-2xs text-xs font-bold text-emerald-800 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span>Loading more student records...</span>
              </div>
            )}

            {!hasMore && students.length > 0 && (
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>All {students.length} student records loaded</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

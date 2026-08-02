import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Database,
  CheckSquare,
  Square,
  Users,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface PromoteClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface GradeAnalysis {
  grade: string;
  studentCount: number;
  action: 'graduate' | 'promote';
  targetGrade?: string;
}

export const PromoteClassModal: React.FC<PromoteClassModalProps> = ({ onClose, onSuccess }) => {
  const { addToast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingDb, setLoadingDb] = useState(true);

  // Analyzed classes from DB
  const [dbClassAnalysis, setDbClassAnalysis] = useState<GradeAnalysis[]>([]);
  const [selectedGradeSet, setSelectedGradeSet] = useState<Set<string>>(new Set());

  // Analyze Database for active classes and student counts
  useEffect(() => {
    const analyzeDatabase = async () => {
      setLoadingDb(true);
      try {
        const res = await fetch('/api/students');
        if (!res.ok) throw new Error('Failed to query database');
        const students = await res.json();

        // Count students per grade
        const counts: Record<string, number> = {};
        if (Array.isArray(students)) {
          students.forEach((s) => {
            const g = (s.grade || '10th').trim();
            counts[g] = (counts[g] || 0) + 1;
          });
        }

        // Standard Grade Order: 6th, 7th, 8th, 9th, 10th, 11th, 12th
        const defaultGradeList = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];
        const detectedGrades = Array.from(new Set([...defaultGradeList, ...Object.keys(counts)]));

        // Sort numerical grade order
        const sortOrder = (g: string) => {
          const num = parseInt(g.replace(/\D/g, ''), 10);
          return isNaN(num) ? 99 : num;
        };

        detectedGrades.sort((a, b) => sortOrder(a) - sortOrder(b));

        const analysis: GradeAnalysis[] = detectedGrades.map((g, idx) => {
          const num = sortOrder(g);
          const nextGrade = num < 12 ? `${num + 1}th` : 'Graduated';
          const count = counts[g] || 0;

          if (num === 12 || g.toLowerCase().includes('12')) {
            return {
              grade: g,
              studentCount: count,
              action: 'graduate',
            };
          } else {
            return {
              grade: g,
              studentCount: count,
              action: 'promote',
              targetGrade: nextGrade,
            };
          }
        });

        // Filter analysis to include grades that have standard names or students
        const validAnalysis = analysis.filter((a) => defaultGradeList.includes(a.grade) || a.studentCount > 0);

        setDbClassAnalysis(validAnalysis);

        // By default, select all detected grades for promotion
        const allGradesSet = new Set(validAnalysis.map((a) => a.grade));
        setSelectedGradeSet(allGradesSet);
      } catch (err) {
        console.error('Failed to analyze DB classes:', err);
        // Fallback default analysis
        const fallback: GradeAnalysis[] = [
          { grade: '12th', studentCount: 0, action: 'graduate' },
          { grade: '11th', studentCount: 0, action: 'promote', targetGrade: '12th' },
          { grade: '10th', studentCount: 0, action: 'promote', targetGrade: '11th' },
          { grade: '9th', studentCount: 0, action: 'promote', targetGrade: '10th' },
          { grade: '8th', studentCount: 0, action: 'promote', targetGrade: '9th' },
          { grade: '7th', studentCount: 0, action: 'promote', targetGrade: '8th' },
          { grade: '6th', studentCount: 0, action: 'promote', targetGrade: '7th' },
        ];
        setDbClassAnalysis(fallback);
        setSelectedGradeSet(new Set(fallback.map((f) => f.grade)));
      } finally {
        setLoadingDb(false);
      }
    };

    analyzeDatabase();
  }, []);

  const toggleGradeSelection = (grade: string) => {
    setSelectedGradeSet((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) {
        next.delete(grade);
      } else {
        next.add(grade);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedGradeSet.size === dbClassAnalysis.length) {
      setSelectedGradeSet(new Set());
    } else {
      setSelectedGradeSet(new Set(dbClassAnalysis.map((a) => a.grade)));
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorized) {
      addToast('Authorization Required', 'error', 'You must explicitly confirm Principal Authorization before proceeding.');
      return;
    }

    if (selectedGradeSet.size === 0) {
      addToast('No Classes Selected', 'warning', 'Please select at least one class from the database analysis to promote.');
      return;
    }

    setSubmitting(true);

    try {
      const selectedGradesArray = Array.from(selectedGradeSet);

      const res = await fetch('/api/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principalAuthorized: true,
          passcode: passcode.trim(),
          selectedGrades: selectedGradesArray,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to complete annual promotion');
      }

      const data = await res.json();

      addToast(
        'Annual Promotion Completed',
        'success',
        `${data.graduatedCount || 0} graduating students processed. ${data.promotedCount || 0} students promoted across selected classes!`
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('Promotion Failed', 'error', err.message || 'An error occurred during promotion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-linear-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 ring-2 ring-amber-400/50 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    Principal Executive Action
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold hidden sm:inline">
                    Database Academic Analysis
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-['Playfair_Display'] text-white mt-1">
                  Annual Class Promotion & Graduation
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50 text-xs">
          
          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3.5 text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Principal Authorization & Class Selection</h4>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                The system has analyzed active class rosters in the database. Select the specific classes you wish to promote to the next grade level or graduate.
              </p>
            </div>
          </div>

          {/* Database Class Analysis & Selection List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-emerald-700" />
                <span>Database Class Analysis ({dbClassAnalysis.length} Classes Detected)</span>
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[10px] font-bold text-indigo-700 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                {selectedGradeSet.size === dbClassAnalysis.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Select All Classes</span>
                  </>
                )}
              </button>
            </div>

            {loadingDb ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-700 mx-auto" />
                <p className="text-slate-500 font-semibold text-xs">Querying database for active class rosters...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dbClassAnalysis.map((item) => {
                  const isSelected = selectedGradeSet.has(item.grade);
                  const isGraduate = item.action === 'graduate';

                  return (
                    <div
                      key={item.grade}
                      onClick={() => toggleGradeSelection(item.grade)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? isGraduate
                            ? 'bg-rose-50/80 border-rose-200 ring-1 ring-rose-300'
                            : 'bg-emerald-50/80 border-emerald-200 ring-1 ring-emerald-300'
                          : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleGradeSelection(item.grade)}
                          className="h-4 w-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-600 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-2">
                            <span>{item.grade} Grade Class</span>
                            <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                              <Users className="w-3 h-3 text-slate-500" />
                              <span>{item.studentCount} Students in DB</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {isGraduate ? (
                              <span className="text-rose-700 font-semibold">
                                Graduation & Record Archival from Active DB Roster
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                Promotion to next academic level
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isGraduate ? (
                          <span className="bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-[10px] px-2.5 py-1 rounded-lg">
                            Graduate Class
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1.5 font-bold text-emerald-800 text-xs">
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Promote to <strong className="font-extrabold text-slate-900">{item.targetGrade}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Principal Authorization Checkbox Form */}
          <form onSubmit={handlePromote} className="space-y-4 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-start space-x-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer" onClick={() => setAuthorized(!authorized)}>
              <input
                type="checkbox"
                id="principalAuth"
                checked={authorized}
                onChange={(e) => setAuthorized(e.target.checked)}
                className="mt-1 h-4 w-4 text-emerald-800 focus:ring-emerald-600 rounded border-slate-300 cursor-pointer"
              />
              <label htmlFor="principalAuth" className="text-xs text-slate-900 font-semibold cursor-pointer leading-snug">
                I hereby declare as the <strong className="text-emerald-900 font-bold">Principal of Punjab Daanish Schools</strong> that I officially permit and authorize this annual class promotion for the <strong className="text-emerald-950 font-extrabold">{selectedGradeSet.size} selected classes</strong>.
              </label>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Principal Authorization Passcode / Notes (Optional)</span>
              </label>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="e.g. PRINCIPAL-2026-APPROVAL"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-amber-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!authorized || submitting || selectedGradeSet.size === 0}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                !authorized || submitting || selectedGradeSet.size === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-linear-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Promotion & Updating Database Records...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4.5 h-4.5 text-amber-300" />
                  <span>Authorize & Execute Promotion ({selectedGradeSet.size} Classes Selected)</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Audited Principal Permission Flow</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

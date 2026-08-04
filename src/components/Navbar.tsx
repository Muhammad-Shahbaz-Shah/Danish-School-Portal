import {
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle2,
  GraduationCap,
  Menu,
  MessageSquare,
  Search,
  Send,
  Trash2,
  UserCheck,
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { AiSettings, Assessment, Student, SystemNotification, Teacher, UserSession } from '../types';

interface NavbarProps {
  currentUser: UserSession;
  students?: Student[];
  teachers?: Teacher[];
  assessments?: Assessment[];
  onSearchRollNo: (rollNo: string) => void;
  onSelectStudent?: (s: Student) => void;
  onSelectTeacher?: (t: Teacher) => void;
  onSelectAssessment?: (asm: Assessment) => void;
  onOpenAiInsights?: () => void;
  onOpenCopilot?: () => void;
  aiSettings?: AiSettings;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  students = [],
  teachers = [],
  assessments = [],
  onSearchRollNo,
  onSelectStudent,
  onSelectTeacher,
  onSelectAssessment,
  onOpenAiInsights,
  onOpenCopilot,
  aiSettings,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const { addToast, isOffline, checkConnection } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);



  const notifRef = useRef<HTMLDivElement>(null);

  




  // Filtered live results
  const query = searchInput.trim().toLowerCase();
  const matchedStudents = query.length > 0
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.rollNo.toLowerCase().includes(query) ||
          (s.guardianName && s.guardianName.toLowerCase().includes(query)) ||
          s.grade.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const matchedTeachers = query.length > 0
    ? teachers.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.employeeId.toLowerCase().includes(query) ||
          t.department.toLowerCase().includes(query) ||
          t.designation.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchedAssessments = query.length > 0
    ? assessments.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.subject.toLowerCase().includes(query) ||
          a.grade.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const hasAnyMatches = matchedStudents.length > 0 || matchedTeachers.length > 0 || matchedAssessments.length > 0;

  // For Student user, render simplified top header with mobile sidebar toggle
  if (currentUser.userType === 'student') {
    return (
      <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex items-center space-x-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="p-2 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl md:hidden transition-colors flex items-center space-x-1.5 shrink-0"
              title="Toggle Navigation Menu"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <Menu className="w-5 h-5 text-emerald-800" />}
              <span className="text-xs font-bold text-emerald-900 hidden sm:inline">Menu</span>
            </button>
          )}

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-extrabold text-emerald-700 leading-none">
                PUNJAB DAANISH
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Student Portal
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
            {currentUser.userName}
          </span>
          <button
            onClick={() => onSearchRollNo('')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            title="Open Directory Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>
    );
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchRollNo(searchInput.trim());
    }
  };


  


 

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 py-1 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left side: Hamburger Toggle for Mobile + Search */}
      <div className="flex items-center space-x-3 flex-1 max-w-md">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-emerald-900 bg-emerald-50  hover:bg-emerald-100 border border-emerald-300 rounded-xl md:hidden transition-colors flex justify-center items-center  shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <Menu className="w-5 h-5 text-emerald-800" />}
            <span className="text-xs font-bold text-emerald-900 hidden sm:inline">Menu</span>
          </button>
        )}

        {/* Global Multi-Category Search */}
        <div ref={searchContainerRef} className="relative w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowSearchResults(false);
              handleSearchSubmit(e);
            }}
            className="flex items-center space-x-2 w-full"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onFocus={() => setShowSearchResults(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSearchResults(true);
                }}
                placeholder="Search Student Name, Roll No., Teacher, Subject..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shrink-0 transition-colors hidden sm:block cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Interactive Live Results Dropdown */}
          {showSearchResults && query.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 max-h-96 overflow-y-auto space-y-3 font-['Plus_Jakarta_Sans',sans-serif]">
              {!hasAnyMatches ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No student, faculty, or assessment found matching &quot;{searchInput}&quot;.
                </div>
              ) : (
                <>
                  {/* Student Matches */}
                  {matchedStudents.length > 0 && (
                    <div>
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                        Students ({matchedStudents.length})
                      </div>
                      <div className="space-y-1">
                        {matchedStudents.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              if (onSelectStudent) onSelectStudent(s);
                              else onSearchRollNo(s.rollNo);
                            }}
                            className="flex items-center justify-between p-2 hover:bg-emerald-50 rounded-xl cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={s.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                                alt={s.name}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/20"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900">{s.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {s.rollNo} • {s.grade} ({s.section})
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              View Profile
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teacher Matches */}
                  {matchedTeachers.length > 0 && (
                    <div>
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-2 border-t border-slate-100 pt-2">
                        Faculty Members ({matchedTeachers.length})
                      </div>
                      <div className="space-y-1">
                        {matchedTeachers.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              if (onSelectTeacher) onSelectTeacher(t);
                            }}
                            className="flex items-center justify-between p-2 hover:bg-sky-50 rounded-xl cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={t.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                                alt={t.name}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-sky-500/20"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900">{t.name}</div>
                                <div className="text-[10px] text-slate-500">
                                  {t.designation} • {t.department}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                              Faculty File
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assessment Matches */}
                  {matchedAssessments.length > 0 && (
                    <div>
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-2 border-t border-slate-100 pt-2">
                        Assessments ({matchedAssessments.length})
                      </div>
                      <div className="space-y-1">
                        {matchedAssessments.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              if (onSelectAssessment) onSelectAssessment(a);
                            }}
                            className="flex items-center justify-between p-2 hover:bg-amber-50 rounded-xl cursor-pointer transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-900">{a.title}</div>
                              <div className="text-[10px] text-slate-500">
                                {a.subject} • {a.grade} ({a.section})
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Result Sheet
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Top Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        
        {/* AI Copilot Button */}
        {aiSettings?.aiEnabled !== false && onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 bg-linear-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all ring-1 ring-emerald-500/30 cursor-pointer"
            title="Open AI Academic Copilot"
          >
            <Bot className='w-4 h-4' />
            <span>My AI</span>
          </button>
        )}

        


        {/* User Badge */}
        <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-900 text-amber-300 font-bold flex items-center justify-center text-xs ring-2 ring-emerald-600/30">
            {currentUser.userName.charAt(0)}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.userName}</div>
            <div className="text-[10px] text-slate-500 font-medium capitalize">
              {currentUser.userType === 'principal' ? 'Campus Principal' : 'Faculty Member'}
            </div>
          </div>
        </div>
      </div>

      
     
    </header>
  );
};

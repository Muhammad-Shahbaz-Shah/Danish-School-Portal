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
  const [showNotif, setShowNotif] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Compose Notification Form state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifPriority, setNotifPriority] = useState<'Urgent' | 'Academic' | 'Normal'>('Normal');
  const [targetRole, setTargetRole] = useState<'principal' | 'teacher' | 'all'>(
    currentUser.userType === 'teacher' ? 'principal' : 'teacher'
  );
  const [isSending, setIsSending] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch real notifications from backend API
  const fetchNotifications = () => {
    fetch(`/api/notifications?role=${currentUser.userType || 'principal'}&userEmail=${encodeURIComponent(currentUser.userEmail || '')}`)
      .then(async (res) => {
        if (!res.ok) return [];
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          return [];
        }
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close notifications or search overlay on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    notifications.forEach((n) => {
      if (!n.isRead) {
        fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {});
      }
    });
    addToast('Notifications Read', 'info', 'All alerts marked as read.');
  };

  const handleClearAll = () => {
    notifications.forEach((n) => {
      fetch(`/api/notifications/${n.id}`, { method: 'DELETE' }).catch(() => {});
    });
    setNotifications([]);
    addToast('Cleared Alerts', 'info', 'All notifications cleared.');
  };

  const handleDismissOne = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleMarkSingleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      addToast('Validation Error', 'error', 'Please enter both subject title and message content.');
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderRole: currentUser.userType,
          senderName: currentUser.userName,
          senderEmail: currentUser.userEmail,
          targetRole: currentUser.userType === 'teacher' ? 'principal' : targetRole,
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          priority: notifPriority,
          type: 'inter-role',
        }),
      });

      if (res.ok) {
        const created = await res.json();
        addToast(
          'Notification Sent!',
          'success',
          `Dispatched alert to ${currentUser.userType === 'teacher' ? 'Principal Dr. Ahmad Khan' : 'Faculty Members'}.`
        );
        setNotifTitle('');
        setNotifMessage('');
        setShowComposeModal(false);
        fetchNotifications();
      } else {
        addToast('Sending Failed', 'error', 'Unable to dispatch notification at this moment.');
      }
    } catch (err) {
      addToast('Error', 'error', 'Failed to connect to backend server.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs font-['Plus_Jakarta_Sans',sans-serif]">
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

        {/* Send Notification Button */}
        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center md:space-x-1.5 bg-emerald-100 text-center justify-center hover:bg-emerald-200 text-emerald-900 p-2 md:px-3 md:py-1.5  rounded-full md:rounded-xl text-xs font-bold transition-all border border-emerald-300"
          title={currentUser.userType === 'teacher' ? 'Send message to Principal' : 'Notify Faculty Members'}
        >
          <Send className="w-3.5 h-3.5 text-emerald-800" />
          <span className="hidden sm:inline">Send Alert</span>
        </button>

        {/* Notification Icon & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-xl relative transition-colors focus:outline-none"
            title="Campus Notifications & Inter-Role Alerts"
          >
            <Bell className="w-4.5 h-4.5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-white text-[9px] text-slate-950 font-extrabold items-center justify-center">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          {/* Notifications Flyout Card */}
          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">Notifications & Role Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-[11px]">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-emerald-700 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    No campus notifications for your role
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMarkSingleRead(item.id)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between space-x-2 ${
                        !item.isRead ? 'bg-emerald-50/40 border-l-4 border-emerald-600' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                          item.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : item.priority === 'Academic'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.priority === 'Urgent' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : item.senderRole === 'teacher' ? (
                            <GraduationCap className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-slate-900 leading-snug">
                              {item.title}
                            </span>
                            {!item.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                            )}
                          </div>
                          
                          <div className="text-[11px] text-slate-600 mt-1 leading-tight">
                            {item.message}
                          </div>

                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1.5 font-medium">
                            <span className="text-emerald-800 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">
                              From: {item.senderName} ({item.senderRole})
                            </span>
                            <span>• {item.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissOne(item.id);
                        }}
                        className="text-slate-300 hover:text-slate-500 p-1 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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

      {/* Compose Inter-Role Notification Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Dispatch Inter-Role Alert</h2>
                  <p className="text-xs text-slate-500">
                    Send real-time portal notification to {currentUser.userType === 'teacher' ? 'Principal' : 'Faculty'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowComposeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sender</label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.userName} (${currentUser.userType.toUpperCase()})`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600 cursor-not-allowed"
                />
              </div>

              {currentUser.userType === 'principal' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Recipient</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  >
                    <option value="teacher">All Faculty Members / Teachers</option>
                    <option value="principal">Campus Administration</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNotifPriority('Normal')}
                    className={`py-1.5 px-3 rounded-xl font-bold transition-all ${
                      notifPriority === 'Normal'
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifPriority('Academic')}
                    className={`py-1.5 px-3 rounded-xl font-bold transition-all ${
                      notifPriority === 'Academic'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Academic
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifPriority('Urgent')}
                    className={`py-1.5 px-3 rounded-xl font-bold transition-all ${
                      notifPriority === 'Urgent'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Urgent
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder={
                    currentUser.userType === 'teacher'
                      ? 'e.g. Leave Application / Re-checking Request'
                      : 'e.g. Mandatory Staff Meeting / Board Exam Directive'
                  }
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type message details here..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Dispatch Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

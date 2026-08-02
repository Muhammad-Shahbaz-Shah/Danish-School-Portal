import React, { useState, useEffect } from 'react';
import { Preloader } from './components/Preloader';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ResultsUploadView } from './components/ResultsUploadView';
import { StudentRegistrationView } from './components/StudentRegistrationView';
import { FacultyView } from './components/FacultyView';
import { TeacherAssignmentMatrixView } from './components/TeacherAssignmentMatrixView';
import { TeacherProfileView } from './components/TeacherProfileView';
import { StudentProfileView } from './components/StudentProfileView';
import { StudentPortalView } from './components/StudentPortalView';
import { SettingsView } from './components/SettingsView';
import { MyProfileView } from './components/MyProfileView';
import { AiAnalysisModal } from './components/AiAnalysisModal';
import { AiClassInsightsModal } from './components/AiClassInsightsModal';
import { AiCopilotModal } from './components/AiCopilotModal';
import { AssignClassModal } from './components/AssignClassModal';
import { AssignInChargeModal } from './components/AssignInChargeModal';
import { PromoteClassModal } from './components/PromoteClassModal';

import { ToastProvider, useToast } from './context/ToastContext';

import {
  Student,
  Teacher,
  Assessment,
  SchoolStats,
  PerformanceTrendPoint,
  UserSession,
  StudentMark,
  AiSettings,
  ClassSchedule,
} from './types';

import {
  initialStats,
  initialPerformanceTrend,
  initialStudents,
  initialTeachers,
  initialAssessments,
} from './data/mockData';

// Route Protection Helper
const isTabAuthorized = (tab: string, role: 'principal' | 'teacher' | 'student'): boolean => {
  if (role === 'principal') {
    return ['dashboard', 'faculty', 'assignment-matrix', 'students', 'student-portal', 'student-registration', 'settings', 'student-profile', 'teacher-profile',"my-profile"].includes(tab);
  }
  if (role === 'teacher') {
    return ['dashboard', 'assignment-matrix', 'students',"my-profile", 'results-upload', 'student-portal', 'student-profile'].includes(tab);
  }
  if (role === 'student') {
    return ['student-profile', 'student-portal'].includes(tab);
  }
  return false;
};

const getDefaultTabForRole = (role: 'principal' | 'teacher' | 'student'): string => {
  if (role === 'student') return 'student-profile';
  return 'dashboard';
};

function AppContent() {
  const { addToast } = useToast();
  const [showPreloader, setShowPreloader] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('daanish_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      isLoggedIn: false, // Start at the login page by default
      userType: 'principal',
      userName: '',
      userEmail: '',
    };
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // AI Configuration State
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => {
    const saved = localStorage.getItem('daanish_ai_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { aiEnabled: true, geminiApiKey: '' };
  });

  // AI Modals State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalStudent, setAiModalStudent] = useState<Student | null>(null);

  const [showClassAiModal, setShowClassAiModal] = useState(false);
  const [aiModalAssessment, setAiModalAssessment] = useState<Assessment | null>(null);

  const [showNoticeAiModal, setShowNoticeAiModal] = useState(false);
  const [showCopilotModal, setShowCopilotModal] = useState(false);
  const [showQuizGenModal, setShowQuizGenModal] = useState(false);
  const [showLessonPlanModal, setShowLessonPlanModal] = useState(false);

  // Class Assignment Modal State
  const [showAssignClassModal, setShowAssignClassModal] = useState(false);
  const [assignClassTeacherId, setAssignClassTeacherId] = useState<string | undefined>(undefined);

  // In-Charge Assignment Modal State
  const [showAssignInChargeModal, setShowAssignInChargeModal] = useState(false);
  const [assignInChargeTeacherId, setAssignInChargeTeacherId] = useState<string | undefined>(undefined);

  // Class Promotion Modal State
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  // Deduplication Helpers
  const deduplicateById = <T extends { id: string }>(list: T[]): T[] => {
    const seen = new Set<string>();
    return list.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // Data Collections State (Loaded live from DB)
  const [stats, setStats] = useState<SchoolStats>(initialStats);
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrendPoint[]>(initialPerformanceTrend);
  const [students, setStudents] = useState<Student[]>(() => deduplicateById(initialStudents));
  const [teachers, setTeachers] = useState<Teacher[]>(() => deduplicateById(initialTeachers));
  const [assessments, setAssessments] = useState<Assessment[]>(() => deduplicateById(initialAssessments));

  // Route Protection Guard
  useEffect(() => {
    if (!session.isLoggedIn) return;
    if (!isTabAuthorized(activeTab, session.userType)) {
      const fallback = getDefaultTabForRole(session.userType);
      setActiveTab(fallback);
      addToast(
        'Access Restricted',
        'error',
        `Your role (${session.userType.toUpperCase()}) does not have permission to view page "${activeTab}". Redirected to authorized section.`
      );
    }
  }, [activeTab, session.userType, session.isLoggedIn]);

  // Sync real database records from backend API with initial connection handshake
  useEffect(() => {
    const fetchApplicationData = () => {
      fetch('/api/stats')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setStats(data);
        })
        .catch(() => {});

      fetch('/api/performance-trend')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setPerformanceTrend(data);
        })
        .catch(() => {});

      fetch('/api/students')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setStudents(deduplicateById(data));
        })
        .catch(() => {});

      fetch('/api/faculty')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setTeachers(deduplicateById(data));
        })
        .catch(() => {});

      fetch('/api/assessments')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setAssessments(deduplicateById(data));
        })
        .catch(() => {});
    };

    const performDatabaseHandshake = async () => {
      try {
        const res = await fetch('/api/db/status');
        const status = await res.json();

        // If status returns disconnected but saved connection URI exists in localStorage
        if (!status?.isConnected) {
          const savedUri = localStorage.getItem('daanish_mongo_uri');
          if (savedUri && savedUri.trim()) {
            console.log('[Frontend Handshake] MongoDB session disconnected on boot. Re-establishing connection with saved URI...');
            await fetch('/api/db/connect-mongo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mongoUri: savedUri.trim() }),
            });
          }
        }
      } catch (err) {
        console.error('[Frontend Handshake] Database status check/reconnect error:', err);
      } finally {
        fetchApplicationData();
      }
    };

    performDatabaseHandshake();
  }, []);

  // Dynamically re-calculate client-side stats in real time based on actual DB state arrays
  useEffect(() => {
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const activeTeachers = teachers.filter((t) => t.status === 'Active').length;

    const publishedAsms = assessments.filter(
      (a) => a.status === 'Published' && a.marks && a.marks.length > 0
    );

    let passPercentage = 0;
    if (publishedAsms.length > 0) {
      let totalObtained = 0;
      let totalMax = 0;
      publishedAsms.forEach((asm) => {
        asm.marks?.forEach((m) => {
          totalObtained += m.marksObtained || 0;
          totalMax += m.maxMarks || asm.maxMarks || 100;
        });
      });
      if (totalMax > 0) {
        passPercentage = Number(((totalObtained / totalMax) * 100).toFixed(1));
      }
    } else if (totalStudents > 0) {
      const totalEntry = students.reduce((acc, s) => acc + (s.entryTestMarks || 0), 0);
      passPercentage = Number((totalEntry / totalStudents).toFixed(1));
    }

    const criticalAlerts = students.filter(
      (s) => (s.entryTestMarks !== undefined ? s.entryTestMarks < 60 : false)
    ).length;

    setStats((prev) => ({
      ...prev,
      totalStudents,
      totalTeachers,
      activeTeachers,
      passPercentage,
      passPercentageTier:
        passPercentage >= 90
          ? 'National Top 1%'
          : passPercentage >= 80
          ? 'Excellence Distinction'
          : passPercentage >= 60
          ? 'Standard Performance'
          : passPercentage > 0
          ? 'Needs Improvement'
          : 'Zero / Unassessed',
      criticalAlerts,
      studentGrowthPercentage: totalStudents > 0 ? Number(((totalStudents / 10) * 10).toFixed(1)) : 0,
    }));

    // Auto-redirect if tab is unauthorized for current user role
    if (!isTabAuthorized(activeTab, session.userType)) {
      setActiveTab(getDefaultTabForRole(session.userType));
    }

    // Calculate real-time performance trend per grade
    const gradesList = ['8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'];
    const updatedTrend = gradesList.map((grd) => {
      const gradeKey = grd.replace(' Grade', '');
      const gradeStudents = students.filter((s) => s.grade.toLowerCase().includes(gradeKey.toLowerCase()));
      const gradeAsms = assessments.filter(
        (a) => a.grade.toLowerCase().includes(gradeKey.toLowerCase()) && a.status === 'Published' && a.marks && a.marks.length > 0
      );

      let passRate = 0;
      if (gradeAsms.length > 0) {
        let totalObtained = 0;
        let totalMax = 0;
        gradeAsms.forEach((a) => {
          a.marks?.forEach((m) => {
            totalObtained += m.marksObtained || 0;
            totalMax += m.maxMarks || a.maxMarks || 100;
          });
        });
        if (totalMax > 0) {
          passRate = Math.round((totalObtained / totalMax) * 100);
        }
      } else if (gradeStudents.length > 0) {
        const avgEntry = gradeStudents.reduce((acc, s) => acc + (s.entryTestMarks || 0), 0) / gradeStudents.length;
        passRate = Math.round(avgEntry);
      }

      return {
        year: grd,
        passRate,
        targetRate: 90,
        topAchievers: gradeStudents.filter((s) => (s.entryTestMarks || 85) >= 80).length || 5,
      };
    });

    setPerformanceTrend(updatedTrend);

    // Re-fetch performance trend from backend if available
    fetch('/api/performance-trend')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setPerformanceTrend(data);
      })
      .catch(() => {});
  }, [students, teachers, assessments, activeTab, session.userType]);

  // Handlers
  const handleGlobalRollSearch = (rollNo: string) => {
    const found = students.find(
      (s) => s.rollNo.toUpperCase().trim() === rollNo.toUpperCase().trim()
    );
    if (found) {
      setSelectedStudent(found);
      setActiveTab('student-profile');
      addToast('Student Dossier Found', 'success', `Viewing record for ${found.name}`);
    } else {
      addToast('Student Not Found', 'error', `No record matches Roll No "${rollNo}"`);
    }
  };

  const handleRegisterSingleStudent = (data: Partial<Student>) => {
    const newStd: Student = {
      id: 'std-' + Date.now(),
      rollNo: data.rollNo || `PDS-2024-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name || 'New Student',
      guardianName: data.guardianName || 'Guardian',
      dob: data.dob || '2008-01-01',
      gender: data.gender || 'Male',
      grade: data.grade || '10th',
      section: data.section || 'Section A',
      house: data.house || 'Chenab',
      enrollmentDate: new Date().toISOString().split('T')[0],
      photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      entryTestMarks: Number(data.entryTestMarks) || 85,
      meritPoints: 100,
      status: 'Active',
      address: data.address,
      contactPhone: data.contactPhone,
    };

    setStudents((prev) => [newStd, ...prev]);
    setStats((prev) => ({ ...prev, totalStudents: prev.totalStudents + 1 }));

    // Send to server DB
    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStd),
    }).catch(() => {});
  };

  const handleRegisterBulkStudents = (bulkList: Partial<Student>[]) => {
    const created: Student[] = bulkList.map((s, idx) => ({
      id: 'std-bulk-' + Date.now() + '-' + idx,
      rollNo: `PDS-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      name: s.name || 'Enrolled Student',
      guardianName: s.guardianName || 'Guardian',
      dob: s.dob || '2008-01-01',
      gender: s.gender || 'Male',
      grade: s.grade || '10th',
      section: s.section || 'Section A',
      house: s.house || 'Ravi',
      enrollmentDate: new Date().toISOString().split('T')[0],
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      entryTestMarks: s.entryTestMarks || 85,
      meritPoints: 100,
      status: 'Active',
      address: s.address,
      contactPhone: s.contactPhone,
    }));

    setStudents((prev) => [...created, ...prev]);
    setStats((prev) => ({ ...prev, totalStudents: prev.totalStudents + created.length }));

    fetch('/api/students/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: bulkList }),
    }).catch(() => {});
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setStats((prev) => ({ ...prev, totalStudents: Math.max(0, prev.totalStudents - 1) }));
    addToast('Record Deleted', 'info', `Student record for ${target?.name || 'student'} removed.`);
    fetch(`/api/students/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleAddTeacher = (tData: Partial<Teacher>) => {
    const newTch: Teacher = {
      id: 'tch-' + Date.now(),
      employeeId: tData.employeeId || `DS-2024-${Math.floor(100 + Math.random() * 900)}`,
      name: tData.name || 'Faculty Member',
      designation: tData.designation || 'Lecturer',
      department: tData.department || 'Department of Science',
      qualification: tData.qualification || 'M.Sc.',
      experienceYears: tData.experienceYears || 5,
      joiningDate: new Date().toISOString().split('T')[0],
      email: tData.email || 'faculty@daanish.edu.pk',
      phone: '+92 300 0000000',
      photoUrl: tData.photoUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      status: 'Active',
      peerRating: 4.8,
      workshopsCount: 5,
      classesTaught: [],
    };

    setTeachers((prev) => [newTch, ...prev]);
    setStats((prev) => ({ ...prev, totalTeachers: prev.totalTeachers + 1, activeTeachers: prev.activeTeachers + 1 }));
    addToast('Faculty Added', 'success', `Registered ${newTch.name} in ${newTch.department}`);

    fetch('/api/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTch),
    }).catch(() => {});
  };

  const handleRegisterBulkTeachers = (bulkList: Partial<Teacher>[]) => {
    if (!bulkList || bulkList.length === 0) return;

    const createdList: Teacher[] = bulkList.map((t, idx) => {
      const cleanName = (t.name || `Faculty ${idx + 1}`).trim();
      const cleanEmail = (t.email || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@daanish.edu.pk`).trim();
      return {
        id: 'tch-' + Date.now() + '-' + idx,
        employeeId: t.employeeId || `DS-2024-${Math.floor(100 + Math.random() * 900)}`,
        name: cleanName,
        designation: t.designation || 'Lecturer',
        department: t.department || 'Sciences',
        qualification: t.qualification || 'M.Sc.',
        experienceYears: Number(t.experienceYears) || 5,
        joiningDate: t.joiningDate || new Date().toISOString().split('T')[0],
        email: cleanEmail,
        phone: t.phone || '+92 300 1234567',
        photoUrl: t.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        status: 'Active',
        peerRating: 4.8,
        workshopsCount: 6,
        classesTaught: [],
      };
    });

    setTeachers((prev) => [...createdList, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalTeachers: prev.totalTeachers + createdList.length,
      activeTeachers: prev.activeTeachers + createdList.length,
    }));

    addToast(
      'Bulk Faculty Onboarded',
      'success',
      `Successfully registered ${createdList.length} new faculty members with default accounts (password: teacher123)`
    );

    fetch('/api/faculty/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teachers: bulkList }),
    }).catch(() => {});
  };

  const handleUpdateTeacher = (teacherId: string, updatedFields: Partial<Teacher>) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, ...updatedFields } : t))
    );

    if (selectedTeacher && selectedTeacher.id === teacherId) {
      setSelectedTeacher((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }

    addToast('Faculty Profile Updated', 'success', 'Successfully updated teacher details.');

    fetch(`/api/faculty/${teacherId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields),
    }).catch(() => {});
  };

  const handleDeleteTeacher = (id: string) => {
    const target = teachers.find((t) => t.id === id);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    addToast('Faculty Deleted', 'info', `Removed faculty member ${target?.name || ''}`);
    fetch(`/api/faculty/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleUpdateTeacherClasses = (
    teacherId: string,
    classesTaught: ClassSchedule[],
    classInChargeOf?: string
  ) => {
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === teacherId
          ? {
              ...t,
              classesTaught,
              classInChargeOf:
                classInChargeOf !== undefined ? classInChargeOf : t.classInChargeOf,
            }
          : t
      )
    );

    if (selectedTeacher && selectedTeacher.id === teacherId) {
      setSelectedTeacher((prev) =>
        prev
          ? {
              ...prev,
              classesTaught,
              classInChargeOf:
                classInChargeOf !== undefined ? classInChargeOf : prev.classInChargeOf,
            }
          : null
      );
    }

    fetch(`/api/faculty/${teacherId}/classes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classesTaught, classInChargeOf }),
    }).catch(() => {});
  };

  const handleOpenAssignClassModal = (teacher?: Teacher) => {
    setAssignClassTeacherId(teacher?.id);
    setShowAssignClassModal(true);
  };

  const handleUpdateTeacherInCharge = (teacherId: string, classInChargeOf: string) => {
    // Single in-charge policy: remove newly assigned duties from any other teacher
    const newDuties = classInChargeOf.split(',').map((s) => s.trim()).filter(Boolean);

    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === teacherId) {
          return { ...t, classInChargeOf };
        } else {
          if (!t.classInChargeOf) return t;
          const othDuties = t.classInChargeOf.split(',').map((s) => s.trim()).filter(Boolean);
          const filtered = othDuties.filter(
            (duty) => !newDuties.some((nd) => nd.toLowerCase() === duty.toLowerCase())
          );
          return { ...t, classInChargeOf: filtered.join(', ') };
        }
      })
    );

    if (selectedTeacher) {
      if (selectedTeacher.id === teacherId) {
        setSelectedTeacher((prev) => (prev ? { ...prev, classInChargeOf } : null));
      } else if (selectedTeacher.classInChargeOf) {
        const othDuties = selectedTeacher.classInChargeOf.split(',').map((s) => s.trim()).filter(Boolean);
        const filtered = othDuties.filter(
          (duty) => !newDuties.some((nd) => nd.toLowerCase() === duty.toLowerCase())
        );
        setSelectedTeacher((prev) => (prev ? { ...prev, classInChargeOf: filtered.join(', ') } : null));
      }
    }

    fetch(`/api/faculty/${teacherId}/classes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classInChargeOf, enforceSingleInCharge: true }),
    }).catch(() => {});
  };

  const handleOpenAssignInChargeModal = (teacher?: Teacher) => {
    setAssignInChargeTeacherId(teacher?.id);
    setShowAssignInChargeModal(true);
  };

  const handleAddAssessment = (asmData: Partial<Assessment>) => {
    const creator = session.userEmail || session.userName || 'System';
    const newAsm: Assessment = {
      id: 'asm-' + Date.now(),
      title: asmData.title || 'New Examination',
      grade: asmData.grade || '10th',
      section: asmData.section || 'Section A',
      subject: asmData.subject || 'Mathematics',
      testDate: asmData.testDate || new Date().toISOString().split('T')[0],
      maxMarks: asmData.maxMarks || 100,
      status: 'Draft',
      createdBy: asmData.createdBy || creator,
    };

    setAssessments((prev) => [newAsm, ...prev]);
    fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAsm),
    }).catch(() => {});
  };

  const handleUpdateAssessment = (id: string, updatedFields: Partial<Assessment>) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a))
    );
    fetch(`/api/assessments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields),
    }).catch(() => {});
  };

  const handleDeleteAssessment = (id: string) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/assessments/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleSubmitMarks = (assessmentId: string, marks: StudentMark[]) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === assessmentId ? { ...a, marks, status: 'Published' } : a))
    );
    fetch(`/api/assessments/${assessmentId}/marks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marks }),
    }).catch(() => {});
  };

  if (showPreloader) {
    return <Preloader onComplete={() => setShowPreloader(false)} />;
  }

  if (!session.isLoggedIn) {
    return (
      <LoginView
        defaultPrincipalName={stats.principalName}
        defaultPrincipalEmail={stats.principalEmail || 'principal@daanish.edu.pk'}
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          localStorage.setItem('daanish_user_session', JSON.stringify(newSession));
          setActiveTab(getDefaultTabForRole(newSession.userType));
        }}
        onDirectStudentLookup={(rollNo) => {
          const found = students.find(
            (s) => s.rollNo.toUpperCase().trim() === rollNo.toUpperCase().trim()
          );
          const matched = found || students[0];
          setSelectedStudent(matched);
          setSession({
            isLoggedIn: true,
            userType: 'student',
            userName: matched.name,
            userEmail: `${matched.rollNo.toLowerCase()}@student.daanish.edu.pk`,
            rollNo: matched.rollNo,
          });
          setActiveTab('student-profile');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'teacher-profile') setSelectedTeacher(null);
          if (tab !== 'student-profile') setSelectedStudent(null);
        }}
        currentUser={session}
        onLogout={() => setSession({ isLoggedIn: false, userType: 'principal', userName: '', userEmail: '' })}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Navbar
          currentUser={session}
          students={students}
          teachers={teachers}
          assessments={assessments}
          onSearchRollNo={handleGlobalRollSearch}
          onSelectStudent={(s) => {
            setSelectedStudent(s);
            setActiveTab('student-profile');
          }}
          onSelectTeacher={(t) => {
            setSelectedTeacher(t);
            setActiveTab('teacher-profile');
          }}
          onSelectAssessment={(asm) => {
            setActiveTab('results-upload');
          }}
          aiSettings={aiSettings}
          onOpenCopilot={() => setShowCopilotModal(true)}
          onOpenAiInsights={() => {
            setAiModalStudent(null);
            setShowAiModal(true);
          }}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="p-4 sm:p-6 md:p-8 flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={session}
              stats={stats}
              performanceTrend={performanceTrend}
              teachers={teachers}
              students={students}
              aiSettings={aiSettings}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectStudent={(s) => {
                setSelectedStudent(s);
                setActiveTab('student-profile');
              }}
              onSelectTeacher={(t) => {
                setSelectedTeacher(t);
                setActiveTab('teacher-profile');
              }}
              onOpenAiInsights={() => {
                setAiModalStudent(null);
                setShowAiModal(true);
              }}
              onOpenAiNotice={() => setShowNoticeAiModal(true)}
              onOpenCopilot={() => setShowCopilotModal(true)}
              onOpenQuizGen={() => setShowQuizGenModal(true)}
              onOpenLessonPlan={() => setShowLessonPlanModal(true)}
              onOpenPromoteModal={() => setShowPromoteModal(true)}
            />
          )}

          {activeTab === 'results-upload' && (
            <ResultsUploadView
              currentUser={session}
              teachers={teachers}
              assessments={assessments}
              students={students}
              aiSettings={aiSettings}
              onAddAssessment={handleAddAssessment}
              onUpdateAssessment={handleUpdateAssessment}
              onSubmitMarks={handleSubmitMarks}
              onDeleteAssessment={handleDeleteAssessment}
              onOpenAiInsights={(s) => {
                setAiModalStudent(s);
                setShowAiModal(true);
              }}
              onOpenClassAiInsights={(asm) => {
                setAiModalAssessment(asm);
                setShowClassAiModal(true);
              }}
            />
          )}

          {activeTab === 'student-registration' && (
            <StudentRegistrationView
              onRegisterSingle={handleRegisterSingleStudent}
              onRegisterBulk={handleRegisterBulkStudents}
            />
          )}

          {activeTab === 'faculty' && (
            <FacultyView
              teachers={teachers}
              onSelectTeacher={(t) => {
                setSelectedTeacher(t);
                setActiveTab('teacher-profile');
              }}
              onAddTeacher={handleAddTeacher}
              onRegisterBulkTeachers={handleRegisterBulkTeachers}
              onDeleteTeacher={handleDeleteTeacher}
              onOpenAssignClassModal={handleOpenAssignClassModal}
              onOpenAssignInChargeModal={handleOpenAssignInChargeModal}
            />
          )}

          {activeTab === 'assignment-matrix' && (
            <TeacherAssignmentMatrixView
              teachers={teachers}
              students={students}
              assessments={assessments}
              onOpenAssignClassModal={handleOpenAssignClassModal}
              onOpenAssignInChargeModal={handleOpenAssignInChargeModal}
              onSelectTeacher={(t) => {
                setSelectedTeacher(t);
                setActiveTab('teacher-profile');
              }}
            />
          )}

          {activeTab === 'teacher-profile' && selectedTeacher && (
            <TeacherProfileView
              teacher={selectedTeacher}
              onBack={() => setActiveTab('faculty')}
              onUpdateTeacher={handleUpdateTeacher}
              onOpenAssignClassModal={handleOpenAssignClassModal}
              onOpenAssignInChargeModal={handleOpenAssignInChargeModal}
            />
          )}

          {(activeTab === 'students' || activeTab === 'student-portal') && (
            <StudentPortalView
              students={students}
              currentUser={session}
              aiSettings={aiSettings}
              onSelectStudent={(s) => {
                setSelectedStudent(s);
                setActiveTab('student-profile');
              }}
              onDeleteStudent={handleDeleteStudent}
              onOpenAiInsights={(s) => {
                setAiModalStudent(s);
                setShowAiModal(true);
              }}
              onOpenPromoteModal={() => {
                if (session.userType === 'principal') setShowPromoteModal(true);
              }}
            />
          )}

          {activeTab === 'student-profile' && (selectedStudent || students[0]) && (
            <StudentProfileView
              student={selectedStudent || students[0]}
              assessments={assessments}
              aiSettings={aiSettings}
              currentUser={session}
              onBack={() => setActiveTab(session.userType === 'student' ? 'student-portal' : 'students')}
              onOpenAiInsights={(s) => {
                setAiModalStudent(s);
                setShowAiModal(true);
              }}
              onUpdateStudent={(updated) => {
                setSelectedStudent(updated);
                setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
              }}
            />
          )}

          {activeTab === 'my-profile' && (
            <MyProfileView
              currentUser={session}
              onUpdateUserSession={(updated) =>
                setSession((prev) => {
                  const next = { ...prev, ...updated };
                  localStorage.setItem('daanish_user_session', JSON.stringify(next));
                  return next;
                })
              }
              teachers={teachers}
              onUpdateTeacher={handleUpdateTeacher}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={session}
              stats={stats}
              aiSettings={aiSettings}
              teachers={teachers}
              onOpenAssignClassModal={handleOpenAssignClassModal}
              onOpenAssignInChargeModal={handleOpenAssignInChargeModal}
              onUpdateAiSettings={(newSettings) => {
                setAiSettings(newSettings);
                localStorage.setItem('daanish_ai_settings', JSON.stringify(newSettings));
              }}
              onUpdateUserSession={(updated) =>
                setSession((prev) => {
                  const next = { ...prev, ...updated };
                  localStorage.setItem('daanish_user_session', JSON.stringify(next));
                  return next;
                })
              }
              onUpdateStats={(updatedStats) =>
                setStats((prev) => ({ ...prev, ...updatedStats }))
              }
            />
          )}
        </main>
      </div>

      {/* Student AI Analysis Modal */}
      {showAiModal && aiSettings.aiEnabled && (
        <AiAnalysisModal
          student={aiModalStudent}
          customApiKey={aiSettings.geminiApiKey}
          onClose={() => setShowAiModal(false)}
        />
      )}

      {/* Class AI Insights Modal */}
      {showClassAiModal && aiSettings.aiEnabled && aiModalAssessment && (
        <AiClassInsightsModal
          assessment={aiModalAssessment}
          customApiKey={aiSettings.geminiApiKey}
          onClose={() => {
            setShowClassAiModal(false);
            setAiModalAssessment(null);
          }}
        />
      )}

     

      {/* AI Academic Copilot Modal */}
      {showCopilotModal && (
        <AiCopilotModal
          currentUser={session}
          customApiKey={aiSettings.geminiApiKey}
          onClose={() => setShowCopilotModal(false)}
        />
      )}

      {/* Principal Subject Class Assignment Modal */}
      {showAssignClassModal && (
        <AssignClassModal
          teachers={teachers}
          initialSelectedTeacherId={assignClassTeacherId}
          onUpdateTeacherClasses={handleUpdateTeacherClasses}
          onClose={() => {
            setShowAssignClassModal(false);
            setAssignClassTeacherId(undefined);
          }}
        />
      )}

      {/* Principal Class In-Charge (Class Teacher) Modal */}
      {showAssignInChargeModal && (
        <AssignInChargeModal
          teachers={teachers}
          initialSelectedTeacherId={assignInChargeTeacherId}
          onUpdateTeacherInCharge={handleUpdateTeacherInCharge}
          onClose={() => {
            setShowAssignInChargeModal(false);
            setAssignInChargeTeacherId(undefined);
          }}
        />
      )}

      {/* Annual Class Promotion & 12th Graduation Modal */}
      {showPromoteModal && (
        <PromoteClassModal
          onClose={() => setShowPromoteModal(false)}
          onSuccess={() => {
            fetch('/api/students')
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (Array.isArray(data)) setStudents(data);
                else if (data && Array.isArray(data.students)) setStudents(data.students);
              })
              .catch(() => {});

            fetch('/api/stats')
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (data) setStats(data);
              })
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

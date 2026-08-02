export type HouseType = string;
export type StudentStatus = 'Active' | 'Graduated' | 'Suspended';
export type TeacherStatus = 'Active' | 'On Leave' | 'Retired';

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  guardianName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  grade: string;
  section: string;
  house: HouseType;
  enrollmentDate: string;
  photoUrl: string;
  entryTestMarks: number; // e.g. 88 (out of 100)
  meritPoints?: number;
  status: StudentStatus;
  address?: string;
  contactPhone?: string;
  extracurriculars?: string[];
  badges?: string[];
  marks?: StudentMark[];
}

export interface ClassSchedule {
  grade: string;
  section: string;
  subject: string;
  period: string;
  room: string;
}

export interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  qualification: string;
  experienceYears: number;
  joiningDate: string;
  email: string;
  phone: string;
  photoUrl: string;
  status: TeacherStatus;
  peerRating: number;
  workshopsCount: number;
  classesTaught: ClassSchedule[];
  classInChargeOf?: string; // e.g. "10th - Section A"
}

export interface StudentMark {
  id: string;
  assessmentId: string;
  studentId: string;
  studentRoll: string;
  studentName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
}

export interface Assessment {
  id: string;
  title: string;
  grade: string;
  section: string;
  subject: string;
  testDate: string;
  maxMarks: number;
  status: 'Draft' | 'Published' | 'Grading';
  classAverage?: number;
  passRate?: number;
  marks?: StudentMark[];
  createdBy?: string;
}

export interface SystemNotification {
  id: string;
  senderRole?: 'principal' | 'teacher' | 'system' | string;
  senderName?: string;
  senderEmail?: string;
  targetRole?: 'principal' | 'teacher' | 'all' | string;
  targetEmail?: string;
  title: string;
  message: string;
  timestamp: string;
  priority: 'Urgent' | 'Normal' | 'Academic' | string;
  isRead?: boolean;
  read?: boolean;
  type?: 'inter-role' | 'result' | 'academic' | 'notice' | string;
  category?: string;
  userEmail?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
}

export interface SchoolStats {
  totalStudents: number;
  studentGrowthPercentage: number;
  totalTeachers: number;
  activeTeachers: number;
  passPercentage: number;
  passPercentageTier: string;
  criticalAlerts: number;
  campusName: string;
  principalName: string;
  principalEmail?: string;
  targetBenchmark?: number;
}

export interface PerformanceTrendPoint {
  year: string;
  passRate: number;
  targetRate: number;
  topAchievers: number;
}

export interface UserSession {
  isLoggedIn: boolean;
  userType: 'principal' | 'teacher' | 'student';
  userName: string;
  userEmail: string;
  rollNo?: string;
  avatarUrl?: string;
}

export interface AiSettings {
  aiEnabled: boolean;
  geminiApiKey: string;
}

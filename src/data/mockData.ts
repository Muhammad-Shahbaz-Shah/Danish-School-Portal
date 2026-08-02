import { Student, Teacher, Assessment, Notice, SchoolStats, PerformanceTrendPoint, SystemNotification } from '../types';

export const initialStats: SchoolStats = {
  totalStudents: 0,
  studentGrowthPercentage: 0,
  totalTeachers: 0,
  activeTeachers: 0,
  passPercentage: 0,
  passPercentageTier: 'No Data',
  criticalAlerts: 0,
  campusName: 'Punjab Daanish School & Center of Excellence',
  principalName: '',
};

export const initialPerformanceTrend: PerformanceTrendPoint[] = [];

export const initialStudents: Student[] = [];

export const initialTeachers: Teacher[] = [];

export const initialAssessments: Assessment[] = [];

export const initialNotices: Notice[] = [];

export const initialNotifications: SystemNotification[] = [];

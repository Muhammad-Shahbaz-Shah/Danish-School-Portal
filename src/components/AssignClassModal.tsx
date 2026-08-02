import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Clock,
  Building,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Teacher, ClassSchedule } from '../types';
import { useToast } from '../context/ToastContext';

interface AssignClassModalProps {
  teachers: Teacher[];
  initialSelectedTeacherId?: string;
  onUpdateTeacherClasses: (
    teacherId: string,
    classesTaught: ClassSchedule[]
  ) => void;
  onClose: () => void;
}

const PERIOD_OPTIONS = [
  '1st Period',
  '2nd Period',
  '3rd Period',
  '4th Period',
  '5th Period',
  '6th Period',
  '7th Period',
  '8th Period',
];

export const AssignClassModal: React.FC<AssignClassModalProps> = ({
  teachers,
  initialSelectedTeacherId,
  onUpdateTeacherClasses,
  onClose,
}) => {
  const { addToast } = useToast();

  const [dbGrades, setDbGrades] = useState<string[]>([
    '6th',
    '7th',
    '8th',
    '9th',
    '10th',
    '11th',
    '12th',
  ]);
  const [dbSections, setDbSections] = useState<string[]>([
    'Section A',
    'Section B',
    'Section C',
  ]);
  const [dbSubjects, setDbSubjects] = useState<string[]>([
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English',
    'Urdu',
    'Pakistan Studies',
    'Islamic Studies',
  ]);

  React.useEffect(() => {
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
          if (Array.isArray(data.departments) && data.departments.length > 0) {
            const allSubs = Array.from(new Set([...data.departments, ...dbSubjects]));
            setDbSubjects(allSubs);
          }
        }
      })
      .catch(() => {});
  }, []);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    initialSelectedTeacherId || (teachers.length > 0 ? teachers[0].id : '')
  );

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  // New Class Form State
  const [grade, setGrade] = useState('6th');
  const [section, setSection] = useState('Section A');
  const [subject, setSubject] = useState('Mathematics');
  const [period, setPeriod] = useState('1st Period');
  const [room, setRoom] = useState('Room 101');

  // Auto-sync teacher subject when selected teacher changes
  React.useEffect(() => {
    if (selectedTeacher) {
      if (selectedTeacher.department && dbSubjects.includes(selectedTeacher.department)) {
        setSubject(selectedTeacher.department);
      }
    }
  }, [selectedTeacherId]);

  if (!selectedTeacher) {
    return null;
  }

  const currentClasses: ClassSchedule[] = selectedTeacher.classesTaught || [];

  // Add a class schedule
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();

    // Check duplicate assignment
    const isDuplicate = currentClasses.some(
      (c) => c.grade === grade && c.section === section && c.subject === subject && c.period === period
    );

    if (isDuplicate) {
      addToast(
        'Assignment Warning',
        'info',
        `${selectedTeacher.name} is already assigned ${subject} for ${grade} (${section}) in ${period}.`
      );
      return;
    }

    const newSchedule: ClassSchedule = {
      grade,
      section,
      subject,
      period,
      room: room || 'Room 101',
    };

    const updated = [...currentClasses, newSchedule];
    onUpdateTeacherClasses(selectedTeacher.id, updated);

    addToast(
      'Class Assigned Successfully',
      'success',
      `Assigned ${subject} (${grade} ${section} - ${period}) to ${selectedTeacher.name}`
    );
  };

  const handleRemoveClass = (indexToRemove: number) => {
    const removedItem = currentClasses[indexToRemove];
    const updated = currentClasses.filter((_, idx) => idx !== indexToRemove);
    onUpdateTeacherClasses(selectedTeacher.id, updated);

    addToast(
      'Class Unassigned',
      'info',
      `Removed ${removedItem.subject} (${removedItem.grade} ${removedItem.section}) from ${selectedTeacher.name}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 ring-2 ring-indigo-400/50 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-400/10 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                    Subject Schedule Allocation
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold hidden sm:inline">
                    Academic Timetable
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-['Playfair_Display'] text-white mt-1">
                  Assign Class Subjects & Schedules
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
          
          {/* Teacher Selector Dropdown & Profile Banner */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Select Faculty Member to Allocate Schedules
              </label>
              <select
                value={selectedTeacher.id}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-700 focus:outline-none"
              >
                {teachers.map((t, idx) => (
                  <option key={`${t.id}-${idx}`} value={t.id}>
                    {t.name} — {t.designation} ({t.department}) — [{t.classesTaught?.length || 0} Classes Assigned]
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher Details Card */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedTeacher.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                  alt={selectedTeacher.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-600/30 shadow-xs"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedTeacher.name}</div>
                  <div className="text-indigo-800 font-semibold text-xs">{selectedTeacher.designation}</div>
                  <div className="text-slate-500 text-[11px] font-mono">ID: {selectedTeacher.employeeId} | {selectedTeacher.department}</div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="bg-indigo-800 text-white font-extrabold text-xs px-3 py-1 rounded-lg inline-block">
                  {currentClasses.length} Active Classes
                </span>
              </div>
            </div>
          </div>

          {/* New Class Assignment Form */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-xs">
                <Plus className="w-4 h-4 text-indigo-700" />
                <span>Allocate Class Subject & Timetable Period</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Multiple Classes Allowed</span>
            </div>

            <form onSubmit={handleAddClass} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade Level</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-700 focus:outline-none"
                  >
                    {dbGrades.map((g) => (
                      <option key={g} value={g}>
                        {g.toLowerCase().includes('grade') ? g : `${g} Grade`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-700 focus:outline-none"
                  >
                    {dbSections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject Module</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-700 focus:outline-none"
                  >
                    {dbSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              

              <button
                type="submit"
                className="w-full bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Confirm & Assign {subject} ({grade} - {section}) to {selectedTeacher.name}</span>
              </button>
            </form>
          </div>

          {/* List of Currently Assigned Classes for Selected Teacher */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-xs">
                <BookOpen className="w-4 h-4 text-indigo-700" />
                <span>Currently Assigned Schedules ({currentClasses.length})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Weekly Timetable</span>
            </div>

            {currentClasses.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-xs">No class schedules assigned to this faculty member yet.</p>
                <p className="text-[10px] text-slate-400">Use the form above to assign class subjects and period slots.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                      <th className="p-2.5">Class / Section</th>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentClasses.map((cls, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-900">
                          {cls.grade} ({cls.section})
                        </td>
                        <td className="p-2.5 font-semibold text-indigo-800">{cls.subject}</td>
                       
                       
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveClass(idx)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer"
                            title="Unassign Class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">Unassign</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Schedules persist in Punjab Daanish Schools Portal DB</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done & Close
          </button>
        </div>

      </div>
    </div>
  );
};

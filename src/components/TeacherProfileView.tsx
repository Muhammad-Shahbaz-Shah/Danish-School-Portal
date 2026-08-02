import React, { useState,useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Award,
  BookOpen,
  CheckCircle2,
  Star,
  Users,
  Building,
  GraduationCap,
  Clock,
  UserCheck,
  Edit3,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Teacher, TeacherStatus } from '../types';

interface TeacherProfileViewProps {
  teacher: Teacher;
  onBack: () => void;
  onUpdateTeacher?: (teacherId: string, updatedFields: Partial<Teacher>) => void;
  onOpenAssignClassModal?: (teacher: Teacher) => void;
  onOpenAssignInChargeModal?: (teacher: Teacher) => void;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({
  teacher,
  onBack,
  onUpdateTeacher,
  onOpenAssignClassModal,
  onOpenAssignInChargeModal,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const defaultDepts = ['Sciences', 'Mathematics', 'Computer Science', 'English', 'Urdu', 'Humanities', 'Islamiat', 'Social Sciences', 'Sports & Physical Ed'];
  const [editName, setEditName] = useState('');
  const [departments, setDepartments] = useState<string[]>(defaultDepts);
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [editExperienceYears, setEditExperienceYears] = useState(0);
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editStatus, setEditStatus] = useState<TeacherStatus>('Active');
  const [editClassInChargeOf, setEditClassInChargeOf] = useState('');

  const handleOpenEditModal = () => {
    setEditName(teacher.name);
    setEditEmployeeId(teacher.employeeId);
    setEditDesignation(teacher.designation);
    setEditDepartment(teacher.department);
    setEditQualification(teacher.qualification);
    setEditExperienceYears(teacher.experienceYears);
    setEditJoiningDate(teacher.joiningDate);
    setEditEmail(teacher.email);
    setEditPhone(teacher.phone);
    setEditPhotoUrl(teacher.photoUrl);
    setEditStatus(teacher.status);
    setEditClassInChargeOf(teacher.classInChargeOf || '');
    setIsEditing(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      alert('Please fill in required fields (Name and Email).');
      return;
    }

    const updatedFields: Partial<Teacher> = {
      name: editName.trim(),
      employeeId: editEmployeeId.trim(),
      designation: editDesignation.trim(),
      department: editDepartment.trim(),
      qualification: editQualification.trim(),
      experienceYears: Number(editExperienceYears) || 0,
      joiningDate: editJoiningDate,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      photoUrl: editPhotoUrl.trim() || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: editStatus,
      classInChargeOf: teacher.classInChargeOf, // Cannot edit incharge duty in teacher profile edit modal
    };

    if (onUpdateTeacher) {
      onUpdateTeacher(teacher.id, updatedFields);
    }
    setIsEditing(false);
  };

  const teacherPerformanceData = [
    { metric: 'Class Pass %', score: 98 },
    { metric: 'Student Satisfaction', score: 95 },
    { metric: 'Punctuality Rate', score: 99 },
    { metric: 'Curriculum Coverage', score: 100 },
  ];

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.departments) && data.departments.length > 0) {
          setDepartments(data.departments);
          if (editDepartment && !data.departments.includes(editDepartment)) {
            setEditDepartment(data.departments[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Back Button & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Faculty Directory</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenEditModal}
            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
            <span>Edit Profile</span>
          </button>

          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full font-mono">
            Employee ID: {teacher.employeeId}
          </span>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <img
              src={teacher.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
              alt={teacher.name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-700/20 shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 font-['Playfair_Display']">
                  {teacher.name}
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {teacher.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-emerald-800 mt-0.5">{teacher.designation}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{teacher.department}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-slate-900 font-['Playfair_Display']">
                {teacher.experienceYears} Yrs
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Teaching Experience</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-extrabold text-amber-600 font-['Playfair_Display'] flex items-center justify-center">
                <span>{teacher.peerRating}</span>
                <Star className="w-4 h-4 fill-amber-500 text-amber-500 ml-1" />
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Peer Review Score</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-extrabold text-emerald-800 font-['Playfair_Display']">
                {teacher.classesTaught?.length || 0}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Assigned Classes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Bio & Qualifications + Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Personal Details */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Academic Background & Contact
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block">Highest Educational Qualification</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{teacher.qualification}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 font-semibold block">Total Experience</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{teacher.experienceYears} Years</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Campus Joining Date</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{teacher.joiningDate}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center space-x-2 text-slate-700">
                <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium">{teacher.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium">{teacher.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Departmental & Administrative Allocation Card */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Faculty Duty & Administrative Profile</h2>
              <p className="text-xs text-slate-500">Official academic duties and section oversight</p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs px-2.5 py-1 rounded-full">
              {teacher.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-slate-500 font-semibold text-[11px]">Class In-Charge Duty</div>
              <div className="font-extrabold text-slate-900 text-sm">
                {teacher.classInChargeOf ? (
                  <span className="text-amber-800 flex items-center space-x-1">
                    <UserCheck className="w-4 h-4 text-amber-600 inline" />
                    <span>{teacher.classInChargeOf}</span>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">No Class In-Charge assigned</span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-slate-500 font-semibold text-[11px]">Primary Department</div>
              <div className="font-bold text-emerald-800 text-sm">{teacher.department}</div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 sm:col-span-2">
              <div className="text-slate-500 font-semibold text-[11px]">Subject Modules Taught</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {teacher.classesTaught && teacher.classesTaught.length > 0 ? (
                  Array.from(new Set(teacher.classesTaught.map((c) => c.subject))).map((sub) => (
                    <span
                      key={sub}
                      className="px-2.5 py-1 bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-lg font-bold text-[11px]"
                    >
                      {sub}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">No subjects assigned yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Taught Schedule Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Assigned Classes & Schedule</h2>
            <p className="text-xs text-slate-500">Active period allocations and room assignments</p>
          </div>
          <div className="flex items-center space-x-2">
            {onOpenAssignClassModal && (
              <button
                onClick={() => onOpenAssignClassModal(teacher)}
                className="flex items-center space-x-1.5 bg-indigo-900 hover:bg-indigo-950 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                <span>Assign Schedules</span>
              </button>
            )}
            {onOpenAssignInChargeModal && (
              <button
                onClick={() => onOpenAssignInChargeModal(teacher)}
                className="flex items-center space-x-1.5 bg-amber-800 hover:bg-amber-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Appoint In-Charge</span>
              </button>
            )}
            <span className="bg-slate-100 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl">
              {teacher.classesTaught.length} Classes Weekly
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                <th className="p-3">Grade & Section</th>
                <th className="p-3">Subject / Module</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacher.classesTaught.map((cls, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{cls.grade} ({cls.section})</td>
                  <td className="p-3 font-semibold text-emerald-800">{cls.subject}</td>
                  <td className="p-3 text-right">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      In Progress
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Teacher Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-bold text-slate-900">Edit Faculty Member Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={editEmployeeId}
                    onChange={(e) => setEditEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    placeholder="e.g. Senior Lecturer, HOD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  >
                   {Array.isArray(departments) && departments.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                   
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    required
                    value={editQualification}
                    onChange={(e) => setEditQualification(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teaching Experience (Years)</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    required
                    value={editExperienceYears}
                    onChange={(e) => setEditExperienceYears(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={editJoiningDate}
                    onChange={(e) => setEditJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TeacherStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

              

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Photo URL</label>
                  <input
                    type="url"
                    value={editPhotoUrl}
                    onChange={(e) => setEditPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px] text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

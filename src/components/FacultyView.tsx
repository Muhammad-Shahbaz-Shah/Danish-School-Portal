import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Search,
  UserPlus,
  Award,
  BookOpen,
  GraduationCap,
  Star,
  Trash2,
  Eye,
  Building,
  CheckCircle2,
  X,
  UserCheck,
  Upload,
  FileSpreadsheet,
  Download,
  Sparkles,
} from 'lucide-react';
import { Teacher } from '../types';

interface FacultyViewProps {
  teachers: Teacher[];
  onSelectTeacher: (teacher: Teacher) => void;
  onAddTeacher: (teacher: Partial<Teacher>) => void;
  onRegisterBulkTeachers?: (teachers: Partial<Teacher>[]) => void;
  onDeleteTeacher: (id: string) => void;
  onOpenAssignClassModal?: (teacher?: Teacher) => void;
  onOpenAssignInChargeModal?: (teacher?: Teacher) => void;
}

export const FacultyView: React.FC<FacultyViewProps> = ({
  teachers,
  onSelectTeacher,
  onAddTeacher,
  onRegisterBulkTeachers,
  onDeleteTeacher,
  onOpenAssignClassModal,
  onOpenAssignInChargeModal,
}) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Bulk Upload State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMode, setBulkMode] = useState<'upload' | 'paste'>('upload');
  const [rawCsvInput, setRawCsvInput] = useState('');
  const [parsedTeachers, setParsedTeachers] = useState<Partial<Teacher>[]>([]);
  const [isBulkPreviewOpen, setIsBulkPreviewOpen] = useState(false);

  // New Teacher Modal Form State
  const defaultDepts = ['Sciences', 'Mathematics', 'Computer Science', 'English', 'Urdu', 'Humanities', 'Islamiat', 'Social Sciences', 'Sports & Physical Ed'];
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Lecturer');
  const [department, setDepartment] = useState('Sciences');
  const [dbDepartments, setDbDepartments] = useState<string[]>(defaultDepts);
  const [qualification, setQualification] = useState('M.Sc. Physics');
  const [experienceYears, setExperienceYears] = useState(6);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+92 300 1234567');
  const [password, setPassword] = useState('teacher123');
  const [employeeId, setEmployeeId] = useState(`DS-2024-${Math.floor(100 + Math.random() * 900)}`);
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.departments) && data.departments.length > 0) {
          setDbDepartments(data.departments);
          if (!data.departments.includes(department)) {
            setDepartment(data.departments[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const filteredTeachers = teachers.filter((t) => {
    const matchesDept = deptFilter === 'All' || t.department.toLowerCase().includes(deptFilter.toLowerCase());
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const teacherEmail = email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@daanish.edu.pk`;

    onAddTeacher({
      name,
      designation,
      department,
      qualification,
      experienceYears,
      email: teacherEmail,
      phone,
      employeeId,
      photoUrl,
    });

    fetch('/api/auth/register-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: name.trim(),
        userEmail: teacherEmail,
        userType: 'teacher',
        password: password.trim() || 'teacher123',
        department: department.trim(),
        designation: designation.trim(),
      }),
    }).catch(() => {});

    setShowAddModal(false);
    setName('');
    setEmail('');
    setPassword('teacher123');
    addToast('Faculty Member Onboarded', 'success', `Registered ${name} (${teacherEmail}) with login password: ${password.trim() || 'teacher123'}`);
  };

  // Helper to parse CSV string into Partial<Teacher>[]
  const parseTeacherCsvText = (text: string): Partial<Teacher>[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const results: Partial<Teacher>[] = [];

    // Skip header line if present
    const startIndex =
      lines[0] &&
      (lines[0].toLowerCase().includes('name') ||
        lines[0].toLowerCase().includes('designation') ||
        lines[0].toLowerCase().includes('email'))
        ? 1
        : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 1 && parts[0] !== '') {
        const teacherName = parts[0];
        const designation = parts[1] || 'Lecturer';
        const department = parts[2] || 'Sciences';
        const qualification = parts[3] || 'M.Sc.';
        const experienceYears = parts[4] && !isNaN(Number(parts[4])) ? Number(parts[4]) : 5;
        const email = parts[5] || `${teacherName.toLowerCase().replace(/\s+/g, '.')}@daanish.edu.pk`;
        const phone = parts[6] || '+92 300 1234567';

        results.push({
          name: teacherName,
          designation,
          department,
          qualification,
          experienceYears,
          email,
          phone,
          employeeId: `DS-2024-${Math.floor(100 + Math.random() * 900)}`,
        });
      }
    }
    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseTeacherCsvText(text);
        if (parsed.length === 0) {
          addToast('Empty CSV', 'error', 'No valid teacher records were found in the uploaded file.');
          return;
        }
        setParsedTeachers(parsed);
        setIsBulkPreviewOpen(true);
        addToast('CSV File Processed', 'success', `Extracted ${parsed.length} teacher records`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleProcessPastedCsv = () => {
    if (!rawCsvInput.trim()) {
      addToast('Validation Error', 'error', 'Please paste CSV content before parsing');
      return;
    }
    const parsed = parseTeacherCsvText(rawCsvInput);
    if (parsed.length === 0) {
      addToast('Parsing Error', 'error', 'Unable to parse valid teacher rows from text');
      return;
    }
    setParsedTeachers(parsed);
    setIsBulkPreviewOpen(true);
    addToast('CSV Text Processed', 'success', `Extracted ${parsed.length} teacher records`);
  };

  const handleLoadSampleBatch = () => {
    const sampleText = `Name, Designation, Department, Qualification, Experience, Email, Phone
Dr. Farooq Ahmed, Senior Professor, Sciences, Ph.D. Physics, 12, farooq.ahmed@daanish.edu.pk, +92 300 5551122
Mrs. Nighat Yasmeen, Head of Department, Mathematics, M.Phil. Math, 10, nighat.yasmeen@daanish.edu.pk, +92 301 6662233
Mr. Tariq Mehmood, Assistant Professor, Computer Science, M.S. Software Eng, 7, tariq.mehmood@daanish.edu.pk, +92 302 7773344
Ms. Samina Kausar, Lecturer, English Literature, M.A. English, 5, samina.kausar@daanish.edu.pk, +92 303 8884455
Mr. Bilal Hassan, Assistant Professor, Humanities, M.A. History, 8, bilal.hassan@daanish.edu.pk, +92 304 9995566`;

    setRawCsvInput(sampleText);
    const parsed = parseTeacherCsvText(sampleText);
    setParsedTeachers(parsed);
    setIsBulkPreviewOpen(true);
    addToast('Sample Batch Loaded', 'info', 'Loaded 5 sample faculty records for preview');
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        'Name, Designation, Department, Qualification, Experience, Email, Phone\n' +
          'Dr. Sarah Miller, Senior Lecturer, Sciences, Ph.D. Chemistry, 8, sarah.miller@daanish.edu.pk, +92 300 1234567\n' +
          'Prof. Usman Ali, Assistant Professor, Mathematics, M.Phil Math, 6, usman.ali@daanish.edu.pk, +92 301 9876543\n'
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'daanish_faculty_bulk_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmBulkOnboard = () => {
    if (parsedTeachers.length === 0) return;
    if (onRegisterBulkTeachers) {
      onRegisterBulkTeachers(parsedTeachers);
    } else {
      parsedTeachers.forEach((t) => onAddTeacher(t));
      addToast('Bulk Faculty Onboarded', 'success', `Successfully registered ${parsedTeachers.length} faculty members.`);
    }
    setIsBulkPreviewOpen(false);
    setShowBulkModal(false);
    setRawCsvInput('');
    setParsedTeachers([]);
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            HUMAN RESOURCES & ACADEMIC FACULTY
          </span>
          <h1 className="text-2xl font-bold text-slate-900 font-['Playfair_Display'] mt-1">
            Faculty & Staff Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage teaching staff, departmental heads, performance ratings, and class allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center space-x-2 bg-indigo-900 hover:bg-indigo-950 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-300" />
            <span>Bulk Import Faculty</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Teacher</span>
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Faculty</span>
            <Users className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-3 font-['Playfair_Display']">
            {teachers.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% Active Duty</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Avg Experience</span>
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-3 font-['Playfair_Display']">
            {teachers.length > 0
              ? (teachers.reduce((acc, t) => acc + (t.experienceYears || 0), 0) / teachers.length).toFixed(1) + ' Years'
              : '0 Years'}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Senior Pedagogy</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">PhD & Scholars</span>
            <GraduationCap className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-3 font-['Playfair_Display']">
            {teachers.filter(
              (t) =>
                (t.qualification || '').toLowerCase().includes('ph.d') ||
                (t.qualification || '').toLowerCase().includes('m.phil') ||
                (t.qualification || '').toLowerCase().includes('dr')
            ).length} Scholars
          </div>
          <div className="text-[11px] text-sky-600 font-semibold mt-1">Higher Education</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Avg Peer Rating</span>
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-3 font-['Playfair_Display']">
            {teachers.length > 0
              ? (teachers.reduce((acc, t) => acc + (t.peerRating || 4.5), 0) / teachers.length).toFixed(2) + ' / 5.0'
              : '5.0 / 5.0'}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Excellence Benchmark</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teacher name, ID or role..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
          {['All', ...dbDepartments].map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                deptFilter === dept
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                <th className="p-4">Faculty Member</th>
                
                <th className="p-4">Department</th>
                <th className="p-4">Qualification</th>
                <th className="p-4">Assigned Classes</th>
                
                <th className="p-4 text-right hidden md:block">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher, idx) => (
                <tr key={`${teacher.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={teacher.photoUrl}
                        alt={teacher.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{teacher.name}</div>
                        <div className="text-[11px] text-slate-400">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                      {teacher.department}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                      {teacher.qualification}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => onOpenAssignClassModal && onOpenAssignClassModal(teacher)}
                        className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors border border-slate-200"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                        <span>{teacher.classesTaught?.length || 0} Classes</span>
                      </button>
                      {teacher.classInChargeOf && (
                        <div>
                          <button
                            type="button"
                            onClick={() => onOpenAssignInChargeModal && onOpenAssignInChargeModal(teacher)}
                            className="inline-flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors"
                          >
                            <GraduationCap className="w-3 h-3 text-amber-600" />
                            <span>In-Charge: {teacher.classInChargeOf}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                 
                  <td className="p-4 text-right">
                    <div className="grid-cols-2 gap-2 hidden md:grid space-x-1.5">
                      {onOpenAssignClassModal && (
                        <button
                          onClick={() => onOpenAssignClassModal(teacher)}
                          className="p-1.5 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          title="Assign Class Subject Schedules"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      )}
                      {onOpenAssignInChargeModal && (
                        <button
                          onClick={() => onOpenAssignInChargeModal(teacher)}
                          className="p-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          title="Appoint Class In-Charge (Class Teacher)"
                        >
                          <GraduationCap className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelectTeacher(teacher)}
                        className="p-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTeacher(teacher.id)}
                        className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Onboard New Teacher */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Onboard New Faculty Member</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              {/* Photo Upload & Preview */}
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <img
                  src={photoUrl}
                  alt="Teacher Preview"
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-700/30 shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Profile Photograph</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@daanish.edu.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Login Password</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. teacher123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {dbDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d.toLowerCase().startsWith('department') ? d : `Department of ${d}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience (Yrs)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={40}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-lg transition-colors mt-2"
              >
                Save & Onboard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Teacher Upload */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
                <h3 className="text-base font-bold text-slate-900">Bulk Faculty Import Engine</h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs: Upload File vs Paste Text */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setBulkMode('upload')}
                className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                  bulkMode === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Upload CSV File (.csv)
              </button>
              <button
                type="button"
                onClick={() => setBulkMode('paste')}
                className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                  bulkMode === 'paste' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Paste CSV Text
              </button>
            </div>

            {bulkMode === 'upload' ? (
              <div>
                <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 p-6 rounded-xl text-center cursor-pointer transition-colors block">
                  <Upload className="w-8 h-8 text-indigo-700 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-800">Select or Drag Faculty CSV File</div>
                  <p className="text-[10px] text-slate-500 mt-1">Supports .csv or .txt formatted files</p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={rawCsvInput}
                  onChange={(e) => setRawCsvInput(e.target.value)}
                  placeholder={`Name, Designation, Department, Qualification, Experience, Email, Phone\nDr. Sarah Miller, Senior Lecturer, Sciences, Ph.D. Chemistry, 8, sarah.miller@daanish.edu.pk, +92 300 1234567\nProf. Usman Ali, Assistant Professor, Mathematics, M.Phil Math, 6, usman.ali@daanish.edu.pk, +92 301 9876543`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-indigo-700 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleProcessPastedCsv}
                  className="w-full bg-indigo-900 hover:bg-indigo-950 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Parse & Preview CSV Rows</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleLoadSampleBatch}
                className="text-xs font-bold text-indigo-900 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Sample (5 Faculty Members)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-slate-500 font-semibold hover:text-slate-800 flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Preview Modal */}
      {isBulkPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 border border-slate-200 relative overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full uppercase">
                  FACULTY BULK ONBOARDING VERIFICATION
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Parsed Roster Preview ({parsedTeachers.length} Faculty Members)
                </h3>
              </div>
              <button
                onClick={() => setIsBulkPreviewOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Teacher Name</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Qualification</th>
                    <th className="p-3">Exp</th>
                    <th className="p-3">Email</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {parsedTeachers.map((tch, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{tch.name}</td>
                      <td className="p-3 text-slate-700 font-semibold">{tch.designation}</td>
                      <td className="p-3">
                        <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          {tch.department}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{tch.qualification}</td>
                      <td className="p-3 font-semibold text-slate-800">{tch.experienceYears} Yrs</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{tch.email}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setParsedTeachers((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsBulkPreviewOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                onClick={handleConfirmBulkOnboard}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Confirm & Onboard All ({parsedTeachers.length} Teachers)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

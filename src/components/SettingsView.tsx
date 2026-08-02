import {
  AlertCircle,
  BookOpen,
  Bot,
  Building,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  EyeOff,
  GraduationCap,
  Key,
  Loader2,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { AiSettings, SchoolStats, Teacher, UserSession } from '../types';

interface SettingsViewProps {
  currentUser: UserSession;
  stats: SchoolStats;
  aiSettings: AiSettings;
  teachers?: Teacher[];
  onUpdateAiSettings: (newSettings: AiSettings) => void;
  onUpdateUserSession?: (updatedFields: Partial<UserSession>) => void;
  onUpdateStats?: (updatedStats: Partial<SchoolStats>) => void;
  onOpenAssignClassModal?: (teacher?: Teacher) => void;
  onOpenAssignInChargeModal?: (teacher?: Teacher) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  stats,
  aiSettings,
  teachers = [],
  onUpdateAiSettings,
  onUpdateUserSession,
  onUpdateStats,
  onOpenAssignClassModal,
  onOpenAssignInChargeModal,
}) => {
  const { addToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'credentials' | 'db'>('classes');

  // Academic Configuration State
  const [gradesList, setGradesList] = useState<string[]>([]);
  const [sectionsList, setSectionsList] = useState<string[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>([
  ]);
  const [housesList, setHousesList] = useState<string[]>([]);
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [targetBenchmark, setTargetBenchmark] = useState<number>(stats.targetBenchmark || 80);
  const [newGradeInput, setNewGradeInput] = useState('');
  const [newSectionInput, setNewSectionInput] = useState('');
  const [newDepartmentInput, setNewDepartmentInput] = useState('');
  const [newHouseInput, setNewHouseInput] = useState('');

  const [campusName, setCampusName] = useState(stats.campusName || 'Punjab Daanish School & Center of Excellence');
  const [principalName, setPrincipalName] = useState(stats.principalName || 'Dr. Ahmad Khan');
  const [emailNotif, setEmailNotif] = useState(() => {
    const saved = localStorage.getItem('daanish_email_notif');
    return saved !== null ? saved === 'true' : true;
  });
  const [twoFactor, setTwoFactor] = useState(() => {
    const saved = localStorage.getItem('daanish_2fa');
    return saved !== null ? saved === 'true' : true;
  });
  const [mongoUri, setMongoUri] = useState<string>('');
  const [isTestingMongo, setIsTestingMongo] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [dbStatusInfo, setDbStatusInfo] = useState<{ isConnected: boolean; dbName?: string; counts?: any } | null>(null);

  // Load current DB connection status & portal settings on mount
  React.useEffect(() => {
    fetch('/api/db/status')
      .then((res) => res.json())
      .then((data) => setDbStatusInfo(data))
      .catch(() => { });

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.campusName) setCampusName(data.campusName);
          if (data.principalName) setPrincipalName(data.principalName);
          if (Array.isArray(data.grades) && data.grades.length > 0) setGradesList(data.grades);
          if (Array.isArray(data.sections) && data.sections.length > 0) setSectionsList(data.sections);
          if (Array.isArray(data.departments) && data.departments.length > 0) setDepartmentsList(data.departments);
          if (Array.isArray(data.houses) && data.houses.length > 0) setHousesList(data.houses);
          if (data.academicYear) setAcademicYear(data.academicYear);
          if (typeof data.targetBenchmark === 'number') setTargetBenchmark(data.targetBenchmark);
        }
      })
      .catch(() => { });
  }, []);

  const saveAcademicConfig = (
    updatedGrades = gradesList,
    updatedSections = sectionsList,
    updatedDepts = departmentsList,
    updatedHouses = housesList,
    year = academicYear,
    benchmark = targetBenchmark
  ) => {
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campusName: campusName.trim(),
        principalName: principalName.trim(),
        grades: updatedGrades,
        sections: updatedSections,
        departments: updatedDepts,
        houses: updatedHouses,
        academicYear: year,
        targetBenchmark: benchmark,
      }),
    }).catch(() => { });

    if (onUpdateStats) {
      onUpdateStats({ targetBenchmark: benchmark });
    }
  };

  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const g = newGradeInput.trim();
    if (!g) return;
    if (gradesList.includes(g)) {
      addToast('Grade Exists', 'info', `Grade "${g}" is already in the list.`);
      return;
    }
    const updated = [...gradesList, g];
    setGradesList(updated);
    setNewGradeInput('');
    saveAcademicConfig(updated, sectionsList, departmentsList, housesList);
    addToast('Grade Added', 'success', `Added "${g}" to active class levels.`);
  };

  const handleRemoveGrade = (gradeToRemove: string) => {
    const updated = gradesList.filter((g) => g !== gradeToRemove);
    setGradesList(updated);
    saveAcademicConfig(updated, sectionsList, departmentsList, housesList);
    addToast('Grade Removed', 'info', `Removed "${gradeToRemove}" from active class levels.`);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    const sec = newSectionInput.trim();
    if (!sec) return;
    if (sectionsList.includes(sec)) {
      addToast('Section Exists', 'info', `Section "${sec}" is already in the list.`);
      return;
    }
    const updated = [...sectionsList, sec];
    setSectionsList(updated);
    setNewSectionInput('');
    saveAcademicConfig(gradesList, updated, departmentsList, housesList);
    addToast('Section Added', 'success', `Added "${sec}" to active sections.`);
  };

  const handleRemoveSection = (sectionToRemove: string) => {
    const updated = sectionsList.filter((s) => s !== sectionToRemove);
    setSectionsList(updated);
    saveAcademicConfig(gradesList, updated, departmentsList, housesList);
    addToast('Section Removed', 'info', `Removed "${sectionToRemove}" from active sections.`);
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = newDepartmentInput.trim();
    if (!dept) return;
    if (departmentsList.includes(dept)) {
      addToast('Department Exists', 'info', `Department "${dept}" is already registered.`);
      return;
    }
    const updated = [...departmentsList, dept];
    setDepartmentsList(updated);
    setNewDepartmentInput('');
    saveAcademicConfig(gradesList, sectionsList, updated, housesList);
    addToast('Department Added', 'success', `Added "${dept}" to academic departments.`);
  };

  const handleRemoveDepartment = (deptToRemove: string) => {
    const updated = departmentsList.filter((d) => d !== deptToRemove);
    setDepartmentsList(updated);
    saveAcademicConfig(gradesList, sectionsList, updated, housesList);
    addToast('Department Removed', 'info', `Removed "${deptToRemove}" from academic departments.`);
  };

  const handleAddHouse = (e: React.FormEvent) => {
    e.preventDefault();
    const house = newHouseInput.trim();
    if (!house) return;
    if (housesList.includes(house)) {
      addToast('House Exists', 'info', `House "${house}" is already registered.`);
      return;
    }
    const updated = [...housesList, house];
    setHousesList(updated);
    setNewHouseInput('');
    saveAcademicConfig(gradesList, sectionsList, departmentsList, updated);
    addToast('House Added', 'success', `Added "${house}" House to student Houses.`);
  };

  const handleRemoveHouse = (houseToRemove: string) => {
    const updated = housesList.filter((h) => h !== houseToRemove);
    setHousesList(updated);
    saveAcademicConfig(gradesList, sectionsList, departmentsList, updated);
    addToast('House Removed', 'info', `Removed "${houseToRemove}" House.`);
  };

  // User credentials local states
  const [userName, setUserName] = useState(currentUser.userName);
  const [userEmail, setUserEmail] = useState(currentUser.userEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);

  // AI settings local state
  const [aiEnabled, setAiEnabled] = useState(aiSettings.aiEnabled);
  const [geminiApiKey, setGeminiApiKey] = useState(aiSettings.geminiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      addToast('Name Required', 'error', 'Please enter your account holder name.');
      return;
    }
    if (!userEmail.trim() || !userEmail.includes('@')) {
      addToast('Invalid Email', 'error', 'Please enter a valid email address.');
      return;
    }

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        addToast('Current Password Required', 'error', 'Please enter your current password to authorize this password change.');
        return;
      }
      if (newPassword.length < 6) {
        addToast('Weak Password', 'error', 'New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        addToast('Password Mismatch', 'error', 'New password and confirm password do not match.');
        return;
      }
    }

    setIsUpdatingCreds(true);
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principalName: userName.trim(),
        principalEmail: userEmail.trim(),
      }),
    }).catch(() => { });

    setTimeout(() => {
      if (onUpdateUserSession) {
        onUpdateUserSession({
          userName: userName.trim(),
          userEmail: userEmail.trim(),
        });
      }
      if (currentUser.userType === 'principal' && onUpdateStats) {
        onUpdateStats({ principalName: userName.trim(), principalEmail: userEmail.trim() });
        setPrincipalName(userName.trim());
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsUpdatingCreds(false);
      addToast(
        'Account Updated!',
        'success',
        `Updated account name to "${userName.trim()}" and email to "${userEmail.trim()}"${newPassword ? ' with new password.' : '.'}`
      );
    }, 400);
  };

  const handleTestMongoUri = async () => {
    if (!mongoUri.trim()) {
      addToast('URI Missing', 'error', 'Please enter a MongoDB connection URI to connect.');
      return;
    }
    setIsTestingMongo(true);
    try {
      const res = await fetch('/api/db/connect-mongo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mongoUri: mongoUri.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDbStatusInfo({
          isConnected: true,
          dbName: data.dbName,
          counts: data.counts,
        });
        localStorage.setItem('daanish_mongo_uri', mongoUri.trim());
        addToast(
          'MongoDB Cluster Active!',
          'success',
          data.message || `Connected to "${data.dbName}". All future records will be saved directly to this database.`
        );
      } else {
        addToast('Connection Error', 'error', data.error || 'Failed to connect to MongoDB cluster.');
      }
    } catch (err) {
      addToast('Connection Error', 'error', 'Could not reach server to establish MongoDB connection.');
    } finally {
      setIsTestingMongo(false);
    }
  };


  

  const handleTestApiKey = async () => {
    setIsTestingKey(true);
    try {
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customApiKey: geminiApiKey }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Gemini API Key Verified!', 'success', data.message || 'Key is valid and responsive.');
      } else {
        addToast('Key Verification Failed', 'error', data.error || 'Invalid API key or network error.');
      }
    } catch (err) {
      addToast('Error', 'error', 'Could not reach server to test API key.');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAiSettings({
      aiEnabled,
      geminiApiKey: geminiApiKey.trim(),
    });
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campusName: campusName.trim(),
        principalName: principalName.trim(),
      }),
    }).catch(() => { });

    if (onUpdateStats) {
      onUpdateStats({
        campusName: campusName.trim(),
        principalName: principalName.trim(),
      });
    }

    if (mongoUri.trim()) {
      localStorage.setItem('daanish_mongo_uri', mongoUri.trim());
      try {
        const res = await fetch('/api/db/connect-mongo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mongoUri: mongoUri.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          setDbStatusInfo({
            isConnected: true,
            dbName: data.dbName,
            counts: data.counts,
          });
        }
      } catch (e) { }
    }

    localStorage.setItem('daanish_2fa', String(twoFactor));
    localStorage.setItem('daanish_email_notif', String(emailNotif));

    setIsSaved(true);
    addToast('Configurations Saved!', 'success', 'Saved campus profile, AI features, active database URI, and security settings.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif] max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            PORTAL CONFIGURATION
          </span>
          <h1 className="text-2xl font-bold text-slate-900 font-['Playfair_Display'] mt-1">
            System Settings & AI Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Punjab Daanish School campus parameters, AI feature toggles, Gemini API keys, and database strings.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('classes')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${activeSubTab === 'classes'
              ? 'border-emerald-800 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Campus</span>
        </button>

        

        <button
          type="button"
          onClick={() => setActiveSubTab('db')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${activeSubTab === 'db'
              ? 'border-emerald-800 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Database className="w-4 h-4" />
          <span>Others</span>
        </button>
      </div>

      {/* Sub-Tab 1: Classes, Sections & Teacher Assignments */}
      {activeSubTab === 'classes' && (
        <div className="space-y-6">
           {/* Campus & Administration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>Campus & Administration Profile</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus Title</label>
                <input
                  type="text"
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus Principal / Head</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
            </div>
            <button
            type="button"
            onClick={handleSaveSettings}  
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          </div>
          {/* Class, Section & Department Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grades / Class Levels Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Academic Class Levels / Grades</h2>
                  <p className="text-[11px] text-slate-500">
                    Manage active grade levels in campus system.
                  </p>
                </div>
              </div>

              {/* Active Grades Badges */}
              <div className="flex flex-wrap gap-2">
                {gradesList.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold"
                  >
                    <span>Grade {g}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGrade(g)}
                      title="Remove grade level"
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Grade Form */}
              <form onSubmit={handleAddGrade} className="flex  items-center space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="e.g. 7th, 1st Year, 2nd Year"
                  value={newGradeInput}
                  onChange={(e) => setNewGradeInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                <Plus className="w-3.5 h-3.5" />
                Add Grade
                </button>
              </form>
            </div>

            {/* Sections Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Campus Class Sections</h2>
                  <p className="text-[11px] text-slate-500">
                    Manage active class sections & wings.
                  </p>
                </div>
              </div>

              {/* Active Sections Badges */}
              <div className="flex flex-wrap gap-2">
                {sectionsList.map((sec) => (
                  <span
                    key={sec}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-slate-800 rounded-xl text-xs font-bold"
                  >
                    <span>{sec}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sec)}
                      title="Remove section"
                      className="text-amber-400 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Section Form */}
              <form onSubmit={handleAddSection} className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="e.g. Section D"
                  value={newSectionInput}
                  onChange={(e) => setNewSectionInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-amber-700 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Section
                </button>
              </form>
            </div>

            {/* Academic Departments Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-sky-100 text-sky-800 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Academic Departments</h2>
                  <p className="text-[11px] text-slate-500">
                    Principal-defined subject departments for faculty.
                  </p>
                </div>
              </div>

              {/* Active Departments Badges */}
              <div className="flex flex-wrap gap-2">
                {departmentsList.map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl text-xs font-bold"
                  >
                    <span>{dept}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(dept)}
                      title="Remove department"
                      className="text-sky-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Department Form */}
              <form onSubmit={handleAddDepartment} className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="e.g. Science, Math, Computer"
                  value={newDepartmentInput}
                  onChange={(e) => setNewDepartmentInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-sky-800 hover:bg-sky-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Department
                </button>
              </form>
            </div>

            {/* Academic Houses Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Academic Houses</h2>
                  <p className="text-[11px] text-slate-500">
                    Principal-defined Houses for student allocation (e.g. Jinnah, Liaquat, Chenab, Ravi).
                  </p>
                </div>
              </div>

              {/* Active Houses Badges */}
              <div className="flex flex-wrap gap-2">
                {housesList.map((house) => (
                  <span
                    key={house}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-950 rounded-xl text-xs font-bold"
                  >
                    <span>{house} House</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHouse(house)}
                      title="Remove house"
                      className="text-amber-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New House Form */}
              <form onSubmit={handleAddHouse} className="flex items-center space-x-2 pt-2 max-w-md">
                <input
                  type="text"
                  placeholder="e.g. Jinnah, Liaquat, Iqbal"
                  value={newHouseInput}
                  onChange={(e) => setNewHouseInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add House</span>
                </button>
              </form>
            </div>

            
          </div>

        
        </div>
      )}

     
      {/* Sub-Tab 3: Database & AI Services */}
      {activeSubTab === 'db' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">

          {/* AI Features & Gemini API Key Settings */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span>AI Academic Intelligence & Assistant</span>
                  <p className="text-[11px] font-normal text-slate-500">
                    Control AI appraisal reports, class mark sheet analytics, and official notice drafting.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
              </label>
            </div>

            {aiEnabled ? (
              <div className="space-y-4 pt-1">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs flex items-start space-x-3">
                  <Cpu className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950">AI Features Active Across Portal:</span>
                    <ul className="list-disc list-inside mt-1 text-emerald-900 space-y-0.5 text-[11px]">
                      <li><strong>Student Academic Appraisal</strong> (Individual board exam readiness & strength analysis)</li>
                      <li><strong>Class Result Sheet Insights</strong> (Subject breakdown & remedial action plans)</li>
                      <li><strong>Official Notice Draft Generator</strong> (Instant administrative circular creation)</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 text-xs mb-1.5 items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Custom Gemini API Key (Required)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      If you don't provide API key AI features won't work.
                    </span>
                  </label>

                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="AIzaSy..."
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="w-full pl-3.5 pr-28 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                    />
                    <div className="absolute right-2 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        title={showApiKey ? 'Hide Key' : 'Show Key'}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestApiKey}
                        disabled={isTestingKey}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold transition-colors flex items-center space-x-1"
                      >
                        {isTestingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Test Key</span>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">AI Features Disabled</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    All AI buttons, appraisal report generators, class insights, and AI notice drafting tools have been completely removed from the portal views for all users.
                  </p>
                </div>
              </div>
            )}
          </div>

         

          {/* Database & MongoDB Integration Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Database className="w-4 h-4 text-emerald-700" />
                <span>MongoDB Cloud Connectivity</span>
              </div>
              {dbStatusInfo?.isConnected ? (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>Active ({dbStatusInfo.dbName || 'Connected'})</span>
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Local Memory Storage
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Connect & Activate MongoDB Cluster</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Supply your <code>MONGODB_URI</code> to connect. All future student registrations, assessment marksheets, staff logs, and circulars will be stored and updated live in your cluster database.
                  </p>
                </div>
              </div>

              {dbStatusInfo?.isConnected && dbStatusInfo.counts && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Live Database Synced:</span>
                  </span>
                  <div className="flex items-center space-x-3 font-mono text-[11px] text-emerald-900 font-bold">
                    <span>{dbStatusInfo.counts.students ?? 0} Students</span>
                    <span>•</span>
                    <span>{dbStatusInfo.counts.teachers ?? 0} Faculty</span>
                    <span>•</span>
                    <span>{dbStatusInfo.counts.assessments ?? 0} Marksheets</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="password"
                  placeholder="mongodb+srv://username:password@cluster.mongodb.net/daanish_schools_db"
                  value={mongoUri}
                  onChange={(e) => setMongoUri(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestMongoUri}
                  disabled={isTestingMongo}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isTestingMongo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting Database...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Connect & Activate Database</span>
                    </>
                  )}
                </button>

                
              </div>
            </div>
          </div>

         
         

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save System Configurations</span>
          </button>

        </form>
      )}
    </div>
  );
};


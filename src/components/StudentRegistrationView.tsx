import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Upload,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CheckCircle2,
  Camera,
  GraduationCap,
  Sparkles,
  FileText,
  AlertCircle,
  X,
  Trash2,
} from 'lucide-react';
import { Student, HouseType } from '../types';
import { useToast } from '../context/ToastContext';

interface StudentRegistrationViewProps {
  onRegisterSingle: (studentData: Partial<Student>) => void;
  onRegisterBulk: (students: Partial<Student>[]) => void;
}

export const StudentRegistrationView: React.FC<StudentRegistrationViewProps> = ({
  onRegisterSingle,
  onRegisterBulk,
}) => {
  const { addToast } = useToast();

  // Single Registration Form State
  const [name, setName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [dob, setDob] = useState('2008-05-14');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [grade, setGrade] = useState('10th');
  const [section, setSection] = useState('Section A');
  const [dbGrades, setDbGrades] = useState<string[]>([]);
  const [dbSections, setDbSections] = useState<string[]>([]);
  const [dbHouses, setDbHouses] = useState<string[]>(['Chenab', 'Ravi', 'Jhelum', 'Indus', 'Jinnah', 'Liaquat']);
  const [house, setHouse] = useState<string>('Chenab');
  const [rollNo, setRollNo] = useState('1');
  const [entryTestMarks, setEntryTestMarks] = useState<number>(85);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+92 300 ');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300'
  );

  const fetchNextRoll = () => {
    fetch('/api/students/next-roll')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.nextRollNo) {
          setRollNo(String(data.nextRollNo));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNextRoll();

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (Array.isArray(data.grades) && data.grades.length > 0) {
            setDbGrades(data.grades);
            if (!data.grades.includes(grade)) setGrade(data.grades[0]);
          }
          if (Array.isArray(data.sections) && data.sections.length > 0) {
            setDbSections(data.sections);
            if (!data.sections.includes(section)) setSection(data.sections[0]);
          }
          if (Array.isArray(data.houses) && data.houses.length > 0) {
            setDbHouses(data.houses);
            setHouse(data.houses[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Bulk Registration Functional State
  const [bulkMode, setBulkMode] = useState<'upload' | 'paste'>('upload');
  const [rawCsvInput, setRawCsvInput] = useState('');
  const [parsedStudents, setParsedStudents] = useState<Partial<Student>[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Validation Error', 'error', 'Student full name is required');
      return;
    }

    onRegisterSingle({
      name,
      guardianName,
      dob,
      gender,
      grade,
      section,
      house,
      rollNo,
      entryTestMarks,
      address,
      contactPhone: phone,
      photoUrl,
    });

    addToast(
      'Student Registered!',
      'success',
      `${name} registered under Roll No: ${rollNo} (${house} House)`
    );

    // Reset Form
    setName('');
    setGuardianName('');
    fetchNextRoll();
  };

  // Helper to parse CSV string into Partial<Student>[]
  const parseCsvText = (text: string): Partial<Student>[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const results: Partial<Student>[] = [];

    // Skip header line if present
    const startIndex = lines[0] && (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('roll')) ? 1 : 0;

    const houses: HouseType[] = ['Jinnah', 'Sir Syed', 'Liaquat', 'Iqbal'];

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 1 && parts[0] !== '') {
        const studentName = parts[0];
        const fatherName = parts[1] || 'Guardian';

        let studentGender: 'Male' | 'Female' | 'Other' = 'Male';
        let studentGrade = '10th';
        let studentSection = 'Section A';
        let studentHouse: HouseType = houses[i % 4];
        let studentDob = '2008-01-01';
        let studentPhone = '+92 300 0000000';
        let entryTestMarks = 85;
        let address = 'Punjab, Pakistan';

        if (['male', 'female', 'other'].includes(parts[2]?.toLowerCase())) {
          // Format with Gender at index 2: Name, Father Name, Gender, Grade, Section, House, DOB, Phone, Entry Test Marks, Address
          studentGender = (parts[2].charAt(0).toUpperCase() + parts[2].slice(1).toLowerCase()) as any;
          studentGrade = parts[3] || '10th';
          studentSection = parts[4] || 'Section A';
          studentHouse = (houses.includes(parts[6] as any) ? parts[6] : houses[i % 4]) as HouseType;
          studentDob = parts[6] || '2008-01-01';
          studentPhone = parts[7] || '+92 300 0000000';
          entryTestMarks = parts[8] && !isNaN(Number(parts[8])) ? Number(parts[8]) : 85;
          address = parts[9] || 'Punjab, Pakistan';
        } else {
          // Legacy format: Name, Father Name, Grade, Section, House, DOB, Phone
          studentGrade = parts[2] || '10th';
          studentSection = parts[3] || 'Section A';
          studentHouse = (houses.includes(parts[4] as any) ? parts[4] : houses[i % 4]) as HouseType;
          studentDob = parts[5] || '2008-01-01';
          studentPhone = parts[6] || '+92 300 0000000';
          entryTestMarks = parts[7] && !isNaN(Number(parts[7])) ? Number(parts[7]) : 85;
          address = parts[8] || 'Punjab, Pakistan';
        }

        results.push({
          name: studentName,
          guardianName: fatherName,
          gender: studentGender,
          grade: studentGrade,
          section: studentSection,
          house: studentHouse,
          dob: studentDob,
          contactPhone: studentPhone,
          entryTestMarks,
          address,
        });
      }
    }

    return results;
  };

  // Handle actual file upload input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseCsvText(content);
        if (parsed.length > 0) {
          setParsedStudents(parsed);
          setIsBulkModalOpen(true);
          addToast('CSV Parsed', 'info', `Found ${parsed.length} student records in ${file.name}`);
        } else {
          addToast('File Error', 'error', 'No valid student records found in file.');
        }
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  // Handle pasted CSV submission
  const handleProcessPastedCsv = () => {
    if (!rawCsvInput.trim()) {
      addToast('Empty Input', 'warning', 'Please paste CSV text data first.');
      return;
    }

    const parsed = parseCsvText(rawCsvInput);
    if (parsed.length > 0) {
      setParsedStudents(parsed);
      setIsBulkModalOpen(true);
      addToast('CSV Text Processed', 'info', `Parsed ${parsed.length} student rows.`);
    } else {
      addToast('Parse Error', 'error', 'Could not extract valid records from pasted CSV.');
    }
  };


  // Confirm final bulk enrollment
  const handleConfirmBulkEnrollment = () => {
    if (parsedStudents.length === 0) return;

    onRegisterBulk(parsedStudents);
    addToast(
      'Bulk Registration Successful!',
      'success',
      `Enrolled ${parsedStudents.length} students into Punjab Daanish Schools database!`
    );

    setParsedStudents([]);
    setIsBulkModalOpen(false);
    setRawCsvInput('');
  };

  // Download official CSV format template
  const handleDownloadTemplate = () => {
    const csvHeader = 'Name, Father Name, Gender, Grade, Section, House, Date of Birth, Contact Phone, Entry Test Marks, Address\n';
    const csvRows = [
      'Arshad Nadeem, Muhammad Nadeem, Male, 10th, Section A, Chenab, 2008-05-14, +92 300 1234567, 88, Mian Channu District Khanewal',
      'Hamza Shehbaz, Shehbaz Sharif, Male, 11th, Section B, Ravi, 2007-09-20, +92 301 9876543, 92, Model Town Lahore',
      'Ayesha Siddiqua, Ahmad Ali, Female, 9th, Section A, Jhelum, 2009-03-11, +92 302 5554433, 85, Satellite Town Multan',
    ].join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'daanish_student_roster_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Template Downloaded', 'success', 'Official Daanish CSV Template saved to device.');
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            ENROLLMENT PORTAL
          </span>
          <h1 className="text-2xl font-bold text-slate-900 font-['Playfair_Display'] mt-1">
            Student Enrollment & Registration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Form 02-B: Official Punjab Daanish Schools Academic Registration & House Allocation.
          </p>
        </div>

        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form 02-B: Main Single Form */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
              <UserPlus className="w-5 h-5 text-emerald-700" />
              <span>Form 02-B: Individual Student Dossier</span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">
              
            </span>
          </div>

          <form onSubmit={handleSubmitSingle} className="space-y-4 text-xs">
            {/* Avatar & Photo Picker */}
            <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <img
                src={photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                alt="Student Preview"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-700/30"
              />
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Upload Student Photograph
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Image URL..."
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-full max-w-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoUrl(
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300'
                      )
                    }
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition-colors"
                    title="Generate Random Photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arshad Nadeem"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Father / Guardian Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Nadeem"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Roll Number</label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Academic Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                >
                  {dbGrades.map((g) => (
                    <option key={g} value={g}>
                      {g.toLowerCase().includes('grade') ? g : `${g} Grade`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                >
                  {dbSections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">House Allocation</label>
                <select
                  value={house}
                  onChange={(e) => setHouse(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                >
                  {dbHouses.map((h) => (
                    <option key={h} value={h}>
                      {h} House
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entry Test Marks (/100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={entryTestMarks}
                  onChange={(e) => setEntryTestMarks(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Address & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Permanent Residence Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="District, City, Punjab"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center space-x-2 mt-4"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Complete Registration & Save Dossier</span>
            </button>
          </form>
        </div>

        {/* Right Column: Bulk Upload & Interactive CSV Tool */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Functional Bulk Enrollment Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <span>Bulk Student Import Engine</span>
            </div>

            {/* Sub-tabs: Upload File vs Paste Text */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setBulkMode('upload')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  bulkMode === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Upload File (.csv)
              </button>
              <button
                type="button"
                onClick={() => setBulkMode('paste')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  bulkMode === 'paste' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Paste CSV Text
              </button>
            </div>

            {bulkMode === 'upload' ? (
              <div>
                <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 p-6 rounded-xl text-center cursor-pointer transition-colors block">
                  <Upload className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-800">Select or Drag CSV File</div>
                  <p className="text-[10px] text-slate-500 mt-1">Supports .csv or .txt files</p>
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
                  rows={5}
                  value={rawCsvInput}
                  onChange={(e) => setRawCsvInput(e.target.value)}
                  placeholder={`Name, Father Name, Gender, Grade, Section, House, DOB, Phone, Entry Test Marks, Address\nArshad Nadeem, Muhammad Nadeem, Male, 10th, Section A, Chenab, 2008-05-14, +92 300 1234567, 88, Mian Channu\nSana Malik, Malik Hussain, Female, 9th, Section B, Ravi, 2009-06-21, +92 301 4445566, 92, DG Khan`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleProcessPastedCsv}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Parse & Preview CSV Rows</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center text-xs">
              

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-slate-500 font-semibold hover:text-slate-800 flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>
            </div>
          </div>

          {/* Registration Policy */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm mb-3">
              <ShieldCheck className="w-5 h-5" />
              <span>Daanish Admission Criteria</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>100% Free Education, Lodging, Uniforms, and Boarding Facilities.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Strict verification of underprivileged family income certificate.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Automatic assignment into Chenab, Ravi, Jhelum, or Indus House.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Bulk Preview Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 border border-slate-200 relative overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                  BULK ENROLLMENT VERIFICATION
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Parsed Roster Preview ({parsedStudents.length} Students)
                </h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Guardian Name</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Grade & Sec</th>
                    <th className="p-3">House</th>
                    <th className="p-3">Entry Test</th>
                    <th className="p-3">Address</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {parsedStudents.map((st, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{st.name}</td>
                      <td className="p-3 text-slate-600">{st.guardianName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${st.gender === 'Female' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}>
                          {st.gender || 'Male'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{st.grade} ({st.section})</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          {st.house}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-700">{st.entryTestMarks || 85}/100</td>
                      <td className="p-3 text-slate-600 max-w-35 truncate" title={st.address}>{st.address || 'Punjab'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setParsedStudents((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
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
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmBulkEnrollment}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Confirm & Enrol All {parsedStudents.length} Students</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Loader2,
  Search,
} from 'lucide-react';
import { UserSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
  onDirectStudentLookup: (rollNo: string) => void;
  defaultPrincipalName?: string;
  defaultPrincipalEmail?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onDirectStudentLookup,
}) => {
  // Principal exists check
  const [hasPrincipal, setHasPrincipal] = useState<boolean | null>(null);
  const [checkingPrincipal, setCheckingPrincipal] = useState(true);

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Principal Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCampus, setRegCampus] = useState('Punjab Daanish School & Center of Excellence');
  const [regDesignation, setRegDesignation] = useState('Principal / Administrator');

  // Student roll lookup state
  const [rollInput, setRollInput] = useState('');
  const [isSearchingRoll, setIsSearchingRoll] = useState(false);
  const [rollError, setRollError] = useState<string | null>(null);
  const [publicStudentResult, setPublicStudentResult] = useState<any | null>(null);

  const handlePublicRollLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanRoll = rollInput.trim();
    if (!cleanRoll) {
      setRollError('Please enter a valid student Roll Number.');
      return;
    }

    setRollError(null);
    setIsSearchingRoll(true);

    try {
      const res = await fetch(`/api/students/roll/${encodeURIComponent(cleanRoll)}`);
      const data = await res.json();

      if (res.ok && data && data.id) {
        setPublicStudentResult(data);
      } else {
        setRollError(data.error || `No student record found for Roll No: "${cleanRoll}". Please verify your roll number.`);
      }
    } catch (err) {
      setRollError('Server connection error. Please try again.');
    } finally {
      setIsSearchingRoll(false);
    }
  };

  // Check if principal exists on mount
  React.useEffect(() => {
    async function checkPrincipal() {
      try {
        const res = await fetch('/api/auth/principal-exists');
        const data = await res.json();
        setHasPrincipal(data.hasPrincipal);
       
      } catch (err) {
        setHasPrincipal(false);
      } finally {
        setCheckingPrincipal(false);
      }
    }
    checkPrincipal();
  }, []);

  // Handle Principal Registration Submission
  const handleRegisterPrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register-principal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: regName,
          userEmail: regEmail,
          password: regPassword,
          campusName: regCampus,
          designation: regDesignation,
        }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setLoginError(data.error || 'Failed to register principal account.');
      }
    } catch (err) {
      setLoginError('Server connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setLoginError(data.error || 'Failed to authenticate. Please check your credentials.');
      }
    } catch (err) {
      setLoginError('Server connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">
        
        {/* Left Side: Form Controls */}
        <div className="lg:col-span-6 p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Header / Brand Logo */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-amber-300 shadow-md shrink-0">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase block">
                  GOVERNMENT OF PUNJAB
                </span>
                <h1 className="text-xl font-bold text-slate-900 font-['Playfair_Display']">
                  Punjab Daanish Schools
                </h1>
              </div>
            </div>

            {/* Form Section Header */}
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">
                {checkingPrincipal
                  ? 'Checking System Status...'
                  : hasPrincipal === false
                  ? 'First-Time Setup: Register Principal'
                  : 'Portal Login'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasPrincipal === false
                  ? 'No Principal account found in the system. Please register the Principal account to initialize school management.'
                  : 'Enter your official email and password. (Teachers are registered by the Principal).'}
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {checkingPrincipal ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                Loading system authentication status...
              </div>
            ) : hasPrincipal === false ? (
              /* Principal Registration Form */
              <form onSubmit={handleRegisterPrincipal} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Principal Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Ahmad Khan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="principal@daanish.edu.pk"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Set Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Campus / School Name
                  </label>
                  <input
                    type="text"
                    value={regCampus}
                    onChange={(e) => setRegCampus(e.target.value)}
                    placeholder="Punjab Daanish School & Center of Excellence"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>{isSubmitting ? 'Creating Principal Account...' : 'Register Principal & Access System'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Standard Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username@daanish.edu.pk"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600" />
                    <span>Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Login to Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Quick Roll Lookup Card */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Public Student Result & Marksheet Lookup</span>
            </div>

            <form onSubmit={handlePublicRollLookup} className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter Student Roll No (e.g. PDS-2024-089)"
                  value={rollInput}
                  onChange={(e) => {
                    setRollInput(e.target.value);
                    if (rollError) setRollError(null);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isSearchingRoll}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSearchingRoll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>View Marksheet</span>
                    </>
                  )}
                </button>
              </div>

              {rollError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 font-medium flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{rollError}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Public Marksheet Result Modal */}
        {publicStudentResult && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
              {/* Header */}
              <div className="bg-emerald-900 text-white p-5 flex items-center justify-between border-b border-emerald-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest block">
                      PUNJAB DAANISH SCHOOLS
                    </span>
                    <h3 className="text-base font-bold font-['Playfair_Display']">
                      Official Academic Result Marksheet
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setPublicStudentResult(null)}
                  className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student Dossier Summary Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Student Name</span>
                    <span className="font-bold text-slate-900 text-sm">{publicStudentResult.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Roll Number</span>
                    <span className="font-mono font-bold text-emerald-800">{publicStudentResult.rollNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Grade & Section</span>
                    <span className="font-semibold text-slate-800">{publicStudentResult.grade} - {publicStudentResult.section}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">House</span>
                    <span className="font-semibold text-amber-700">{publicStudentResult.house || 'Daanish House'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Father/Guardian:</span>
                    <span className="font-semibold text-slate-800">{publicStudentResult.guardianName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Entry Test Score:</span>
                    <span className="font-extrabold text-emerald-700">{publicStudentResult.entryTestMarks ? `${publicStudentResult.entryTestMarks} / 100` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Merit Rank Points:</span>
                    <span className="font-bold text-amber-600">{publicStudentResult.meritPoints || 100} pts</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Enrollment Status:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {publicStudentResult.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assessment Results Breakdown */}
              <div className="p-6">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Academic Test & Examination Marks Breakdown
                </h4>

                {publicStudentResult.assessmentResults && publicStudentResult.assessmentResults.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Assessment Title</th>
                          <th className="p-2.5">Subject</th>
                          <th className="p-2.5 text-center">Marks Obtained</th>
                          <th className="p-2.5 text-center">Max Marks</th>
                          <th className="p-2.5 text-center">Pct (%)</th>
                          <th className="p-2.5 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {publicStudentResult.assessmentResults.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{m.assessmentTitle}</td>
                            <td className="p-2.5 text-slate-600">{m.subject}</td>
                            <td className="p-2.5 text-center font-bold text-slate-900">{m.marksObtained}</td>
                            <td className="p-2.5 text-center text-slate-500">{m.maxMarks}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700">{m.percentage}%</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                m.percentage >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {m.letterGrade || (m.percentage >= 80 ? 'A+' : m.percentage >= 60 ? 'B' : 'F')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium">
                      No published terminal examination results recorded for this student yet.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Entry test score is registered as <strong className="text-emerald-700">{publicStudentResult.entryTestMarks || 'N/A'} / 100</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Marksheet</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPublicStudentResult(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDirectStudentLookup(publicStudentResult.rollNo);
                      setPublicStudentResult(null);
                    }}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <span>Login to Full Student Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Hero Media Banner */}
        <div className="lg:col-span-6 bg-emerald-950 relative overflow-hidden flex flex-col justify-between p-8 text-white min-h-130">
          {/* Background Campus Photo */}
          <img
            src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=1200"
            alt="Punjab Daanish School Campus"
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
          />

          <div className="relative z-10 flex items-center justify-between">
            <span className="bg-amber-400/90 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
              DAANISH SYSTEM
            </span>
            <span className="text-xs text-emerald-200/80 font-mono">Punjab, Pakistan</span>
          </div>

          <div className="relative z-10 space-y-4 my-auto">
            <h2 className="text-3xl font-extrabold font-['Playfair_Display'] leading-tight text-white">
              Empowering the Leaders of Tomorrow
            </h2>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-md">
              Free state-of-the-art boarding, quality education, and holistic development for deserving talent across 14+ campuses in Punjab.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center">
                <Building2 className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-white">14+</div>
                <div className="text-[10px] text-emerald-200">Campuses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center">
                <Users className="w-5 h-5 text-emerald-300 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-white">10,000+</div>
                <div className="text-[10px] text-emerald-200">Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center">
                <Award className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-white">100%</div>
                <div className="text-[10px] text-emerald-200">Board Pass</div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-emerald-300/70 border-t border-emerald-800/60 pt-4">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fully Secure </span>
            </span>
            <span>© {new Date().getFullYear()} Powered By Syed Shahbaz Shah</span>
          </div>
        </div>

      </div>
    </div>
  );
};

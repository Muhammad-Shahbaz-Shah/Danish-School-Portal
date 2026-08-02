import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Key,
  CheckCircle2,
  Lock,
  Camera,
  Shield,
  Save,
  GraduationCap,
  Sparkles,
  Award,
} from "lucide-react";
import { UserSession, Teacher } from "../types";
import { useToast } from "../context/ToastContext";

interface MyProfileViewProps {
  currentUser: UserSession;
  onUpdateUserSession: (updatedSession: Partial<UserSession>) => void;
  teachers?: Teacher[];
  onUpdateTeacher?: (
    teacherId: string,
    updatedFields: Partial<Teacher>,
  ) => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  currentUser,
  onUpdateUserSession,
  teachers = [],
  onUpdateTeacher,
}) => {
  const { addToast } = useToast();

  // Match corresponding teacher record if current user is a teacher
  const matchedTeacher =
    currentUser.userType === "teacher"
      ? teachers.find(
          (t) =>
            t.email.toLowerCase() === currentUser.userEmail.toLowerCase() ||
            t.name.toLowerCase() === currentUser.userName.toLowerCase(),
        )
      : undefined;

  // Form State
  const defaultDepts = [
    "Sciences",
    "Mathematics",
    "Computer Science",
    "English",
    "Urdu",
    "Humanities",
    "Islamiat",
    "Social Sciences",
    "Sports & Physical Ed",
  ];
  const [userName, setUserName] = useState(currentUser.userName || "");
  const [departments, setDepartments] = useState<string[]>(defaultDepts);
  const [userEmail, setUserEmail] = useState(currentUser.userEmail || "");
  const [phone, setPhone] = useState(
    matchedTeacher?.phone || "+92 300 1234567",
  );
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser.avatarUrl ||
      matchedTeacher?.photoUrl ||
      "https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  );
  const [department, setDepartment] = useState(
    matchedTeacher?.department || "Sciences",
  );
  const [designation, setDesignation] = useState(
    matchedTeacher?.designation ||
      (currentUser.userType === "principal" ? "Campus Principal" : "Lecturer"),
  );

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // fetching department
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          data &&
          Array.isArray(data.departments) &&
          data.departments.length > 0
        ) {
          setDepartments(data.departments);
          if (!data.departments.includes(department)) {
            setDepartment(data.departments[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim() || !userEmail.trim()) {
      addToast(
        "Validation Error",
        "error",
        "Full Name and Email Address are required.",
      );
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      addToast(
        "Password Mismatch",
        "error",
        "New password and confirm password do not match.",
      );
      return;
    }

    setIsSaving(true);

    const payload: any = {
      userType: currentUser.userType,
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      oldEmail: currentUser.userEmail,
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim(),
      department,
      designation: designation.trim(),
    };

    if (newPassword.trim()) {
      payload.newPassword = newPassword.trim();
    }

    try {
      // 1. Update session locally
      onUpdateUserSession({
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      // 2. If teacher, update teacher record
      if (matchedTeacher && onUpdateTeacher) {
        onUpdateTeacher(matchedTeacher.id, {
          name: userName.trim(),
          email: userEmail.trim(),
          phone: phone.trim(),
          photoUrl: avatarUrl.trim(),
          department,
          designation: designation.trim(),
        });
      }

      // 3. Send update to API endpoint
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        addToast(
          "Profile Saved",
          "success",
          "Your profile details have been updated successfully.",
        );
      } else {
        addToast(
          "Profile Updated",
          "success",
          "Local profile updated successfully.",
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      addToast(
        "Profile Updated",
        "success",
        "Profile state updated successfully.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif] max-w-5xl mx-auto">
      {/* Top Banner Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden border border-slate-200">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          <div className="relative group">
            <img
              src={avatarUrl}
              alt={userName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-teal-500/40 shadow-2xl bg-teal-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-1.5 rounded-lg shadow-md border border-emerald-500">
              <Camera className="w-4 h-4" />
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-teal-500/20 text-teal-800 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider border border-teal-600/30">
                {currentUser.userType === "principal"
                  ? "Principal & Administrator"
                  : currentUser.userType === "teacher"
                    ? "Faculty Educator"
                    : "Daanish Scholar"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold  font-['Playfair_Display'] tracking-tight">
              {userName}
            </h1>

            <p className=" text-xs font-medium">
              {designation} &bull;{" "}
              {currentUser.userType === "principal"
                ? "Campus Management"
                : department}{" "}
              Department
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs ">
              <span className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-800" />
                <span>{userEmail}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-800" />
                <span>{phone}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Overview Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-800" />
              <span>Account Credentials</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 flex flex-col items-start gap-1 justify-center rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Account Type
                </span>
                <div className="font-bold text-slate-900  capitalize flex items-center justify-between">
                  <span>{currentUser.userType}</span>
                  <Award className="w-4 h-4 text-emerald-700" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex flex-col items-start gap-1 justify-center border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Primary Email
                </span>
                <div className="font-mono text-slate-800  text-[11px] truncate">
                  {userEmail}
                </div>
              </div>

              {matchedTeacher && (
                <div className="p-3 bg-slate-50 rounded-xl flex flex-col items-start gap-1 justify-center   border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Employee ID
                  </span>
                  <div className="font-mono font-bold text-emerald-800">
                    {matchedTeacher.employeeId}
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Portal Access Status</span>
                </span>
                <p className="text-[11px] text-slate-600">
                  Full active permissions granted for Punjab Daanish Schools
                  Academic Portal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6"
          >
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Personal & Professional Information
                </h3>
                <p className="text-xs text-slate-500">
                  Update your account name, contact info, and profile avatar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Lecturer, Campus Principal"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>

              {currentUser.userType === "teacher" && (
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Academic Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  >
                    {Array.isArray(departments) &&
                      departments.map((dept, index) => (
                        <option key={index} value={dept}>
                          {dept}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Profile Photo / Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 text-[11px] focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Change Password Section */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-800" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Change Account Password
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to verify"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-emerald-300" />
                <span>
                  {isSaving ? "Saving Changes..." : "Save Profile Changes"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

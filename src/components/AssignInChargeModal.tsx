import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";
import { Teacher } from "../types";

interface AssignInChargeModalProps {
  teachers: Teacher[];
  initialSelectedTeacherId?: string;
  onUpdateTeacherInCharge: (teacherId: string, classInChargeOf: string) => void;
  onClose: () => void;
}

export const AssignInChargeModal: React.FC<AssignInChargeModalProps> = ({
  teachers,
  initialSelectedTeacherId,
  onUpdateTeacherInCharge,
  onClose,
}) => {
  const { addToast } = useToast();

  const [dbGrades, setDbGrades] = useState<string[]>([
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
  ]);
  const [dbSections, setDbSections] = useState<string[]>([
    "Section A",
    "Section B",
    "Section C",
  ]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (Array.isArray(data.grades) && data.grades.length > 0) {
            setDbGrades(data.grades);
          }
          if (Array.isArray(data.sections) && data.sections.length > 0) {
            setDbSections(data.sections);
          }
        }
      })
      .catch(() => {});
  }, []);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    initialSelectedTeacherId || (teachers.length > 0 ? teachers[0].id : ""),
  );

  const selectedTeacher =
    teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  // Selected Grade & Section for In-Charge Appointment
  const [inChargeGrade, setInChargeGrade] = useState("6th");
  const [inChargeSection, setInChargeSection] = useState("Section A");

  if (!selectedTeacher) {
    return null;
  }

  // Parse list of in-charge strings for a teacher
  const getInChargeList = (str?: string): string[] => {
    if (!str || !str.trim()) return [];
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const currentTeacherInChargeList = getInChargeList(
    selectedTeacher.classInChargeOf,
  );

  // Targeted designation string e.g. "6th Grade - Section A"
  const targetDesignation = `${inChargeGrade} - ${inChargeSection}`;

  // Find if another teacher is ALREADY in-charge of this exact class/section
  const existingInChargeTeacher = teachers.find((t) => {
    if (t.id === selectedTeacher.id) return false;
    const list = getInChargeList(t.classInChargeOf);
    return list.some(
      (item) =>
        item.toLowerCase() === targetDesignation.toLowerCase() ||
        item.toLowerCase().replace(/\s+/g, "") ===
          targetDesignation.toLowerCase().replace(/\s+/g, "") ||
        (item.toLowerCase().includes(inChargeGrade.toLowerCase()) &&
          item.toLowerCase().includes(inChargeSection.toLowerCase())),
    );
  });

  // Appoint as Class In-Charge with strict Single-InCharge Enforcement
  const handleAssignInCharge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentTeacherInChargeList.includes(targetDesignation)) {
      addToast(
        "Already Appointed",
        "info",
        `${selectedTeacher.name} is already Class In-Charge for ${targetDesignation}`,
      );
      return;
    }

    const newList = [...currentTeacherInChargeList, targetDesignation];
    const updatedInChargeStr = newList.join(", ");

    onUpdateTeacherInCharge(selectedTeacher.id, updatedInChargeStr);

    if (existingInChargeTeacher) {
      addToast(
        "Class In-Charge Reassigned",
        "warning",
        `Reassigned ${targetDesignation} from ${existingInChargeTeacher.name} to ${selectedTeacher.name}. (Enforced 1 In-Charge per class)`,
      );
    } else {
      addToast(
        "Class In-Charge Appointed",
        "success",
        `Appointed ${selectedTeacher.name} as Class In-Charge for ${targetDesignation}`,
      );
    }
  };

  // Relieve a single Class In-Charge duty from selected teacher
  const handleRemoveInChargeDuty = (dutyToRemove: string) => {
    const updatedList = currentTeacherInChargeList.filter(
      (item) => item !== dutyToRemove,
    );
    const updatedInChargeStr = updatedList.join(", ");

    onUpdateTeacherInCharge(selectedTeacher.id, updatedInChargeStr);
    addToast(
      "In-Charge Duty Relieved",
      "info",
      `Removed Class In-Charge designation (${dutyToRemove}) from ${selectedTeacher.name}`,
    );
  };

  // Relieve all Class In-Charge duties from selected teacher
  const handleRelieveAllInCharge = () => {
    onUpdateTeacherInCharge(selectedTeacher.id, "");
    addToast(
      "All In-Charge Duties Relieved",
      "info",
      `Relieved all Class In-Charge designations from ${selectedTeacher.name}`,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 ring-2 ring-amber-400/50 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    Principal Executive Action
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-['Playfair_Display'] text-white mt-1">
                  Appoint Class In-Charge (Class Teacher)
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
          {/* Teacher Selection */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Select Faculty Member to Appoint as In-Charge
              </label>
              <select
                value={selectedTeacher.id}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-600 focus:outline-none"
              >
                {teachers.map((t, idx) => {
                  const inChargeCount = getInChargeList(
                    t.classInChargeOf,
                  ).length;
                  return (
                    <option key={`${t.id}-${idx}`} value={t.id}>
                      {t.name} ({t.department}) — [
                      {inChargeCount > 0
                        ? `Currently In-Charge: ${t.classInChargeOf}`
                        : "No In-Charge Duty"}
                      ]
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Teacher Details */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    selectedTeacher.photoUrl ||
                    "https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  }
                  alt={selectedTeacher.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-500/40 shadow-xs"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedTeacher.name}
                  </div>
                  <div className="text-amber-900 font-semibold text-xs">
                    {selectedTeacher.designation}
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    ID: {selectedTeacher.employeeId} |{" "}
                    {selectedTeacher.department}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                {currentTeacherInChargeList.length > 0 ? (
                  <div className="space-y-1">
                    <span className="bg-amber-800 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg inline-block">
                      Active In-Charge ({currentTeacherInChargeList.length})
                    </span>
                    <div className="text-[10px] text-amber-900 font-bold max-w-40 truncate">
                      {selectedTeacher.classInChargeOf}
                    </div>
                  </div>
                ) : (
                  <span className="bg-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-1 rounded-lg inline-block">
                    No In-Charge Duty
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Form */}
          <form
            onSubmit={handleAssignInCharge}
            className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-xs">
                <UserCheck className="w-4 h-4 text-amber-700" />
                <span>Appoint Class In-Charge Duty</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                Class Teacher Designation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Grade Level
                </label>
                <select
                  value={inChargeGrade}
                  onChange={(e) => setInChargeGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                >
                  {dbGrades.map((g) => (
                    <option key={g} value={g}>
                      {g.toLowerCase().includes("grade") ? g : `${g} Grade`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Section
                </label>
                <select
                  value={inChargeSection}
                  onChange={(e) => setInChargeSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                >
                  {dbSections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conflict / Reassignment Notice */}
            {existingInChargeTeacher ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2.5 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug">
                  <span className="font-bold">
                    Class Currently Has an In-Charge:{" "}
                  </span>
                  <strong className="underline">
                    {existingInChargeTeacher.name}
                  </strong>{" "}
                  is currently the In-Charge for{" "}
                  <strong className="font-bold">{targetDesignation}</strong>.
                  Appointing {selectedTeacher.name} will automatically replace{" "}
                  {existingInChargeTeacher.name}.
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center space-x-2 text-emerald-900 text-[11px] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {targetDesignation} is currently vacant and open for In-Charge
                  appointment.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-linear-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <GraduationCap className="w-4.5 h-4.5 text-amber-300" />
              <span>
                Appoint {selectedTeacher.name} as Class In-Charge for{" "}
                {targetDesignation}
              </span>
            </button>
          </form>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-xs">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span>
                  Currently Incharge Of ({currentTeacherInChargeList.length})
                  Classes
                </span>
              </div>
            </div>

            {currentTeacherInChargeList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-xs">
                  No class schedules assigned to this faculty member yet.
                </p>
                <p className="text-[10px] text-slate-400">
                  Use the form above to assign class subjects and period slots.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                      <th className="p-2.5">Class / Section</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentTeacherInChargeList.map((duty, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-2.5 font-bold text-slate-900">
                          {duty}
                        </td>

                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveInChargeDuty(duty)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer"
                            title="Unassign Class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">
                              Relieve
                            </span>
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
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-right shrink-0">
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

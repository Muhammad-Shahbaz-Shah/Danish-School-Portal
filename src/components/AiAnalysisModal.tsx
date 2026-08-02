import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Bot,
  GraduationCap,
  CheckCircle2,
  FileText,
  RefreshCw,
  Copy,
  Check,
  Download,
  Award,
  TrendingUp,
  ShieldCheck,
  Lightbulb,
  Target,
  BookOpen,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Student } from '../types';
import { useToast } from '../context/ToastContext';

interface AiAnalysisModalProps {
  student?: Student | null;
  customApiKey?: string;
  onClose: () => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  student,
  customApiKey,
  onClose,
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const studentName = student?.name || 'Arshad Nadeem';
  const rollNo = student?.rollNo || 'PDS-2024-089';
  const grade = student?.grade || '10th Grade';
  const entryTestMarks = student?.entryTestMarks || 94;

  const generateReport = async () => {
    setLoading(true);
    setInsightText(null);
    try {
      const res = await fetch('/api/ai/report-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          rollNo,
          grade,
          entryTestMarks,
          marks: student?.marks || [],
          customApiKey,
        }),
      });
      const data = await res.json();
      setInsightText(data.insight || 'No report generated.');
    } catch (err) {
      setInsightText('Failed to generate report. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [student]);

  const handleCopyText = () => {
    if (!insightText) return;
    navigator.clipboard.writeText(
      `PUNJAB DAANISH SCHOOLS & CENTER OF EXCELLENCE\n` +
      `AI ACADEMIC APPRAISAL REPORT\n` +
      `Student: ${studentName} (${rollNo}) - Grade: ${grade}\n` +
      `Entry Test Marks: ${entryTestMarks} / 100\n` +
      `--------------------------------------------------\n\n` +
      insightText
    );
    setCopied(true);
    addToast('Report Copied!', 'success', 'Academic appraisal text copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    if (!insightText) return;
    const content =
      `PUNJAB DAANISH SCHOOLS & CENTER OF EXCELLENCE\n` +
      `OFFICIAL AI ACADEMIC APPRAISAL REPORT\n` +
      `==================================================\n` +
      `Student Name: ${studentName}\n` +
      `Roll Number:  ${rollNo}\n` +
      `Grade/Class:  ${grade}\n` +
      `Entry Test Marks: ${entryTestMarks} / 100\n` +
      `Date Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
      `==================================================\n\n` +
      insightText;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${rollNo}_Academic_Appraisal_Report.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Report Saved', 'info', 'Official appraisal summary downloaded as text file.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Banner */}
        <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 ring-2 ring-amber-400/50 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    Gemini 3.6 Flash Intelligence
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold hidden sm:inline">
                    Punjab Daanish Schools & COE
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-['Playfair_Display'] text-white mt-1">
                  AI Academic Appraisal & Evaluation Report
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Profile Quick Stats Bar */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium block">Student Name</span>
              <span className="font-bold text-white truncate block">{studentName}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium block">Roll Number & Grade</span>
              <span className="font-mono font-bold text-amber-300 block">{rollNo} ({grade})</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium block">Entry Test Marks</span>
              <span className="font-bold text-emerald-300 block">{entryTestMarks} / 100</span>
            </div>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {loading ? (
            <div className="min-h-64 flex flex-col items-center justify-center py-16 space-y-4 text-emerald-800 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-800 animate-spin"></div>
                <Bot className="w-6 h-6 text-emerald-800 absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm font-bold text-slate-900">Synthesizing Performance Metrics...</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  Evaluating academic marks, attendance patterns, and board examination preparedness for {studentName}.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Highlight Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standout Rank</span>
                    <span className="text-xs font-bold text-slate-900">Top 5% Merit List</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-teal-100 shadow-2xs flex items-center space-x-3">
                  <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Trajectory</span>
                    <span className="text-xs font-bold text-slate-900">Consistent Upward</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Board Exam Readiness</span>
                    <span className="text-xs font-bold text-slate-900">Distinction Ready</span>
                  </div>
                </div>
              </div>

              {/* Main AI Content Box */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <Bot className="w-4 h-4 text-emerald-700" />
                    <span>Official AI Advisor Output</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyText}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="Copy full text"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold transition-colors"
                      title="Save text report file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download TXT</span>
                    </button>
                  </div>
                </div>

                {/* Formatted Markdown Analysis Body */}
                <div className="prose prose-slate prose-sm max-w-none text-xs text-slate-800 leading-relaxed font-medium">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h3 className="text-sm font-bold text-emerald-950 mt-4 mb-2 flex items-center space-x-2 border-b border-slate-100 pb-1">
                          <BookOpen className="w-4 h-4 text-emerald-700 inline mr-1" />
                          <span>{children}</span>
                        </h3>
                      ),
                      h2: ({ children }) => (
                        <h4 className="text-xs font-bold text-slate-900 mt-3 mb-1.5 flex items-center space-x-1.5">
                          <Target className="w-3.5 h-3.5 text-amber-600 inline mr-1" />
                          <span>{children}</span>
                        </h4>
                      ),
                      h3: ({ children }) => (
                        <h5 className="text-xs font-bold text-slate-800 mt-2 mb-1">{children}</h5>
                      ),
                      ul: ({ children }) => (
                        <ul className="space-y-1.5 my-2 pl-2 list-none">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start space-x-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{children}</span>
                        </li>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 text-slate-700 leading-relaxed">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-emerald-900 bg-emerald-50 px-1 py-0.2 rounded">
                          {children}
                        </strong>
                      ),
                    }}
                  >
                    {insightText || ''}
                  </Markdown>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-analyze with Gemini API</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Done & Close Report
          </button>
        </div>

      </div>
    </div>
  );
};

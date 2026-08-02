import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Bot,
  CheckCircle2,
  Copy,
  Check,
  Download,
  TrendingUp,
  AlertTriangle,
  Award,
  BookOpen,
  Target,
  RefreshCw,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Assessment } from '../types';
import { useToast } from '../context/ToastContext';

interface AiClassInsightsModalProps {
  assessment: Assessment;
  customApiKey?: string;
  onClose: () => void;
}

export const AiClassInsightsModal: React.FC<AiClassInsightsModalProps> = ({
  assessment,
  customApiKey,
  onClose,
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateClassInsights = async () => {
    setLoading(true);
    setInsightText(null);
    try {
      const res = await fetch('/api/ai/class-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assessment.title,
          subject: assessment.subject,
          grade: assessment.grade,
          section: assessment.section,
          classAverage: assessment.classAverage,
          passRate: assessment.passRate,
          maxMarks: assessment.maxMarks,
          marks: assessment.marks || [],
          customApiKey,
        }),
      });
      const data = await res.json();
      setInsightText(data.insight || 'No class insights generated.');
    } catch (err) {
      setInsightText('Failed to generate class insights. Verify API connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateClassInsights();
  }, [assessment]);

  const handleCopyText = () => {
    if (!insightText) return;
    navigator.clipboard.writeText(
      `PUNJAB DAANISH SCHOOLS & CENTER OF EXCELLENCE\n` +
      `CLASS RESULT SHEET AI INSIGHTS & REMEDIAL PLAN\n` +
      `Assessment: ${assessment.title} (${assessment.subject} - ${assessment.grade} ${assessment.section})\n` +
      `Class Avg: ${assessment.classAverage}% | Pass Rate: ${assessment.passRate}%\n` +
      `--------------------------------------------------\n\n` +
      insightText
    );
    setCopied(true);
    addToast('Copied!', 'success', 'Class insights copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!insightText) return;
    const content =
      `PUNJAB DAANISH SCHOOLS & CENTER OF EXCELLENCE\n` +
      `OFFICIAL CLASS RESULT SHEET AI INSIGHTS\n` +
      `==================================================\n` +
      `Assessment Title: ${assessment.title}\n` +
      `Subject & Grade:  ${assessment.subject} (${assessment.grade} ${assessment.section})\n` +
      `Class Average:   ${assessment.classAverage}%\n` +
      `Pass Percentage: ${assessment.passRate}%\n` +
      `Date Evaluated:  ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
      `==================================================\n\n` +
      insightText;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${assessment.title.replace(/\s+/g, '_')}_Class_AI_Insights.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded', 'info', 'Saved class insights report.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Banner */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 ring-2 ring-indigo-400/50 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-400/10 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                    Gemini Class Analytics
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold hidden sm:inline">
                    Pedagogy & Remedial Engine
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-['Playfair_Display'] text-white mt-1">
                  Class Performance & Remedial Strategy
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

          {/* Assessment Overview Bar */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium block">Assessment</span>
              <span className="font-bold text-white truncate block">{assessment.title}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium block">Subject & Class</span>
              <span className="font-mono font-bold text-indigo-300 block">{assessment.subject} • {assessment.grade}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium block">Class Average</span>
              <span className="font-bold text-emerald-300 block">{assessment.classAverage}% Score</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium block">Pass Rate</span>
              <span className="font-bold text-amber-300 block">{assessment.passRate}% Passed</span>
            </div>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {loading ? (
            <div className="min-h-64 flex flex-col items-center justify-center py-16 space-y-4 text-indigo-900 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-800 animate-spin"></div>
                <Bot className="w-6 h-6 text-indigo-800 absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm font-bold text-slate-900">Analyzing Result Sheet & Marks Distribution...</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  Evaluating individual student score cards, identifying key learning gaps, and drafting remedial strategies.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cohort Mean</span>
                    <span className="text-xs font-bold text-slate-900">{assessment.classAverage}% Average Score</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Retention Benchmark</span>
                    <span className="text-xs font-bold text-slate-900">{assessment.passRate}% Clearance</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remedial Priority</span>
                    <span className="text-xs font-bold text-amber-800">
                      {assessment.passRate < 90 ? 'High Focus Needed' : 'Standard Routine'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main AI Content Box */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                    <Bot className="w-4 h-4 text-indigo-700" />
                    <span>Gemini AI Pedagogy Report</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyText}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download TXT</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Formatting Body */}
                <div className="prose prose-slate prose-sm max-w-none text-xs text-slate-800 leading-relaxed font-medium">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h3 className="text-sm font-bold text-indigo-950 mt-4 mb-2 flex items-center space-x-2 border-b border-slate-100 pb-1">
                          <BookOpen className="w-4 h-4 text-indigo-700 inline mr-1" />
                          <span>{children}</span>
                        </h3>
                      ),
                      h2: ({ children }) => (
                        <h4 className="text-xs font-bold text-slate-900 mt-3 mb-1.5 flex items-center space-x-1.5">
                          <Target className="w-3.5 h-3.5 text-amber-600 inline mr-1" />
                          <span>{children}</span>
                        </h4>
                      ),
                      ul: ({ children }) => (
                        <ul className="space-y-1.5 my-2 pl-2 list-none">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start space-x-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
                          <span>{children}</span>
                        </li>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 text-slate-700 leading-relaxed">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-indigo-950 bg-indigo-50 px-1 py-0.2 rounded">
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

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={generateClassInsights}
            disabled={loading}
            className="flex items-center space-x-1.5 text-xs font-bold text-indigo-800 hover:text-indigo-950 hover:underline disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-analyze Class Result Sheet</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Done & Close Insights
          </button>
        </div>

      </div>
    </div>
  );
};

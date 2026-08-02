import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Download,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Award,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSession } from '../types';
import { useToast } from '../context/ToastContext';

interface AiCopilotModalProps {
  currentUser: UserSession;
  customApiKey?: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  currentUser,
  customApiKey,
  onClose,
}) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `### Welcome to Punjab Daanish Schools AI Academic Copilot 👋\n\nI am your intelligent educational assistant for **${currentUser.userName}** (${currentUser.userType === 'principal' ? 'Campus Principal' : currentUser.userType === 'teacher' ? 'Faculty Member' : 'Student Scholar'}).\n\nHow can I support your academic or administrative work today? Choose a prompt below or type your custom query:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const samplePrompts = currentUser.userType === 'principal'
    ? [
        'How can we boost our BISE Matriculation 100% pass rate strategy?',
        'Draft an executive summary for annual board meeting on student progress.',
        'What remedial actions are best for residential house evening coaching?',
      ]
    : currentUser.userType === 'teacher'
    ? [
        'Give me 5 creative board exam preparation tips for Grade 10 Physics.',
        'How to manage heterogeneous learning levels in a 45-minute science class?',
        'What key concepts should students focus on for PCTB Chemistry paper?',
      ]
    : [
        'Explain how to solve quadratic equations step-by-step for BISE exam.',
        'Create a 14-day study timetable for Grade 10 Matric final revision.',
        'What are the most common mistakes students make in Physics numericals?',
      ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          userRole: currentUser.userType,
          context: `User: ${currentUser.userName} (${currentUser.userEmail})`,
          customApiKey,
        }),
      });

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'No response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      addToast('Copilot Error', 'error', 'Unable to fetch AI copilot response.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Copied!', 'success', 'Text copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadChat = () => {
    const chatText = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.sender === 'user' ? currentUser.userName : 'Daanish AI Copilot'}:\n${m.text}\n`
      )
      .join('\n--------------------------------------------------\n\n');

    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daanish_AI_Copilot_Chat_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Chat Exported', 'info', 'Saved conversation log as text file.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full h-[88vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  AI Academic Copilot
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Punjab Daanish Schools & COE
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Educational Assistant & Knowledge Base
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadChat}
              title="Export Conversation"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-xs relative group ${
                  msg.sender === 'user'
                    ? 'bg-emerald-800 text-white rounded-br-none'
                    : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-75 mb-1.5 pb-1 border-b border-current/10">
                  <span className="font-bold">
                    {msg.sender === 'user' ? currentUser.userName : 'Daanish AI Copilot'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="text-xs leading-relaxed font-normal prose prose-xs max-w-none prose-headings:text-inherit prose-headings:font-bold prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-table:border prose-table:border-slate-200 prose-td:p-2 prose-th:p-2 prose-th:bg-slate-100">
                  <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
                </div>

                <button
                  onClick={() => handleCopy(msg.id, msg.text)}
                  title="Copy text"
                  className={`absolute right-2 top-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                    msg.sender === 'user'
                      ? 'text-white/80 hover:bg-white/20'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs font-bold text-xs">
                  {currentUser.userName.charAt(0)}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center space-x-2 text-xs text-slate-500 font-medium">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-700" />
                <span>Gemini is formulating academic response...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Prompts */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> Suggested:
          </span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 border border-slate-200 px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask AI Copilot about BISE syllabus, exams, reports, circulars...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { ShieldCheck, GraduationCap } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 5;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-950 text-white select-none">
      <div className="flex flex-col items-center space-y-6 max-w-md w-full px-6 text-center">
        {/* Emblem Badge */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-emerald-900/80 border-2 border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-900/50">
            <GraduationCap className="w-12 h-12 text-amber-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Playfair_Display']">
            PUNJAB DAANISH SCHOOLS
          </h1>
          <p className="text-xs tracking-widest text-emerald-300 font-semibold uppercase mt-1">
            & Center of Excellence Authority
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full space-y-2 mt-4">
          <div className="flex justify-between text-xs text-emerald-200/80 font-medium">
            <span>Entering Portal for Academic Excellence...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-emerald-900/90 rounded-full overflow-hidden p-0.5 border border-emerald-700/50">
            <div
              className="h-full bg-linear-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="pt-8 border-t border-emerald-900/60 w-full flex items-center justify-between text-[11px] text-emerald-400/60 font-mono">
          <span>GOVT. OF PUNJAB</span>
          <span className="font-semibold text-emerald-300">POWERED BY SYED SHAHBAZ BUKHARI</span>
          <span>v2024.1</span>
        </div>
      </div>
    </div>
  );
};

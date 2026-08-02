import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface OfflineNotificationProps {
  isOffline: boolean;
  onRetryConnection?: () => void;
}

export const OfflineNotification: React.FC<OfflineNotificationProps> = ({
  isOffline,
  onRetryConnection,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(isOffline);

  useEffect(() => {
    if (isOffline) {
      setIsDismissed(false);
      setWasOffline(true);
    } else if (wasOffline && !isOffline) {
      // Just came back online!
      setShowRestoredBanner(true);
      const timer = setTimeout(() => {
        setShowRestoredBanner(false);
        setWasOffline(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  const handleCheckConnection = async () => {
    setIsChecking(true);
    if (onRetryConnection) {
      await onRetryConnection();
    } else {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('/api/stats', { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          window.dispatchEvent(new Event('online'));
        }
      } catch (e) {
        // Still offline
      }
    }
    setTimeout(() => {
      setIsChecking(false);
    }, 600);
  };

  if (!isOffline && !showRestoredBanner) return null;

  return (
    <>
      {/* Top Floating / Fixed Notification Bar */}
      {isOffline && !isDismissed && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-linear-to-r from-amber-950/95 via-slate-900/95 to-rose-950/95 backdrop-blur-md border-b border-amber-500/30 text-white shadow-2xl px-4 py-2.5 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-amber-400 opacity-75"></span>
                  <div className="relative p-1.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                    <WifiOff className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="font-bold text-amber-200 flex items-center gap-1.5 justify-center sm:justify-start">
                    <span>No Internet Connection</span>
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] uppercase font-mono tracking-wider">
                      Offline Mode
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] sm:text-xs">
                    You are currently offline. Cached data is accessible, but online actions will resume once connected.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleCheckConnection}
                  disabled={isChecking}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md hover:shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
                </button>

                <button
                  onClick={() => setIsDismissed(true)}
                  title="Dismiss message"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Restored Top Banner */}
      {showRestoredBanner && !isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-linear-to-r from-emerald-950/95 via-slate-900/95 to-teal-950/95 backdrop-blur-md border-b border-emerald-500/30 text-white shadow-2xl px-4 py-2.5 sm:px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Internet Connection Restored</span>
                  </div>
                  <p className="text-slate-300 text-[11px] sm:text-xs">
                    You are back online. Real-time data synchronization is now active.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRestoredBanner(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

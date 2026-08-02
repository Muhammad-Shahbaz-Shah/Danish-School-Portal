import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { OfflineNotification } from '../components/OfflineNotification';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  isPermanent?: boolean;
  onRetry?: () => Promise<any> | any;
  retryText?: string;
}

interface ToastContextType {
  addToast: (
    title: string,
    type?: ToastType,
    message?: string,
    isPermanent?: boolean,
    customId?: string,
    onRetry?: () => Promise<any> | any,
    retryText?: string
  ) => void;
  removeToast: (id: string) => void;
  isOffline: boolean;
  checkConnection: () => Promise<boolean>;
  dbConnected: boolean | null;
  reconnectDb: () => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      title: string,
      type: ToastType = 'success',
      message?: string,
      isPermanent: boolean = false,
      customId?: string,
      onRetry?: () => Promise<any> | any,
      retryText?: string
    ) => {
      const id = customId || 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

      setToasts((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        return [...filtered.slice(-4), { id, type, title, message, isPermanent, onRetry, retryText }];
      });

      if (!isPermanent) {
        setTimeout(() => {
          removeToast(id);
        }, 5000);
      }
    },
    [removeToast]
  );

  const reconnectDb = useCallback(async (): Promise<boolean> => {
    const savedUri = localStorage.getItem('daanish_mongo_uri') || '';
    try {
      const res = await fetch('/api/db/reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mongoUri: savedUri }),
      });
      const data = await res.json();
      if (data.success) {
        setDbConnected(true);
        setToasts((prev) => prev.filter((t) => t.id !== 'toast-db-status-warning'));
        addToast(
          'MongoDB Atlas Connected!',
          'success',
          data.message || `Successfully connected to MongoDB database "${data.dbName}".`
        );
        return true;
      } else {
        addToast(
          'Reconnection Failed',
          'error',
          data.error || 'Could not connect to MongoDB Atlas cluster. Check your URI or network.'
        );
        return false;
      }
    } catch (e: any) {
      addToast(
        'Connection Error',
        'error',
        e
      );
      return false;
    }
  }, [addToast]);

  const checkDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        const connected = !!data.isConnected;
        setDbConnected(connected);

        if (!connected) {
          addToast(
            'Database Disconnected',
            'warning',
            'Database connection is inactive/disabled. Currently running in temporary local memory mode.',
            true,
            'toast-db-status-warning',
            reconnectDb,
            'Retry Connection'
          );
        } else {
          setToasts((prev) => {
            if (prev.some((t) => t.id === 'toast-db-status-warning')) {
              addToast('Daatabase Active', 'success', `Connected to database "${data.dbName || 'daanish_schools_db'}".`);
            }
            return prev.filter((t) => t.id !== 'toast-db-status-warning');
          });
        }
      } else {
        setDbConnected(false);
        addToast(
          'MongoDB Atlas Disconnected',
          'warning',
          'Database server returned error status. Running in temporary local memory mode.',
          true,
          'toast-db-status-warning',
          reconnectDb,
          'Retry Connection'
        );
      }
    } catch (e) {
      setDbConnected(false);
      addToast(
        'MongoDB Atlas Disconnected',
        'warning',
        'Unable to reach database service. System running in temporary local memory mode.',
        true,
        'toast-db-status-warning',
        reconnectDb,
        'Retry Connection'
      );
    }
  }, [addToast, reconnectDb]);

  useEffect(() => {
    checkDbStatus();
    const dbInterval = setInterval(checkDbStatus, 5000);
    return () => clearInterval(dbInterval);
  }, [checkDbStatus]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/stats', { method: 'HEAD', cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok || res.status < 500) {
        if (isOffline) {
          setIsOffline(false);
          addToast('Internet Restored', 'success', 'You are back online. All services are connected.');
        }
        return true;
      }
    } catch (e) {
      // Fetch failed or timed out
    }
    setIsOffline(true);
    return false;
  }, [isOffline, addToast]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      addToast(
        'No Internet Connection',
        'warning',
        'Your device is offline. Live updates and database sync may be unavailable.'
      );
    };

    const handleOnline = () => {
      setIsOffline(false);
      addToast(
        'Internet Restored',
        'success',
        'You are back online. Real-time system updates are reactivated.'
      );
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, isOffline, checkConnection, dbConnected, reconnectDb }}>
      <OfflineNotification isOffline={isOffline} onRetryConnection={checkConnection} />
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none font-['Plus_Jakarta_Sans',sans-serif]">
        {toasts.map((toast) => (
          <ToastCardItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastCardItem: React.FC<{ toast: ToastItem; onRemove: () => void }> = ({ toast, onRemove }) => {
  const [isRetrying, setIsRetrying] = useState(false);

  let bgColors = 'bg-slate-900 border-slate-800 text-white';
  let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;

  if (toast.type === 'success') {
    bgColors = 'bg-slate-900 border-emerald-500/30 text-white shadow-emerald-950/20';
    icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
  } else if (toast.type === 'error') {
    bgColors = 'bg-slate-900 border-rose-500/30 text-white shadow-rose-950/20';
    icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
  } else if (toast.type === 'warning') {
    bgColors = 'bg-slate-900 border-amber-500/40 text-white shadow-amber-950/30 ring-1 ring-amber-500/20';
    icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
  } else if (toast.type === 'info') {
    bgColors = 'bg-slate-900 border-sky-500/30 text-white shadow-sky-950/20';
    icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;
  }

  const handleRetryClick = async () => {
    if (!toast.onRetry) return;
    setIsRetrying(true);
    try {
      await toast.onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start justify-between space-x-3 transition-all transform animate-in slide-in-from-bottom-5 fade-in duration-200 ${bgColors}`}
    >
      <div className="flex items-start space-x-3 flex-1">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold leading-tight flex items-center gap-1.5 flex-wrap">
            <span>{toast.title}</span>
            {toast.isPermanent && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[9px] uppercase font-mono tracking-wider font-extrabold">
                Persistent
              </span>
            )}
          </div>
          {toast.message && (
            <div className="text-[11px] text-slate-300 mt-1 leading-snug font-medium">
              {toast.message}
            </div>
          )}

          {toast.onRetry && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={handleRetryClick}
                disabled={isRetrying}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Connecting...' : toast.retryText || 'Retry Connection'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-white p-1 rounded-md transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      addToast: (title: string, type: ToastType = 'info', message?: string) => {
        console.log(`[Toast ${type}]: ${title} - ${message || ''}`);
      },
      removeToast: () => {},
      isOffline: false,
      checkConnection: async () => true,
      dbConnected: null,
      reconnectDb: async () => false,
    };
  }
  return context;
};



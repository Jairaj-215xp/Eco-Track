import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X, Trash2, RotateCcw } from 'lucide-react';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

export interface ToastNotification {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, title?: string, duration?: number) => void;
  showConfirm: (options: ConfirmOptions) => void;
  confirm: (options: Omit<ConfirmOptions, 'onConfirm' | 'onCancel'>) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    resolvePromise?: (val: boolean) => void;
    loading?: boolean;
  }>({
    isOpen: false,
    options: null
  });

  // 1. Toast Notification Trigger
  const showAlert = useCallback((message: string, type: AlertType = 'info', title?: string, duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastNotification = { id, type, title, message, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 2. Callback-based Confirmation Dialog
  const showConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmState({
      isOpen: true,
      options,
      loading: false
    });
  }, []);

  // 3. Promise-based Confirmation Dialog
  const confirm = useCallback((options: Omit<ConfirmOptions, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({
        isOpen: true,
        options,
        resolvePromise: resolve,
        loading: false
      });
    });
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmState.options) return;
    setConfirmState(prev => ({ ...prev, loading: true }));

    try {
      if (confirmState.options.onConfirm) {
        await confirmState.options.onConfirm();
      }
      if (confirmState.resolvePromise) {
        confirmState.resolvePromise(true);
      }
    } finally {
      setConfirmState({ isOpen: false, options: null });
    }
  };

  const handleCancelAction = () => {
    if (confirmState.options?.onCancel) {
      confirmState.options.onCancel();
    }
    if (confirmState.resolvePromise) {
      confirmState.resolvePromise(false);
    }
    setConfirmState({ isOpen: false, options: null });
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, confirm }}>
      {children}

      {/* Modern Floating Toast Notification Stack */}
      <div className="fixed top-20 right-4 sm:right-6 z-[100] flex flex-col space-y-2.5 pointer-events-none max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => {
            const isSuccess = toast.type === 'success';
            const isWarn = toast.type === 'warning';
            const isErr = toast.type === 'error';

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className={`pointer-events-auto p-4 rounded-2xl shadow-xl backdrop-blur-xl border flex items-start space-x-3 text-xs ${
                  isSuccess 
                    ? 'bg-slate-900/90 border-emerald-500/40 text-white' 
                    : isWarn 
                    ? 'bg-slate-900/90 border-amber-500/40 text-white' 
                    : isErr 
                    ? 'bg-slate-900/90 border-rose-500/40 text-white' 
                    : 'bg-slate-900/90 border-slate-700/80 text-white'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isSuccess && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {isErr && <XCircle className="w-4 h-4 text-rose-400" />}
                  {toast.type === 'info' && <Info className="w-4 h-4 text-aqua" />}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  {toast.title && (
                    <p className="font-extrabold text-[13px] text-white leading-tight mb-0.5">
                      {toast.title}
                    </p>
                  )}
                  <p className="text-slate-200 leading-relaxed font-medium">
                    {toast.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modern Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmState.isOpen && confirmState.options && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelAction}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              role="alertdialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-[28px] p-6 shadow-2xl z-10 overflow-hidden font-sans"
            >
              <div className="flex flex-col items-center text-center">
                {/* Glowing Icon Header */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm border ${
                  confirmState.options.type === 'danger'
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : confirmState.options.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                    : 'bg-brand-50 border-brand-200 text-brand-600'
                }`}>
                  {confirmState.options.type === 'danger' ? (
                    <Trash2 className="w-6 h-6 text-rose-600" />
                  ) : confirmState.options.type === 'warning' ? (
                    <RotateCcw className="w-6 h-6 text-amber-600" />
                  ) : (
                    <Info className="w-6 h-6 text-brand-600" />
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-display font-extrabold text-ink mb-2">
                  {confirmState.options.title}
                </h3>

                {/* Message */}
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6 max-w-sm">
                  {confirmState.options.message}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={handleCancelAction}
                    disabled={confirmState.loading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-surface-2 hover:bg-slate-200 border border-border text-ink transition-all disabled:opacity-50"
                  >
                    {confirmState.options.cancelText || 'Cancel'}
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={confirmState.loading}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 ${
                      confirmState.options.type === 'danger'
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                        : confirmState.options.type === 'warning'
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                        : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20'
                    }`}
                  >
                    {confirmState.loading ? 'Processing...' : (confirmState.options.confirmText || 'Confirm')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

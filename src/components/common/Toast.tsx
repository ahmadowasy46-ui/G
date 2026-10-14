import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
        };

        const borderColors = {
          success: 'border-emerald-500/30 bg-emerald-950/80',
          error: 'border-rose-500/30 bg-rose-950/80',
          info: 'border-indigo-500/30 bg-indigo-950/80',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-3.5 rounded-xl border backdrop-blur-md shadow-xl text-slate-100 text-xs transition-all animate-in fade-in slide-in-from-bottom-2 ${
              borderColors[toast.type]
            }`}
          >
            <div className="flex items-start gap-2.5">
              {icons[toast.type]}
              <div>
                {toast.title && <p className="font-semibold text-white mb-0.5">{toast.title}</p>}
                <p className="text-slate-300 leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded-md transition -mr-1 -mt-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

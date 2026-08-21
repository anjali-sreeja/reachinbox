import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; message?: string }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", title, message }: { type?: ToastType; title: string; message?: string }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: "success", title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: "error", title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md animate-fade-in transition-all",
              item.type === "success" && "bg-surface-elevated/95 border-emerald-500/30 text-zinc-100",
              item.type === "error" && "bg-surface-elevated/95 border-red-500/30 text-zinc-100",
              item.type === "info" && "bg-surface-elevated/95 border-brand-500/30 text-zinc-100",
              item.type === "warning" && "bg-surface-elevated/95 border-amber-500/30 text-zinc-100"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {item.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {item.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
              {item.type === "info" && <Info className="w-5 h-5 text-brand-400" />}
              {item.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-semibold text-zinc-100">{item.title}</h5>
              {item.message && <p className="text-xs text-zinc-400 mt-0.5">{item.message}</p>}
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

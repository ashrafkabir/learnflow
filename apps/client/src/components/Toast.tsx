import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-success/10 border-success/30 text-success',
  error: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  info: 'bg-accent/10 border-accent/30 text-accent',
  warning: 'bg-warning/10 border-warning/30 text-warning',
};

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, onRemove]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-elevated backdrop-blur-md ${COLORS[item.type]} animate-[slideIn_0.3s_ease-out]`}
      role="alert"
      aria-live="assertive"
    >
      <span>{ICONS[item.type]}</span>
      <p className="text-sm font-medium flex-1">{item.message}</p>
      <button onClick={onRemove} className="opacity-50 hover:opacity-100 text-xs">
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-full pointer-events-none"
            aria-live="assertive"
            role="alert"
          >
            {toasts.map((t) => (
              <div key={t.id} className="pointer-events-auto">
                <ToastItem item={t} onRemove={() => remove(t.id)} />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

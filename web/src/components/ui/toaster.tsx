'use client';

import { createContext, useContext, useState, useCallback } from "react";
import { Toast } from './toast';

interface ToastContextType {
  toast: (title: string, variant?: 'default' | 'success' | 'error') => void;
}

export const ToastContext = createContext<ToastContextType>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; variant: any }>>([]);

  const toast = useCallback((title: string, variant = 'default') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, title, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col-reverse gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} title={t.title} variant={t.variant} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
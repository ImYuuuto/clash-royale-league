import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: NotificationType, title: string, message?: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (type: NotificationType, title: string, message?: string, duration = 4500) => {
      const id = `${Date.now()}-${Math.random()}`;
      setNotifications((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
      {children}
      <aside aria-label="Notifications" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md border text-sm ${
                n.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100 shadow-emerald-900/30'
                  : n.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-100 shadow-rose-900/30'
                  : n.type === 'warning'
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-100 shadow-amber-900/30'
                  : 'bg-sky-950/80 border-sky-500/40 text-sky-100 shadow-sky-900/30'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {n.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {n.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white tracking-wide">{n.title}</div>
                {n.message && <div className="text-xs opacity-90 mt-0.5 leading-relaxed">{n.message}</div>}
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="shrink-0 text-white/60 hover:text-white transition-colors p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </aside>
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

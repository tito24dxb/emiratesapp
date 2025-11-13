import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SystemAnnouncementBanner() {
  const { systemAnnouncement } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!systemAnnouncement.active || isDismissed) return null;

  const getAnnouncementConfig = () => {
    switch (systemAnnouncement.type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgGradient: 'from-green-500/90 to-emerald-600/90',
          iconColor: 'text-white',
          borderColor: 'border-green-400/50',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgGradient: 'from-yellow-500/90 to-orange-600/90',
          iconColor: 'text-white',
          borderColor: 'border-yellow-400/50',
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgGradient: 'from-red-500/90 to-rose-600/90',
          iconColor: 'text-white',
          borderColor: 'border-red-400/50',
        };
      default:
        return {
          icon: Info,
          bgGradient: 'from-blue-500/90 to-indigo-600/90',
          iconColor: 'text-white',
          borderColor: 'border-blue-400/50',
        };
    }
  };

  const config = getAnnouncementConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-[60] w-[95%] md:w-auto md:max-w-2xl"
      >
        <div className={`relative bg-gradient-to-r ${config.bgGradient} backdrop-blur-xl border ${config.borderColor} rounded-2xl shadow-2xl overflow-hidden`}>
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>

          <div className="relative p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
                <Icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                  {systemAnnouncement.message}
                </p>
                {systemAnnouncement.timestamp && (
                  <p className="text-white/70 text-xs mt-2">
                    {new Date(systemAnnouncement.timestamp).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                onClick={() => setIsDismissed(true)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition flex-shrink-0"
                aria-label="Dismiss announcement"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SystemAnnouncementBanner() {
  const { systemAnnouncement } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  console.log('SystemAnnouncementBanner - systemAnnouncement:', systemAnnouncement);

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
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        exit={{ opacity: 0, scaleX: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`bg-gradient-to-r ${config.bgGradient} rounded-full px-2 md:px-3 py-1 md:py-1.5 flex items-center gap-1.5 md:gap-2 w-full`}
        style={{ originX: 0 }}
      >
        <div className={`${config.iconColor} flex-shrink-0`}>
          <Icon className="w-3 h-3 md:w-4 md:h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-[10px] md:text-xs truncate">
            {systemAnnouncement.message}
          </p>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-0.5 transition flex-shrink-0"
          aria-label="Dismiss announcement"
        >
          <X className="w-2.5 h-2.5 md:w-3 md:h-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

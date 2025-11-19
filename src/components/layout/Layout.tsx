import { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SystemAnnouncementBanner from '../SystemAnnouncementBanner';
import BugReportButton from '../BugReportButton';
import { useApp } from '../../context/AppContext';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { banners } = useApp();

  return (
    <div className="min-h-screen relative">
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white text-center py-4 font-black text-2xl z-[9999] shadow-2xl">
        🔥 CHANGES ARE NOW BEING APPLIED - {new Date().toLocaleTimeString()} 🔥
      </div>
      <div className="pt-20">
        <Navbar />
        <SystemAnnouncementBanner />

        <AnimatePresence>
          {banners.map((banner) => (
            <motion.div
              key={banner.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="liquid-card-overlay text-white px-4 py-3 mx-4 my-2 rounded-2xl"
            >
              <div className="max-w-7xl mx-auto flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">{banner.title}</p>
                  <p className="text-sm opacity-90">Expires: {banner.expiration}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row relative z-10">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        <BugReportButton />
      </div>
    </div>
  );
}

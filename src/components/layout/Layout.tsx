import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useApp } from '../../context/AppContext';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OfflineIndicator from '../OfflineIndicator';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { banners } = useApp();
  const location = useLocation();
  const isCommunityPage = location.pathname === '/chat';

  if (isCommunityPage) {
    return (
      <div className="h-screen flex flex-col">
        <OfflineIndicator />
        <div className="flex-shrink-0">
          <TopNavbar />
        </div>

        <AnimatePresence>
          {banners.map((banner) => (
            <motion.div
              key={banner.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-600 text-white px-4 py-2 flex-shrink-0"
            >
              <div className="max-w-7xl mx-auto flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{banner.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        <div className="flex-shrink-0 border-t border-gray-200">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-gray-50">
      <OfflineIndicator />
      <TopNavbar />

      <AnimatePresence>
        {banners.map((banner) => (
          <motion.div
            key={banner.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-600 text-white px-4 py-2"
          >
            <div className="max-w-7xl mx-auto flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">{banner.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <main className="flex-1 p-4 md:p-6 lg:p-8 w-full overflow-x-hidden pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <Sidebar />
      </div>

      <div className="mt-auto hidden md:block">
        <Footer />
      </div>
    </div>
  );
}

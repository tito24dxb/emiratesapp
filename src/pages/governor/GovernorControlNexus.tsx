import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import MetricsCards from '../../components/governor/nexus/MetricsCards';
import RealtimeLogs from '../../components/governor/nexus/RealtimeLogs';
import CommandConsole from '../../components/governor/nexus/CommandConsole';
import BackupControl from '../../components/governor/nexus/BackupControl';
import AIAssistantPanel from '../../components/governor/nexus/AIAssistantPanel';
import UserManager from '../../components/governor/nexus/UserManager';
import SystemFlags from '../../components/governor/nexus/SystemFlags';

interface Announcement {
  active: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: any;
}

export default function GovernorControlNexus() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const announcementDoc = await getDoc(doc(db, 'systemControl', 'announcement'));
        if (announcementDoc.exists()) {
          const data = announcementDoc.data() as Announcement;
          if (data.active) {
            setAnnouncement(data);
          }
        }
      } catch (error) {
        console.error('Error loading announcement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, []);

  const getBannerColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white">
      {!loading && announcement && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border-b ${getBannerColor(announcement.type)} px-6 py-3`}
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm font-medium">{announcement.message}</p>
          </div>
        </motion.div>
      )}

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 shadow-xl border border-gray-200/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Governor Control Nexus</h1>
              <p className="text-gray-600">Central command system for platform management</p>
            </div>
          </div>
        </motion.div>

        <MetricsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RealtimeLogs />
          <CommandConsole />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BackupControl />
          <AIAssistantPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserManager />
          <SystemFlags />
        </div>
      </div>
    </div>
  );
}

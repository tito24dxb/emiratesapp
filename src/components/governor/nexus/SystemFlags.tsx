import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, MessageCircle, Brain, Download, FileQuestion, AlertCircle } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useApp } from '../../../context/AppContext';

interface SystemFlags {
  chatEnabled: boolean;
  quizEnabled: boolean;
  aiEnabled: boolean;
  downloadsEnabled: boolean;
}

export default function SystemFlags() {
  const { currentUser } = useApp();
  const [flags, setFlags] = useState<SystemFlags>({
    chatEnabled: true,
    quizEnabled: true,
    aiEnabled: true,
    downloadsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const isGovernor = currentUser?.role === 'governor';

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const statusDoc = await getDoc(doc(db, 'systemControl', 'status'));
        if (statusDoc.exists()) {
          setFlags(statusDoc.data() as SystemFlags);
        }
      } catch (error) {
        console.error('Error loading system flags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlags();
  }, []);

  const logAction = async (flagName: string, newValue: boolean) => {
    try {
      await addDoc(collection(db, 'auditEvents'), {
        eventType: 'systemFlag',
        userId: currentUser?.uid,
        userName: currentUser?.name,
        details: `${flagName} ${newValue ? 'enabled' : 'disabled'}`,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const handleToggle = async (flagName: keyof SystemFlags) => {
    if (!isGovernor) return;

    setUpdating(flagName);
    const newValue = !flags[flagName];

    try {
      await updateDoc(doc(db, 'systemControl', 'status'), {
        [flagName]: newValue,
      });
      setFlags((prev) => ({ ...prev, [flagName]: newValue }));
      await logAction(flagName, newValue);
    } catch (error) {
      console.error(`Error toggling ${flagName}:`, error);
      alert(`Failed to update ${flagName}`);
    } finally {
      setUpdating(null);
    }
  };

  const flagConfig = [
    {
      key: 'chatEnabled' as keyof SystemFlags,
      label: 'Chat System',
      icon: MessageCircle,
      color: 'blue',
      description: 'Enable/disable platform chat functionality',
    },
    {
      key: 'quizEnabled' as keyof SystemFlags,
      label: 'Quiz System',
      icon: FileQuestion,
      color: 'green',
      description: 'Enable/disable quiz and assessment features',
    },
    {
      key: 'aiEnabled' as keyof SystemFlags,
      label: 'AI Assistant',
      icon: Brain,
      color: 'purple',
      description: 'Enable/disable AI assistant functionality',
    },
    {
      key: 'downloadsEnabled' as keyof SystemFlags,
      label: 'Downloads',
      icon: Download,
      color: 'orange',
      description: 'Enable/disable file downloads',
    },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-lg bg-white/80 rounded-xl shadow-lg border border-gray-200/50 p-6"
      >
        <div className="text-center py-8 text-gray-500">Loading system flags...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-lg bg-white/80 rounded-xl shadow-lg border border-gray-200/50 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-900">System Flags</h2>
      </div>

      {!isGovernor && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            View only mode. System flag control requires governor access.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {flagConfig.map((flag, index) => {
          const Icon = flag.icon;
          const isEnabled = flags[flag.key];
          const isUpdating = updating === flag.key;

          return (
            <motion.div
              key={flag.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white/50 rounded-lg border border-gray-200/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${flag.color}-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${flag.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{flag.label}</h3>
                    <p className="text-xs text-gray-500">{flag.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(flag.key)}
                  disabled={!isGovernor || isUpdating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isEnabled && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Active across platform
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Changes to system flags are instantly reflected across the entire platform.
        </p>
      </div>
    </motion.div>
  );
}

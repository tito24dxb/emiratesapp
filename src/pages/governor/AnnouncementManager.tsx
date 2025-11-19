import { useState, useEffect } from 'react';
import { Megaphone, AlertCircle, Info, AlertTriangle, CheckCircle, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { updateAnnouncement, getSystemControl, SystemAnnouncement } from '../../services/systemControlService';

type AnnouncementType = 'info' | 'warning' | 'error' | 'success';

export default function AnnouncementManager() {
  const { currentUser } = useApp();
  const [type, setType] = useState<AnnouncementType>('info');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<SystemAnnouncement | null>(null);

  useEffect(() => {
    loadCurrentAnnouncement();
  }, []);

  const loadCurrentAnnouncement = async () => {
    const control = await getSystemControl();
    if (control) {
      setCurrentAnnouncement(control.announcement);
      if (control.announcement.active) {
        setType(control.announcement.type);
        setMessage(control.announcement.message);
      }
    }
  };

  const types: { value: AnnouncementType; label: string; icon: any; color: string }[] = [
    { value: 'info', label: 'Info', icon: Info, color: 'blue' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'yellow' },
    { value: 'error', label: 'Error', icon: AlertCircle, color: 'red' },
    { value: 'success', label: 'Success', icon: CheckCircle, color: 'green' },
  ];

  const createAnnouncement = async () => {
    if (!message.trim() || !currentUser) return;

    setLoading(true);
    try {
      await updateAnnouncement({
        active: true,
        message: message.trim(),
        type,
        timestamp: new Date().toISOString()
      }, currentUser.uid);

      await loadCurrentAnnouncement();
      alert('Announcement published successfully!');
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to publish announcement');
    } finally {
      setLoading(false);
    }
  };

  const clearAnnouncement = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await updateAnnouncement({
        active: false,
        message: '',
        type: 'info',
        timestamp: null
      }, currentUser.uid);

      setMessage('');
      await loadCurrentAnnouncement();
      alert('Announcement removed successfully!');
    } catch (error) {
      console.error('Error clearing announcement:', error);
      alert('Failed to remove announcement');
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      green: 'bg-green-50 border-green-200 text-green-800',
    };
    return colors[color];
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-3">
          <Megaphone className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Announcement Manager</h1>
            <p className="text-blue-100 mt-1">Create and manage system-wide announcements</p>
          </div>
        </div>
      </motion.div>

      {currentAnnouncement && currentAnnouncement.active && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 border-2 ${getColorClasses(types.find(t => t.value === currentAnnouncement.type)?.color || 'blue')}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {(() => {
                const Icon = types.find(t => t.value === currentAnnouncement.type)?.icon || Info;
                return <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />;
              })()}
              <div className="flex-1">
                <div className="font-semibold mb-1">Current Active Announcement</div>
                <div>{currentAnnouncement.message}</div>
                {currentAnnouncement.timestamp && (
                  <div className="text-xs opacity-70 mt-2">
                    Published: {new Date(currentAnnouncement.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={clearAnnouncement}
              disabled={loading}
              className="text-gray-600 hover:text-gray-900 font-bold p-2 hover:glass-bubble rounded-lg transition disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-light rounded-xl shadow-lg border border-gray-100 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Announcement</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Announcement Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {types.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      type === t.value
                        ? `border-${t.color}-500 bg-${t.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 text-${t.color}-600`} />
                    <div className="text-sm font-semibold">{t.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your announcement message..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={createAnnouncement}
              disabled={!message.trim() || loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Publish Announcement
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

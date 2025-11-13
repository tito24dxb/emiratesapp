import { useState } from 'react';
import { Megaphone, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type AnnouncementType = 'info' | 'warning' | 'error' | 'success';

export default function AnnouncementManager() {
  const [type, setType] = useState<AnnouncementType>('info');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [currentAnnouncement, setCurrentAnnouncement] = useState<{type: AnnouncementType; message: string} | null>(null);

  const types: { value: AnnouncementType; label: string; icon: any; color: string }[] = [
    { value: 'info', label: 'Info', icon: Info, color: 'blue' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'yellow' },
    { value: 'error', label: 'Error', icon: AlertCircle, color: 'red' },
    { value: 'success', label: 'Success', icon: CheckCircle, color: 'green' },
  ];

  const createAnnouncement = () => {
    if (!message.trim()) return;
    setCurrentAnnouncement({ type, message: message.trim() });
    setMessage('');
  };

  const clearAnnouncement = () => {
    setCurrentAnnouncement(null);
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

      {currentAnnouncement && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 border-2 ${getColorClasses(types.find(t => t.value === currentAnnouncement.type)?.color || 'blue')}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {(() => {
                const Icon = types.find(t => t.value === currentAnnouncement.type)?.icon || Info;
                return <Icon className="w-5 h-5 mt-0.5" />;
              })()}
              <div>
                <div className="font-semibold mb-1">Current Active Announcement</div>
                <div>{currentAnnouncement.message}</div>
              </div>
            </div>
            <button
              onClick={clearAnnouncement}
              className="text-gray-600 hover:text-gray-900 font-bold"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Expiration Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={createAnnouncement}
              disabled={!message.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Announcement
            </button>
            {currentAnnouncement && (
              <button
                onClick={clearAnnouncement}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

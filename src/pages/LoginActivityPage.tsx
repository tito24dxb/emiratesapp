import { useState, useEffect } from 'react';
import { Shield, Smartphone, Monitor, Tablet, MapPin, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  LoginActivity,
  getUserLoginHistory,
  getFailedLoginAttempts,
  clearOldLoginActivity,
} from '../services/loginActivityService';

export default function LoginActivityPage() {
  const { currentUser } = useApp();
  const [loginHistory, setLoginHistory] = useState<LoginActivity[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadLoginActivity();
    }
  }, [currentUser]);

  const loadLoginActivity = async () => {
    if (!currentUser) return;

    try {
      const history = await getUserLoginHistory(currentUser.uid, 20);
      setLoginHistory(history);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const failed = await getFailedLoginAttempts(currentUser.uid, thirtyDaysAgo);
      setFailedAttempts(failed);
    } catch (error) {
      console.error('Error loading login activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOldActivity = async () => {
    if (!currentUser || !confirm('Clear login history older than 90 days?')) return;

    try {
      const deleted = await clearOldLoginActivity(currentUser.uid, 90);
      alert(`Deleted ${deleted} old login records`);
      await loadLoginActivity();
    } catch (error) {
      console.error('Error clearing old activity:', error);
      alert('Error clearing old activity');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Login Activity</h1>
            <p className="text-gray-600">Monitor your account security and login history</p>
          </div>
          <button
            onClick={handleClearOldActivity}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            <Trash2 className="w-5 h-5" />
            Clear Old Records
          </button>
        </div>

        {failedAttempts.length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-6 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">Failed Login Attempts</h2>
                <p className="text-sm text-red-700">
                  {failedAttempts.length} failed attempt{failedAttempts.length !== 1 ? 's' : ''} in the last 30 days
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {failedAttempts.slice(0, 5).map((attempt) => (
                <div key={attempt.id} className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(attempt.deviceType)}
                      <div>
                        <p className="font-bold text-red-900">
                          {attempt.browser} on {attempt.os}
                        </p>
                        <p className="text-sm text-red-700">
                          {attempt.timestamp.toDate().toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {attempt.ipAddress && (
                      <span className="text-sm text-red-700 font-mono">{attempt.ipAddress}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Login History</h2>
              <p className="text-sm text-gray-600">Recent successful logins to your account</p>
            </div>
          </div>

          <div className="space-y-4">
            {loginHistory.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No login history available</p>
              </div>
            ) : (
              loginHistory.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl p-4 hover:bg-white/40 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                        {getDeviceIcon(activity.deviceType)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">
                            {activity.browser} on {activity.os}
                          </h3>
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              CURRENT
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{activity.timestamp.toDate().toLocaleString()}</span>
                          </div>

                          {activity.ipAddress && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span className="font-mono">{activity.ipAddress}</span>
                            </div>
                          )}

                          {activity.location?.country && (
                            <span>
                              {activity.location.city && `${activity.location.city}, `}
                              {activity.location.country}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-2 font-mono truncate">
                          {activity.userAgent}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Security Tips</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[#D71920] font-bold">•</span>
              <span>Review your login history regularly for any suspicious activity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D71920] font-bold">•</span>
              <span>If you see unfamiliar logins, change your password immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D71920] font-bold">•</span>
              <span>Use strong, unique passwords for your account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D71920] font-bold">•</span>
              <span>Enable two-factor authentication for extra security</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

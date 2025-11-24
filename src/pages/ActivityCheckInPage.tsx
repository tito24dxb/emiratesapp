import { useState, useEffect } from 'react';
import { QrCode, Calendar, MapPin, Users, Award, Flame, Trophy, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  activityAttendanceService,
  Activity,
  UserStreak,
  ParticipationBadge
} from '../services/activityAttendanceService';

export default function ActivityCheckInPage() {
  const { currentUser } = useApp();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [userBadges, setUserBadges] = useState<ParticipationBadge[]>([]);
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      const upcomingActivities = await activityAttendanceService.getUpcomingActivities();
      setActivities(upcomingActivities);

      const streak = await activityAttendanceService.getUserStreak(currentUser.uid);
      setUserStreak(streak);

      if (streak) {
        const badges = activityAttendanceService.getAllBadges()
          .filter(badge => streak.badges.includes(badge.id));
        setUserBadges(badges);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (activityId: string) => {
    if (!currentUser) return;

    setCheckingIn(true);
    setMessage(null);

    try {
      const result = await activityAttendanceService.checkIn(
        activityId,
        currentUser.uid,
        currentUser.name,
        currentUser.email,
        'manual'
      );

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await loadData();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleQrCheckIn = async () => {
    if (!currentUser || !qrInput.trim()) return;

    setCheckingIn(true);
    setMessage(null);

    try {
      const match = qrInput.match(/check-in:(.+)/);
      if (!match) {
        setMessage({ type: 'error', text: 'Invalid QR code format' });
        setCheckingIn(false);
        return;
      }

      const activityId = match[1];
      const result = await activityAttendanceService.checkIn(
        activityId,
        currentUser.uid,
        currentUser.name,
        currentUser.email,
        'qr_scan'
      );

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setQrInput('');
        await loadData();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setCheckingIn(false);
    }
  };

  const getBadgeColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      gold: 'bg-yellow-200 text-yellow-900 border-yellow-400',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      red: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[color] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            Activity Check-In
          </h1>
          <p className="text-gray-600">Scan QR codes or check in manually to track your attendance</p>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{userStreak?.currentStreak || 0} days</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{userStreak?.totalAttendance || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Badges Earned</p>
                <p className="text-2xl font-bold text-gray-900">{userBadges.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {userBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D71920]" />
              Your Badges
            </h3>
            <div className="flex flex-wrap gap-3">
              {userBadges.map(badge => (
                <div
                  key={badge.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getBadgeColor(badge.color)}`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{badge.name}</p>
                    <p className="text-xs opacity-80">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8 bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">QR Code Check-In</h3>
          <p className="text-sm text-gray-600 mb-4">
            Scan the activity QR code or paste the code below
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Paste QR code data (check-in:xxx)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]"
            />
            <button
              onClick={handleQrCheckIn}
              disabled={checkingIn || !qrInput.trim()}
              className="px-6 py-3 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingIn ? 'Checking In...' : 'Check In'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Available Activities</h3>
          </div>

          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming activities available for check-in</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activities.map(activity => (
                <div key={activity.id} className="p-6 hover:bg-gray-50/50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{activity.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{activity.date.toDate().toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{activity.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{activity.totalCheckIns} checked in</span>
                        </div>
                      </div>
                      {activity.checkInEnabled ? (
                        <span className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                           Check-in Open
                        </span>
                      ) : (
                        <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                          Check-in Not Started
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {activity.checkInEnabled && (
                        <button
                          onClick={() => handleManualCheckIn(activity.id)}
                          disabled={checkingIn}
                          className="px-4 py-2 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-blue-50/60 backdrop-blur-xl rounded-xl p-6 border border-blue-200/30"
        >
          <h3 className="font-bold text-gray-900 mb-3">How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-[#D71920] rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Scan the QR code displayed at the activity venue</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-[#D71920] rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Or check in manually when check-in is enabled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-[#D71920] rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Build streaks by attending activities on consecutive days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-[#D71920] rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Earn badges for reaching attendance milestones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-[#D71920] rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Download digital certificates for each activity attended</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

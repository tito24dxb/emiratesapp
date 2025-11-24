import { useState, useEffect } from 'react';
import { QrCode, Users, Calendar, Download, Play, Square, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  activityAttendanceService,
  Activity,
  Attendance
} from '../services/activityAttendanceService';

export default function ActivityManagementPage() {
  const { currentUser } = useApp();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [showQr, setShowQr] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [currentUser]);

  const loadActivities = async () => {
    if (!currentUser) return;

    try {
      const allActivities = await activityAttendanceService.getUpcomingActivities(50);
      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (activityId: string) => {
    try {
      const attendanceData = await activityAttendanceService.getActivityAttendance(activityId);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleEnableCheckIn = async (activityId: string) => {
    try {
      await activityAttendanceService.enableCheckIn(activityId, 120);
      await loadActivities();
      alert('Check-in enabled for 2 hours');
    } catch (error) {
      console.error('Error enabling check-in:', error);
      alert('Failed to enable check-in');
    }
  };

  const handleDisableCheckIn = async (activityId: string) => {
    try {
      await activityAttendanceService.disableCheckIn(activityId);
      await loadActivities();
      alert('Check-in disabled');
    } catch (error) {
      console.error('Error disabling check-in:', error);
      alert('Failed to disable check-in');
    }
  };

  const handleViewActivity = async (activity: Activity) => {
    setSelectedActivity(activity);
    await loadAttendance(activity.id);
  };

  const handleDownloadQr = () => {
    if (!selectedActivity) return;

    const link = document.createElement('a');
    link.href = selectedActivity.qrCode;
    link.download = `${selectedActivity.name}-QR.png`;
    link.click();
  };

  const handleGenerateCertificate = async (attendanceId: string) => {
    try {
      const certificateUrl = await activityAttendanceService.generateCertificate(attendanceId);

      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Certificate</title>
              <style>
                body { margin: 0; padding: 20px; }
                iframe { width: 100%; height: 90vh; border: none; }
                .actions { text-align: center; margin-bottom: 20px; }
                button {
                  padding: 10px 20px;
                  background: #D71920;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 16px;
                }
                button:hover { background: #B91518; }
              </style>
            </head>
            <body>
              <div class="actions">
                <button onclick="window.print()">Print Certificate</button>
              </div>
              <iframe src="${certificateUrl}"></iframe>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate');
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            Activity Management
          </h1>
          <p className="text-gray-600">Manage activities and track attendance</p>
        </motion.div>

        {!selectedActivity ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">All Activities</h3>
            </div>

            {activities.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No activities found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {activities.map(activity => (
                  <div key={activity.id} className="p-6 hover:bg-gray-50/50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{activity.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-gray-600">
                            =� {activity.date.toDate().toLocaleDateString()}
                          </span>
                          <span className="text-gray-600">
                            =� {activity.location}
                          </span>
                          <span className="font-semibold text-[#D71920]">
                            {activity.totalCheckIns} attendees
                          </span>
                        </div>
                        <div className="mt-3">
                          {activity.checkInEnabled ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                               Check-in Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                              Check-in Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleViewActivity(activity)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {activity.checkInEnabled ? (
                          <button
                            onClick={() => handleDisableCheckIn(activity.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                          >
                            <Square className="w-4 h-4" />
                            Stop
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnableCheckIn(activity.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                          >
                            <Play className="w-4 h-4" />
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedActivity(null);
                setAttendance([]);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              � Back to Activities
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedActivity.name}</h2>
                <p className="text-gray-600 mb-6">{selectedActivity.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {selectedActivity.date.toDate().toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{selectedActivity.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Check-ins</p>
                    <p className="font-semibold text-[#D71920] text-2xl">
                      {selectedActivity.totalCheckIns}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedActivity.status}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowQr(!showQr)}
                    className="px-4 py-2 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition font-semibold flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    {showQr ? 'Hide' : 'Show'} QR Code
                  </button>
                  <button
                    onClick={handleDownloadQr}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download QR
                  </button>
                </div>
              </motion.div>

              {showQr && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
                >
                  <h3 className="font-bold text-gray-900 mb-4 text-center">Activity QR Code</h3>
                  <img
                    src={selectedActivity.qrCode}
                    alt="Activity QR Code"
                    className="w-full rounded-lg border-4 border-[#D71920]"
                  />
                  <p className="text-xs text-gray-600 text-center mt-4">
                    Attendees scan this code to check in
                  </p>
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Attendance List</h3>
              </div>

              {attendance.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No check-ins yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Check-in Time</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attendance.map(record => (
                        <tr key={record.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {record.userName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {record.userEmail}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {record.checkInTime.toDate().toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              record.checkInMethod === 'qr_scan'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {record.checkInMethod === 'qr_scan' ? 'QR Scan' : 'Manual'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {record.certificateGenerated ? (
                              <span className="text-green-600 text-sm"> Generated</span>
                            ) : (
                              <button
                                onClick={() => handleGenerateCertificate(record.id)}
                                className="text-[#D71920] hover:text-[#B91518] text-sm font-semibold"
                              >
                                Generate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

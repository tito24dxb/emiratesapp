import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Award,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { activityAttendanceService, Attendance } from '../services/activityAttendanceService';
import { activityManagementService, Activity } from '../services/activityManagementService';

export default function ComprehensiveAttendanceDashboard() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'registered'>('all');

  const isStaff = currentUser?.role && ['governor', 'mentor', 'coach', 'trainer'].includes(currentUser.role);

  useEffect(() => {
    if (activityId) {
      loadData();
    }
  }, [activityId]);

  useEffect(() => {
    filterAttendance();
  }, [attendance, searchTerm, statusFilter]);

  const loadData = async () => {
    if (!activityId) return;

    setLoading(true);
    try {
      const [activityData, attendanceData] = await Promise.all([
        activityManagementService.getActivityById(activityId),
        activityAttendanceService.getActivityAttendance(activityId)
      ]);

      setActivity(activityData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAttendance = () => {
    let filtered = [...attendance];

    if (searchTerm) {
      filtered = filtered.filter(
        (att) =>
          att.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          att.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((att) => {
        if (statusFilter === 'checked_in') return att.checkInTime;
        if (statusFilter === 'registered') return !att.checkInTime;
        return true;
      });
    }

    setFilteredAttendance(filtered);
  };

  const exportToCSV = () => {
    if (!activity || !attendance.length) return;

    const headers = ['Name', 'Email', 'Status', 'Check-in Time', 'Check-in Method'];
    const rows = attendance.map((att) => [
      att.userName,
      att.userEmail,
      att.checkInTime ? 'Checked In' : 'Registered',
      att.checkInTime ? new Date(att.checkInTime.toDate()).toLocaleString() : 'N/A',
      att.checkInMethod || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activity.name}-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const stats = {
    registered: attendance.length,
    checkedIn: attendance.filter((att) => att.checkInTime).length,
    notCheckedIn: attendance.filter((att) => !att.checkInTime).length,
    attendanceRate: attendance.length
      ? Math.round((attendance.filter((att) => att.checkInTime).length / attendance.length) * 100)
      : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Not Found</h2>
          <button
            onClick={() => navigate('/activities')}
            className="px-6 py-3 bg-[#D71920] text-white rounded-xl font-semibold hover:opacity-90"
          >
            Back to Activities
          </button>
        </div>
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
          <button
            onClick={() => navigate('/activities')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Activities
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{activity.name}</h1>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {activity.date.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {activity.location}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {activity.duration} minutes
                </div>
              </div>
            </div>

            {isStaff && (
              <button
                onClick={exportToCSV}
                className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Registered</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.registered}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Checked In</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.checkedIn}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Not Checked In</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.notCheckedIn}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.attendanceRate}%</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900">Attendance List</h3>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 md:flex-initial md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search attendees..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="checked_in">Checked In</option>
                  <option value="registered">Registered Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredAttendance.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No attendees found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Check-in Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAttendance.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center text-white font-bold">
                            {att.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{att.userName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{att.userEmail}</td>
                      <td className="px-6 py-4">
                        {att.checkInTime ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                            <CheckCircle className="w-4 h-4" />
                            Checked In
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                            <Clock className="w-4 h-4" />
                            Registered
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {att.checkInTime ? (
                          <>
                            {new Date(att.checkInTime.toDate()).toLocaleDateString()}
                            <br />
                            <span className="text-xs text-gray-500">
                              {new Date(att.checkInTime.toDate()).toLocaleTimeString()}
                            </span>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {att.checkInMethod ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {att.checkInMethod === 'qr_scan' ? 'QR Scan' : att.checkInMethod.replace('_', ' ')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

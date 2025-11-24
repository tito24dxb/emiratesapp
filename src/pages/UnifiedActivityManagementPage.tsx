import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  QrCode,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { activityManagementService, Activity } from '../services/activityManagementService';
import CreateActivityForm from '../components/activities/CreateActivityForm';

export default function UnifiedActivityManagementPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid' | 'training' | 'workshop'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const isStaff = currentUser?.role && ['governor', 'mentor', 'coach', 'trainer'].includes(currentUser.role);

  useEffect(() => {
    loadActivities();
  }, [currentUser]);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, statusFilter, typeFilter]);

  const loadActivities = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      if (isStaff) {
        const allActivities = await activityManagementService.getActivitiesByOrganizer(currentUser.uid);
        setActivities(allActivities);
      } else {
        const upcomingActivities = await activityManagementService.getUpcomingActivities(50);
        setActivities(upcomingActivities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.type === typeFilter);
    }

    setFilteredActivities(filtered);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      await activityManagementService.deleteActivity(activityId);
      await loadActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
    }
  };

  const handleUpdateStatus = async (activityId: string, newStatus: Activity['status']) => {
    try {
      await activityManagementService.updateActivityStatus(activityId, newStatus);
      await loadActivities();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDownloadQR = async (activity: Activity) => {
    const qrCodeUrl = await activityManagementService.generateActivityQR(activity.id);
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${activity.name}-qr-code.png`;
    link.click();
  };

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'ongoing':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'free':
        return '🎉';
      case 'paid':
        return '💰';
      case 'training':
        return '🏋️';
      case 'workshop':
        return '🛠️';
      case 'seminar':
        return '🎓';
      case 'meetup':
        return '🤝';
      default:
        return '📅';
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                {isStaff ? 'Activity Management' : 'Browse Activities'}
              </h1>
              <p className="text-gray-600">
                {isStaff
                  ? 'Create and manage events, workshops, and training sessions'
                  : 'Discover and join upcoming activities'}
              </p>
            </div>
            {isStaff && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Activity
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search activities..."
                  className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-white/30 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-white/30 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-xl border border-white/30 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent appearance-none"
              >
                <option value="all">All Types</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="training">Training</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setShowCreateForm(false)}
            >
              <div onClick={(e) => e.stopPropagation()} className="my-8">
                <CreateActivityForm
                  onSuccess={() => {
                    setShowCreateForm(false);
                    loadActivities();
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/30"
          >
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Activities Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : isStaff
                ? 'Create your first activity to get started'
                : 'Check back soon for upcoming activities'}
            </p>
            {isStaff && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Activity
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/30 shadow-lg hover:shadow-xl transition-all group"
              >
                {activity.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={activity.imageUrl}
                      alt={activity.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTypeIcon(activity.type)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                    {isStaff && (
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === activity.id ? null : activity.id)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>
                        {showMenu === activity.id && (
                          <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 min-w-[180px]">
                            <button
                              onClick={() => {
                                navigate(`/activity/${activity.id}/edit`);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleDownloadQR(activity);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <QrCode className="w-4 h-4" />
                              Download QR
                            </button>
                            <button
                              onClick={() => {
                                navigate(`/activity/${activity.id}/attendance`);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Users className="w-4 h-4" />
                              View Attendance
                            </button>
                            <div className="border-t border-gray-200 my-2"></div>
                            <button
                              onClick={() => {
                                handleDeleteActivity(activity.id);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{activity.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {activity.date.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {activity.duration} minutes
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {activity.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      {activity.registered} / {activity.capacity} registered
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    {activity.price > 0 ? (
                      <span className="text-2xl font-bold text-[#D71920]">${activity.price}</span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                        FREE
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/activity/${activity.id}`)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

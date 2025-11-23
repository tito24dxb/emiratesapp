import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Flag, MessageCircle, Users, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy, limit, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ContentItem {
  id: string;
  type: 'post' | 'comment' | 'message' | 'product';
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  reports: number;
}

interface ModStats {
  pendingReviews: number;
  approvedToday: number;
  rejectedToday: number;
  totalReports: number;
}

export default function ModeratorDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ModStats>({
    pendingReviews: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalReports: 0
  });
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reported'>('pending');

  useEffect(() => {
    if (currentUser?.role === 'moderator' || currentUser?.role === 'governor') {
      loadModeratorData();
    }
  }, [currentUser, filter]);

  const loadModeratorData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      // Get community posts that need moderation
      let postsQuery;
      if (filter === 'reported') {
        postsQuery = query(
          collection(db, 'community_posts'),
          where('reportCount', '>', 0),
          orderBy('reportCount', 'desc'),
          limit(50)
        );
      } else if (filter === 'pending') {
        postsQuery = query(
          collection(db, 'community_posts'),
          where('moderationStatus', '==', 'pending'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      } else {
        postsQuery = query(
          collection(db, 'community_posts'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const postsSnapshot = await getDocs(postsQuery);
      const items: ContentItem[] = [];
      let pendingCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let totalReportsCount = 0;

      postsSnapshot.forEach((doc) => {
        const post = doc.data();
        const status = post.moderationStatus || 'pending';

        items.push({
          id: doc.id,
          type: 'post',
          content: post.content || '',
          authorId: post.userId,
          authorName: post.userName || 'Unknown User',
          createdAt: post.createdAt,
          status,
          reports: post.reportCount || 0
        });

        if (status === 'pending') pendingCount++;
        if (status === 'approved' && post.approvedAt?.toDate() >= today) approvedCount++;
        if (status === 'rejected' && post.rejectedAt?.toDate() >= today) rejectedCount++;
        totalReportsCount += (post.reportCount || 0);
      });

      setStats({
        pendingReviews: pendingCount,
        approvedToday: approvedCount,
        rejectedToday: rejectedCount,
        totalReports: totalReportsCount
      });

      setContentItems(items);
    } catch (error) {
      console.error('Error loading moderator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (itemId: string, action: 'approve' | 'reject') => {
    try {
      const postRef = doc(db, 'community_posts', itemId);
      await updateDoc(postRef, {
        moderationStatus: action === 'approve' ? 'approved' : 'rejected',
        [`${action}dAt`]: Timestamp.now(),
        [`${action}dBy`]: currentUser?.uid
      });

      alert(`Content ${action}d successfully`);
      loadModeratorData();
    } catch (error) {
      console.error(`Error ${action}ing content:`, error);
      alert(`Failed to ${action} content`);
    }
  };

  if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'governor')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 max-w-md">
          <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Only Moderators and Governors can access the moderation dashboard.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                Moderator Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Review and moderate community content</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'pending'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('reported')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'reported'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                Reported
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Pending Reviews</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Approved Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.approvedToday}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Rejected Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.rejectedToday}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Flag className="w-6 h-6 text-white" />
              </div>
              <Flag className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
          </motion.div>
        </div>

        {/* Content Review Queue */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Content Review Queue</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {contentItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p>No content to review. Great job!</p>
              </div>
            ) : (
              contentItems.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'post'
                            ? 'bg-blue-100 text-blue-800'
                            : item.type === 'comment'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{item.authorName}</span>
                        <span className="text-xs text-gray-500">
                          {item.createdAt.toDate().toLocaleString()}
                        </span>
                        {item.reports > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Flag className="w-3 h-3" />
                            {item.reports} {item.reports === 1 ? 'report' : 'reports'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3 line-clamp-3">{item.content}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    {item.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleModeration(item.id, 'approve')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleModeration(item.id, 'reject')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

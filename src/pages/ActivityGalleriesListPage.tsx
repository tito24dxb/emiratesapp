import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Heart, MessageCircle, Star, Image, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { activitySocialProofService, ActivityGallery } from '../services/activitySocialProofService';

export default function ActivityGalleriesListPage() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState<ActivityGallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      const recentGalleries = await activitySocialProofService.getRecentGalleries(20);
      setGalleries(recentGalleries);
    } catch (error) {
      console.error('Error loading galleries:', error);
    } finally {
      setLoading(false);
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
              <Camera className="w-7 h-7 text-white" />
            </div>
            Activity Galleries
          </h1>
          <p className="text-gray-600">Browse photos and memories from past events</p>
        </motion.div>

        {galleries.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No galleries yet</p>
            <p className="text-sm text-gray-500">Galleries will appear here after events are completed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <motion.div
                key={gallery.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden cursor-pointer"
                onClick={() => navigate(`/activity-gallery/${gallery.id}`)}
              >
                <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-gray-400" />
                  {gallery.totalPhotos > 0 && (
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      {gallery.totalPhotos}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {gallery.activityName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    By {gallery.organizerName}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <Heart className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {gallery.totalReactions}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {gallery.totalComments}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Star className="w-4 h-4 text-yellow-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {gallery.averageRating > 0 ? gallery.averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{gallery.attendeeCount} attendees</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {gallery.createdAt.toDate().toLocaleDateString()}
                    </span>
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

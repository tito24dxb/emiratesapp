import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Upload, Star, BarChart3, Users, Heart, MessageCircle, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import ActivityPhotoGallery from '../components/ActivityPhotoGallery';
import {
  activitySocialProofService,
  ActivityGallery,
  ActivityReview,
  EngagementAnalytics
} from '../services/activitySocialProofService';

export default function ActivityGalleryPage() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState<ActivityGallery | null>(null);
  const [reviews, setReviews] = useState<ActivityReview[]>([]);
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (galleryId) {
      loadGalleryData();
    }
  }, [galleryId]);

  const loadGalleryData = async () => {
    if (!galleryId) return;

    try {
      const galleryData = await activitySocialProofService.getGallery(galleryId);
      setGallery(galleryData);

      const reviewsData = await activitySocialProofService.getActivityReviews(galleryId);
      setReviews(reviewsData);

      if (currentUser && galleryData && galleryData.organizerId === currentUser.uid) {
        const analyticsData = await activitySocialProofService.getEngagementAnalytics(galleryId);
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !galleryId || !gallery || !currentUser) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      await activitySocialProofService.uploadPhoto(
        galleryId,
        gallery.activityId,
        currentUser.uid,
        currentUser.name,
        file
      );

      await loadGalleryData();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!galleryId || !gallery || !currentUser || !reviewText.trim()) return;

    const attendedActivity = gallery.attendeeIds.includes(currentUser.uid);

    try {
      await activitySocialProofService.addReview(
        galleryId,
        gallery.activityId,
        currentUser.uid,
        currentUser.name,
        rating,
        reviewText,
        attendedActivity,
        currentUser.photoURL
      );

      setShowReviewForm(false);
      setRating(5);
      setReviewText('');
      await loadGalleryData();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  const isOrganizer = currentUser && gallery && gallery.organizerId === currentUser.uid;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Gallery not found</p>
          <button
            onClick={() => navigate('/open-days')}
            className="mt-4 px-6 py-2 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition"
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {gallery.activityName}
              </h1>
              <p className="text-gray-600">
                By {gallery.organizerName} • {gallery.attendeeCount} attendees
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isOrganizer && (
                <>
                  <label className="px-6 py-3 bg-[#D71920] text-white rounded-xl font-semibold hover:bg-[#B91518] transition cursor-pointer flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Upload Photos'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="hidden"
                      multiple={false}
                    />
                  </label>
                  <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center gap-2"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Analytics
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/30 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Photos</p>
              <p className="text-2xl font-bold text-gray-900">{gallery.totalPhotos}</p>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/30 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Reactions</p>
              <p className="text-2xl font-bold text-gray-900">{gallery.totalReactions}</p>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/30 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Comments</p>
              <p className="text-2xl font-bold text-gray-900">{gallery.totalComments}</p>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/30 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {gallery.averageRating > 0 ? gallery.averageRating.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>

        {showAnalytics && analytics && isOrganizer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Engagement Analytics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Engagement Rate</p>
                  <p className="text-3xl font-bold text-[#D71920]">{analytics.engagementRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">Total engagements vs attendees</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Attendee Engagement</p>
                  <p className="text-3xl font-bold text-[#D71920]">{analytics.attendeeEngagement.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">Attendees who engaged</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Total Engagements</p>
                  <p className="text-3xl font-bold text-[#D71920]">
                    {analytics.totalReactions + analytics.totalComments + analytics.totalReviews}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Reactions + Comments + Reviews</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Reaction Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm">👍 Like</span>
                      <span className="font-semibold">{analytics.reactionBreakdown.like}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">❤️ Love</span>
                      <span className="font-semibold">{analytics.reactionBreakdown.love}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span className="text-sm">🏆 Celebrate</span>
                      <span className="font-semibold">{analytics.reactionBreakdown.celebrate}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm">✨ Inspiring</span>
                      <span className="font-semibold">{analytics.reactionBreakdown.inspiring}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Review Distribution</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm w-12">{stars} ⭐</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#D71920] h-2 rounded-full"
                            style={{
                              width: `${
                                analytics.totalReviews > 0
                                  ? (analytics.reviewDistribution[stars as keyof typeof analytics.reviewDistribution] /
                                      analytics.totalReviews) *
                                    100
                                  : 0
                              }%`
                            }}
                          />
                        </div>
                        <span className="text-sm w-8">
                          {analytics.reviewDistribution[stars as keyof typeof analytics.reviewDistribution]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Photo Gallery</h3>
          </div>
          <div className="p-6">
            {galleryId && (
              <ActivityPhotoGallery
                galleryId={galleryId}
                activityId={gallery.activityId}
                canUpload={isOrganizer}
              />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Reviews ({reviews.length})</h3>
            {!showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition text-sm font-semibold"
              >
                Write a Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-4">Write Your Review</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-3xl transition"
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewText.trim()}
                  className="px-6 py-2 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Review
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="p-6">
            {reviews.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{review.userName}</p>
                          {review.verified && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              Verified Attendee
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-yellow-400">
                              {star <= review.rating ? '⭐' : '☆'}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{review.review}</p>
                        <p className="text-xs text-gray-500">
                          {review.createdAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

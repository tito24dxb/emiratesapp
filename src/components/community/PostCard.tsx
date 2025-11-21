import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Heart, ThumbsUp, Laugh, AlertCircle, MessageCircle, Trash2, Flag, MoreVertical } from 'lucide-react';
import { CommunityPost, communityFeedService } from '../../services/communityFeedService';
import CommentsSection from './CommentsSection';

interface PostCardProps {
  post: CommunityPost;
  currentUser: any;
  onDeleted: () => void;
}

export default function PostCard({ post, currentUser, onDeleted }: PostCardProps) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUserReaction();
  }, [post.id, currentUser.uid]);

  const loadUserReaction = async () => {
    const reaction = await communityFeedService.getUserReaction(post.id, currentUser.uid);
    setUserReaction(reaction);
  };

  const handleReaction = async (type: 'fire' | 'heart' | 'thumbsUp' | 'laugh' | 'wow') => {
    await communityFeedService.toggleReaction(post.id, currentUser.uid, type);
    loadUserReaction();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setIsDeleting(true);
    try {
      await communityFeedService.deletePost(post.id);
      onDeleted();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
      setIsDeleting(false);
    }
  };

  const handleFlag = async () => {
    const reason = prompt('Why are you flagging this post?');
    if (!reason) return;

    try {
      await communityFeedService.flagPost(post.id, reason);
      alert('Post has been flagged for review');
      setShowMenu(false);
    } catch (error) {
      console.error('Error flagging post:', error);
      alert('Failed to flag post');
    }
  };

  const canDelete = currentUser.uid === post.userId || currentUser.role === 'governor' || currentUser.role === 'admin';
  const canFlag = currentUser.uid !== post.userId;

  const reactions = [
    { type: 'fire' as const, icon: Flame, count: post.reactionsCount.fire, color: 'text-orange-500' },
    { type: 'heart' as const, icon: Heart, count: post.reactionsCount.heart, color: 'text-red-500' },
    { type: 'thumbsUp' as const, icon: ThumbsUp, count: post.reactionsCount.thumbsUp, color: 'text-blue-500' },
    { type: 'laugh' as const, icon: Laugh, count: post.reactionsCount.laugh, color: 'text-yellow-500' },
    { type: 'wow' as const, icon: AlertCircle, count: post.reactionsCount.wow, color: 'text-purple-500' }
  ];

  const channelBadges = {
    'announcements': { label: '📢', shortLabel: 'Announcement', color: 'bg-red-100 text-red-700' },
    'general': { label: '💬', shortLabel: 'General', color: 'bg-blue-100 text-blue-700' },
    'study-room': { label: '📚', shortLabel: 'Study', color: 'bg-green-100 text-green-700' }
  };

  const badge = channelBadges[post.channel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="liquid-crystal-panel p-4 md:p-6 relative"
    >
      {post.flagged && (
        <div className="mb-3 md:mb-4 px-3 md:px-4 py-2 bg-red-100 border-2 border-red-300 rounded-xl flex items-center gap-2">
          <Flag className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
          <span className="text-xs md:text-sm font-bold text-red-700">Flagged: {post.flaggedReason}</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">{post.userName}</h3>
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <p className="text-xs text-gray-600">
                {post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${badge.color}`}>
                <span className="mr-1">{badge.label}</span>
                <span className="hidden sm:inline">{badge.shortLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {(canDelete || canFlag) && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full hover:bg-white/50 flex items-center justify-center transition"
            >
              <MoreVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 liquid-crystal-strong rounded-xl shadow-xl py-1 z-50 min-w-[140px] md:min-w-[150px]">
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full px-3 md:px-4 py-2 text-left hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                  {canFlag && (
                    <button
                      onClick={handleFlag}
                      className="w-full px-3 md:px-4 py-2 text-left hover:bg-yellow-50 text-yellow-600 font-semibold flex items-center gap-2 text-sm"
                    >
                      <Flag className="w-4 h-4" />
                      Flag
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-gray-800 mb-3 md:mb-4 whitespace-pre-wrap text-sm md:text-base leading-relaxed">{post.content}</p>

      {post.imageUrl && (
        <div className="mb-3 md:mb-4 rounded-2xl overflow-hidden">
          <img src={post.imageUrl} alt="Post" className="w-full max-h-[300px] md:max-h-[500px] object-cover" />
        </div>
      )}

      <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 flex-wrap">
        {reactions.map(reaction => {
          const Icon = reaction.icon;
          const isActive = userReaction === reaction.type;
          return (
            <motion.button
              key={reaction.type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReaction(reaction.type)}
              className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-xl font-semibold text-xs md:text-sm transition ${
                isActive
                  ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white shadow-lg'
                  : 'liquid-card-overlay text-gray-700 hover:bg-white/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-white' : reaction.color}`} />
              {reaction.count > 0 && <span>{reaction.count}</span>}
            </motion.button>
          );
        })}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-xl liquid-card-overlay text-gray-700 hover:bg-white/80 font-semibold text-xs md:text-sm transition ml-auto"
        >
          <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
          {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
          <span className="hidden sm:inline">Comments</span>
        </motion.button>
      </div>

      {showComments && (
        <CommentsSection
          postId={post.id}
          currentUser={currentUser}
        />
      )}
    </motion.div>
  );
}

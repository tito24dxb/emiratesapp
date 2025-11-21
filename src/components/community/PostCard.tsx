import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Heart, ThumbsUp, Laugh, AlertCircle, MessageCircle, Trash2, Flag, MoreVertical, Edit } from 'lucide-react';
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
    'announcements': { label: '📢 Announcement', color: 'bg-red-100 text-red-700' },
    'general': { label: '💬 General', color: 'bg-blue-100 text-blue-700' },
    'study-room': { label: '📚 Study Room', color: 'bg-green-100 text-green-700' }
  };

  const badge = channelBadges[post.channel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card rounded-3xl p-6 relative"
    >
      {post.flagged && (
        <div className="mb-4 px-4 py-2 bg-red-100 border-2 border-red-300 rounded-xl flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-600" />
          <span className="text-sm font-bold text-red-700">Flagged: {post.flaggedReason}</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold text-lg">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{post.userName}</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">
                {post.createdAt.toDate().toLocaleDateString()} at {post.createdAt.toDate().toLocaleTimeString()}
              </p>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {(canDelete || canFlag) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-200 rounded-xl transition"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 glass-card rounded-xl shadow-lg py-2 z-10 min-w-[150px]">
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                {canFlag && (
                  <button
                    onClick={handleFlag}
                    className="w-full px-4 py-2 text-left hover:bg-yellow-50 text-yellow-600 font-semibold flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Flag
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.imageUrl && (
        <div className="mb-4 rounded-2xl overflow-hidden">
          <img src={post.imageUrl} alt="Post" className="w-full max-h-[500px] object-cover" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {reactions.map(reaction => {
          const Icon = reaction.icon;
          const isActive = userReaction === reaction.type;
          return (
            <motion.button
              key={reaction.type}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReaction(reaction.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-sm transition ${
                isActive
                  ? `bg-gradient-to-r from-[#D71920] to-[#B91518] text-white`
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : reaction.color}`} />
              {reaction.count > 0 && <span>{reaction.count}</span>}
            </motion.button>
          );
        })}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold text-sm transition ml-auto"
        >
          <MessageCircle className="w-4 h-4" />
          {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
          Comments
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

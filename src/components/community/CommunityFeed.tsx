import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { communityFeedService, CommunityPost, POSTS_PER_PAGE } from '../../services/communityFeedService';
import { Flame, Heart, ThumbsUp, Laugh, AlertCircle, MessageCircle, Image as ImageIcon, Plus, Filter, Trash2, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreatePostModal from './CreatePostModal';
import PostCard from './PostCard';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

type Channel = 'all' | 'announcements' | 'general' | 'study-room';
type FilterType = 'all' | 'images' | 'my-posts' | 'my-reactions';

export default function CommunityFeed() {
  const { currentUser } = useApp();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('all');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(async (reset: boolean = false) => {
    if (!currentUser) return;

    try {
      if (reset) {
        setLoading(true);
        setLastDoc(null);
      } else {
        setLoadingMore(true);
      }

      const channel = selectedChannel === 'all' ? undefined : selectedChannel;
      const filters: any = {};

      if (selectedFilter === 'images') {
        filters.imagesOnly = true;
      } else if (selectedFilter === 'my-posts') {
        filters.userId = currentUser.uid;
      }

      const { posts: newPosts, lastDoc: newLastDoc } = await communityFeedService.getPosts(
        channel,
        reset ? undefined : lastDoc || undefined,
        filters
      );

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setLastDoc(newLastDoc);
      setHasMore(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentUser, selectedChannel, selectedFilter, lastDoc]);

  useEffect(() => {
    loadPosts(true);
  }, [selectedChannel, selectedFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadPosts(false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadPosts]);

  const handlePostCreated = () => {
    loadPosts(true);
  };

  const handlePostDeleted = () => {
    loadPosts(true);
  };

  const canPost = () => {
    if (selectedChannel === 'announcements') {
      return currentUser?.role === 'governor' || currentUser?.role === 'admin';
    }
    return true;
  };

  const channels = [
    { id: 'all' as Channel, label: 'All Posts', icon: '📱' },
    { id: 'announcements' as Channel, label: 'Announcements', icon: '📢' },
    { id: 'general' as Channel, label: 'General', icon: '💬' },
    { id: 'study-room' as Channel, label: 'Study Room', icon: '📚' }
  ];

  const filters = [
    { id: 'all' as FilterType, label: 'All', icon: Filter },
    { id: 'images' as FilterType, label: 'Images', icon: ImageIcon },
    { id: 'my-posts' as FilterType, label: 'My Posts', icon: MessageCircle },
    { id: 'my-reactions' as FilterType, label: 'My Reactions', icon: Heart }
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view the community feed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#D71920] to-[#B91518] bg-clip-text text-transparent">
              Community
            </h1>
            {canPost() && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Post
              </motion.button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {channels.map(channel => (
              <motion.button
                key={channel.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChannel(channel.id)}
                className={`px-4 py-2 rounded-xl font-bold transition ${
                  selectedChannel === channel.id
                    ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white'
                    : 'bg-white/50 text-gray-700 hover:bg-white/80'
                }`}
              >
                <span className="mr-2">{channel.icon}</span>
                {channel.label}
              </motion.button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map(filter => {
              const Icon = filter.icon;
              return (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition ${
                    selectedFilter === filter.id
                      ? 'bg-[#D71920] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-600">Be the first to share something with the community!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onDeleted={handlePostDeleted}
                />
              ))}
            </AnimatePresence>

            {hasMore && (
              <div ref={observerTarget} className="py-8 flex justify-center">
                {loadingMore && (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#D71920] border-t-transparent"></div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            currentUser={currentUser}
            defaultChannel={selectedChannel === 'all' ? 'general' : selectedChannel}
            onClose={() => setShowCreateModal(false)}
            onPostCreated={handlePostCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

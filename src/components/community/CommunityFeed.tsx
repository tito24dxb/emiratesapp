import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { communityFeedService, CommunityPost, POSTS_PER_PAGE } from '../../services/communityFeedService';
import { MessageCircle, Image as ImageIcon, Plus, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreatePostModal from './CreatePostModal';
import PostCard from './PostCard';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

type Channel = 'all' | 'announcements' | 'general' | 'study-room';
type FilterType = 'all' | 'images' | 'my-posts';

export default function CommunityFeed() {
  const { currentUser } = useApp();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('all');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
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
    setShowCreatePostModal(false);
    setShowCreateMenu(false);
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
    { id: 'my-posts' as FilterType, label: 'My Posts', icon: MessageCircle }
  ];

  if (!currentUser) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view the community feed.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="liquid-crystal-panel p-4 md:p-6 mb-4">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-[#D71920] to-[#B91518] bg-clip-text text-transparent">
                Community
              </h1>
              {canPost() && (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-[#D71920] to-[#B91518] text-white flex items-center justify-center shadow-lg"
                  >
                    <Plus className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.button>

                  <AnimatePresence>
                    {showCreateMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 md:w-56 liquid-crystal-strong rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <button
                          onClick={() => {
                            setShowCreateMenu(false);
                            setShowCreatePostModal(true);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-white/50 transition-all flex items-center gap-3"
                        >
                          <Plus className="w-5 h-5 text-[#D71920]" />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">Create Post</p>
                            <p className="text-xs text-gray-500">Share with the community</p>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {channels.map(channel => (
                <motion.button
                  key={channel.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`px-3 md:px-4 py-2 rounded-xl font-bold transition whitespace-nowrap text-sm md:text-base ${
                    selectedChannel === channel.id
                      ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white shadow-lg'
                      : 'liquid-card-overlay text-gray-700 hover:bg-white/80'
                  }`}
                >
                  <span className="mr-1.5">{channel.icon}</span>
                  <span className="hidden md:inline">{channel.label}</span>
                  <span className="md:hidden">{channel.label.split(' ')[0]}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map(filter => {
                const Icon = filter.icon;
                return (
                  <motion.button
                    key={filter.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-lg font-semibold text-xs md:text-sm transition whitespace-nowrap ${
                      selectedFilter === filter.id
                        ? 'bg-[#D71920] text-white'
                        : 'liquid-card-overlay text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {filter.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-[#D71920] border-t-transparent"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="liquid-crystal-panel p-8 md:p-12 text-center">
              <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">No posts yet</h3>
              <p className="text-sm md:text-base text-gray-600">Be the first to share something with the community!</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
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
                <div ref={observerTarget} className="py-6 md:py-8 flex justify-center">
                  {loadingMore && (
                    <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-4 border-[#D71920] border-t-transparent"></div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreatePostModal && (
          <CreatePostModal
            currentUser={currentUser}
            defaultChannel={selectedChannel === 'all' ? 'general' : selectedChannel}
            onClose={() => setShowCreatePostModal(false)}
            onPostCreated={handlePostCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

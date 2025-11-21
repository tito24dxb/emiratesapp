import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Send } from 'lucide-react';
import { communityFeedService } from '../../services/communityFeedService';

interface CreatePostModalProps {
  currentUser: any;
  defaultChannel: 'announcements' | 'general' | 'study-room';
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({ currentUser, defaultChannel, onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      await communityFeedService.createPost(
        currentUser.uid,
        currentUser.name || currentUser.email || 'Anonymous',
        currentUser.email || '',
        content.trim(),
        selectedChannel,
        imageFile || undefined
      );
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSelectAnnouncements = currentUser?.role === 'governor' || currentUser?.role === 'admin';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          position: 'fixed',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 chat-header flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Post</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Channel *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {canSelectAnnouncements && (
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('announcements')}
                    className={`p-3 rounded-xl border-2 transition text-left ${
                      selectedChannel === 'announcements'
                        ? 'border-[#D71920] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📢</span>
                      <span className="font-bold text-sm text-gray-900">Announcements</span>
                    </div>
                    <p className="text-xs text-gray-600">Important updates</p>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedChannel('general')}
                  className={`p-3 rounded-xl border-2 transition text-left ${
                    selectedChannel === 'general'
                      ? 'border-[#D71920] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💬</span>
                    <span className="font-bold text-sm text-gray-900">General</span>
                  </div>
                  <p className="text-xs text-gray-600">General discussions</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChannel('study-room')}
                  className={`p-3 rounded-xl border-2 transition text-left ${
                    selectedChannel === 'study-room'
                      ? 'border-[#D71920] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📚</span>
                    <span className="font-bold text-sm text-gray-900">Study Room</span>
                  </div>
                  <p className="text-xs text-gray-600">Study & learning</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full chat-input-field resize-none"
                rows={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Image (Optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D71920] transition flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-[#D71920] bg-gray-50 hover:bg-red-50"
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="font-semibold text-sm">Click to upload an image</span>
                  <span className="text-xs text-gray-500">JPG, PNG, GIF (Max 5MB)</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="flex-1 bg-gradient-to-r from-[#D71920] to-[#B91518] hover:shadow-lg text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base">Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="text-sm sm:text-base">Post</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 chat-input-field font-semibold text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>

  );
}

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Video,
  Edit2,
  Trash2,
  Eye,
  Plus,
  X,
  MessageCircle,
  AlertCircle,
  HelpCircle,
  Save,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  visibility: 'free' | 'premium';
  pdfURL?: string;
  pdfName?: string;
  videoURL?: string;
  videoType?: 'file' | 'link';
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  tags: string[];
}

export default function CoachDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Free Source (Layer 1)',
    visibility: 'free' as 'free' | 'premium',
    pdfFile: null as File | null,
    pdfName: '',
    videoFile: null as File | null,
    videoLink: '',
    videoType: 'link' as 'file' | 'link',
    tags: '',
  });

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'mentor' && currentUser.role !== 'governor')) {
      navigate('/dashboard');
      return;
    }

    loadCourses();
  }, [currentUser, navigate]);

  const loadCourses = () => {
    const savedCourses = localStorage.getItem('coachCourses');
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }
  };

  const saveCourses = (updatedCourses: Course[]) => {
    localStorage.setItem('coachCourses', JSON.stringify(updatedCourses));
    setCourses(updatedCourses);
  };

  const handleFileUpload = (file: File, type: 'pdf' | 'video') => {
    const mockURL = URL.createObjectURL(file);
    if (type === 'pdf') {
      setFormData({ ...formData, pdfFile: file, pdfName: file.name });
    } else {
      setFormData({ ...formData, videoFile: file, videoType: 'file' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    setTimeout(() => {
      const newCourse: Course = {
        id: editingCourse?.id || `course-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        visibility: formData.visibility,
        pdfURL: formData.pdfFile ? URL.createObjectURL(formData.pdfFile) : editingCourse?.pdfURL,
        pdfName: formData.pdfName || editingCourse?.pdfName,
        videoURL: formData.videoType === 'link' ? formData.videoLink : (formData.videoFile ? URL.createObjectURL(formData.videoFile) : editingCourse?.videoURL),
        videoType: formData.videoType,
        uploadedBy: currentUser?.uid || '',
        uploadedByName: currentUser?.name || '',
        createdAt: editingCourse?.createdAt || new Date().toISOString(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      let updatedCourses;
      if (editingCourse) {
        updatedCourses = courses.map(c => c.id === editingCourse.id ? newCourse : c);
      } else {
        updatedCourses = [newCourse, ...courses];
      }

      saveCourses(updatedCourses);
      resetForm();
      setIsUploading(false);
      alert(editingCourse ? 'Course updated successfully!' : 'Course uploaded successfully!');
    }, 1000);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Free Source (Layer 1)',
      visibility: 'free',
      pdfFile: null,
      pdfName: '',
      videoFile: null,
      videoLink: '',
      videoType: 'link',
      tags: '',
    });
    setEditingCourse(null);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      visibility: course.visibility,
      pdfFile: null,
      pdfName: course.pdfName || '',
      videoFile: null,
      videoLink: course.videoType === 'link' ? course.videoURL || '' : '',
      videoType: course.videoType || 'link',
      tags: course.tags.join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      const updatedCourses = courses.filter(c => c.id !== courseId);
      saveCourses(updatedCourses);
      alert('Course deleted successfully!');
    }
  };

  const handleSupportRequest = () => {
    alert('Support request submitted! Our team will get back to you soon.');
    setShowSupportModal(false);
  };

  const handleReportProblem = () => {
    alert('Problem report submitted! Thank you for helping us improve.');
    setShowReportModal(false);
  };

  if (!currentUser || (currentUser.role !== 'mentor' && currentUser.role !== 'governor')) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
          Coach Dashboard
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Upload and manage educational content for your students
        </p>
      </div>

      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-xl flex items-center justify-center">
            {editingCourse ? <Edit2 className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <Plus className="w-5 h-5 md:w-6 md:h-6 text-white" />}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#000000]">
              {editingCourse ? 'Edit Course' : 'Upload New Course'}
            </h2>
            <p className="text-xs md:text-sm text-gray-600">
              {editingCourse ? 'Update course details' : 'Share knowledge with your students'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#000000] mb-2">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                placeholder="e.g., Advanced Interview Techniques"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#000000] mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition resize-none"
                placeholder="Describe what students will learn..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#000000] mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
              >
                <option>Free Source (Layer 1)</option>
                <option>One Step Program (Layer 2)</option>
                <option>Joiner Program (Layer 3)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#000000] mb-2">
                Visibility *
              </label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="free"
                    checked={formData.visibility === 'free'}
                    onChange={(e) => setFormData({ ...formData, visibility: 'free' })}
                    className="w-4 h-4 text-[#D71921] focus:ring-[#D71921]"
                  />
                  <span className="text-sm font-medium">Free</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="premium"
                    checked={formData.visibility === 'premium'}
                    onChange={(e) => setFormData({ ...formData, visibility: 'premium' })}
                    className="w-4 h-4 text-[#D71921] focus:ring-[#D71921]"
                  />
                  <span className="text-sm font-medium">Subscribers Only</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#000000] mb-2">
                Upload PDF
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'pdf')}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D71921] transition cursor-pointer"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formData.pdfName || 'Choose PDF file'}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#000000] mb-2">
                Video
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, videoType: 'link' })}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition ${
                      formData.videoType === 'link'
                        ? 'bg-[#D71921] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, videoType: 'file' })}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition ${
                      formData.videoType === 'file'
                        ? 'bg-[#D71921] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-1" />
                    File
                  </button>
                </div>
                {formData.videoType === 'link' ? (
                  <input
                    type="url"
                    value={formData.videoLink}
                    onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'video')}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D71921] transition cursor-pointer"
                    >
                      <Video className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formData.videoFile?.name || 'Choose video file'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#000000] mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                placeholder="interview, grooming, etiquette"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 sm:flex-none bg-gradient-to-r from-[#D71921] to-[#B91518] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-[#FFD700]/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {editingCourse ? 'Updating...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingCourse ? 'Update Course' : 'Submit Course'}
                </>
              )}
            </button>
            {editingCourse && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-[#000000] rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#000000] mb-4">
          My Courses ({courses.filter(c => c.uploadedBy === currentUser.uid).length})
        </h2>
      </div>

      {courses.filter(c => c.uploadedBy === currentUser.uid).length === 0 ? (
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-8 md:p-12 text-center">
          <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No courses yet</h3>
          <p className="text-gray-500">Upload your first course using the form above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {courses.filter(c => c.uploadedBy === currentUser.uid).map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              <div className="relative h-40 bg-gradient-to-br from-[#D71921] to-[#B91518] flex items-center justify-center">
                {course.videoURL ? (
                  <Video className="w-16 h-16 text-white opacity-80" />
                ) : (
                  <FileText className="w-16 h-16 text-white opacity-80" />
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    course.visibility === 'free'
                      ? 'bg-[#FFD700] text-[#000000]'
                      : 'bg-white text-[#D71921]'
                  }`}>
                    {course.visibility === 'free' ? 'FREE' : 'PREMIUM'}
                  </span>
                </div>
              </div>

              <div className="p-4 md:p-5">
                <div className="mb-3">
                  <h3 className="font-bold text-[#000000] text-base md:text-lg mb-1 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500">{course.category}</p>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {course.description || 'No description provided'}
                </p>

                {course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {course.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-[#EADBC8] text-[#000000] rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingCourse(course)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#D71921] text-white rounded-lg hover:bg-[#B91518] transition text-sm font-bold"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(course)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-[#FFD700] text-[#000000] rounded-lg hover:bg-[#D4AF37] transition text-sm font-bold"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {viewingCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setViewingCourse(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-[#000000] pr-8">
                  {viewingCourse.title}
                </h2>
                <button
                  onClick={() => setViewingCourse(null)}
                  className="absolute top-4 right-4 w-8 h-8 md:w-10 md:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6">
                <div className="mb-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      viewingCourse.visibility === 'free'
                        ? 'bg-[#FFD700] text-[#000000]'
                        : 'bg-[#D71921] text-white'
                    }`}>
                      {viewingCourse.visibility === 'free' ? 'FREE COURSE' : 'PREMIUM'}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
                      {viewingCourse.category}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {viewingCourse.description}
                  </p>
                  {viewingCourse.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {viewingCourse.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-[#EADBC8] text-[#000000] rounded-full text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {viewingCourse.videoURL && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#000000] mb-3">Video Content</h3>
                    <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
                      {viewingCourse.videoType === 'link' && viewingCourse.videoURL.includes('youtube') ? (
                        <iframe
                          src={viewingCourse.videoURL.replace('watch?v=', 'embed/')}
                          className="w-full h-full rounded-xl"
                          allowFullScreen
                        />
                      ) : (
                        <div className="text-center text-white">
                          <Video className="w-16 h-16 mx-auto mb-3 opacity-60" />
                          <p className="text-sm">Video player coming soon</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {viewingCourse.pdfURL && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#000000] mb-3">PDF Materials</h3>
                    <div className="bg-gray-50 rounded-xl p-6 flex items-center gap-4">
                      <FileText className="w-12 h-12 text-[#D71921]" />
                      <div className="flex-1">
                        <p className="font-bold text-[#000000]">{viewingCourse.pdfName}</p>
                        <p className="text-sm text-gray-600">PDF Document</p>
                      </div>
                      <button className="px-4 py-2 bg-[#D71921] text-white rounded-lg hover:bg-[#B91518] transition text-sm font-bold">
                        Download
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => alert('Group chat feature coming soon!')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat about this
                  </button>
                  <button
                    onClick={() => {
                      setViewingCourse(null);
                      setShowSupportModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFD700] text-[#000000] rounded-xl font-bold hover:bg-[#D4AF37] transition"
                  >
                    <HelpCircle className="w-5 h-5" />
                    Contact Support
                  </button>
                  <button
                    onClick={() => {
                      setViewingCourse(null);
                      setShowReportModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Report Problem
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSupportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowSupportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-2xl font-bold text-[#000000] mb-4">Contact Support</h3>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition resize-none mb-4"
                placeholder="Describe your issue or question..."
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSupportRequest}
                  className="flex-1 bg-[#D71921] text-white py-3 rounded-xl font-bold hover:bg-[#B91518] transition"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="px-6 py-3 bg-gray-200 text-[#000000] rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-2xl font-bold text-[#000000] mb-4">Report a Problem</h3>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition resize-none mb-4"
                placeholder="Describe the problem you encountered..."
              />
              <div className="flex gap-3">
                <button
                  onClick={handleReportProblem}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition"
                >
                  Submit Report
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-6 py-3 bg-gray-200 text-[#000000] rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FolderPlus, Image as ImageIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createMainModule,
  createSubmodule,
  getAllMainModules,
  MainModule
} from '../services/mainModuleService';

interface CreateModuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateModuleForm({ isOpen, onClose, onSuccess }: CreateModuleFormProps) {
  const [moduleType, setModuleType] = useState<'main' | 'submodule'>('main');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [visible, setVisible] = useState(true);
  const [parentModuleId, setParentModuleId] = useState('');
  const [submoduleNumber, setSubmoduleNumber] = useState(1);
  const [mainModules, setMainModules] = useState<MainModule[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMainModules();
    }
  }, [isOpen]);

  const loadMainModules = async () => {
    const modules = await getAllMainModules();
    setMainModules(modules);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG or JPG)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !coverImage) {
      alert('Please fill in all fields and upload a cover image');
      return;
    }

    if (moduleType === 'submodule' && !parentModuleId) {
      alert('Please select a parent module');
      return;
    }

    setLoading(true);
    try {
      if (moduleType === 'main') {
        await createMainModule({
          title: title.trim(),
          description: description.trim(),
          coverImage,
          visible
        });
        alert('Main module created successfully!');
      } else {
        await createSubmodule({
          parentModuleId,
          order: submoduleNumber,
          title: title.trim(),
          description: description.trim(),
          coverImage
        });
        alert('Submodule created successfully!');
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Failed to create module. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setModuleType('main');
    setTitle('');
    setDescription('');
    setCoverImage('');
    setVisible(true);
    setParentModuleId('');
    setSubmoduleNumber(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        >
          <div className="glass-light rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 sm:px-8 py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FolderPlus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Create Training Module</h1>
                  <p className="text-blue-100 text-sm sm:text-base mt-1">Build comprehensive training content for your students</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 sm:space-y-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Module Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setModuleType('main')}
                    className={`relative p-4 sm:p-6 rounded-2xl font-semibold transition-all duration-300 border-2 ${
                      moduleType === 'main'
                        ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg scale-105'
                        : 'border-gray-200 glass-light text-gray-600 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {moduleType === 'main' && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-bold text-base sm:text-lg mb-1">Main Module</div>
                      <div className="text-xs sm:text-sm opacity-75">Create a new primary training module</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuleType('submodule')}
                    className={`relative p-4 sm:p-6 rounded-2xl font-semibold transition-all duration-300 border-2 ${
                      moduleType === 'submodule'
                        ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg scale-105'
                        : 'border-gray-200 glass-light text-gray-600 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {moduleType === 'submodule' && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-bold text-base sm:text-lg mb-1">Submodule</div>
                      <div className="text-xs sm:text-sm opacity-75">Add a chapter to existing module</div>
                    </div>
                  </button>
                </div>
              </div>

              {moduleType === 'submodule' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Parent Module
                    </label>
                    <select
                      value={parentModuleId}
                      onChange={(e) => setParentModuleId(e.target.value)}
                      className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                      required
                    >
                      <option value="">Select parent module...</option>
                      {mainModules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Submodule Number
                    </label>
                    <select
                      value={submoduleNumber}
                      onChange={(e) => setSubmoduleNumber(parseInt(e.target.value))}
                      className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          Submodule {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Module Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={moduleType === 'main' ? 'e.g., Cabin Crew Safety Training' : 'e.g., Emergency Procedures'}
                  className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what students will learn in this module..."
                  rows={5}
                  className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Cover Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  {coverImage ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={coverImage}
                        alt="Cover preview"
                        className="w-full h-48 sm:h-64 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <div className="text-white text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <span className="font-semibold">Change Image</span>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-8 sm:p-12 glass-light border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:glass-bubble transition-all group"
                    >
                      <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 group-hover:text-blue-500 mx-auto mb-4 transition-colors" />
                      <div className="text-center">
                        <p className="text-gray-700 font-semibold mb-1 text-sm sm:text-base">Click to upload cover image</p>
                        <p className="text-gray-500 text-xs sm:text-sm">PNG, JPG up to 10MB</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {moduleType === 'main' && (
                <div className="flex items-center gap-3 p-4 sm:p-5 glass-light rounded-2xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      visible ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                        visible ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">Visible to Students</div>
                    <div className="text-xs sm:text-sm text-gray-500">Make this module available immediately</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 px-6 py-4 glass-light border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:border-gray-400 hover:shadow-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Create {moduleType === 'main' ? 'Main Module' : 'Submodule'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

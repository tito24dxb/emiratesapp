import { useState, useEffect, useRef } from 'react';
import { X, Upload, FolderPlus, Plus } from 'lucide-react';
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-[#D71920] to-[#B91518]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FolderPlus className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Create Training Module</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Module Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModuleType('main')}
                    className={`p-4 rounded-xl font-semibold transition border-2 ${
                      moduleType === 'main'
                        ? 'border-[#D71920] bg-red-50 text-[#D71920]'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Main Module
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuleType('submodule')}
                    className={`p-4 rounded-xl font-semibold transition border-2 ${
                      moduleType === 'submodule'
                        ? 'border-[#D71920] bg-red-50 text-[#D71920]'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Submodule
                  </button>
                </div>
              </div>

              {moduleType === 'submodule' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Parent Module *
                    </label>
                    <select
                      value={parentModuleId}
                      onChange={(e) => setParentModuleId(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:outline-none transition"
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
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Submodule Number *
                    </label>
                    <select
                      value={submoduleNumber}
                      onChange={(e) => setSubmoduleNumber(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:outline-none transition"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          Submodule {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={moduleType === 'main' ? 'e.g., Cabin Crew Training' : 'e.g., Safety Procedures'}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this module covers..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:outline-none transition resize-none"
                  required
                />
              </div>

              {moduleType === 'main' && (
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={(e) => setVisible(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-14 h-8 rounded-full transition ${visible ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${visible ? 'translate-x-6' : ''}`} />
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-700">Visible to Students</span>
                      <p className="text-xs text-gray-500">Turn off to hide this module from students</p>
                    </div>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cover Image * (PNG or JPG)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#D71920] transition"
                >
                  {coverImage ? (
                    <div className="space-y-3">
                      <img
                        src={coverImage}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <p className="text-sm text-gray-600">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-gray-600 font-semibold">Click to upload cover image</p>
                      <p className="text-sm text-gray-500">PNG or JPG (recommended: 1200x600px)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm sm:text-base">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span className="text-sm sm:text-base">Create {moduleType === 'main' ? 'Main Module' : 'Submodule'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

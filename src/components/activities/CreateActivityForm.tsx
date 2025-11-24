import { useState } from 'react';
import { Calendar, MapPin, Users, DollarSign, Clock, Info, Image as ImageIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { activityManagementService, ActivityType } from '../../services/activityManagementService';

interface CreateActivityFormProps {
  onSuccess?: (activityId: string) => void;
  onCancel?: () => void;
}

export default function CreateActivityForm({ onSuccess, onCancel }: CreateActivityFormProps) {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'free' as ActivityType,
    date: '',
    time: '',
    location: '',
    capacity: 50,
    price: 0,
    duration: 60,
    imageUrl: '',
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activityTypes: { value: ActivityType; label: string; icon: string }[] = [
    { value: 'free', label: 'Free Event', icon: '🎉' },
    { value: 'paid', label: 'Paid Event', icon: '💰' },
    { value: 'training', label: 'Training Session', icon: '🏋️' },
    { value: 'workshop', label: 'Workshop', icon: '🛠️' },
    { value: 'seminar', label: 'Seminar', icon: '🎓' },
    { value: 'meetup', label: 'Meetup', icon: '🤝' },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: 'Image must be less than 5MB' });
      return;
    }

    setUploadingImage(true);
    setErrors({ ...errors, image: '' });

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setErrors({ ...errors, image: 'Failed to upload image' });
    } finally {
      setUploadingImage(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Activity name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1';
    if (formData.type === 'paid' && formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.duration < 15) newErrors.duration = 'Duration must be at least 15 minutes';

    const selectedDate = new Date(`${formData.date}T${formData.time}`);
    if (selectedDate < new Date()) {
      newErrors.date = 'Activity date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !currentUser) return;

    setLoading(true);

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const activityId = await activityManagementService.createActivity({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        date: dateTime,
        location: formData.location,
        capacity: formData.capacity,
        price: formData.price,
        duration: formData.duration,
        imageUrl: formData.imageUrl,
        tags: formData.tags,
        organizerId: currentUser.uid,
        organizerName: currentUser.name,
        organizerEmail: currentUser.email,
      });

      if (onSuccess) {
        onSuccess(activityId);
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to create activity' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 max-w-4xl mx-auto"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Activity</h2>
        <p className="text-gray-600">Set up a new event, workshop, or training session</p>
      </div>

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errors.submit}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Activity Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {activityTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.value })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === type.value
                    ? 'border-[#D71920] bg-[#D71920]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="text-sm font-medium text-gray-900">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Activity Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
            placeholder="e.g., Morning Yoga Session"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
            placeholder="Describe what participants can expect..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Time
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
            />
            {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
            placeholder="e.g., Main Gym Hall or Online via Zoom"
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Capacity
            </label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
            />
            {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Duration (min)
            </label>
            <input
              type="number"
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
            />
            {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
          </div>

          {formData.type === 'paid' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Price (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <ImageIcon className="inline w-4 h-4 mr-1" />
            Activity Image
          </label>
          <div className="flex items-center gap-4">
            {formData.imageUrl && (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <label className="flex-1 cursor-pointer">
              <div className="px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D71920] transition-colors text-center">
                {uploadingImage ? (
                  <div className="text-gray-500">Uploading...</div>
                ) : (
                  <div className="text-gray-600">
                    <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    Click to upload image
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
          </div>
          {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
              placeholder="Add tags (press Enter)"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#D71920]/10 text-[#D71920] rounded-full text-sm font-medium flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-[#B91518]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Activity Guidelines:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Free events are open to all members</li>
                <li>Paid events require payment before joining</li>
                <li>QR codes will be generated for check-in tracking</li>
                <li>Participants will receive notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            'Create Activity'
          )}
        </button>
      </div>
    </motion.form>
  );
}

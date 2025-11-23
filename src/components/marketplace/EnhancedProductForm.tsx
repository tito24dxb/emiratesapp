import { useState, FormEvent } from 'react';
import { Save, Download, Package, Briefcase, Tag, DollarSign, Info } from 'lucide-react';
import { ProductFormData } from '../../services/marketplaceService';
import { processProductImage } from '../../utils/imageProcessing';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
}

const CATEGORIES = [
  'Education & Courses',
  'Digital Products',
  'Software & Tools',
  'Graphics & Design',
  'Business Services',
  'Physical Products',
  'Other'
];

export default function EnhancedProductForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}: EnhancedProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price ? initialData.price / 100 : 0,
    currency: initialData?.currency || 'USD',
    category: initialData?.category || CATEGORIES[0],
    product_type: initialData?.product_type || 'digital',
    images: initialData?.images || [],
    digital_file_url: initialData?.digital_file_url || '',
    digital_file_name: initialData?.digital_file_name || '',
    stock_quantity: initialData?.stock_quantity,
    tags: initialData?.tags || []
  });

  const [loading, setLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string[]>(initialData?.images || []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (formData.images.length === 0) {
      setError('At least one image is required');
      return;
    }

    if (formData.product_type === 'physical' && !formData.stock_quantity) {
      setError('Stock quantity is required for physical products');
      return;
    }

    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error: any) {
      setError(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessingImages(true);
    setError('');

    try {
      const processedImages: string[] = [];

      for (let i = 0; i < Math.min(files.length, 5 - formData.images.length); i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} is not an image`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setError(`Image ${file.name} is too large. Max size is 5MB`);
          continue;
        }

        const processed = await processProductImage(file, true, 1200, 1200);
        processedImages.push(processed.base64);
      }

      setFormData({
        ...formData,
        images: [...formData.images, ...processedImages]
      });
      setImagePreview([...imagePreview, ...processedImages]);
    } catch (error: any) {
      setError('Failed to process images: ' + error.message);
    } finally {
      setProcessingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
    setImagePreview(newPreviews);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag)
    });
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'digital':
        return <Download className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'physical':
        return <Package className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'service':
        return <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <Package className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Product Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter product title"
            maxLength={100}
          />
          <p className="text-xs text-gray-500">{formData.title.length}/100</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe your product..."
            maxLength={2000}
          />
          <p className="text-xs text-gray-500">{formData.description.length}/2000</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Product Type *
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {['digital', 'physical', 'service'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, product_type: type as any })}
                className={`p-2 sm:p-3 border-2 rounded-lg flex flex-col items-center gap-1 sm:gap-2 transition-all ${
                  formData.product_type === type
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                {getProductTypeIcon(type)}
                <span className="text-xs sm:text-sm font-medium capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Price *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full pl-9 sm:pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
          </div>
        </div>

        {formData.product_type === 'physical' && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock_quantity || 0}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter quantity"
            />
          </div>
        )}

        {formData.product_type === 'digital' && (
          <div className="space-y-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Digital File URL (Optional)
              </label>
              <input
                type="url"
                value={formData.digital_file_url || ''}
                onChange={(e) => setFormData({ ...formData, digital_file_url: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/file.pdf"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                File Name (Optional)
              </label>
              <input
                type="text"
                value={formData.digital_file_name || ''}
                onChange={(e) => setFormData({ ...formData, digital_file_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="product-file.pdf"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tags (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900 text-base leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Product Images * (Max 5)
          </label>
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              White backgrounds will be automatically removed for better display
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {imagePreview.map((image, index) => (
              <div key={index} className="relative aspect-square group">
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                >
                  ×
                </button>
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}

            {formData.images.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-1 sm:gap-2 bg-gray-50 hover:bg-blue-50 transition-colors">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                <span className="text-xs text-gray-500">Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={processingImages}
                />
              </label>
            )}
          </div>

          {processingImages && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Processing images...
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || processingImages}
            className="w-full sm:flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

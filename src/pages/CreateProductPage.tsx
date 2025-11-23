import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductForm from '../components/marketplace/ProductForm';
import { createProduct, publishProduct, ProductFormData } from '../services/marketplaceService';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const handleSubmit = async (data: ProductFormData) => {
    if (!currentUser) {
      alert('Please login to create products');
      navigate('/login');
      return;
    }

    try {
      const productId = await createProduct(
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'Anonymous',
        currentUser.email || '',
        currentUser.photoURL || undefined,
        data
      );

      alert('Product created successfully! You can publish it from your products page.');
      navigate(`/marketplace/my-products`);
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please login to create products</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </button>

          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            Create New Product
          </h1>
          <p className="text-gray-600 mt-2">
            List your product on the marketplace and reach thousands of potential buyers
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <ProductForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/marketplace')}
            isEdit={false}
          />
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Tips for a successful listing:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Use high-quality images that showcase your product from multiple angles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Write a clear, detailed description that highlights key features and benefits</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Price competitively by researching similar products</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Use relevant tags to help buyers find your product</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>For digital products, ensure your download links are secure and accessible</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

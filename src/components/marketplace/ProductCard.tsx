import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Package, Download, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { MarketplaceProduct } from '../../services/marketplaceService';
import { formatPrice } from '../../services/stripeService';

interface ProductCardProps {
  product: MarketplaceProduct;
  onFavoriteToggle?: (productId: string) => void;
  isFavorite?: boolean;
  showActions?: boolean;
}

export default function ProductCard({
  product,
  onFavoriteToggle,
  isFavorite = false,
  showActions = true
}: ProductCardProps) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    navigate(`/marketplace/product/${product.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(product.id);
    }
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/marketplace/checkout/${product.id}`);
  };

  const getProductIcon = () => {
    switch (product.product_type) {
      case 'digital':
        return <Download className="w-4 h-4" />;
      case 'physical':
        return <Package className="w-4 h-4" />;
      case 'service':
        return <Tag className="w-4 h-4" />;
    }
  };

  const getDefaultImage = () => {
    return `https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=300&fit=crop`;
  };

  const productImage = !imageError && product.images && product.images.length > 0
    ? product.images[0]
    : getDefaultImage();

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
      className="bg-white rounded-xl overflow-hidden border border-gray-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={productImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={() => setImageError(true)}
        />

        {/* Product Type Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
          {getProductIcon()}
          <span className="capitalize">{product.product_type}</span>
        </div>

        {/* Favorite Button */}
        {showActions && (
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-red-500 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Out of Stock Badge */}
        {product.product_type === 'physical' && product.stock_quantity !== undefined && product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg">OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {product.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Category & Stats */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{product.views_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>{product.likes_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />
            <span>{product.sales_count || 0} sold</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(product.price, product.currency)}
            </div>
            {product.product_type === 'physical' && product.stock_quantity !== undefined && (
              <div className="text-xs text-gray-500">
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
              </div>
            )}
          </div>

          {showActions && product.stock_quantity !== 0 && (
            <button
              onClick={handleBuyClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy Now
            </button>
          )}
        </div>

        {/* Seller Info */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          {product.seller_photo_url ? (
            <img
              src={product.seller_photo_url}
              alt={product.seller_name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
              {product.seller_name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-600">{product.seller_name}</span>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { getProduct, MarketplaceProduct } from '../services/marketplaceService';
import { createOrder } from '../services/orderService';
import { getStripe, createMarketplacePaymentIntent, formatPrice } from '../services/stripeService';
import PaymentForm from '../components/marketplace/PaymentForm';

export default function MarketplaceCheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const stripePromise = getStripe();

  useEffect(() => {
    if (productId && currentUser) {
      loadProductAndCreateOrder();
    }
  }, [productId, currentUser]);

  const loadProductAndCreateOrder = async () => {
    if (!productId || !currentUser) return;

    setLoading(true);
    try {
      // Check if Stripe is configured
      const stripe = await stripePromise;
      if (!stripe) {
        alert('Payment system is not configured. Please contact support.');
        navigate('/marketplace');
        return;
      }

      const fetchedProduct = await getProduct(productId);

      if (!fetchedProduct) {
        alert('Product not found');
        navigate('/marketplace');
        return;
      }

      if (fetchedProduct.status !== 'published') {
        alert('This product is not available for purchase');
        navigate('/marketplace');
        return;
      }

      if (fetchedProduct.product_type === 'physical' && fetchedProduct.stock_quantity === 0) {
        alert('This product is out of stock');
        navigate('/marketplace');
        return;
      }

      setProduct(fetchedProduct);

      const newOrderId = await createOrder({
        buyer_id: currentUser.uid,
        buyer_name: currentUser.displayName || currentUser.email || 'Anonymous',
        buyer_email: currentUser.email || '',
        seller_id: fetchedProduct.seller_id,
        seller_name: fetchedProduct.seller_name,
        seller_email: fetchedProduct.seller_email,
        product_id: fetchedProduct.id,
        product_title: fetchedProduct.title,
        product_type: fetchedProduct.product_type,
        product_image: fetchedProduct.images[0],
        quantity: quantity,
        price: fetchedProduct.price,
        currency: fetchedProduct.currency
      });

      setOrderId(newOrderId);

      // Price is already in cents from Firestore, so divide by 100 to get dollars
      const priceInDollars = fetchedProduct.price / 100;

      const paymentIntent = await createMarketplacePaymentIntent({
        firebase_buyer_uid: currentUser.uid,
        firebase_seller_uid: fetchedProduct.seller_id,
        firebase_order_id: newOrderId,
        product_id: fetchedProduct.id,
        product_title: fetchedProduct.title,
        product_type: fetchedProduct.product_type,
        quantity: quantity,
        amount: priceInDollars * quantity,
        currency: fetchedProduct.currency,
        seller_email: fetchedProduct.seller_email
      });

      setClientSecret(paymentIntent.clientSecret);
    } catch (error: any) {
      console.error('Error loading checkout:', error);
      alert(error.message || 'Failed to load checkout');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Payment succeeded:', paymentIntentId);
    setPaymentSuccess(true);

    setTimeout(() => {
      navigate(`/marketplace/orders`);
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please login to complete your purchase</p>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (!product || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout Error</h2>
          <p className="text-gray-600 mb-4">Unable to load checkout</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = product.price * quantity;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/marketplace/product/${product.id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Product
        </button>

        {/* Success Overlay */}
        <AnimatePresence>
          {paymentSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/90 backdrop-blur-xl rounded-xl p-8 max-w-md text-center border border-white/30 shadow-2xl"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-4">
                  Your order has been confirmed. Redirecting to orders page...
                </p>
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkout Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/30 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Product */}
              <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
                <img
                  src={product.images[0] || ''}
                  alt={product.title}
                  className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 capitalize">{product.product_type}</p>
                </div>
              </div>

              {/* Quantity */}
              {product.product_type === 'physical' && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {product.stock_quantity && (
                    <p className="text-xs text-gray-500 mt-1">
                      {product.stock_quantity} available
                    </p>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Price</span>
                  <span>{formatPrice(product.price, product.currency)}</span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Quantity</span>
                    <span>× {quantity}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(totalAmount, product.currency)}</span>
                </div>
              </div>

              {/* Seller */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Sold by</p>
                <div className="flex items-center gap-2">
                  {product.seller_photo_url ? (
                    <img
                      src={product.seller_photo_url}
                      alt={product.seller_name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                      {product.seller_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{product.seller_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-blue-900/90 to-indigo-900/90 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-6 lg:p-8 relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6">Payment Details</h2>

              <Elements stripe={stripePromise}>
                <PaymentForm
                  amount={totalAmount}
                  currency={product.currency}
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

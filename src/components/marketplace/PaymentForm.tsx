import { useState, useEffect, FormEvent } from 'react';
import { CardElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, CreditCard, Smartphone, Wallet, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PaymentRequest, PaymentMethod } from '@stripe/stripe-js';
import { getCurrencySymbol, formatCurrencyAmount } from '../../utils/currencyDetection';
import { ApplePayIcon, GooglePayIcon } from './PaymentIcons';

interface PaymentFormProps {
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  clientSecret: string;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
      iconColor: '#3b82f6',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: false,
};

export default function PaymentForm({
  amount,
  currency,
  onSuccess,
  onError,
  clientSecret
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [walletPaymentAvailable, setWalletPaymentAvailable] = useState(false);
  const [processing3DSecure, setProcessing3DSecure] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState<string>(currency);
  const [cardBrand, setCardBrand] = useState<string>('');
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });

  // Initialize Apple Pay and Google Pay
  useEffect(() => {
    if (!stripe || !clientSecret) {
      return;
    }

    const pr = stripe.paymentRequest({
      country: currency === 'AED' ? 'AE' : 'US',
      currency: currency.toLowerCase(),
      total: {
        label: 'Total',
        amount: amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Apple Pay or Google Pay is available
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setWalletPaymentAvailable(true);
      }
    });

    // Handle the payment method from Apple Pay or Google Pay
    pr.on('paymentmethod', async (e) => {
      setLoading(true);
      setError('');

      try {
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: e.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          e.complete('fail');
          throw new Error(confirmError.message);
        }

        e.complete('success');

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          onSuccess(paymentIntent.id);
        } else if (paymentIntent && paymentIntent.status === 'requires_action') {
          const { error: nextActionError } = await stripe.confirmCardPayment(clientSecret);
          if (nextActionError) {
            throw new Error(nextActionError.message);
          } else {
            onSuccess(paymentIntent.id);
          }
        } else {
          throw new Error('Payment was not successful');
        }
      } catch (err: any) {
        console.error('Wallet payment error:', err);
        const errorMessage = err.message || 'Wallet payment failed. Please try again.';
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setLoading(false);
      }
    });
  }, [stripe, clientSecret, amount, currency, onSuccess, onError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardComplete) {
      setError('Please complete card details');
      return;
    }

    if (!billingDetails.name.trim()) {
      setError('Cardholder name is required');
      return;
    }

    if (!billingDetails.email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: billingDetails.name,
              email: billingDetails.email,
              address: {
                line1: billingDetails.address.line1 || undefined,
                city: billingDetails.address.city || undefined,
                state: billingDetails.address.state || undefined,
                postal_code: billingDetails.address.postal_code || undefined,
                country: billingDetails.address.country
              }
            }
          }
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent) {
        if (paymentIntent.status === 'requires_action') {
          setProcessing3DSecure(true);
          const { error: authError, paymentIntent: authIntent } = await stripe.confirmCardPayment(clientSecret);
          setProcessing3DSecure(false);

          if (authError) {
            throw new Error(authError.message);
          }

          if (authIntent && authIntent.status === 'succeeded') {
            onSuccess(authIntent.id);
          } else {
            throw new Error('3D Secure authentication failed');
          }
        } else if (paymentIntent.status === 'succeeded') {
          onSuccess(paymentIntent.id);
        } else {
          throw new Error('Payment was not successful');
        }
      } else {
        throw new Error('Payment intent not found');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = () => {
    return formatCurrencyAmount(amount / 100, detectedCurrency);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm opacity-90">Total Amount</div>
          <div className="flex items-center gap-2 text-xs opacity-75">
            <Globe className="w-3 h-3" />
            <span>{currency.toUpperCase()}</span>
          </div>
        </div>
        <div className="text-4xl font-bold mb-2">{formatAmount()}</div>
        <div className="text-sm opacity-75 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>Secure payment with 3D Secure protection</span>
        </div>
      </div>

      {/* 3D Secure Processing Modal */}
      <AnimatePresence>
        {processing3DSecure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Verifying Payment</h3>
              <p className="text-gray-600 mb-6">
                Please complete the verification with your card issuer. This may open in a new window or popup.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-xs text-gray-500 mt-4">Secured by 3D Secure</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Apple Pay and Google Pay - Always Show */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-6 h-6 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-lg">Express Checkout</h3>
          </div>

          {walletPaymentAvailable && paymentRequest ? (
            <div className="bg-white rounded-lg p-1">
              <PaymentRequestButtonElement
                options={{ paymentRequest }}
                className="w-full"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors opacity-50 cursor-not-allowed">
                  <ApplePayIcon className="w-10 h-6" />
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors opacity-50 cursor-not-allowed">
                  <GooglePayIcon className="w-10 h-6" />
                </div>
              </div>
              <p className="text-xs text-gray-600 text-center">
                Not available on this device/browser
              </p>
            </div>
          )}

          <p className="text-sm text-gray-700 mt-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span className="font-medium">
              {walletPaymentAvailable ? 'Pay with Apple Pay or Google Pay - Faster & Secure' : 'Available on supported devices and browsers'}
            </span>
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-600 font-semibold">OR PAY WITH CARD</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
      </div>

      {/* Billing Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Billing Information
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cardholder Name *
          </label>
          <input
            type="text"
            value={billingDetails.name}
            onChange={(e) => setBillingDetails({ ...billingDetails, name: e.target.value })}
            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            placeholder="John Doe"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={billingDetails.email}
            onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            placeholder="john@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address (Optional)
          </label>
          <input
            type="text"
            value={billingDetails.address.line1}
            onChange={(e) => setBillingDetails({
              ...billingDetails,
              address: { ...billingDetails.address, line1: e.target.value }
            })}
            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            placeholder="123 Main St"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City (Optional)
            </label>
            <input
              type="text"
              value={billingDetails.address.city}
              onChange={(e) => setBillingDetails({
                ...billingDetails,
                address: { ...billingDetails.address, city: e.target.value }
              })}
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="City"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State (Optional)
            </label>
            <input
              type="text"
              value={billingDetails.address.state}
              onChange={(e) => setBillingDetails({
                ...billingDetails,
                address: { ...billingDetails.address, state: e.target.value }
              })}
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="State"
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={billingDetails.address.postal_code}
              onChange={(e) => setBillingDetails({
                ...billingDetails,
                address: { ...billingDetails.address, postal_code: e.target.value }
              })}
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="12345"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={billingDetails.address.country}
              onChange={(e) => setBillingDetails({
                ...billingDetails,
                address: { ...billingDetails.address, country: e.target.value }
              })}
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              disabled={loading}
            >
              <option value="US">United States</option>
              <option value="AE">United Arab Emirates</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="AF">Afghanistan</option>
              <option value="AL">Albania</option>
              <option value="DZ">Algeria</option>
              <option value="AR">Argentina</option>
              <option value="AT">Austria</option>
              <option value="BH">Bahrain</option>
              <option value="BD">Bangladesh</option>
              <option value="BE">Belgium</option>
              <option value="BR">Brazil</option>
              <option value="BG">Bulgaria</option>
              <option value="CN">China</option>
              <option value="CO">Colombia</option>
              <option value="HR">Croatia</option>
              <option value="CY">Cyprus</option>
              <option value="CZ">Czech Republic</option>
              <option value="DK">Denmark</option>
              <option value="EG">Egypt</option>
              <option value="EE">Estonia</option>
              <option value="FI">Finland</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
              <option value="GR">Greece</option>
              <option value="HK">Hong Kong</option>
              <option value="HU">Hungary</option>
              <option value="IS">Iceland</option>
              <option value="IN">India</option>
              <option value="ID">Indonesia</option>
              <option value="IE">Ireland</option>
              <option value="IL">Israel</option>
              <option value="IT">Italy</option>
              <option value="JP">Japan</option>
              <option value="JO">Jordan</option>
              <option value="KE">Kenya</option>
              <option value="KW">Kuwait</option>
              <option value="LV">Latvia</option>
              <option value="LB">Lebanon</option>
              <option value="LT">Lithuania</option>
              <option value="LU">Luxembourg</option>
              <option value="MY">Malaysia</option>
              <option value="MT">Malta</option>
              <option value="MX">Mexico</option>
              <option value="MA">Morocco</option>
              <option value="NL">Netherlands</option>
              <option value="NZ">New Zealand</option>
              <option value="NG">Nigeria</option>
              <option value="NO">Norway</option>
              <option value="OM">Oman</option>
              <option value="PK">Pakistan</option>
              <option value="PH">Philippines</option>
              <option value="PL">Poland</option>
              <option value="PT">Portugal</option>
              <option value="QA">Qatar</option>
              <option value="RO">Romania</option>
              <option value="RU">Russia</option>
              <option value="SA">Saudi Arabia</option>
              <option value="SG">Singapore</option>
              <option value="SK">Slovakia</option>
              <option value="SI">Slovenia</option>
              <option value="ZA">South Africa</option>
              <option value="KR">South Korea</option>
              <option value="ES">Spain</option>
              <option value="LK">Sri Lanka</option>
              <option value="SE">Sweden</option>
              <option value="CH">Switzerland</option>
              <option value="TW">Taiwan</option>
              <option value="TH">Thailand</option>
              <option value="TR">Turkey</option>
              <option value="UA">Ukraine</option>
              <option value="VN">Vietnam</option>
            </select>
          </div>
        </div>
      </div>

      {/* Card Element */}
      <div className="relative z-20">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details *
        </label>
        <div className="relative p-4 border-2 border-gray-300/50 rounded-lg bg-white/50 backdrop-blur-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 transition-all min-h-[44px] z-30" style={{ pointerEvents: 'auto' }}>
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => {
              setCardComplete(e.complete);
              if (e.error) {
                setError(e.error.message);
              } else {
                setError('');
              }

              if (e.brand) {
                setCardBrand(e.brand);
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-700 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Encrypted & Secure
          </p>
          {cardBrand && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="capitalize">{cardBrand}</span>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading || !cardComplete}
        className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Pay {formatAmount()}
          </>
        )}
      </button>

      {/* Security Info */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>PCI-DSS Compliant Payment Processing</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>3D Secure Authentication Available</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Multi-Currency Support</span>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center border-t border-gray-200 pt-2">
          Powered by Stripe • Your card information is never stored on our servers
        </p>
      </div>
    </form>
  );
}

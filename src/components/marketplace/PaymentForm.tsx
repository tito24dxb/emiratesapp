import { useState, useEffect, FormEvent } from 'react';
import { CardElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PaymentRequest, PaymentMethod } from '@stripe/stripe-js';

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
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);
  const [verifying3DS, setVerifying3DS] = useState(false);
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

      if (paymentIntent && paymentIntent.status === 'requires_action') {
        setVerifying3DS(true);
        const { error: actionError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(clientSecret);
        setVerifying3DS(false);

        if (actionError) {
          throw new Error(actionError.message);
        }

        if (confirmedIntent && confirmedIntent.status === 'succeeded') {
          onSuccess(confirmedIntent.id);
        } else {
          throw new Error('3D Secure verification failed');
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
      setVerifying3DS(false);
    }
  };

  const formatAmount = () => {
    const formatted = (amount / 100).toFixed(2);
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : 'د.إ';
    return `${symbol}${formatted}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
        <div className="text-sm opacity-90 mb-1">Total Amount</div>
        <div className="text-4xl font-bold">{formatAmount()}</div>
        <div className="text-sm opacity-75 mt-2">
          <Lock className="w-4 h-4 inline mr-1" />
          Secure payment powered by Stripe
        </div>
      </div>

      {/* 3D Secure Verification Message */}
      {verifying3DS && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-3"
        >
          <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="font-semibold">Verifying your card with 3D Secure...</p>
            <p className="text-xs mt-1">Please complete the verification in the popup window</p>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
        >
          {error}
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
                <div className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg shadow-md">
                  <svg width="40" height="16" viewBox="0 0 40 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.14 3.5c-.28.74-.62 1.32-1.02 1.74-.4.42-.88.63-1.43.63-.33 0-.61-.08-.84-.23-.23-.16-.34-.36-.34-.62 0-.2.08-.39.23-.57.16-.18.37-.27.64-.27.21 0 .42.07.63.22.21.14.39.34.54.59.15-.5.23-.99.23-1.47 0-.73-.17-1.3-.52-1.72-.34-.42-.82-.63-1.43-.63-.82 0-1.48.36-1.98 1.09C1.31 3.43 1.06 4.4 1.06 5.56c0 1.06.25 1.9.75 2.52.5.62 1.18.93 2.03.93.61 0 1.14-.19 1.59-.58.45-.39.79-.93 1.03-1.62l.73.29c-.29.84-.71 1.48-1.27 1.93-.56.45-1.23.67-2.02.67-1.08 0-1.95-.38-2.6-1.15-.65-.77-.98-1.77-.98-3.01 0-1.33.36-2.41 1.08-3.23.72-.82 1.64-1.23 2.76-1.23.84 0 1.51.25 2.02.76.51.51.76 1.19.76 2.05 0 .5-.09 1.01-.28 1.53z" fill="white"/>
                    <path d="M11.61 8.86c-.39 0-.7-.11-.93-.34-.23-.23-.34-.52-.34-.89 0-.36.11-.66.34-.89.23-.23.54-.34.93-.34.38 0 .69.11.92.34.23.23.35.53.35.89 0 .37-.12.66-.35.89-.23.23-.54.34-.92.34zm6.58-5.19c.61 0 1.08.17 1.42.52.34.35.51.84.51 1.48v3.26h-.87V5.81c0-.48-.11-.84-.33-1.08-.22-.24-.54-.36-.96-.36-.51 0-.91.16-1.21.49-.3.33-.45.77-.45 1.32v2.75h-.87V5.81c0-.48-.11-.84-.33-1.08-.22-.24-.54-.36-.96-.36-.51 0-.91.16-1.21.49-.3.33-.45.77-.45 1.32v2.75h-.87V3.82h.87v.78c.21-.28.47-.49.77-.64.3-.15.63-.22 1-.22.41 0 .77.1 1.08.29.31.19.54.45.68.79.23-.33.52-.58.86-.76.34-.18.72-.27 1.13-.27zm5.93 0c.61 0 1.08.17 1.42.52.34.35.51.84.51 1.48v3.26h-.87V5.81c0-.48-.11-.84-.33-1.08-.22-.24-.54-.36-.96-.36-.51 0-.91.16-1.21.49-.3.33-.45.77-.45 1.32v2.75h-.87V3.82h.87v.78c.21-.28.47-.49.77-.64.3-.15.63-.22 1-.22z" fill="white"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                  <svg width="42" height="17" viewBox="0 0 42 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.8 13V4.2h2.55c.75 0 1.34.18 1.77.54.43.36.64.86.64 1.5 0 .39-.1.73-.31 1.03-.21.3-.49.52-.85.67.44.12.78.34 1.03.67.25.33.37.72.37 1.17 0 .7-.23 1.25-.68 1.65-.45.4-1.06.6-1.83.6H19.8zm.96-5.03h1.42c.46 0 .82-.11 1.06-.32.24-.21.37-.51.37-.89 0-.38-.12-.68-.37-.89-.24-.21-.6-.32-1.06-.32h-1.42v2.42zm0 4.19h1.61c.48 0 .85-.12 1.11-.35.26-.23.39-.55.39-.95 0-.41-.13-.73-.39-.97-.26-.24-.63-.36-1.11-.36h-1.61v2.63z" fill="#5F6368"/>
                    <path d="M28.8 9.65c0-.3-.11-.54-.32-.71-.21-.17-.58-.34-1.1-.51-.53-.17-.94-.33-1.24-.49-.81-.41-1.21-1-.1-1.71.29-.26.65-.47 1.07-.61.42-.14.87-.21 1.34-.21.51 0 .96.08 1.36.25.4.17.71.4.94.7.23.3.34.64.34 1.01h-1.8c0-.27-.1-.48-.29-.64-.19-.16-.46-.24-.81-.24-.33 0-.59.07-.78.2-.19.13-.28.31-.28.53 0 .2.11.36.33.5.22.14.57.28 1.06.43.49.15.89.31 1.21.48.32.17.57.37.74.61.17.24.26.53.26.88 0 .56-.22 1-.67 1.33-.45.33-1.05.49-1.82.49-.54 0-1.03-.09-1.47-.27-.44-.18-.78-.43-1.02-.75-.24-.32-.36-.69-.36-1.1h1.8c0 .32.11.56.34.73.23.17.55.25.96.25.34 0 .61-.06.8-.19.19-.13.29-.3.29-.52z" fill="#5F6368"/>
                    <path d="M30.08 12.3l.44-.77c.49.37 1.08.56 1.77.56.94 0 1.41-.39 1.41-1.17V10.6c-.23.31-.52.55-.86.71-.34.16-.72.24-1.14.24-.52 0-.99-.12-1.42-.35-.43-.23-.76-.56-1-1-.24-.43-.36-.93-.36-1.48 0-.55.12-1.04.36-1.47.24-.43.57-.77 1-1 .43-.23.9-.35 1.42-.35.42 0 .8.08 1.14.24.34.16.63.39.86.7V6.4h.85v4.77c0 .72-.21 1.27-.62 1.65-.41.38-1 .57-1.77.57-.47 0-.91-.08-1.32-.24-.41-.16-.76-.38-1.06-.66zm3.18-3.74c.31-.29.47-.68.47-1.17 0-.49-.16-.88-.47-1.17-.31-.29-.7-.44-1.17-.44-.47 0-.86.15-1.17.44-.31.29-.47.68-.47 1.17 0 .49.16.88.47 1.17.31.29.7.44 1.17.44.47 0 .86-.15 1.17-.44z" fill="#5F6368"/>
                    <path d="M37.34 13.16c-.56 0-1.07-.12-1.51-.36-.44-.24-.79-.58-1.03-1.01-.24-.43-.37-.92-.37-1.46 0-.54.12-1.02.37-1.45.25-.43.59-.77 1.03-1.01.44-.24.94-.36 1.51-.36.57 0 1.07.12 1.51.36.44.24.79.58 1.03 1.01.25.43.37.91.37 1.45 0 .54-.12 1.03-.37 1.46-.24.43-.59.77-1.03 1.01-.44.24-.94.36-1.51.36zm0-.82c.47 0 .86-.15 1.17-.46.31-.31.47-.72.47-1.23 0-.51-.16-.92-.47-1.23-.31-.31-.7-.46-1.17-.46s-.86.15-1.17.46c-.31.31-.47.72-.47 1.23 0 .51.16.92.47 1.23.31.31.7.46 1.17.46z" fill="#5F6368"/>
                    <path d="M13.18 8.5c0 .34-.03.67-.08.98h-4.5c.07.46.27.82.59 1.08.32.26.7.39 1.15.39.66 0 1.14-.27 1.44-.81h1.67c-.2.65-.57 1.18-1.1 1.58-.53.4-1.18.6-1.95.6-.59 0-1.12-.12-1.58-.37-.46-.25-.82-.6-1.08-1.04-.26-.44-.39-.94-.39-1.49 0-.55.13-1.04.38-1.48.26-.44.61-.78 1.07-1.03.46-.25.98-.37 1.57-.37.57 0 1.08.12 1.53.36.45.24.8.58 1.05 1.01.25.43.37.92.37 1.46v.13zm-1.66-.41c-.01-.42-.18-.75-.48-1-.3-.25-.67-.37-1.1-.37-.41 0-.76.12-1.05.37-.29.25-.47.58-.54 1h3.17z" fill="#EA4335"/>
                    <path d="M4.5 13.16c-.56 0-1.07-.12-1.51-.36-.44-.24-.79-.58-1.03-1.01C1.72 11.36 1.6 10.87 1.6 10.33c0-.54.12-1.02.37-1.45.25-.43.59-.77 1.03-1.01.44-.24.94-.36 1.51-.36.57 0 1.07.12 1.51.36.44.24.79.58 1.03 1.01.25.43.37.91.37 1.45 0 .54-.12 1.03-.37 1.46-.24.43-.59.77-1.03 1.01-.44.24-.94.36-1.51.36zm0-.82c.47 0 .86-.15 1.17-.46.31-.31.47-.72.47-1.23 0-.51-.16-.92-.47-1.23-.31-.31-.7-.46-1.17-.46s-.86.15-1.17.46c-.31.31-.47.72-.47 1.23 0 .51.16.92.47 1.23.31.31.7.46 1.17.46z" fill="#4285F4"/>
                  </svg>
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
            }}
          />
        </div>
        <p className="text-xs text-gray-700 mt-2">
          <Lock className="w-3 h-3 inline mr-1" />
          Your payment information is encrypted and secure
        </p>
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
      <div className="text-center text-xs text-gray-300">
        <p>Payments are processed securely by Stripe</p>
        <p className="mt-1">Your card information is never stored on our servers</p>
      </div>
    </form>
  );
}

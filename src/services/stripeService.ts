import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key not found in environment variables');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export interface CreatePaymentIntentData {
  orderId: string;
  amount: number;
  currency: string;
  productId: string;
  productTitle: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export const createPaymentIntent = async (
  data: CreatePaymentIntentData
): Promise<PaymentIntentResponse> => {
  try {
    const createPaymentIntentFn = httpsCallable<CreatePaymentIntentData, PaymentIntentResponse>(
      functions,
      'createPaymentIntent'
    );

    const result = await createPaymentIntentFn(data);
    return result.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export interface ConfirmPaymentData {
  clientSecret: string;
  paymentMethod: {
    card: any;
    billing_details: {
      name: string;
      email: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      };
    };
  };
}

export const confirmCardPayment = async (
  stripe: Stripe,
  clientSecret: string,
  paymentMethod: any
): Promise<any> => {
  try {
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

export const retrievePaymentIntent = async (
  stripe: Stripe,
  paymentIntentId: string
): Promise<any> => {
  try {
    const result = await stripe.retrievePaymentIntent(paymentIntentId);
    if (result.error) {
      throw new Error(result.error.message);
    }
    return result.paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
};

export interface GenerateDownloadLinkData {
  orderId: string;
}

export interface GenerateDownloadLinkResponse {
  downloadUrl: string;
  expiresAt: string;
}

export const generateDownloadLink = async (
  orderId: string
): Promise<GenerateDownloadLinkResponse> => {
  try {
    const generateDownloadLinkFn = httpsCallable<GenerateDownloadLinkData, GenerateDownloadLinkResponse>(
      functions,
      'generateDownloadLink'
    );

    const result = await generateDownloadLinkFn({ orderId });
    return result.data;
  } catch (error) {
    console.error('Error generating download link:', error);
    throw error;
  }
};

export const formatPrice = (amountInCents: number, currency: string = 'USD'): string => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
};

export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const validateExpiry = (expiry: string): boolean => {
  const cleaned = expiry.replace(/\s/g, '');
  const parts = cleaned.split('/');

  if (parts.length !== 2) return false;

  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);

  if (month < 1 || month > 12) return false;

  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
};

export const validateCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv);
};

export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\s/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ');
};

export const formatExpiry = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
  }
  return cleaned;
};

export const getCardType = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';

  return 'Unknown';
};

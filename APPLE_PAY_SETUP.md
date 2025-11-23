# Apple Pay & Google Pay Setup Guide

## Overview
Apple Pay and Google Pay have been integrated into the marketplace checkout flow using Stripe's Payment Request API.

## Features Implemented
- ✅ Apple Pay button (iOS Safari / macOS Safari)
- ✅ Google Pay button (Chrome / Android Chrome)
- ✅ Automatic detection of available payment methods
- ✅ Express checkout with one tap
- ✅ Fallback to card payment if wallets unavailable
- ✅ Secure payment processing through Stripe

## How It Works

### For Users
1. Navigate to any product in the marketplace
2. Click "Buy" or "Buy Now"
3. On checkout page:
   - If Apple Pay or Google Pay is available, an "Express Checkout" button appears
   - Click the wallet button for instant payment
   - Authenticate with Face ID, Touch ID, or device PIN
   - Payment processes automatically
4. Fallback: Use the card form below if wallet payment unavailable

### Payment Flow
```
User clicks wallet button
  ↓
Device authentication (biometric/PIN)
  ↓
Stripe creates payment method
  ↓
Payment confirmed with client secret
  ↓
Order marked as paid
  ↓
User redirected to success page
```

## Stripe Dashboard Setup Required

### 1. Enable Apple Pay
1. Log into [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Settings** → **Payment methods**
3. Find **Apple Pay** and click **Enable**
4. Register your domain:
   - Go to **Settings** → **Apple Pay**
   - Click **Add domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Download the verification file OR use the one already in `public/.well-known/`
   - Click **Verify domain**

### 2. Enable Google Pay
1. In Stripe Dashboard: **Settings** → **Payment methods**
2. Find **Google Pay** and click **Enable**
3. Configure business name and logo (optional)
4. Save changes

### 3. Test Payment Methods
- **Apple Pay Test**: Use Safari on macOS or iOS with a test card in Wallet
- **Google Pay Test**: Use Chrome with a test card in Google Pay
- Stripe provides test cards: `4242 4242 4242 4242`

## Domain Verification for Apple Pay

### Production Setup
The file `public/.well-known/apple-developer-merchantid-domain-association` is already included.

1. Deploy your app to production domain
2. Verify the file is accessible at:
   ```
   https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
   ```
3. In Stripe Dashboard, add and verify your domain
4. Apple Pay will work on Safari (iOS and macOS)

### Local Development
For local testing with Apple Pay:
1. Use a tunneling service (ngrok, cloudflare tunnel, etc.):
   ```bash
   ngrok http 5173
   ```
2. Get the HTTPS URL (e.g., `https://abc123.ngrok.io`)
3. Add this domain to Stripe Dashboard
4. Verify domain with the association file
5. Test Apple Pay on your iPhone using the ngrok URL

## Browser Compatibility

### Apple Pay
- ✅ Safari (iOS 10.1+)
- ✅ Safari (macOS 10.12+)
- ❌ Chrome, Firefox, Edge (not supported)

### Google Pay
- ✅ Chrome (Desktop & Android)
- ✅ Edge
- ✅ Firefox (with limitations)
- ❌ Safari (not supported)

## Testing Checklist

- [ ] Enable Apple Pay in Stripe Dashboard
- [ ] Enable Google Pay in Stripe Dashboard
- [ ] Verify domain for Apple Pay
- [ ] Test on Safari with Apple Pay
- [ ] Test on Chrome with Google Pay
- [ ] Test fallback to card payment
- [ ] Test error handling (cancelled payment)
- [ ] Verify order creation on successful payment
- [ ] Test on production domain

## Technical Details

### Files Modified
- `src/components/marketplace/PaymentForm.tsx` - Added wallet payment logic
- `public/.well-known/apple-developer-merchantid-domain-association` - Apple Pay verification

### Dependencies Used
- `@stripe/react-stripe-js` - PaymentRequestButtonElement
- `@stripe/stripe-js` - Payment Request API

### Payment Request Configuration
```typescript
stripe.paymentRequest({
  country: 'US', // or 'AE' for AED
  currency: 'usd', // lowercase required
  total: {
    label: 'Total',
    amount: 1000, // in cents
  },
  requestPayerName: true,
  requestPayerEmail: true,
})
```

## Troubleshooting

### Apple Pay button not showing
1. Check browser: Must be Safari
2. Check device: Must have card in Apple Wallet
3. Check domain: Must be HTTPS and verified in Stripe
4. Check console for errors

### Google Pay button not showing
1. Check browser: Must be Chrome or Edge
2. Check device: Must have card saved in Google account
3. Check HTTPS: Must be secure connection
4. Check console for Stripe initialization errors

### Payment failing
1. Check Stripe Dashboard logs
2. Verify API keys are correct
3. Check client secret is valid
4. Ensure payment methods are enabled in Stripe

## Support Resources
- [Stripe Payment Request Button Docs](https://stripe.com/docs/stripe-js/elements/payment-request-button)
- [Apple Pay Setup Guide](https://stripe.com/docs/apple-pay)
- [Google Pay Setup Guide](https://stripe.com/docs/google-pay)
- [Stripe Dashboard](https://dashboard.stripe.com/)

## Security Notes
- All payment processing happens through Stripe (PCI compliant)
- Card details never touch your servers
- Payment methods are tokenized
- 3D Secure supported for additional authentication
- Apple Pay uses device biometrics for authorization
- Google Pay uses device authentication

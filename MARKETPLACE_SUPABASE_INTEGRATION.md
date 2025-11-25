# Marketplace with Supabase Edge Functions Integration

## Overview

Your marketplace now uses **Supabase Edge Functions** for all Stripe payment processing while storing complete product and order data in **Firebase Firestore**. This hybrid architecture leverages the best of both platforms:

- **Supabase**: Handles Stripe payment processing, customer management, and webhook handling
- **Firebase**: Stores all marketplace data (products, orders, user info) and serves as the main application database

## Architecture

### Payment Flow

1. **User initiates checkout** → Frontend creates order in Firebase with "pending" status
2. **Frontend calls Supabase Edge Function** → `marketplace-payment-intent` creates Stripe payment intent
3. **User completes payment** → Stripe processes the payment with 3D Secure support
4. **Stripe webhook fires** → Supabase Edge Function receives webhook event
5. **Webhook updates Firebase** → Edge Function writes full payment details to Firebase order document
6. **User receives confirmation** → Frontend displays order confirmation with payment details

### Data Storage

**Supabase Tables:**
- `stripe_customers` - Maps Firebase UIDs to Stripe customer IDs
- `stripe_subscriptions` - Manages subscription data (kept separate from marketplace)
- `stripe_orders` - Tracks one-time payment checkouts
- `marketplace_payment_intents` - Bridges Stripe payment intents with Firebase orders

**Firebase Collections:**
- `marketplace_products` - Product catalog with images, pricing, and stock
- `marketplace_orders` - Complete order history with full payment details
- `marketplace_favorites` - User favorited products
- `marketplace_reviews` - Product reviews and ratings
- `users` - User profiles and authentication data

## Supabase Edge Functions

### 1. marketplace-payment-intent

**Purpose**: Creates Stripe payment intents for marketplace purchases

**Location**: `supabase/functions/marketplace-payment-intent/index.ts`

**Request Body**:
```json
{
  "firebase_buyer_uid": "user-firebase-uid",
  "firebase_seller_uid": "seller-firebase-uid",
  "firebase_order_id": "firebase-order-document-id",
  "product_id": "product-id",
  "product_title": "Product Name",
  "product_type": "digital|physical|service",
  "quantity": 1,
  "amount": 2999,
  "currency": "usd",
  "seller_email": "seller@example.com"
}
```

**Response**:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "customerId": "cus_xxx"
}
```

**What it does**:
- Looks up or creates Stripe customer from Firebase UID
- Creates payment intent with marketplace metadata
- Tracks payment intent in `marketplace_payment_intents` table
- Returns client secret for frontend payment confirmation

### 2. stripe-webhook (Enhanced)

**Purpose**: Processes Stripe webhook events and updates Firebase orders

**Location**: `supabase/functions/stripe-webhook/index.ts`

**Handles**:
- `payment_intent.succeeded` - Updates Firebase order with payment details
- `checkout.session.completed` - Processes subscription and one-time payments
- Other Stripe events for subscription management

**Firebase Update**:
When a marketplace payment succeeds, it updates the Firebase order document with:
- `payment_status`: "completed"
- `payment_intent_id`: Stripe payment intent ID
- `payment_method`: Payment method type
- `stripe_customer_id`: Stripe customer ID
- `stripe_charge_id`: Stripe charge ID
- `completed_at`: Timestamp

### 3. marketplace-generate-download

**Purpose**: Generates secure download links for digital products

**Location**: `supabase/functions/marketplace-generate-download/index.ts`

**Request Body**:
```json
{
  "firebase_order_id": "order-id",
  "firebase_buyer_uid": "buyer-uid"
}
```

**Response**:
```json
{
  "downloadUrl": "https://...",
  "expiresAt": "2025-12-01T00:00:00.000Z"
}
```

**What it does**:
- Verifies payment completion in `marketplace_payment_intents`
- Generates time-limited download URL (7 days)
- Updates Firebase order with download URL and expiration
- Tracks download count for digital rights management

## Deployment Guide

### Step 1: Configure Supabase Environment Variables

In your Supabase dashboard (Settings → Edge Functions → Secrets), add:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Getting Firebase Service Account Credentials:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract `project_id`, `client_email`, and `private_key` from the JSON
5. For `FIREBASE_PRIVATE_KEY`, copy the entire private key including headers (keep the `\n` characters)

### Step 2: Deploy Supabase Edge Functions

```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref your-project-ref

# Deploy all marketplace Edge Functions
npx supabase functions deploy marketplace-payment-intent
npx supabase functions deploy marketplace-generate-download
npx supabase functions deploy stripe-webhook
```

### Step 3: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Copy the webhook signing secret
6. Add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

### Step 4: Update Frontend Environment Variables

In your `.env` file:

```bash
# Supabase (already configured)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Firebase (already configured)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase configs
```

### Step 5: Apply Supabase Migration

The `marketplace_payment_intents` table has already been created through the migration system. Verify it exists:

```bash
npx supabase db pull
```

### Step 6: Update Firebase Firestore Rules

Your Firestore rules already include marketplace collections. Ensure these rules are deployed:

```bash
firebase deploy --only firestore:rules
```

### Step 7: Build and Deploy Frontend

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Testing the Integration

### 1. Test Payment Flow

1. Navigate to the marketplace
2. Select a product and click "Buy Now"
3. Complete the payment form with Stripe test card: `4242 4242 4242 4242`
4. Verify the payment completes successfully
5. Check that the order appears in "My Orders" with status "completed"

### 2. Test Digital Download

For digital products:
1. Complete a purchase
2. Go to "My Orders"
3. Click "Download" button
4. Verify the download link is generated and works

### 3. Test Webhook Processing

1. Make a test purchase
2. Check Supabase Edge Function logs for webhook processing
3. Verify Firebase order document is updated with payment details
4. Check `marketplace_payment_intents` table shows "succeeded" status

### 4. Monitor Logs

**Supabase Edge Functions:**
```bash
npx supabase functions logs marketplace-payment-intent
npx supabase functions logs stripe-webhook
npx supabase functions logs marketplace-generate-download
```

**Firebase:**
- Check Firebase Console → Firestore → marketplace_orders collection
- Verify payment fields are populated after successful payments

## Troubleshooting

### Payment Intent Creation Fails

**Error**: "Supabase configuration missing"

**Solution**: Ensure `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Webhook Not Updating Firebase

**Error**: "Failed to update Firestore order"

**Solution**:
1. Verify Firebase service account credentials in Supabase secrets
2. Check that `FIREBASE_PRIVATE_KEY` includes `\n` characters (don't remove them)
3. Ensure Firebase project ID is correct

### Download Link Generation Fails

**Error**: "Payment not found or not completed"

**Solution**:
1. Verify payment was successful in Stripe dashboard
2. Check `marketplace_payment_intents` table has status "succeeded"
3. Ensure buyer UID matches the authenticated user

### CORS Errors

**Error**: "Cross-origin request blocked"

**Solution**: Edge Functions already include proper CORS headers. If you still see issues:
1. Check that you're calling the correct Supabase URL
2. Verify `apikey` header is included in requests
3. Ensure Authorization header has valid Firebase ID token

## Security Considerations

### Row Level Security (RLS)

All Supabase tables have RLS enabled:
- Service role has full access (used by Edge Functions)
- Authenticated users can only read their own payment intents
- Customers can only view their own Stripe data

### Firebase Security Rules

Marketplace collections are protected:
- Users can create orders but only for themselves
- Only order participants (buyer/seller) can read order details
- Product updates restricted to sellers and governors

### Payment Security

- All payment processing handled by Stripe (PCI compliant)
- Client secret validated on Stripe's servers
- Webhook signatures verified to prevent tampering
- Firebase private key stored securely in Supabase secrets (never exposed to frontend)

## Cost Optimization

### Supabase Edge Functions

- First 500K function invocations per month: **Free**
- After that: $2 per 1M invocations
- Database queries included in your Supabase plan

### Firebase

- Firestore reads/writes charged per operation
- Storage for product images charged per GB
- Hosting bandwidth included in your plan

### Stripe

- 2.9% + $0.30 per successful transaction
- No monthly fees
- Webhook events don't count against Stripe API limits

## Migration from Firebase Cloud Functions

Your old Firebase Cloud Functions in `functions/src/stripe/` are **no longer used**. The new Supabase Edge Functions have replaced them entirely.

**What changed:**
- ❌ **Old**: Firebase Cloud Functions (`createPaymentIntent`, `handleWebhook`, `generateDownloadLink`)
- ✅ **New**: Supabase Edge Functions (`marketplace-payment-intent`, `stripe-webhook`, `marketplace-generate-download`)

**Benefits:**
- Faster cold starts (Deno vs Node.js)
- Better integration with Supabase database
- Simpler deployment (no Firebase Functions build step)
- Direct access to Supabase RLS and policies
- Unified Stripe integration for subscriptions and marketplace

## Support and Maintenance

### Monitoring

Check these regularly:
1. **Supabase Dashboard** → Edge Functions → Logs
2. **Stripe Dashboard** → Developers → Webhooks (webhook delivery status)
3. **Firebase Console** → Firestore → marketplace_orders (order completion rate)

### Database Maintenance

```sql
-- Check payment intent tracking
SELECT status, COUNT(*)
FROM marketplace_payment_intents
GROUP BY status;

-- Find failed payments
SELECT * FROM marketplace_payment_intents
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Monitor Stripe customer growth
SELECT COUNT(*) FROM stripe_customers;
```

### Updating Edge Functions

When you modify Edge Function code:

```bash
# Deploy specific function
npx supabase functions deploy marketplace-payment-intent

# Or deploy all at once
npx supabase functions deploy
```

## Conclusion

Your marketplace is now fully integrated with Supabase Edge Functions for payment processing while maintaining all business data in Firebase Firestore. This architecture provides:

- ✅ Unified Stripe integration (subscriptions + marketplace)
- ✅ No Firebase Cloud Functions needed for marketplace
- ✅ Complete payment details stored in Firebase orders
- ✅ Secure webhook processing with Firebase updates
- ✅ Scalable Edge Function architecture
- ✅ Separation of concerns (payments vs application data)

All payment operations flow through Supabase, while your core application and user data remain in Firebase. This gives you the best of both platforms without conflicts or duplication.

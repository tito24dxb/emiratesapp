# Marketplace Deployment Checklist

## Quick Setup (15 minutes)

### ✅ Step 1: Get Firebase Service Account (2 min)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ Settings → Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Keep it safe - you'll need values from it

### ✅ Step 2: Configure Supabase Secrets (3 min)

Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Edge Functions → Secrets

Add these secrets:

```bash
STRIPE_SECRET_KEY=sk_test_... # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # You'll get this in Step 4
FIREBASE_PROJECT_ID=your-project-id # From service account JSON
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com # From JSON
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\n-----END PRIVATE KEY-----\n" # From JSON (keep \n)
```

**Important**: For `FIREBASE_PRIVATE_KEY`:
- Copy the entire `private_key` field from the JSON
- Keep the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` headers
- Keep all the `\n` characters (they're important!)

### ✅ Step 3: Deploy Supabase Edge Functions (5 min)

```bash
# Login to Supabase CLI
npx supabase login

# Link your project
npx supabase link --project-ref your-project-ref

# Deploy all marketplace Edge Functions
npx supabase functions deploy marketplace-payment-intent
npx supabase functions deploy marketplace-generate-download
npx supabase functions deploy stripe-webhook

# Verify deployment
npx supabase functions list
```

### ✅ Step 4: Configure Stripe Webhook (3 min)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click "+ Add endpoint"
3. Enter webhook URL:
   ```
   https://YOUR-PROJECT-REF.supabase.co/functions/v1/stripe-webhook
   ```
   Replace `YOUR-PROJECT-REF` with your actual Supabase project reference

4. Select these events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `checkout.session.completed`

5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Go back to Supabase → Edge Functions → Secrets
8. Update `STRIPE_WEBHOOK_SECRET` with this value

### ✅ Step 5: Update Frontend Environment (2 min)

Update your `.env` file:

```bash
# Supabase (should already be configured)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Add Stripe publishable key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Firebase (should already be configured)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... rest of Firebase config
```

### ✅ Step 6: Build and Deploy Frontend (3 min)

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or if you get errors, try:
firebase deploy --only hosting --debug
```

## Testing Your Marketplace

### Test 1: Create a Product (1 min)

1. Login as a user
2. Go to Marketplace → "Sell on Marketplace"
3. Create a test product:
   - Title: "Test Digital Product"
   - Price: $9.99
   - Type: Digital
   - Add at least one image
4. Click "Publish Product"

### Test 2: Make a Test Purchase (2 min)

1. Login as a different user (or incognito window)
2. Go to Marketplace
3. Click on your test product
4. Click "Buy Now"
5. Use Stripe test card:
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/25)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)
   ```
6. Complete the payment
7. You should see "Payment successful!" message

### Test 3: Verify Order (1 min)

1. Go to "My Orders"
2. You should see your order with status "Completed"
3. Payment details should be visible
4. For digital products, download button should appear

### Test 4: Check Logs (1 min)

```bash
# Check payment intent function logs
npx supabase functions logs marketplace-payment-intent --limit 10

# Check webhook function logs
npx supabase functions logs stripe-webhook --limit 10

# Look for successful payment processing
# You should see: "Successfully processed marketplace payment for order..."
```

## Verification Checklist

After deployment, verify:

- [ ] Marketplace page loads and shows products
- [ ] Can create new products
- [ ] Checkout page loads when clicking "Buy Now"
- [ ] Payment form accepts card details
- [ ] Test payment completes successfully
- [ ] Order appears in "My Orders" with "Completed" status
- [ ] Payment details are visible in Firebase order document
- [ ] Stripe Dashboard shows the test payment
- [ ] Webhook events show "succeeded" in Stripe Dashboard
- [ ] Supabase logs show successful webhook processing
- [ ] Digital products show download button after purchase

## Troubleshooting

### "Supabase configuration missing" Error

**Problem**: Frontend can't find Supabase URL or key

**Solution**:
1. Check `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Rebuild frontend: `npm run build`
3. Redeploy: `firebase deploy --only hosting`

### "Failed to create payment intent" Error

**Problem**: Supabase Edge Function is not accessible

**Solution**:
1. Verify Edge Functions are deployed: `npx supabase functions list`
2. Check Edge Function logs: `npx supabase functions logs marketplace-payment-intent`
3. Ensure Stripe secret key is set in Supabase secrets
4. Test Edge Function directly:
   ```bash
   curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/marketplace-payment-intent \
     -H "apikey: YOUR-ANON-KEY" \
     -H "Content-Type: application/json" \
     -d '{"firebase_buyer_uid":"test","firebase_seller_uid":"test","firebase_order_id":"test","product_id":"test","product_title":"Test","product_type":"digital","quantity":1,"amount":999,"currency":"usd","seller_email":"test@test.com"}'
   ```

### "Webhook signature verification failed" Error

**Problem**: Stripe webhook secret is incorrect or missing

**Solution**:
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Copy the "Signing secret" again
4. Update `STRIPE_WEBHOOK_SECRET` in Supabase secrets
5. Wait 1-2 minutes for secret to propagate
6. Make a test payment again

### Orders Not Updating After Payment

**Problem**: Webhook is not updating Firebase

**Solution**:
1. Check Stripe Dashboard → Webhooks → Your endpoint → Recent events
2. Look for failed webhook deliveries (should be 2xx success)
3. If failing, check Edge Function logs:
   ```bash
   npx supabase functions logs stripe-webhook --limit 20
   ```
4. Verify Firebase service account credentials in Supabase secrets:
   - `FIREBASE_PROJECT_ID` should match your Firebase project
   - `FIREBASE_CLIENT_EMAIL` should be the service account email
   - `FIREBASE_PRIVATE_KEY` should include `\n` characters and key headers

### CORS Errors

**Problem**: Browser blocking requests to Supabase Edge Functions

**Solution**:
1. Edge Functions already have CORS headers configured
2. If still seeing errors, check browser console for exact error
3. Verify you're using correct Supabase URL (should end with `.supabase.co`)
4. Ensure `apikey` header is included in requests

## Production Checklist

Before going live with real customers:

- [ ] Replace test Stripe keys with live keys (both frontend and Supabase)
- [ ] Update webhook URL in Stripe to use live mode webhook
- [ ] Test with real credit card in test mode first
- [ ] Set up monitoring alerts for failed payments
- [ ] Configure proper error logging
- [ ] Set up backup procedures for Firebase data
- [ ] Review and test refund process
- [ ] Set up customer support system
- [ ] Add terms of service and refund policy
- [ ] Configure email notifications for orders
- [ ] Test on multiple devices and browsers

## Support Resources

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Stripe Docs**: https://stripe.com/docs/payments
- **Firebase Docs**: https://firebase.google.com/docs/firestore
- **Project Documentation**: `MARKETPLACE_SUPABASE_INTEGRATION.md`

## Quick Commands Reference

```bash
# View Edge Function logs
npx supabase functions logs <function-name>

# Redeploy Edge Function
npx supabase functions deploy <function-name>

# View Supabase database
npx supabase db pull

# Deploy Firebase rules
firebase deploy --only firestore:rules

# Deploy Firebase hosting
firebase deploy --only hosting

# Build frontend
npm run build

# Check Edge Function status
npx supabase functions list
```

## Success Criteria

Your marketplace is ready when:

✅ You can create products
✅ Customers can browse products
✅ Checkout process works smoothly
✅ Payments process successfully
✅ Orders appear with complete payment details
✅ Digital products generate download links
✅ Webhooks process without errors
✅ All logs show successful operations

**Total Setup Time**: ~15-20 minutes
**First Test Purchase**: ~5 minutes after setup

You're all set! Your marketplace now processes payments through Supabase while storing everything in Firebase. 🎉

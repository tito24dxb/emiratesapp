# Quick Reference - Supabase Marketplace Integration

## 🚀 Quick Deploy (Copy & Paste)

### 1. Set Supabase Secrets
```bash
# In Supabase Dashboard → Settings → Edge Functions → Secrets
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. Deploy Edge Functions
```bash
npx supabase login
npx supabase link --project-ref your-ref
npx supabase functions deploy marketplace-payment-intent
npx supabase functions deploy marketplace-generate-download
npx supabase functions deploy stripe-webhook
```

### 3. Configure Stripe Webhook
```
URL: https://your-project.supabase.co/functions/v1/stripe-webhook
Events: payment_intent.succeeded, payment_intent.payment_failed, checkout.session.completed
```

### 4. Update .env
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

### 5. Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

## 📦 What You Have

### Supabase Edge Functions
- `marketplace-payment-intent` - Creates payment intents
- `marketplace-generate-download` - Generates download links
- `stripe-webhook` - Processes webhooks → updates Firebase

### Supabase Tables
- `marketplace_payment_intents` - Payment tracking
- `stripe_customers` - Customer mapping
- `stripe_subscriptions` - Subscription data
- `stripe_orders` - One-time payments

### Firebase Collections
- `marketplace_products` - Product catalog
- `marketplace_orders` - **Orders with full payment details**
- `marketplace_favorites` - User favorites
- `marketplace_reviews` - Reviews

## 🔄 Payment Flow

```
User → Firebase (pending order) → Supabase (payment intent) →
Stripe (payment) → Webhook → Supabase → Firebase (completed order)
```

## 🐛 Quick Troubleshooting

### Payment fails
```bash
# Check Edge Function logs
npx supabase functions logs marketplace-payment-intent

# Verify Stripe keys in Supabase secrets
```

### Webhook not updating Firebase
```bash
# Check webhook logs
npx supabase functions logs stripe-webhook

# Verify Firebase credentials in Supabase secrets
# Ensure FIREBASE_PRIVATE_KEY includes \n characters
```

### CORS errors
- Edge Functions already have CORS headers
- Check .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Rebuild: `npm run build`

## 🧪 Test Commands

### Test Card
```
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
ZIP: 12345
```

### View Logs
```bash
npx supabase functions logs marketplace-payment-intent --limit 10
npx supabase functions logs stripe-webhook --limit 10
```

### Check Database
```bash
# View payment intents
npx supabase db remote console
SELECT * FROM marketplace_payment_intents ORDER BY created_at DESC LIMIT 5;
```

## 📊 Monitoring

### Check Payment Success Rate
```sql
-- In Supabase SQL Editor
SELECT
  status,
  COUNT(*) as count
FROM marketplace_payment_intents
GROUP BY status;
```

### Recent Orders
```
Firebase Console → Firestore → marketplace_orders
```

### Webhook Delivery
```
Stripe Dashboard → Developers → Webhooks → Your endpoint
```

## 🔐 Security Checklist

- [x] Stripe keys secure in Supabase secrets
- [x] Firebase private key secure in Supabase secrets
- [x] RLS enabled on all Supabase tables
- [x] Firebase security rules deployed
- [x] Webhook signatures verified
- [x] HTTPS only (enforced by Supabase)

## 💰 Costs

### Supabase
- First 500K Edge Function invocations: **FREE**
- After: $2 per 1M invocations

### Stripe
- 2.9% + $0.30 per transaction
- No monthly fees

### Firebase
- Pay per operation
- Generous free tier

## 📚 Documentation

- **Full Guide**: `MARKETPLACE_SUPABASE_INTEGRATION.md`
- **Deployment**: `MARKETPLACE_DEPLOYMENT_CHECKLIST.md`
- **Status**: `IMPLEMENTATION_COMPLETE_SUPABASE_MARKETPLACE.md`

## ⚡ Quick Commands

```bash
# Redeploy Edge Function
npx supabase functions deploy marketplace-payment-intent

# View logs
npx supabase functions logs stripe-webhook

# List functions
npx supabase functions list

# Test function locally
npx supabase functions serve marketplace-payment-intent

# Pull database schema
npx supabase db pull

# Deploy Firebase rules
firebase deploy --only firestore:rules

# Deploy frontend
npm run build && firebase deploy --only hosting
```

## ✅ Success Indicators

Payment flow is working when:
1. Order created in Firebase with "pending" status
2. Payment intent created in Supabase
3. User completes payment on Stripe
4. Webhook fires to Supabase
5. Firebase order updated to "completed"
6. Payment details visible in Firebase order
7. Download link generated for digital products

## 🎯 Production Checklist

Before going live:
- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook URL to live mode
- [ ] Test with real card (in test mode)
- [ ] Set up error monitoring
- [ ] Configure email notifications
- [ ] Add refund policy
- [ ] Test on multiple devices
- [ ] Review security rules
- [ ] Set up backups

## 🆘 Emergency Rollback

If something goes wrong:
```bash
# Revert to previous Firebase deployment
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID

# Check Edge Function versions
npx supabase functions list

# View audit logs in Supabase Dashboard
```

## 📞 Support Resources

- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Firebase: https://firebase.google.com/docs

---

**Total Setup Time**: 15 minutes
**Difficulty**: Easy (Copy & Paste commands)
**Status**: ✅ Ready to Deploy

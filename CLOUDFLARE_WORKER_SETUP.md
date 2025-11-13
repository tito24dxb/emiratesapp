# Cloudflare Worker Setup Guide

This guide walks you through deploying the Cloudflare Worker for secure OpenAI API calls.

## Prerequisites

- Node.js installed (v16 or higher)
- A Cloudflare account (free tier works)
- OpenAI API key

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for you to authenticate with Cloudflare.

## Step 3: Navigate to Worker Directory

```bash
cd cloudflare-worker
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Configure Your Worker

Edit `wrangler.toml` and update the `ALLOWED_ORIGIN` variable with your Firebase Hosting URL:

```toml
[vars]
ALLOWED_ORIGIN = "https://your-firebase-app.web.app"
```

Replace `your-firebase-app` with your actual Firebase project name.

## Step 6: Set OpenAI API Key Secret

**IMPORTANT:** Never commit your API key to the repository. Use Wrangler secrets:

```bash
wrangler secret put OPENAI_API_KEY
```

When prompted, paste your OpenAI API key and press Enter.

## Step 7: Test Locally (Optional)

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`

Test with curl:

```bash
curl -X POST http://localhost:8787/api/openai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, world!"}
    ]
  }'
```

## Step 8: Deploy to Cloudflare

```bash
npm run deploy
```

After successful deployment, you'll see output like:

```
Published emirates-ai-worker (X.XX sec)
  https://emirates-ai-worker.your-account.workers.dev
```

Copy this URL - you'll need it for the frontend configuration.

## Step 9: Update Frontend Configuration

In your Firebase project root, update the `.env` file:

```env
VITE_CLOUDFLARE_WORKER_URL=https://emirates-ai-worker.your-account.workers.dev
```

Replace with your actual Worker URL from Step 8.

## Step 10: Rebuild and Deploy Firebase App

```bash
npm run build
firebase deploy
```

## Testing the Integration

1. Navigate to your Firebase app
2. Login as a governor user
3. Go to Governor Control Nexus
4. Use the AI Assistant panel
5. Send a message and verify you get a streaming response

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Verify `ALLOWED_ORIGIN` in `wrangler.toml` matches your Firebase Hosting URL exactly
2. Redeploy the worker: `wrangler deploy`

### 401 Unauthorized from OpenAI

Your API key may be invalid or expired:

1. Generate a new key at https://platform.openai.com/api-keys
2. Update the secret: `wrangler secret put OPENAI_API_KEY`
3. Redeploy: `wrangler deploy`

### Worker Not Responding

Check worker logs:

```bash
wrangler tail
```

This shows real-time logs from your worker.

### Rate Limiting

If you hit OpenAI rate limits, you can:

1. Upgrade your OpenAI account
2. Implement rate limiting in the worker
3. Add caching for common queries

## Monitoring

View your worker's analytics in the Cloudflare dashboard:

1. Go to https://dash.cloudflare.com
2. Select "Workers & Pages"
3. Click on your worker name
4. View requests, errors, and CPU time

## Security Best Practices

1. **Never expose API keys** - Always use Wrangler secrets
2. **Restrict CORS** - Set `ALLOWED_ORIGIN` to your specific domain
3. **Monitor usage** - Check Cloudflare analytics regularly
4. **Set OpenAI limits** - Configure usage limits in OpenAI dashboard
5. **Implement authentication** - Consider adding Firebase Auth token verification

## Cost Considerations

### Cloudflare Workers (Free Tier)
- 100,000 requests/day
- 10ms CPU time per request

### OpenAI API Costs
- gpt-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Monitor usage at https://platform.openai.com/usage

## Advanced Configuration

### Custom Domain

To use a custom domain for your worker:

1. Add a route in `wrangler.toml`:

```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

2. Deploy: `wrangler deploy`

### Environment-Specific Configurations

Create separate environments for dev/staging/production:

```toml
[env.production]
name = "emirates-ai-worker-prod"
vars = { ALLOWED_ORIGIN = "https://your-prod-domain.web.app" }

[env.staging]
name = "emirates-ai-worker-staging"
vars = { ALLOWED_ORIGIN = "https://your-staging-domain.web.app" }
```

Deploy to specific environment:

```bash
wrangler deploy --env production
```

## Support

For issues with:
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **OpenAI API**: https://platform.openai.com/docs/
- **Firebase**: https://firebase.google.com/support

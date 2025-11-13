# Emirates AI Worker

Cloudflare Worker for secure OpenAI API calls.

## Features

- ✅ Secure OpenAI API key handling (never exposed to frontend)
- ✅ Real-time streaming responses (SSE)
- ✅ CORS protection (configurable allowed origins)
- ✅ Error handling and logging
- ✅ Token usage tracking
- ✅ No mock data - production ready

## Architecture

```
Frontend (Firebase) → Cloudflare Worker → OpenAI API
```

The worker acts as a secure proxy, keeping your OpenAI API key server-side.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Set your OpenAI API key:
   ```bash
   wrangler secret put OPENAI_API_KEY
   ```

4. Update `wrangler.toml` with your Firebase domain:
   ```toml
   [vars]
   ALLOWED_ORIGIN = "https://your-firebase-app.web.app"
   ```

5. Deploy:
   ```bash
   npm run deploy
   ```

## API Endpoint

### POST `/api/openai`

Accepts a JSON body with chat messages and returns a streaming response.

**Request:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "context": {
    "role": "governor",
    "section": "control_nexus"
  }
}
```

**Response:**

Server-Sent Events (SSE) stream:

```
data: {"content":"Hello"}
data: {"content":" there"}
data: {"content":"!"}
data: {"done":true,"totalTokens":25}
```

## Local Development

```bash
npm run dev
```

Test with curl:

```bash
curl -X POST http://localhost:8787/api/openai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

## Configuration

### Environment Variables

Set in `wrangler.toml`:

- `ALLOWED_ORIGIN`: Your Firebase Hosting URL (CORS)

### Secrets

Set via Wrangler CLI:

- `OPENAI_API_KEY`: Your OpenAI API key

```bash
wrangler secret put OPENAI_API_KEY
```

## Deployment

```bash
# Deploy to production
npm run deploy

# View logs
wrangler tail

# View deployments
wrangler deployments list
```

## Security

1. **API Key Protection**: OpenAI key is stored as a Cloudflare secret, never in code
2. **CORS**: Only allows requests from your specified Firebase domain
3. **No Data Storage**: Worker doesn't store or log sensitive data
4. **Rate Limiting**: Inherits OpenAI's rate limits

## Monitoring

View analytics in Cloudflare Dashboard:
- Request count
- Error rates
- CPU time
- Response times

## Troubleshooting

### CORS Errors

Update `ALLOWED_ORIGIN` in `wrangler.toml` and redeploy.

### 401 from OpenAI

Invalid API key. Reset with:
```bash
wrangler secret put OPENAI_API_KEY
```

### Worker Not Responding

Check logs:
```bash
wrangler tail
```

## Costs

### Cloudflare Workers
- Free tier: 100,000 requests/day
- Paid: $5/month for 10M requests

### OpenAI API
- gpt-4o-mini: ~$0.15 per 1M input tokens
- See: https://openai.com/api/pricing/

## License

MIT

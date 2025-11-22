# CSP Issue - Complete Troubleshooting Guide

## The Problem
You're seeing CSP (Content Security Policy) errors blocking Supabase connections, even though the code has been fixed.

## Quick Fix (99% of cases)

### 🔥 **HARD REFRESH YOUR BROWSER**

**Windows/Linux:** `Ctrl + Shift + R`
**Mac:** `Cmd + Shift + R`

This forces the browser to reload the HTML file with the updated CSP.

---

## What Was Changed

### 1. **index.html** (Line 7) - Updated ✅
Changed from specific URLs to wildcards:

**Before:**
```html
connect-src ... https://kzeupdwwttqpisijffac.supabase.co ...
```

**After:**
```html
connect-src ... https://*.supabase.co wss://*.supabase.co ...
```

Now supports:
- ✅ All Supabase HTTPS API calls
- ✅ All Supabase WebSocket connections (real-time)
- ✅ Works with any Supabase instance

### 2. **firebase.json** - Updated ✅
Added cache control headers to prevent this issue in production:

```json
{
  "headers": [
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

This ensures `index.html` is never cached in production.

---

## Verification Steps

### Step 1: Check if Cache is the Issue

Open DevTools Console and run:
```javascript
document.querySelector('meta[http-equiv="Content-Security-Policy"]').content
```

**If it contains `kzeupdwwttqpisijffac`:** Browser is cached → Hard refresh
**If it contains `*.supabase.co`:** Cache cleared → Issue is elsewhere

### Step 2: Test Supabase Connection

Run in console:
```javascript
fetch('https://xrpdwdzwxivssxuvqcpt.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycGR3ZHp3eGl2c3N4dXZxY3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjM0NjIsImV4cCI6MjA3OTM5OTQ2Mn0.S9onI_yiWLfIvLOdg739swv9cORM2ZcQ_rMZ1WotheU'
  }
})
.then(r => console.log('✅ Supabase reachable:', r.ok))
.catch(e => console.error('❌ CSP blocking:', e));
```

**Result: "Supabase reachable: true"** → CSP is working!
**Result: "CSP blocking"** → Still cached or other issue

### Step 3: Check WebSocket

Run in console:
```javascript
const ws = new WebSocket('wss://xrpdwdzwxivssxuvqcpt.supabase.co/realtime/v1/websocket?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycGR3ZHp3eGl2c3N4dXZxY3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjM0NjIsImV4cCI6MjA3OTM5OTQ2Mn0.S9onI_yiWLfIvLOdg739swv9cORM2ZcQ_rMZ1WotheU&vsn=1.0.0');
ws.onopen = () => console.log('✅ WebSocket connected!');
ws.onerror = (e) => console.error('❌ WebSocket blocked:', e);
```

**Result: "WebSocket connected!"** → Real-time will work!
**Result: "WebSocket blocked"** → CSP still blocking

---

## If Hard Refresh Doesn't Work

### Method 1: Clear All Site Data
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear site data** button
4. Check all boxes
5. Click **Clear site data**
6. Close and reopen browser

### Method 2: Unregister Service Workers
Run in console:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => {
    console.log('Unregistering:', reg);
    reg.unregister();
  });
  location.reload();
});
```

### Method 3: Incognito Window
1. Open **new incognito/private window**
2. Navigate to your app
3. Check if errors persist

If it works in incognito, it's definitely a cache issue.

### Method 4: Different Browser
Test in a completely different browser (Chrome → Firefox, Safari → Chrome, etc.)

### Method 5: Clear Browser Cache Manually
1. Open browser settings
2. Find "Clear browsing data"
3. Select "Cached images and files"
4. Select "All time"
5. Clear data

---

## Common Mistakes

### ❌ Mistake 1: Only Refreshing (F5)
Regular refresh doesn't clear HTML cache.
**Solution:** Use hard refresh (Ctrl+Shift+R)

### ❌ Mistake 2: Dev Server Not Restarted
If you're in development mode, the dev server might need restart.
**Solution:** Stop dev server, run `npm run dev` again

### ❌ Mistake 3: Looking at Wrong Error
There might be multiple errors. Make sure the CSP error specifically mentions Supabase.
**Solution:** Filter console by "Content-Security-Policy"

### ❌ Mistake 4: Service Worker Caching
Service workers can cache aggressively.
**Solution:** Unregister service workers (see Method 2 above)

---

## Expected Results After Fix

### ✅ Console Should Show:
- No CSP violations for Supabase
- Successful API calls to `xrpdwdzwxivssxuvqcpt.supabase.co`
- WebSocket connection established
- Real-time subscriptions working

### ✅ Network Tab Should Show:
- GET requests to Supabase REST API (Status: 200)
- WebSocket connection (Status: 101 Switching Protocols)
- No blocked requests

### ✅ Application Should:
- Load notifications from Supabase
- Show notification count in bell icon
- Update notifications in real-time
- Allow changing notification preferences

---

## Still Not Working?

If after ALL the above steps you still have issues:

### Check Environment Variables
```bash
# In terminal
cat .env | grep SUPABASE
```

Should show:
```
VITE_SUPABASE_URL=https://xrpdwdzwxivssxuvqcpt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

If URL is different, update `.env` and rebuild.

### Check Supabase Client
In `src/lib/supabase.ts`, verify:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Check Network Firewall
Some corporate networks block WebSocket connections.
**Test:** Use mobile hotspot or different network

### Check Supabase Status
Visit: https://status.supabase.com/
Ensure Supabase services are operational.

---

## For Deployed Production

If this is a deployed app on Firebase Hosting:

1. **Rebuild:** `npm run build`
2. **Redeploy:** `firebase deploy`
3. **Wait 2-5 minutes** for CDN to update
4. **Hard refresh** browser after deployment

The updated `firebase.json` will prevent HTML caching in production.

---

## Summary

| Issue | Solution |
|-------|----------|
| Browser cache | Hard refresh (Ctrl+Shift+R) |
| Service worker | Unregister in DevTools |
| Dev server | Restart dev server |
| Production | Redeploy with firebase deploy |
| Still failing | Try incognito mode |

**Most common fix:** Hard refresh your browser!

---

## Build Status

✅ **Source code updated** - index.html has correct CSP
✅ **Build successful** - dist/index.html has correct CSP
✅ **Firebase config updated** - Cache headers added
✅ **Ready for deployment** - All changes committed

**Action Required:** Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

# Browser Cache Issue - CSP Not Updating

## Problem
You're seeing CSP errors for the old Supabase URL (`kzeupdwwttqpisijffac`) even though the source code has been updated to use wildcards (`*.supabase.co`).

## Root Cause
The browser has **cached the old index.html** with the old CSP header. Even after rebuilding, the browser continues to serve the cached version.

## Solution: Force Clear Browser Cache

### Method 1: Hard Refresh (Recommended)
1. **Windows/Linux:** Hold `Ctrl + Shift` and press `R`
2. **Mac:** Hold `Cmd + Shift` and press `R`
3. This forces the browser to reload everything from the server

### Method 2: Clear Cache Manually
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Method 3: Disable Cache in DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Keep DevTools open and refresh

### Method 4: Clear All Site Data
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear site data"
4. Refresh the page

### Method 5: Incognito/Private Window
1. Open a new incognito/private window
2. Navigate to your app
3. This bypasses all cache

## Verification

After clearing cache, check the console. You should see:
- ✅ No CSP errors
- ✅ Supabase connections working
- ✅ Real-time WebSocket connections established

If you still see errors, check:

```javascript
// In browser console, run:
document.querySelector('meta[http-equiv="Content-Security-Policy"]').content
```

This should show:
```
... connect-src 'self' ... https://*.supabase.co wss://*.supabase.co ...
```

NOT:
```
... https://kzeupdwwttqpisijffac.supabase.co ...
```

## What Was Fixed

**File:** `index.html` line 7

**Old CSP (cached):**
```html
connect-src ... https://kzeupdwwttqpisijffac.supabase.co https://*.functions.supabase.co ...
```

**New CSP (in source):**
```html
connect-src ... https://*.supabase.co wss://*.supabase.co ...
```

## Why This Happens

1. HTML files are often cached aggressively by browsers
2. Meta tags (including CSP) are part of the HTML
3. The browser doesn't know the CSP has changed until it re-fetches the HTML
4. Service workers can also cache the HTML

## Prevention for Future

Add cache-busting headers in production:

**firebase.json:**
```json
{
  "hosting": {
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
}
```

This ensures index.html is never cached.

## Still Having Issues?

If after clearing cache you still see errors:

1. **Check the error message carefully** - Is it actually the CSP blocking, or a different error?

2. **Verify the URL in error matches** - Make sure it's trying to connect to `xrpdwdzwxivssxuvqcpt.supabase.co`

3. **Check Network tab** - See if requests are being made and what the response is

4. **Try different browser** - Test in a different browser entirely

5. **Check service worker** - Run in console:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
   });
   ```
   Then refresh.

## Quick Test Command

Run this in browser console to test Supabase connection:

```javascript
fetch('https://xrpdwdzwxivssxuvqcpt.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycGR3ZHp3eGl2c3N4dXZxY3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjM0NjIsImV4cCI6MjA3OTM5OTQ2Mn0.S9onI_yiWLfIvLOdg739swv9cORM2ZcQ_rMZ1WotheU'
  }
}).then(r => console.log('Supabase reachable:', r.ok))
  .catch(e => console.error('CSP blocking:', e));
```

If this works but your app doesn't, the issue is elsewhere.

---

## Summary

✅ **Source code is correct** - index.html has proper CSP with wildcards
✅ **Build is correct** - dist/index.html has proper CSP
❌ **Browser is cached** - You need to hard refresh

**Action:** Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

# Security Improvements & Google OAuth Setup Guide

## Security Improvements Implemented

### 1. Notification Mark as Read Button
- ✅ Added prominent "Mark Read" button to each unread notification
- ✅ Button displays as green badge with clear text
- ✅ Clicking marks notification as read and clears counter

### 2. Password-Protected 2FA Deactivation
- ✅ Created `Disable2FAModal` component requiring password verification
- ✅ Two-step process: password verification → confirmation
- ✅ Firebase authentication validates password before allowing 2FA disable
- ✅ Security warnings displayed to user about reduced account security
- ✅ Integrated into `TwoFactorSetup` component

### 3. Data Security Considerations

#### Current localStorage Usage:
The app currently stores the following in localStorage:
- `currentUser`: Complete user object (NOT sensitive as it contains no passwords/tokens)
- This is used for faster app initialization and offline support

#### Console Logging:
Many files contain `console.log`, `console.error`, and `console.warn` statements. These are currently helpful for debugging but should be conditionally disabled in production.

#### Recommendations for Production:

**Option 1: Remove localStorage (Most Secure)**
- Remove all `localStorage.setItem('currentUser', ...)` calls from AppContext
- Rely solely on Firebase auth state and Firestore for user data
- Trade-off: Slightly slower initial load, no offline user data

**Option 2: Minimize localStorage Data**
- Store only non-sensitive user ID: `localStorage.setItem('lastUserId', uid)`
- Don't store full user object
- Trade-off: Moderate security improvement

**Option 3: Encrypt localStorage (Balanced)**
- Encrypt user data before storing in localStorage
- Use a session-based encryption key (not stored in localStorage)
- Trade-off: Complexity vs security

**Console Logging:**
- Wrap all console statements in environment checks:
  ```typescript
  if (import.meta.env.DEV) {
    console.log('Debug info');
  }
  ```
- Or use a logging service that automatically disables in production

---

## Google OAuth Setup Guide

Follow these steps to enable Google Sign-In for your Firebase project:

### Step 1: Firebase Console Configuration

1. **Go to Firebase Console**
   - Navigate to https://console.firebase.google.com
   - Select your project: `Emirates Academy`

2. **Enable Google Authentication**
   - Click on "Authentication" in the left sidebar
   - Go to the "Sign-in method" tab
   - Find "Google" in the list of providers
   - Click on "Google"
   - Toggle "Enable" to ON
   - **Important:** Copy the Web SDK configuration (you'll need this later)

3. **Configure OAuth Consent Screen**
   - You'll see a link to "Web SDK configuration"
   - Click it or go to Google Cloud Console directly

### Step 2: Google Cloud Console Configuration

1. **Access Google Cloud Console**
   - Go to https://console.cloud.google.com
   - Select the same project as your Firebase app

2. **Configure OAuth Consent Screen**
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Select "External" (for public access) or "Internal" (for organization only)
   - Click "Create"

3. **Fill Out App Information**
   - **App name:** The Crew Academy (or Emirates Academy)
   - **User support email:** Your support email
   - **App logo:** Upload your app logo (optional)
   - **App domain:** Your deployed app domain
   - **Authorized domains:** Add your domains:
     - `thecrewacademy.com` (if you have a custom domain)
     - `firebaseapp.com`
     - `web.app`
   - **Developer contact information:** Your email
   - Click "Save and Continue"

4. **Scopes** (Optional Step)
   - Click "Add or Remove Scopes"
   - Select basic scopes (email, profile) - these are usually pre-selected
   - Click "Save and Continue"

5. **Test Users** (If using External + Testing)
   - Add test user emails who can access the app during testing
   - Click "Save and Continue"

### Step 3: Create OAuth 2.0 Credentials

1. **Create Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"

2. **Configure OAuth Client**
   - **Application type:** Web application
   - **Name:** The Crew Academy Web Client

3. **Authorized JavaScript Origins**
   Add all URLs where your app will run:
   - `http://localhost:5173` (development)
   - `http://localhost:3000` (if using different port)
   - `https://your-project-id.web.app` (Firebase Hosting)
   - `https://your-project-id.firebaseapp.com` (Firebase Hosting)
   - `https://your-custom-domain.com` (if you have one)

4. **Authorized Redirect URIs**
   Add Firebase auth redirect URIs:
   - `https://your-project-id.firebaseapp.com/__/auth/handler`
   - `https://your-custom-domain.com/__/auth/handler` (if applicable)
   - Firebase will automatically handle these

5. **Create & Save**
   - Click "Create"
   - **Important:** Copy the Client ID and Client Secret (you may not need the secret for Firebase)

### Step 4: Update Firebase with OAuth Credentials

1. **Return to Firebase Console**
   - Go back to Firebase Console → Authentication → Sign-in method → Google

2. **Add OAuth Client Details**
   - Paste the **Client ID** from Google Cloud Console
   - (Client Secret is usually auto-filled by Firebase)
   - Click "Save"

### Step 5: Verify Configuration

1. **Check Your Firebase Config**
   - Ensure your `.env` file has correct Firebase configuration
   - The config should already be in your project

2. **Test Locally**
   ```bash
   npm run dev
   ```
   - Go to the login page
   - Click "Sign in with Google"
   - You should see Google's OAuth consent screen
   - Sign in with a Google account
   - You should be redirected back to the app and logged in

### Step 6: Publish OAuth Consent Screen (For Production)

1. **Return to Google Cloud Console**
   - Go to "APIs & Services" → "OAuth consent screen"

2. **Submit for Verification** (if External)
   - Click "Publish App"
   - For apps with < 100 users, you can stay in "Testing" mode
   - For public apps, you'll need to submit for verification
   - Verification can take several days

3. **Testing Mode**
   - In testing mode, only added test users can sign in
   - No verification needed, but limited to 100 test users
   - Perfect for development and private beta

### Common Issues & Solutions

#### Issue: "Error 403: access_denied"
**Solution:**
- Ensure the Google account is added as a test user (if in Testing mode)
- Check that all redirect URIs are correctly configured

#### Issue: "Error 400: redirect_uri_mismatch"
**Solution:**
- Add the exact redirect URI to Authorized Redirect URIs in Google Cloud Console
- Format: `https://your-project-id.firebaseapp.com/__/auth/handler`

#### Issue: "This app isn't verified"
**Solution:**
- This is normal during development
- Users can click "Advanced" → "Go to [App Name] (unsafe)"
- For production, submit app for verification

#### Issue: "Popup blocked by browser"
**Solution:**
- The app already handles this - user will see a message to allow popups
- Alternative: Enable redirect flow instead of popup flow in Firebase

### Environment Variables

Your `.env` file should already have these (verify they're correct):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Testing Checklist

- [ ] Google Sign-In button appears on login page
- [ ] Clicking button opens Google OAuth popup
- [ ] Can select Google account
- [ ] Successfully redirected back to app
- [ ] User is logged in and redirected to dashboard
- [ ] User document is created in Firestore (if new user)
- [ ] 2FA prompt appears if user has 2FA enabled
- [ ] Can sign out and sign in again
- [ ] Works on both localhost and deployed URL

### Firebase Hosting Deployment

If you need to deploy to test Google OAuth in production:

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be available at: `https://your-project-id.web.app`

---

## Additional Security Recommendations

### 1. Remove Sensitive Console Logs

Before deploying to production, consider creating a logger utility:

```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: any[]) => {
    if (isDev) console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
};
```

Then replace all `console.log` with `logger.log`, etc.

### 2. Implement Content Security Policy (CSP)

Add CSP headers to your hosting configuration to prevent XSS attacks.

### 3. Enable Firebase App Check

Protect your Firebase resources from abuse:
- Go to Firebase Console → App Check
- Register your web app
- Use reCAPTCHA v3 or reCAPTCHA Enterprise

### 4. Regular Security Audits

- Review Firestore security rules regularly
- Monitor authentication logs for suspicious activity
- Keep all dependencies updated
- Use `npm audit` to check for vulnerabilities

---

## Support

If you encounter issues:
1. Check Firebase Console → Authentication → Users to see if accounts are being created
2. Check browser console for detailed error messages
3. Verify all redirect URIs match exactly (including http vs https)
4. Ensure OAuth consent screen is properly configured
5. Check that the Google Cloud Project matches your Firebase project

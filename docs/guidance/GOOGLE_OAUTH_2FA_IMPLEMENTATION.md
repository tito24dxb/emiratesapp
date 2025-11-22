# Google OAuth & 2FA Implementation Guide

## Overview

This guide provides complete implementation for:
1. **Google OAuth** - Sign in with Google button
2. **2FA with Google Authenticator** - Time-based One-Time Password (TOTP)

---

## Part 1: Google OAuth Implementation

### Step 1: Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`emirates-academy`)
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Google** provider
5. Add authorized domains if needed

### Step 2: Install Dependencies

```bash
npm install @react-oauth/google firebase
```

### Step 3: Update Login Page

File: `src/pages/auth/LoginPage.tsx`

Add Google OAuth button:

```typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const handleGoogleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'User',
        role: 'student',
        subscription: 'free',
        plan: 'free',
        createdAt: new Date(),
        verified: user.emailVerified,
        photoURL: user.photoURL,
        provider: 'google'
      });
    }

    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    setError(error.message);
  }
};

// Add this button in your JSX:
<button
  onClick={handleGoogleSignIn}
  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Continue with Google
</button>
```

### Step 4: Update Register Page

File: `src/pages/auth/RegisterPage.tsx`

Add the same Google button with similar logic.

---

## Part 2: 2FA with Google Authenticator

### Step 1: Keep Existing Dependencies

The project already has `speakeasy` and `qrcode` installed.

### Step 2: Update 2FA Service

File: `src/services/twoFactorAuthService.ts`

The service already exists and is correctly implemented! It includes:
- `generateSecret()` - Creates TOTP secret
- `generateQRCode()` - Generates QR code
- `verifyToken()` - Verifies 6-digit code
- `enable2FA()` - Saves to Firebase
- `disable2FA()` - Removes from Firebase
- `check2FAStatus()` - Checks if enabled

### Step 3: 2FA Setup Component

File: `src/components/TwoFactorSetup.tsx`

Already exists and working! Features:
- Shows QR code
- Manual entry option
- Verification step
- Enable/disable toggle

### Step 4: Integrate 2FA into Login Flow

File: `src/pages/auth/LoginPage.tsx`

Add 2FA verification step:

```typescript
import { check2FAStatus, verifyToken } from '../../services/twoFactorAuthService';

const [requires2FA, setRequires2FA] = useState(false);
const [tempUserId, setTempUserId] = useState('');
const [twoFactorCode, setTwoFactorCode] = useState('');

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if 2FA is enabled
    const has2FA = await check2FAStatus(user.uid);

    if (has2FA) {
      // Don't complete login yet, show 2FA input
      setRequires2FA(true);
      setTempUserId(user.uid);
      await auth.signOut(); // Sign out temporarily
      setLoading(false);
      return;
    }

    // No 2FA, proceed to dashboard
    navigate('/dashboard');
  } catch (error: any) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

const handle2FAVerification = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const isValid = await verifyToken(tempUserId, twoFactorCode);

    if (!isValid) {
      setError('Invalid verification code');
      setLoading(false);
      return;
    }

    // Re-sign in after successful 2FA
    await signInWithEmailAndPassword(auth, email, password);
    navigate('/dashboard');
  } catch (error: any) {
    setError('2FA verification failed');
  } finally {
    setLoading(false);
  }
};

// In JSX, show 2FA input when requires2FA is true:
{requires2FA ? (
  <form onSubmit={handle2FAVerification}>
    <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
    <p className="text-gray-600 mb-4">
      Enter the 6-digit code from your authenticator app
    </p>
    <input
      type="text"
      value={twoFactorCode}
      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000000"
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
      maxLength={6}
    />
    <button
      type="submit"
      disabled={twoFactorCode.length !== 6 || loading}
      className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 mt-4"
    >
      {loading ? 'Verifying...' : 'Verify Code'}
    </button>
    <button
      type="button"
      onClick={() => {
        setRequires2FA(false);
        setTwoFactorCode('');
        setTempUserId('');
      }}
      className="w-full text-gray-600 py-3 font-semibold hover:text-gray-800 mt-2"
    >
      Back to Login
    </button>
  </form>
) : (
  // Regular login form
  <form onSubmit={handleLogin}>
    {/* Existing login form */}
  </form>
)}
```

### Step 5: Add 2FA Setup in Settings

File: `src/pages/SettingsPage.tsx`

Import and add the component:

```typescript
import TwoFactorSetup from '../components/TwoFactorSetup';

// In your settings page JSX:
<div className="glass-card rounded-xl p-6">
  <h2 className="text-xl font-bold mb-4">Security Settings</h2>
  <TwoFactorSetup />
</div>
```

---

## Testing Instructions

### Test Google OAuth:
1. Click "Continue with Google" button
2. Select Google account
3. Should create user in Firebase and redirect to dashboard
4. Check Firestore `users` collection for new user

### Test 2FA Setup:
1. Go to Settings page
2. Enable 2FA toggle
3. Scan QR code with Google Authenticator app (or Microsoft Authenticator, Authy, etc.)
4. Enter 6-digit code to verify
5. Should save to Firestore `users/{uid}/twoFactorAuth/settings`

### Test 2FA Login:
1. Log out
2. Sign in with email/password
3. Should show 2FA code input
4. Enter code from authenticator app
5. Should log in successfully

---

## Security Best Practices

### 1. Store Secrets Securely
```typescript
// In Firebase, store encrypted:
const secret = generateSecret();
await setDoc(doc(db, 'users', uid, 'twoFactorAuth', 'settings'), {
  secret: secret.base32, // Store base32 encoded
  enabled: true,
  createdAt: new Date(),
  backupCodes: generateBackupCodes() // Optional: generate backup codes
});
```

### 2. Recovery Codes
Generate backup codes when enabling 2FA:

```typescript
const generateBackupCodes = () => {
  return Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
};
```

### 3. Rate Limiting
Add rate limiting to prevent brute force:

```typescript
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Track attempts in Firestore
const attemptDoc = await getDoc(doc(db, 'loginAttempts', userId));
if (attemptDoc.exists()) {
  const data = attemptDoc.data();
  if (data.attempts >= MAX_ATTEMPTS) {
    const timeSince = Date.now() - data.lastAttempt;
    if (timeSince < LOCKOUT_TIME) {
      throw new Error('Too many attempts. Try again later.');
    }
  }
}
```

### 4. Audit Logging
Log all 2FA events:

```typescript
await auditLogService.log(
  userId,
  userEmail,
  '2FA enabled',
  'security',
  { method: '2fa_enable', timestamp: new Date() }
);
```

---

## Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// 2FA settings - only user can read/write their own
match /users/{userId}/twoFactorAuth/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Login attempts tracking
match /loginAttempts/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## Firebase Authentication Rules

In Firebase Console → Authentication → Settings:

1. **Email Enumeration Protection**: Enable to prevent email discovery
2. **Password Policy**: Set minimum 8 characters
3. **Multi-factor Authentication**: Configure backup options

---

## Troubleshooting

### Google OAuth Issues

**Problem**: "unauthorized_client" error
**Solution**: Add your domain to authorized domains in Firebase Console

**Problem**: User creation fails
**Solution**: Check Firestore security rules allow write access

### 2FA Issues

**Problem**: QR code doesn't scan
**Solution**:
- Check if secret is valid base32
- Ensure issuer name doesn't have special characters
- Try manual entry option

**Problem**: Codes don't match
**Solution**:
- Check system time is synced (TOTP is time-based)
- Verify secret is stored correctly
- Window of 30 seconds is standard

**Problem**: Lost authenticator app
**Solution**:
- Implement backup codes system
- Provide admin override for governors
- Allow email recovery option

---

## Additional Features

### 1. Remember Device
Store trusted devices:

```typescript
const trustDevice = async (userId: string, deviceInfo: any) => {
  await addDoc(collection(db, 'users', userId, 'trustedDevices'), {
    ...deviceInfo,
    createdAt: new Date(),
    lastUsed: new Date()
  });
};
```

### 2. SMS Backup
Add SMS as backup method (requires Twilio or similar):

```typescript
import twilio from 'twilio';

const sendSMSCode = async (phoneNumber: string, code: string) => {
  const client = twilio(accountSid, authToken);
  await client.messages.create({
    body: `Your verification code is: ${code}`,
    to: phoneNumber,
    from: twilioNumber
  });
};
```

### 3. Email Backup
Send code via email as fallback:

```typescript
const sendEmailCode = async (email: string, code: string) => {
  // Use Firebase Functions or SendGrid
  await fetch('/api/send-2fa-email', {
    method: 'POST',
    body: JSON.stringify({ email, code })
  });
};
```

---

## Complete Implementation Checklist

### Google OAuth:
- [ ] Enable Google provider in Firebase Console
- [ ] Add Google button to Login page
- [ ] Add Google button to Register page
- [ ] Create user document on first Google sign-in
- [ ] Test sign-in flow
- [ ] Test new user creation
- [ ] Handle errors gracefully

### 2FA:
- [ ] Verify `speakeasy` and `qrcode` are installed
- [ ] Service file exists (`twoFactorAuthService.ts`)
- [ ] Component exists (`TwoFactorSetup.tsx`)
- [ ] Add 2FA check to login flow
- [ ] Add 2FA verification step
- [ ] Add 2FA setup in Settings
- [ ] Generate backup codes
- [ ] Test enable/disable flow
- [ ] Test login with 2FA
- [ ] Add audit logging
- [ ] Update Firestore rules
- [ ] Test recovery scenarios

---

## Status

### ✅ Already Implemented:
- 2FA service with all functions
- TwoFactorSetup component
- QR code generation
- Token verification
- Enable/disable functionality

### ⚠️ Needs Implementation:
- Google OAuth button in Login/Register pages
- 2FA verification step in login flow
- 2FA setup in Settings page
- Backup codes system
- Rate limiting
- Recovery options

### 📋 Optional Enhancements:
- Remember device feature
- SMS backup
- Email backup
- Biometric authentication
- Hardware key support (WebAuthn)

---

## Support

The core infrastructure for both Google OAuth and 2FA is ready. Firebase is already configured. You just need to:

1. Add Google buttons to auth pages
2. Integrate 2FA check into login flow
3. Add TwoFactorSetup to Settings page
4. Test and deploy

All services, components, and backend logic are already in place!

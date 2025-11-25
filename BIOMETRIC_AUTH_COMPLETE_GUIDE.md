# Complete Biometric/WebAuthn Authentication System
## Firebase-Only Implementation for The Crew Academy

---

## 🎯 IMPLEMENTATION SUMMARY

This document provides a complete biometric authentication system using **Firebase exclusively** - no Supabase, no other backends. All authentication, storage, and cloud functions run on Firebase infrastructure.

---

## 📦 CLOUD FUNCTIONS CREATED

### Location: `/functions/src/`

#### 1. **WebAuthn Configuration** (`webauthn/config.ts`)
```typescript
export const webauthnConfig = {
  rpID: process.env.RP_ID || 'localhost',
  rpName: 'The Crew Academy',
  origin: process.env.ORIGIN || 'http://localhost:5173',
  timeout: 60000,
  challengeTTL: 5 * 60 * 1000, // 5 minutes
};
```

**Environment Variables Required:**
- `RP_ID` - Your domain (e.g., `crewacademy.com`)
- `ORIGIN` - Full URL (e.g., `https://crewacademy.com`)
- `ORIGINS` - JSON array for multiple origins

---

#### 2. **Registration Begin** (`webauthn/registerBegin.ts`)
**Endpoint:** `POST /webauthn/register_begin`

**What it does:**
- Verifies user is authenticated (Firebase ID token)
- Generates WebAuthn registration options
- Excludes already-registered devices
- Stores challenge in Firestore with 5-minute TTL

**Request:**
```typescript
Headers: {
  Authorization: "Bearer <firebase-id-token>"
}
```

**Response:**
```json
{
  "challenge": "...",
  "rp": { "name": "The Crew Academy", "id": "crewacademy.com" },
  "user": { "id": "...", "name": "user@email.com", "displayName": "User Name" },
  "pubKeyCredParams": [...],
  "timeout": 60000,
  "excludeCredentials": [...],
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "requireResidentKey": false,
    "userVerification": "preferred"
  }
}
```

---

#### 3. **Registration Complete** (`webauthn/registerComplete.ts`)
**Endpoint:** `POST /webauthn/register_complete`

**What it does:**
- Verifies attestation response from device
- Stores credential in `users/{uid}/devices/{deviceId}`
- Creates audit log
- Deletes challenge

**Request:**
```typescript
{
  response: RegistrationResponseJSON,
  deviceName?: string  // e.g., "iPhone 15 Pro"
}
Headers: {
  Authorization: "Bearer <firebase-id-token>"
}
```

**Response:**
```json
{
  "verified": true,
  "deviceId": "base64url-device-id",
  "message": "Device registered successfully"
}
```

---

#### 4. **Login Begin** (`webauthn/loginBegin.ts`)
**Endpoint:** `POST /webauthn/login_begin`

**What it does:**
- Accepts email or userId
- Fetches registered non-revoked devices
- Generates authentication options
- Stores challenge

**Request:**
```typescript
{
  email?: string,
  userId?: string
}
```

**Response:**
```json
{
  "challenge": "...",
  "rpId": "crewacademy.com",
  "allowCredentials": [
    { "id": "...", "type": "public-key", "transports": ["internal"] }
  ],
  "timeout": 60000,
  "userId": "firebase-uid"
}
```

---

#### 5. **Login Complete** (`webauthn/loginComplete.ts`)
**Endpoint:** `POST /webauthn/login_complete`

**What it does:**
- Verifies authentication response
- Updates device signCount and lastSeen
- Creates Firebase custom token
- Creates audit log

**Request:**
```typescript
{
  response: AuthenticationResponseJSON,
  userId: string
}
```

**Response:**
```json
{
  "verified": true,
  "customToken": "firebase-custom-token",
  "message": "Login successful"
}
```

**Client Usage:**
```typescript
const { customToken } = await loginComplete(response, userId);
await firebase.auth().signInWithCustomToken(customToken);
```

---

#### 6. **Device Revocation** (`devices/revokeDevice.ts`)
**Endpoint:** `POST /devices/revoke`

**What it does:**
- Marks device as revoked
- Creates audit log
- Prevents future logins with that device

**Request:**
```typescript
{
  deviceId: string
}
Headers: {
  Authorization: "Bearer <firebase-id-token>"
}
```

---

#### 7. **Backup Codes** (`backup/generateCodes.ts`)

**Generate Codes:**
**Endpoint:** `POST /backup/generate_codes`

- Generates 10 backup codes (format: `ABCD-1234`)
- Stores SHA-256 hashes in Firestore
- Returns plain codes ONCE (must be saved by user)

**Verify Code:**
**Endpoint:** `POST /backup/verify_code`

```typescript
{
  email: string,
  code: string  // e.g., "ABCD-1234"
}
```

Returns Firebase custom token if valid.

---

## 🗄️ FIRESTORE STRUCTURE

### Collection: `users/{uid}/devices/{deviceId}`
```javascript
{
  credentialId: "base64url-credential-id",
  publicKey: "base64-public-key",
  signCount: 0,
  deviceName: "iPhone 15 Pro",
  userAgent: "Mozilla/5.0...",
  createdAt: Timestamp,
  lastSeen: Timestamp,
  revoked: false,
  revokedAt?: Timestamp,
  revokedBy?: string,
  transports: ["internal", "usb"]
}
```

### Collection: `webauthn_challenges/{uid}`
```javascript
{
  challenge: "base64url-challenge",
  type: "register" | "login",
  createdAt: Timestamp,
  expiresAt: Timestamp  // createdAt + 5 minutes
}
```

### Collection: `users/{uid}/security/backup_codes`
```javascript
{
  codes: [
    "sha256-hash-1",
    "sha256-hash-2",
    // ... 10 total
  ],
  createdAt: Timestamp,
  used: ["sha256-hash-1"]  // codes already used
}
```

### Collection: `audit_logs/{logId}`
```javascript
{
  userId: "uid",
  action: "device_register" | "device_login" | "device_revoke" | "backup_code_login",
  deviceId?: "device-id",
  deviceName?: "Device Name",
  ip: "user-ip",
  userAgent: "browser-ua",
  timestamp: Timestamp,
  success: true,
  reason?: "error message"
}
```

---

## 🔐 FIRESTORE SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read their own devices
    match /users/{userId}/devices/{deviceId} {
      allow read, list: if request.auth != null && request.auth.uid == userId;
      allow write: if false;  // Only Cloud Functions can write
    }

    // Security data readable only by owner
    match /users/{userId}/security/{document=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;  // Only Cloud Functions can write
    }

    // WebAuthn challenges - Cloud Functions only
    match /webauthn_challenges/{userId} {
      allow read, write: if false;  // Cloud Functions only
    }

    // Audit logs - Governors and admins only
    match /audit_logs/{logId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['governor', 'admin'];
      allow write: if false;  // Cloud Functions only
    }
  }
}
```

---

## 🖥️ FRONTEND IMPLEMENTATION

### Required Package
```bash
npm install @simplewebauthn/browser
```

### Hook: `hooks/useBiometric.ts`
```typescript
import { useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { auth } from '../lib/firebase';

export function useBiometric() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerDevice = async (deviceName?: string) => {
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const idToken = await user.getIdToken();

      // 1. Get registration options
      const optionsRes = await fetch(
        'https://your-region-your-project.cloudfunctions.net/registerBegin',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!optionsRes.ok) {
        throw new Error('Failed to get registration options');
      }

      const options = await optionsRes.json();

      // 2. Trigger WebAuthn ceremony
      const attResp = await startRegistration(options);

      // 3. Complete registration
      const verifyRes = await fetch(
        'https://your-region-your-project.cloudfunctions.net/registerComplete',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            response: attResp,
            deviceName: deviceName || navigator.userAgent,
          }),
        }
      );

      if (!verifyRes.ok) {
        throw new Error('Failed to verify registration');
      }

      const result = await verifyRes.json();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithBiometric = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get authentication options
      const optionsRes = await fetch(
        'https://your-region-your-project.cloudfunctions.net/loginBegin',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (!optionsRes.ok) {
        throw new Error('Failed to get login options');
      }

      const options = await optionsRes.json();
      const userId = options.userId;

      // 2. Trigger WebAuthn ceremony
      const asseResp = await startAuthentication(options);

      // 3. Complete login
      const verifyRes = await fetch(
        'https://your-region-your-project.cloudfunctions.net/loginComplete',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            response: asseResp,
            userId,
          }),
        }
      );

      if (!verifyRes.ok) {
        throw new Error('Failed to verify login');
      }

      const result = await verifyRes.json();

      // 4. Sign in with custom token
      await auth.signInWithCustomToken(result.customToken);

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    registerDevice,
    loginWithBiometric,
    loading,
    error,
  };
}
```

---

### Component: `components/biometric/EnableBiometricModal.tsx`
```typescript
import { useState } from 'react';
import { X, Fingerprint, Smartphone, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBiometric } from '../../hooks/useBiometric';

interface EnableBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnableBiometricModal({ isOpen, onClose }: EnableBiometricModalProps) {
  const [step, setStep] = useState<'intro' | 'registering' | 'codes' | 'success'>('intro');
  const [deviceName, setDeviceName] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const { registerDevice, loading, error } = useBiometric();

  const handleRegister = async () => {
    setStep('registering');
    try {
      await registerDevice(deviceName || undefined);

      // Generate backup codes
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        const codesRes = await fetch(
          'https://your-region-your-project.cloudfunctions.net/generateBackupCodes',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          }
        );
        const codesData = await codesRes.json();
        setBackupCodes(codesData.codes);
        setStep('codes');
      }
    } catch (err) {
      console.error(err);
      setStep('intro');
    }
  };

  const handleContinue = () => {
    setStep('success');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 'intro' && 'Enable Biometric Login'}
                {step === 'registering' && 'Registering Device...'}
                {step === 'codes' && 'Save Backup Codes'}
                {step === 'success' && 'All Set!'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {step === 'intro' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <Fingerprint className="w-10 h-10 text-[#D71920]" />
                  </div>
                  <p className="text-gray-600">
                    Use Face ID, Touch ID, or Windows Hello to sign in securely without passwords.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device Name (optional)
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g., iPhone 15 Pro"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-[#D71920] hover:bg-[#B01419] text-white font-bold py-3 px-6 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Enable Biometric Login'}
                </button>
              </div>
            )}

            {step === 'registering' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-pulse">
                  <Smartphone className="w-16 h-16 text-[#D71920]" />
                </div>
                <p className="text-gray-600">Follow the prompt on your device...</p>
              </div>
            )}

            {step === 'codes' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 text-sm font-medium">
                    ⚠️ Save these codes securely. They can only be used once each and won't be shown again.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 px-4 py-3 rounded-lg font-mono text-sm text-center font-bold"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full bg-[#D71920] hover:bg-[#B01419] text-white font-bold py-3 px-6 rounded-xl transition"
                >
                  I've Saved My Codes
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">Biometric Login Enabled!</p>
                <p className="text-gray-600 text-center">
                  You can now sign in using your device's biometric authentication.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

---

### Page: `pages/Settings/TrustedDevices.tsx`
```typescript
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Smartphone, Trash2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Device {
  id: string;
  deviceName: string;
  createdAt: any;
  lastSeen: any;
  revoked: boolean;
}

export default function TrustedDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const devicesRef = collection(db, 'users', user.uid, 'devices');
      const snapshot = await getDocs(devicesRef);

      const devicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Device[];

      setDevices(devicesList);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    if (!confirm('Revoke this device? You won\'t be able to sign in with it anymore.')) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();

      const res = await fetch(
        'https://your-region-your-project.cloudfunctions.net/revokeDevice',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceId }),
        }
      );

      if (res.ok) {
        await loadDevices();
      }
    } catch (error) {
      console.error('Failed to revoke device:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Trusted Devices</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D71920] mx-auto"></div>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No trusted devices registered</p>
        </div>
      ) : (
        <div className="space-y-4">
          {devices.map((device) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white border-2 rounded-xl p-6 ${
                device.revoked ? 'border-gray-300 opacity-60' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{device.deviceName}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Added {device.createdAt?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <span>•</span>
                      <span>
                        Last used {device.lastSeen?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    {device.revoked && (
                      <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                        Revoked
                      </span>
                    )}
                  </div>
                </div>

                {!device.revoked && (
                  <button
                    onClick={() => handleRevoke(device.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Set Environment Variables
```bash
firebase functions:config:set \
  webauthn.rp_id="your-domain.com" \
  webauthn.origin="https://your-domain.com"
```

### 3. Update `functions/src/index.ts`
```typescript
// Add to existing index.ts
export { registerBegin } from './webauthn/registerBegin';
export { registerComplete } from './webauthn/registerComplete';
export { loginBegin } from './webauthn/loginBegin';
export { loginComplete } from './webauthn/loginComplete';
export { revokeDevice } from './devices/revokeDevice';
export { generateBackupCodes, verifyBackupCode } from './backup/generateCodes';
```

### 4. Deploy Functions
```bash
firebase deploy --only functions
```

### 5. Update Firestore Rules
Copy the security rules above and deploy:
```bash
firebase deploy --only firestore:rules
```

---

## ✅ TESTING CHECKLIST

### Device Registration
- [ ] User can trigger biometric registration
- [ ] Platform authenticator prompt appears
- [ ] Device is saved to Firestore with correct data
- [ ] Backup codes are generated and displayed
- [ ] Audit log is created

### Biometric Login
- [ ] User can select biometric login option
- [ ] Platform authenticator prompt appears
- [ ] Login succeeds with custom token
- [ ] SignCount is incremented
- [ ] Last seen timestamp updates
- [ ] Audit log is created

### Device Management
- [ ] All devices are listed in settings
- [ ] Device details (name, dates) display correctly
- [ ] Device revocation works
- [ ] Revoked devices can't be used for login
- [ ] Audit log created on revocation

### Backup Codes
- [ ] 10 codes are generated
- [ ] Codes are shown only once
- [ ] Codes can be used for login
- [ ] Used codes can't be reused
- [ ] Audit log created on code use

### Security
- [ ] Challenges expire after 5 minutes
- [ ] Non-authenticated users can't register devices
- [ ] Users can only see their own devices
- [ ] Cloud Functions validate all inputs
- [ ] Audit logs track all actions

---

## 📱 NATIVE MOBILE INTEGRATION (Optional)

For React Native or Capacitor apps, you can store a device refresh token securely:

### Example with React Native Keychain
```typescript
import * as Keychain from 'react-native-keychain';
import * as LocalAuthentication from 'expo-local-authentication';

async function storeBiometricToken(token: string) {
  await Keychain.setGenericPassword(
    'biometric_token',
    token,
    {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
    }
  );
}

async function loginWithBiometrics() {
  // 1. Check if biometrics are available
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    throw new Error('Biometrics not available');
  }

  // 2. Authenticate with biometrics
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Sign in to Crew Academy',
    cancelLabel: 'Cancel',
  });

  if (!result.success) {
    throw new Error('Authentication failed');
  }

  // 3. Retrieve stored token
  const credentials = await Keychain.getGenericPassword();
  if (!credentials) {
    throw new Error('No token found');
  }

  // 4. Exchange with server for Firebase token
  const response = await fetch(
    'https://your-region-your-project.cloudfunctions.net/exchangeDeviceToken',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceToken: credentials.password }),
    }
  );

  const { customToken } = await response.json();

  // 5. Sign in with Firebase
  await auth.signInWithCustomToken(customToken);
}
```

---

## 🔒 SECURITY BEST PRACTICES

1. **HTTPS Only**: WebAuthn requires HTTPS in production
2. **RP ID Matches Domain**: Set RP_ID to your actual domain
3. **Challenge TTL**: Challenges expire in 5 minutes
4. **SignCount Validation**: Detects cloned authenticators
5. **Audit Logging**: All actions are logged
6. **Device Revocation**: Instant and effective
7. **Backup Codes**: SHA-256 hashed, single-use
8. **Rate Limiting**: Add to Cloud Functions if needed

---

## 📊 MONITORING & LOGS

### View Audit Logs (Governor Dashboard)
```typescript
const auditLogs = await getDocs(
  query(
    collection(db, 'audit_logs'),
    orderBy('timestamp', 'desc'),
    limit(100)
  )
);
```

### Common Queries
```typescript
// Failed login attempts
where('action', '==', 'device_login_failed')

// Recent registrations
where('action', '==', 'device_register')
where('timestamp', '>', thirtyDaysAgo)

// Revoked devices
where('action', '==', 'device_revoke')
```

---

## 🎨 UI/UX RECOMMENDATIONS

1. **Onboarding**: Show modal after first login
2. **Settings**: Dedicated "Security" tab with device management
3. **Login Page**: Prominent "Sign in with Face ID/Touch ID" button
4. **Fallback**: Always show "Sign in with password" option
5. **Feedback**: Clear error messages for unsupported browsers
6. **Progressive**: Don't force biometric enrollment

---

## 🌐 BROWSER SUPPORT

| Browser | Platform | Support |
|---------|----------|---------|
| Chrome 67+ | Windows/macOS/Android | ✅ Full |
| Safari 14+ | macOS/iOS | ✅ Full |
| Edge 18+ | Windows | ✅ Full |
| Firefox 60+ | All | ✅ Full |

**Face ID**: iOS Safari 14+
**Touch ID**: macOS Safari 14+
**Windows Hello**: Chrome/Edge on Windows 10+
**Android Biometrics**: Chrome on Android 7+

---

## 📞 SUPPORT & TROUBLESHOOTING

### "Authenticator not supported"
- User's device doesn't have biometric hardware
- Show password login option

### "Challenge expired"
- User took > 5 minutes to complete
- Start over with new challenge

### "Device already registered"
- Device credential already exists
- Show in device list, allow revoke + re-register

### "Invalid signature"
- SignCount decreased (possible clone)
- Revoke device, alert user

---

## 🎯 NEXT STEPS

1. Deploy Cloud Functions
2. Update Firestore rules
3. Add UI components to frontend
4. Test on multiple devices/browsers
5. Enable in production with feature flag
6. Monitor audit logs for issues

---

**Created:** November 2025
**Framework:** Firebase + React + TypeScript
**Author:** Development Team
**License:** Proprietary

---

**END OF DOCUMENT**

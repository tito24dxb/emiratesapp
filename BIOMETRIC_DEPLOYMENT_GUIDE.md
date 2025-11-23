# Biometric Authentication Deployment Guide

## Issue
Biometric authentication (Face ID, Touch ID, Windows Hello) is showing CORS errors because the Firebase Cloud Functions are not deployed.

## Root Cause
The WebAuthn biometric functions exist in `/functions/src/webauthn/` but were not being exported from the main `index.ts`, so they were never deployed to Firebase Cloud Functions.

## What Was Fixed
1. ✅ Exported biometric functions in `/functions/src/index.ts`
2. ✅ Added functions configuration to `firebase.json`
3. ✅ Added deployment notice in Settings UI
4. ✅ Added temporary guard to prevent CORS errors

## Deployment Instructions

### Prerequisites
You need to deploy these functions from **your local machine** with proper Firebase credentials.

1. **Firebase CLI** installed: `npm install -g firebase-tools`
2. **Authenticated** with Firebase: `firebase login`
3. **IAM Permissions**: Service Account User role on the project

### Step 1: Install Function Dependencies
From your local project directory:

```bash
cd functions
npm install
```

This installs all required packages including:
- `@simplewebauthn/server` - WebAuthn authentication
- `firebase-functions` - Cloud Functions runtime
- `firebase-admin` - Firebase Admin SDK

### Step 2: Build the Functions
Build the TypeScript code:

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `lib/` directory.

### Step 3: Deploy to Firebase
From the project root:

```bash
firebase deploy --only functions
```

**If you get a permissions error:**
1. Go to: https://console.cloud.google.com/iam-admin/iam?project=emirates-app-d80c5
2. Ask a project Owner to assign you the **"Service Account User"** role

### Step 4: Verify Deployment
Check that functions are live:

```bash
firebase functions:list
```

You should see:
- `registerBegin`
- `registerComplete`
- `loginBegin`
- `loginComplete`
- `revokeDevice`
- `generateBackupCodes`

### Step 5: Enable in Application
Once deployed, remove the temporary guard:

1. Open `/src/hooks/useBiometric.ts`
2. Remove lines 82-83:
   ```typescript
   // DELETE THESE LINES:
   throw new Error('Biometric authentication requires Firebase Cloud Functions to be deployed. Please run: firebase deploy --only functions');
   ```
3. Rebuild the application: `npm run build`

### Step 6: Test Biometric Authentication
1. Navigate to **Settings → Account Security**
2. Expand **"Biometric Login"** section
3. Enter a device name (e.g., "Chrome on MacBook Pro")
4. Click **"Enable Biometric Login"**
5. Follow browser prompts for Face ID/Touch ID/Windows Hello
6. **Save the backup codes** that are generated

## Functions Overview

| Function | Purpose | Method |
|----------|---------|--------|
| `registerBegin` | Start biometric registration | POST |
| `registerComplete` | Complete registration & save credential | POST |
| `loginBegin` | Start biometric authentication | POST |
| `loginComplete` | Complete auth & issue custom token | POST |
| `revokeDevice` | Remove a registered device | POST |
| `generateBackupCodes` | Create recovery codes | POST |

## Security Features
- ✅ CORS headers properly configured
- ✅ Firebase Auth token verification
- ✅ WebAuthn cryptographic challenge-response
- ✅ Secure credential storage in Firestore
- ✅ Backup codes for account recovery
- ✅ Device management and revocation

## Troubleshooting

### "Missing permissions" Error
You need the "Service Account User" IAM role. Contact your Firebase project owner.

### "Module not found" Error
Run `cd functions && npm install` to install dependencies.

### CORS Errors After Deployment
1. Verify functions are deployed: `firebase functions:list`
2. Check function logs: `firebase functions:log`
3. Ensure functions are in the correct region (us-central1)

### Biometric Not Available
- Check browser support (Chrome 67+, Safari 13+, Edge 18+)
- HTTPS required (or localhost for development)
- Device must have biometric hardware

## Alternative: Disable Biometric Feature
If you don't want to deploy Firebase Functions, you can disable biometric authentication:

1. Remove the biometric section from `/src/pages/SettingsPage.tsx` (lines 515-650)
2. Remove the import: `import { useBiometric } from '../hooks/useBiometric';`
3. This will hide the feature from users

## Cost Considerations
Firebase Cloud Functions pricing:
- First 2 million invocations/month: **FREE**
- Biometric operations typically use 2-4 invocations per login/registration
- Expected cost for most apps: **$0/month** (within free tier)

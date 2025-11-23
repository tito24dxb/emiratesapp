# Biometric Authentication Deployment Guide

## Issue
Biometric authentication (Face ID, Touch ID, Windows Hello) is showing CORS errors because the Firebase Cloud Functions are not deployed.

## Root Cause
The WebAuthn biometric functions exist in `/functions/src/webauthn/` but were not being exported from the main `index.ts`, so they were never deployed to Firebase Cloud Functions.

## Solution

### Step 1: Deploy Firebase Functions
The functions have now been exported in `/functions/src/index.ts`. Deploy them to Firebase:

```bash
firebase deploy --only functions
```

This will deploy the following functions:
- `registerBegin` - Initiates biometric registration
- `registerComplete` - Completes biometric registration
- `loginBegin` - Initiates biometric login
- `loginComplete` - Completes biometric login
- `revokeDevice` - Revokes a biometric device
- `generateBackupCodes` - Generates backup codes

### Step 2: Verify Deployment
After deployment, verify the functions are live:

```bash
firebase functions:list
```

You should see all the WebAuthn functions listed.

### Step 3: Enable Biometric Features
Once the functions are deployed:

1. Remove the temporary error throw in `/src/hooks/useBiometric.ts` line 83:
   ```typescript
   // Remove this line:
   throw new Error('Biometric authentication requires Firebase Cloud Functions to be deployed. Please run: firebase deploy --only functions');
   ```

2. The biometric authentication will now work properly without CORS errors.

### Step 4: Test Biometric Authentication
1. Go to Settings → Account Security
2. Expand "Biometric Login" section
3. Enter a device name (e.g., "Chrome on MacBook")
4. Click "Enable Biometric Login"
5. Follow the browser prompts for Face ID/Touch ID/Windows Hello
6. Save the backup codes that are generated

## Dependencies
The biometric functions require the following packages (already in package.json):
- `@simplewebauthn/server` - WebAuthn server library
- `firebase-functions` - Firebase Cloud Functions SDK
- `firebase-admin` - Firebase Admin SDK

## Notes
- CORS headers are properly configured in all WebAuthn functions
- Functions use Firebase Authentication for user verification
- Backup codes are generated for account recovery
- All biometric data is stored securely in Firestore

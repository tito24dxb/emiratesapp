# Firestore Rules Deployment Guide

## Issue Fixed
The "Missing or insufficient permissions" error when loading system control has been resolved by updating the Firestore security rules to allow unauthenticated read access to the `systemControl` collection.

## What Changed
The `systemControl` collection now allows public read access since it contains system-wide feature flags and announcements that need to be loaded before user authentication.

**Previous Rule:**
```javascript
match /systemControl/{docId} {
  allow read: if isAuthenticated();
  allow write: if isGovernor() || hasPermission('manageSystem');
}
```

**Updated Rule:**
```javascript
match /systemControl/{docId} {
  allow read: if true;
  allow write: if isGovernor() || hasPermission('manageSystem');
}
```

## Manual Deployment Required

The Firebase CLI deployment failed due to authentication/API access requirements. Please deploy the updated rules manually:

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `emirates-app-d80c5`
3. Navigate to **Firestore Database** → **Rules**
4. Copy the entire contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

### Option 2: Firebase CLI (If Authenticated)
```bash
# Login to Firebase
firebase login

# Deploy only the Firestore rules
firebase deploy --only firestore:rules
```

## Files Modified
- `firestore.rules` - Updated systemControl read permissions
- `firebase.json` - Created for Firebase CLI configuration
- `.firebaserc` - Created with project ID

## Security Notes
- System control data is safe to expose publicly as it only contains feature flags and announcements
- Write access remains restricted to governors and users with `manageSystem` permission
- No user data or sensitive information is exposed by this change

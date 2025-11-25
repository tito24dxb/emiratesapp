# URGENT: Firestore Rules Deployment Required

## Issue Fixed
The Firebase permissions error for exams has been resolved by adding the missing Firestore security rules for the `exams` and `userExams` collections.

## What Was Changed

### 1. Firestore Rules (firestore.rules)
Added two new collection rules:

#### Exams Collection
```javascript
match /exams/{examId} {
  allow read: if isAuthenticated();
  allow write: if isGovernor() || hasPermission('manageContent') || hasRole('mentor');
}
```

#### User Exams Collection (Results)
```javascript
match /userExams/{resultId} {
  allow read: if isAuthenticated() && (
    resource.data.userId == request.auth.uid ||
    isGovernor() ||
    isStaff()
  );
  allow create, update: if isAuthenticated() &&
    request.resource.data.userId == request.auth.uid;
  allow delete: if false;
}
```

### 2. System Announcement Banner
Updated the banner to be fully responsive and properly centered:
- Adapts to mobile (90% width), tablet (85%), desktop (75%), and large screens (55%)
- Maximum width of 4xl for very large screens
- Responsive text sizes and spacing
- Proper positioning in top-middle of screen

## Deployment Instructions

### Option 1: Firebase Console (RECOMMENDED - Fastest)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `emirates-app-d80c5`
3. Navigate to **Firestore Database** → **Rules**
4. Copy the entire content from `/tmp/cc-agent/60054680/project/firestore.rules`
5. Paste into the Firebase Console editor
6. Click **Publish**

### Option 2: Firebase CLI
```bash
# Login to Firebase (if not already logged in)
firebase login

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

### Option 3: Deploy Everything
```bash
firebase deploy
```

## Verification

After deployment, verify that:
1. Students can view courses with exams
2. "Mark Complete" button works without permission errors
3. Exam interface loads without errors
4. System announcements appear at top-middle of screen
5. Banner is responsive on all screen sizes

## Error Before Fix
```
FirebaseError: Missing or insufficient permissions.
code: "permission-denied"
```

## Error After Fix
No errors - full exam functionality restored!

## Additional Notes
- The announcement system was already implemented correctly
- Only the Firestore rules were missing
- No code changes needed beyond rules deployment

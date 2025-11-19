# 🚨 URGENT: Deploy Firestore Rules

## The Problem
- Mark Complete button fails with: "Missing or insufficient permissions"
- Exam results can't be read: "Missing or insufficient permissions"

## The Fix
Firestore rules have been updated in `firestore.rules` to allow:
- Users to read/write their own course progress
- Users to read/write their own exam results
- Proper permission checks for new documents

## Deploy NOW

### Option 1: Firebase Console (Recommended)
1. Go to: https://console.firebase.google.com/project/emirates-app-d80c5/firestore/rules
2. Copy the entire content from `firestore.rules` file
3. Paste it into the console editor
4. Click "Publish"

### Option 2: Command Line
```bash
npx firebase deploy --only firestore:rules
```

## What Changed

### Course Progress Rules
```javascript
match /course_progress/{progressId} {
  allow read: if isAuthenticated() && (
    progressId.matches('^' + request.auth.uid + '_.*') ||
    (resource.exists() && resource.data.user_id == request.auth.uid) ||
    isGovernor() || isStaff()
  );
  allow list: if isAuthenticated();
  allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
  allow update: if isAuthenticated() && (resource.data.user_id == request.auth.uid || isGovernor());
}
```

### Exam Results Rules
```javascript
match /userExams/{resultId} {
  allow read: if isAuthenticated() && (
    resultId.matches('.*_' + request.auth.uid + '_.*') ||
    (resource.exists() && resource.data.userId == request.auth.uid) ||
    isGovernor() || isStaff()
  );
  allow list: if isAuthenticated();
  allow create, update: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
}
```

## After Deployment

Mark Complete button will work and you'll see:
```
✅ Course marked as complete!
```

## Module Locking Now Active

Courses are now locked until:
1. ✅ Previous course is completed (100%)
2. ✅ Previous course exam is passed (70%+)

This ensures proper progression through the learning path.

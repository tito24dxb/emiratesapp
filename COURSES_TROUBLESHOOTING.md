# Courses Not Displaying - Troubleshooting Guide

## Issue
4 courses exist in Firebase Firestore under the `courses` collection, but students cannot see them on the courses page.

## Root Cause
The Firestore security rules have been updated in the codebase, but **they haven't been deployed to Firebase yet**. The old rules are still active and checking for the wrong field name.

## Solution

### Step 1: Deploy Updated Firestore Rules (CRITICAL)

You MUST deploy the updated `firestore.rules` file to Firebase. Choose one method:

#### Method A: Firebase Console (Easiest)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `emirates-app-d80c5`
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the entire contents of the `firestore.rules` file from this project
5. Paste into the Firebase rules editor
6. Click **Publish**

#### Method B: Firebase CLI
```bash
# Login to Firebase (if not already)
firebase login

# Deploy the rules
firebase deploy --only firestore:rules
```

### Step 2: Verify Course Data Structure

Each course document in Firestore should have these fields:
- `plan`: 'free', 'pro', or 'vip' (lowercase)
- `title`: Course title
- `description`: Course description
- `category`: One of 'grooming', 'service', 'safety', 'interview', 'language'
- `instructor`: Instructor name
- `thumbnail`: Image URL
- `duration`: Duration string
- `level`: 'beginner', 'intermediate', or 'advanced'
- `lessons`: Number of lessons
- `coach_id`: ID of coach who created it
- `created_at`: ISO timestamp
- `updated_at`: ISO timestamp

**IMPORTANT**: The `plan` field must be lowercase ('free', 'pro', 'vip'), NOT capitalized ('Free', 'Pro', 'VIP').

### Step 3: Check Browser Console

After deploying the rules, refresh the courses page and check the browser console for:

```
Fetching courses from Firebase...
Courses query result: { size: 4, empty: false, docs: 4 }
Course data: { id: '...', title: '...', plan: 'free', ... }
Total courses fetched: 4
```

If you see a permissions error instead, the rules haven't been deployed correctly.

### Step 4: Verify User Plan

Make sure the student user has a `plan` field in their user document:
- Free plan users can only see `plan: 'free'` courses
- Pro plan users can see `plan: 'free'` and `plan: 'pro'` courses
- VIP plan users can see all courses

## Common Errors

### "Missing or insufficient permissions"
**Cause**: Firestore rules haven't been deployed
**Fix**: Deploy the rules using Method A or B above

### "No Courses Available"
**Cause 1**: Course documents have wrong field names (e.g., `layer` instead of `plan`)
**Fix**: Update course documents to use `plan` field with lowercase values

**Cause 2**: Student user doesn't have permission for course plan level
**Fix**: Check that courses are marked as `plan: 'free'` for testing

### Courses show but are locked
**Cause**: User's plan level is lower than course requirement
**Fix**: Either upgrade user's plan or set courses to `plan: 'free'`

## Testing

1. Deploy the Firestore rules
2. Log in as a student with `plan: 'free'`
3. Navigate to `/courses`
4. Open browser developer console (F12)
5. Look for the console logs showing courses being fetched
6. You should see at least the free courses appear

## Quick Fix for Testing

If you want to test immediately without deploying rules, you can temporarily change the rules in Firebase Console to:

```javascript
match /courses/{courseId} {
  allow read: if true;  // TEMPORARY - allows all reads
  allow write: if isGovernor();
}
```

Then change it back to the proper rules after confirming courses appear.

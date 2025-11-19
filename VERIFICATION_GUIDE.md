# Verification Guide: Exam Permissions & Announcement Banner

## Quick Reference

### What Was Fixed
1. ✅ Firebase permission errors for exams
2. ✅ System announcement banner responsiveness

### What Needs Deployment
⚠️ **Firestore security rules must be deployed**

---

## Testing Guide

### 1. Verify Exam Permissions (After Rules Deployment)

#### Test Scenario 1: View Course with Exam
1. Login as a student
2. Navigate to Courses page
3. Select a course that has an exam
4. Course should load without errors
5. **Expected:** No "Missing or insufficient permissions" error

#### Test Scenario 2: Mark Course Complete
1. Watch at least 80% of a video course
2. Click "Mark Complete" button
3. **Expected:** Button works without errors
4. **Expected:** Progress updates in database
5. **Expected:** No Firebase permission errors in console

#### Test Scenario 3: Take Exam
1. Complete video watching (80%+)
2. Click "Take Exam" button
3. **Expected:** Exam interface opens
4. Complete the exam
5. Submit answers
6. **Expected:** Results are saved
7. **Expected:** Points are awarded
8. **Expected:** No permission errors

#### Test Scenario 4: View Exam Results
1. After taking an exam, check your results
2. **Expected:** Your exam history is visible
3. **Expected:** Score and attempts are displayed
4. **Expected:** No permission errors when loading

### 2. Verify Announcement Banner

#### Test Scenario 1: Desktop View (> 1024px)
1. Access system as governor
2. Create an announcement via Governor Control Nexus
3. Navigate to any page
4. **Expected:** Banner appears at top-middle of screen
5. **Expected:** Banner is 65% width (or 55% on XL screens)
6. **Expected:** Text is readable (base font size)
7. **Expected:** Icon is 7x7

#### Test Scenario 2: Tablet View (768px - 1023px)
1. Resize browser to tablet width
2. **Expected:** Banner is 75% width
3. **Expected:** Text is sm font size
4. **Expected:** Icon is 6x6
5. **Expected:** Proper spacing maintained

#### Test Scenario 3: Mobile View (< 640px)
1. Resize browser to mobile width (e.g., 375px)
2. **Expected:** Banner is 90% width
3. **Expected:** Text is xs font size
4. **Expected:** Icon is 5x5
5. **Expected:** Banner doesn't overflow
6. **Expected:** Close button is easily tappable

#### Test Scenario 4: Banner Positioning
1. Check z-index layering
2. **Expected:** Banner (z-60) appears above navbar (z-40)
3. **Expected:** Banner is centered horizontally
4. **Expected:** Banner is positioned below navbar (top-20 md:top-24)
5. **Expected:** Banner doesn't block critical UI elements

#### Test Scenario 5: Banner Types
Test all announcement types:

**Info (Blue)**
```javascript
type: 'info'
message: 'System maintenance scheduled for tomorrow'
```
**Expected:** Blue gradient background, Info icon

**Success (Green)**
```javascript
type: 'success'
message: 'New features have been deployed!'
```
**Expected:** Green gradient background, CheckCircle icon

**Warning (Yellow/Orange)**
```javascript
type: 'warning'
message: 'Some features may be slow due to high traffic'
```
**Expected:** Yellow/orange gradient background, AlertTriangle icon

**Error (Red)**
```javascript
type: 'error'
message: 'Critical system error detected'
```
**Expected:** Red gradient background, AlertCircle icon

#### Test Scenario 6: Banner Interactions
1. Click dismiss button (X)
2. **Expected:** Banner disappears smoothly
3. **Expected:** Banner stays dismissed on page navigation
4. Refresh page
5. **Expected:** Banner reappears (dismiss state not persisted)

---

## Device Testing Matrix

### Recommended Test Devices

| Device Type | Width | Expected Banner Width | Font Size |
|-------------|-------|----------------------|-----------|
| Mobile S | 320px | 90% (288px) | xs |
| Mobile M | 375px | 90% (337px) | xs |
| Mobile L | 425px | 90% (382px) | xs |
| Tablet | 768px | 75% (576px) | sm |
| Laptop | 1024px | 65% (665px) | base |
| Desktop | 1440px | 55% (792px) | base |
| Desktop XL | 1920px | Max 896px | base |

---

## Browser Console Checks

### Before Firestore Rules Deployment
Expected errors:
```
FirebaseError: Missing or insufficient permissions.
code: "permission-denied"
```

### After Firestore Rules Deployment
No Firebase permission errors should appear for:
- Reading exams collection
- Writing to userExams collection
- Querying exams by courseId
- Updating user exam results

---

## Firebase Console Verification

### 1. Check Firestore Rules
1. Go to Firebase Console
2. Navigate to Firestore Database → Rules
3. Verify presence of:
   ```javascript
   match /exams/{examId} {
     allow read: if isAuthenticated();
     allow write: if isGovernor() || hasPermission('manageContent') || hasRole('mentor');
   }

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

### 2. Check System Control Document
1. Navigate to Firestore Database → Data
2. Find `systemControl` collection
3. Check `global` document
4. Verify `announcement` field structure:
   ```javascript
   {
     active: boolean,
     message: string,
     type: 'info' | 'success' | 'warning' | 'error',
     timestamp: string | null
   }
   ```

---

## Common Issues & Solutions

### Issue 1: Banner Not Appearing
**Symptoms:** Announcement banner doesn't show

**Checklist:**
- [ ] Is `announcement.active` set to `true` in Firestore?
- [ ] Is there a message in `announcement.message`?
- [ ] Check browser console for React errors
- [ ] Verify SystemAnnouncementBanner is imported in Layout

**Solution:**
1. Go to Governor Control Nexus
2. Update announcement with active: true
3. Verify in Firestore that changes saved

### Issue 2: Permission Errors Persist
**Symptoms:** Still seeing "Missing or insufficient permissions"

**Checklist:**
- [ ] Have Firestore rules been deployed?
- [ ] Check deployment logs for errors
- [ ] Verify rules in Firebase Console
- [ ] Try hard refresh (Ctrl+Shift+R)

**Solution:**
1. Deploy rules again
2. Clear browser cache
3. Re-login to refresh Firebase token

### Issue 3: Banner Overflow on Mobile
**Symptoms:** Banner too wide or text cut off

**Checklist:**
- [ ] Check viewport width
- [ ] Verify responsive classes applied
- [ ] Check for CSS conflicts

**Solution:**
1. Verify classes: `w-[90%] sm:w-[85%] md:w-[75%]...`
2. Check parent container doesn't have fixed width
3. Test with browser DevTools mobile emulation

### Issue 4: Banner Behind Other Elements
**Symptoms:** Banner hidden by other UI

**Checklist:**
- [ ] Check z-index values
- [ ] Verify positioning classes
- [ ] Look for parent container z-index

**Solution:**
1. Banner z-index should be 60
2. Navbar z-index should be 40
3. Ensure no parent has lower z-index

---

## Performance Checks

### 1. Animation Performance
- Banner should slide down smoothly (300ms)
- No janky animations
- Smooth dismiss animation

### 2. Load Time
- Banner appears immediately after page load
- No delay in showing active announcements
- Real-time updates work via Firestore listener

### 3. Responsive Behavior
- No layout shift when banner appears
- Smooth transitions between breakpoints
- Text wrapping works correctly

---

## Final Checklist

### Code Changes
- [x] Firestore rules updated with exam permissions
- [x] SystemAnnouncementBanner responsive classes updated
- [x] Build successful (no compilation errors)

### Deployment
- [ ] Firestore rules deployed to production
- [ ] Rules verified in Firebase Console

### Testing
- [ ] Exam viewing works without errors
- [ ] Mark complete button functions
- [ ] Exam submission saves results
- [ ] Banner appears on all screen sizes
- [ ] Banner is dismissible
- [ ] All announcement types display correctly

### Documentation
- [x] Deployment instructions created
- [x] Verification guide created
- [x] Testing scenarios documented

---

## Support & Troubleshooting

### Getting Help
1. Check browser console for specific errors
2. Review Firebase Console → Firestore → Rules for deployment status
3. Verify document structure in Firestore matches expected format
4. Test with different user roles (student, mentor, governor)

### Contact Information
For persistent issues:
1. Check FIXES_COMPLETE.md for additional details
2. Review FIRESTORE_DEPLOY_URGENT.md for deployment steps
3. Examine browser Network tab for failed requests

---

**Last Updated:** 2025-11-19
**Status:** Ready for Production (pending rules deployment)

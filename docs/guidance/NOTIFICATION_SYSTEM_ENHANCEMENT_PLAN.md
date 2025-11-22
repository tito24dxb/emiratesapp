# Notification System Enhancement Plan

## Executive Summary

This document provides a comprehensive plan to fix and enhance the notification system. The current system has multiple issues including lack of real-time updates, missing notification triggers, no role-based filtering, and no user preferences.

---

## Current System Analysis

### Existing Infrastructure

**Two Notification Systems:**
1. **Legacy System** (`notificationService.ts`) - Firebase notifications collection
2. **FCM System** (`fcmNotificationService.ts`) - FCM push notifications

**Key Issues Identified:**

1. **Duplicate Systems**: Two separate notification services causing inconsistency
2. **No Real-time Updates**: NotificationBell uses `fcmNotificationService` but NotificationsPage uses `notificationService`
3. **Missing Triggers**: Many notification events are not being triggered
4. **No Role-Based Filtering**: All users get all notifications
5. **No User Preferences**: Users cannot control what notifications they receive
6. **Missing Security Alerts**: No unknown login detection
7. **Incomplete Integration**: Bug reports, chat, and community features don't trigger notifications properly

---

## Solution Architecture

### 1. Unified Notification System

**Create a single, comprehensive notification service** that handles:
- Notification creation with role-based filtering
- User preference checking
- Real-time updates via Firestore listeners
- FCM push notifications (optional)

### 2. Notification Preferences Schema

```typescript
interface NotificationPreferences {
  userId: string;

  // Bug Reports
  bugReports: {
    statusChanges: boolean;
    newComments: boolean;
    assignedToMe: boolean;
  };

  // Chat & Messaging
  chat: {
    privateMessages: boolean;
    groupMessages: boolean;
    communityChat: boolean;
    mentions: boolean;
  };

  // Community Feed
  community: {
    newPosts: boolean;
    postComments: boolean;
    postReactions: boolean;
    myPostActivity: boolean;
  };

  // System Notifications
  system: {
    newFeatures: boolean;
    featureShutdowns: boolean;
    systemAnnouncements: boolean;
    maintenanceAlerts: boolean;
  };

  // Learning & Progress
  learning: {
    newCourses: boolean;
    newModules: boolean;
    courseUpdates: boolean;
    examReminders: boolean;
    achievements: boolean;
  };

  // Security
  security: {
    unknownLogins: boolean;
    accountRestrictions: boolean;
    passwordChanges: boolean;
  };

  // Meta settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  updatedAt: Timestamp;
}
```

### 3. Role-Based Notification Rules

```typescript
interface NotificationRoleFilter {
  notificationType: string;
  allowedRoles: Role[];
  excludedRoles?: Role[];
  requiresPreference: boolean;
  preferenceKey?: string;
}

const notificationRules: NotificationRoleFilter[] = [
  {
    notificationType: 'new_course',
    allowedRoles: ['student', 'crew', 'mentor', 'coach', 'governor'],
    requiresPreference: true,
    preferenceKey: 'learning.newCourses'
  },
  {
    notificationType: 'community_post',
    allowedRoles: ['student', 'crew', 'mentor', 'coach', 'trainer', 'communicator', 'governor'],
    requiresPreference: true,
    preferenceKey: 'community.newPosts'
  },
  {
    notificationType: 'feature_shutdown',
    allowedRoles: 'all',
    requiresPreference: true,
    preferenceKey: 'system.featureShutdowns'
  },
  {
    notificationType: 'unknown_login',
    allowedRoles: 'all',
    requiresPreference: true,
    preferenceKey: 'security.unknownLogins'
  }
];
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Priority: Critical)

#### Task 1.1: Create Unified Notification Service

**File**: `src/services/unifiedNotificationService.ts`

**Features**:
- Merge functionality from both existing services
- Implement role-based filtering
- Integrate preference checking
- Add batch notification creation
- Implement notification templates

**Functions to implement**:
```typescript
- createNotification(notification, checkPreferences = true)
- createNotificationForRoles(notification, roles)
- createNotificationForAllUsers(notification, excludeRoles = [])
- subscribeToUserNotifications(userId, callback)
- markAsRead(notificationId)
- markAllAsRead(userId)
- deleteNotification(notificationId)
```

#### Task 1.2: Create Notification Preferences Service

**File**: `src/services/notificationPreferencesService.ts`

**Features**:
- Initialize default preferences for new users
- Get user preferences
- Update preferences
- Check if notification should be sent based on preferences

**Functions**:
```typescript
- initializeUserPreferences(userId)
- getUserPreferences(userId)
- updatePreferences(userId, preferences)
- shouldSendNotification(userId, notificationType, preferenceKey)
```

#### Task 1.3: Create Notification Settings Page

**File**: `src/pages/NotificationSettingsPage.tsx`

**Features**:
- Toggle switches for each notification category
- Save preferences to Firestore
- Real-time preview
- Reset to defaults option

---

### Phase 2: Bug Report Notifications (Priority: High)

#### Task 2.1: Integrate Notifications into Bug Report Service

**File**: `src/services/bugReportService.ts`

**Modifications**:
1. **When bug status changes** (in `updateBugReportStatus`):
   ```typescript
   // Notify the reporter
   await notifyBugReportStatusChange(
     bugReport.reportedBy,
     reportId,
     bugReport.title,
     newStatus,
     changerName
   );
   ```

2. **When comment is added** (in `addResponseToBugReport`):
   ```typescript
   // Notify reporter and all previous commenters
   const usersToNotify = [bugReport.reportedBy, ...previousCommenters];
   await notifyBugReportComment(
     usersToNotify,
     reportId,
     bugReport.title,
     commenterName
   );
   ```

#### Task 2.2: Create Bug Report Notification Functions

**File**: `src/services/unifiedNotificationService.ts`

```typescript
async function notifyBugReportStatusChange(
  userId: string,
  bugReportId: string,
  bugTitle: string,
  newStatus: string,
  changedBy: string
) {
  await createNotification({
    userId,
    type: 'bug_report_status',
    title: 'Bug Report Status Updated',
    message: `${changedBy} changed "${bugTitle}" to ${newStatus}`,
    priority: 'medium',
    actionUrl: `/support?bugId=${bugReportId}`,
    metadata: { bugReportId, status: newStatus }
  }, true);
}
```

---

### Phase 3: Chat Notifications (Priority: High)

#### Task 3.1: Private Message Notifications

**File**: `src/services/enhancedChatService.ts` or conversation creation

**Integration Point**: When creating a new conversation
```typescript
// Notify all members except sender
const membersToNotify = conversation.members.filter(m => m !== senderId);
for (const memberId of membersToNotify) {
  await notifyNewConversation(memberId, senderName, conversationId);
}
```

#### Task 3.2: Group Chat Notifications

**Integration Point**: When sending a message in group chat
```typescript
// Notify group members except sender (if they have it enabled)
const membersToNotify = groupMembers.filter(m => m !== senderId);
await notifyGroupMessage(membersToNotify, groupName, senderName, messagePreview, conversationId);
```

#### Task 3.3: Community Chat Notifications (Optional)

**Integration Point**: Public room messages
```typescript
// Only notify users who have enabled community chat notifications
await notifyCommunityChat(
  senderName,
  messagePreview,
  preferenceKey: 'chat.communityChat'
);
```

---

### Phase 4: Community Post Notifications (Priority: High)

#### Task 4.1: New Post Notifications

**File**: `src/services/communityFeedService.ts`

**In `createPost` function**:
```typescript
// After post is created successfully
await notifyNewCommunityPost({
  postId: postDoc.id,
  authorName: userName,
  content: content.substring(0, 100),
  channel,
  excludeUserId: userId
});
```

#### Task 4.2: Comment Notifications

**In `addComment` function**:
```typescript
// Notify post author
if (post.userId !== commentAuthorId) {
  await notifyPostComment(
    post.userId,
    postId,
    commentAuthorName,
    commentContent
  );
}

// Notify other commenters
const otherCommenters = await getUniqueCommenters(postId, commentAuthorId);
await notifyPostCommentToFollowers(
  otherCommenters,
  postId,
  commentAuthorName
);
```

#### Task 4.3: Reaction Notifications

**In `addReaction` function**:
```typescript
// Notify post author about reactions (batched every 5 reactions)
if (post.reactionsCount % 5 === 0) {
  await notifyPostMilestone(
    post.userId,
    postId,
    post.reactionsCount,
    'reactions'
  );
}
```

---

### Phase 5: System Notifications (Priority: Medium)

#### Task 5.1: Feature Release Notifications

**Integration**: When admin creates new feature via Governor Control

```typescript
await notifyNewFeature({
  title: featureName,
  description: featureDescription,
  releaseDate: Timestamp.now()
});
```

#### Task 5.2: Feature Shutdown Notifications

**Already implemented** in `featureShutdownService.ts` - Just ensure it calls unified service

#### Task 5.3: New Module/Course Notifications

**File**: `src/services/courseService.ts` and `src/services/mainModuleService.ts`

**When course is created**:
```typescript
await notifyNewCourse({
  courseTitle,
  courseId,
  mentorName,
  category
});
```

**When module is created**:
```typescript
await notifyNewModule({
  moduleTitle,
  moduleId,
  parentCourse
});
```

---

### Phase 6: Security Notifications (Priority: Critical)

#### Task 6.1: Unknown Login Detection

**File**: `src/services/loginActivityService.ts`

**Enhancement to `recordLoginActivity`**:

```typescript
export async function recordLoginActivity(userId: string, success: boolean = true) {
  const deviceInfo = getDeviceInfo();
  const ipInfo = await getIPInfo();

  // Check if this is a known device
  const isKnownDevice = await checkIfKnownDevice(userId, deviceInfo, ipInfo);

  if (!isKnownDevice && success) {
    // Trigger unknown login alert
    await notifyUnknownLogin(
      userId,
      deviceInfo,
      ipInfo
    );
  }

  // Record activity as before...
}

async function checkIfKnownDevice(
  userId: string,
  deviceInfo: any,
  ipInfo: any
): Promise<boolean> {
  // Get last 10 logins
  const recentLogins = await getUserLoginHistory(userId, 10);

  // Check if device/location matches
  return recentLogins.some(login =>
    login.deviceType === deviceInfo.deviceType &&
    login.browser === deviceInfo.browser &&
    login.os === deviceInfo.os &&
    login.location?.country === ipInfo.location?.country
  );
}
```

#### Task 6.2: Account Restriction Notifications

**Integration**: When governor applies restrictions

```typescript
async function notifyAccountRestriction(
  userId: string,
  restrictionType: string,
  reason: string,
  duration?: string
) {
  await createNotification({
    userId,
    type: 'account_restriction',
    title: 'Account Notice',
    message: `Your account has been ${restrictionType}. ${reason}`,
    priority: 'urgent',
    actionUrl: '/support',
    metadata: { restrictionType, reason, duration }
  }, false); // Always send, ignore preferences
}
```

---

### Phase 7: Real-time Updates (Priority: High)

#### Task 7.1: Fix NotificationBell Component

**File**: `src/components/NotificationBell.tsx`

**Change from `fcmNotificationService` to unified service**:

```typescript
import { subscribeToUserNotifications } from '../services/unifiedNotificationService';

// Use the unified service for real-time updates
```

#### Task 7.2: Fix NotificationsPage

**File**: `src/pages/NotificationsPage.tsx`

**Ensure it uses the unified service**:

```typescript
import { subscribeToUserNotifications } from '../services/unifiedNotificationService';
```

#### Task 7.3: Add Notification Sound & Visual Feedback

**Optional enhancement**:
- Add sound effect when new notification arrives
- Show toast notification in bottom-right corner
- Animate notification bell icon

---

### Phase 8: User Preferences UI (Priority: Medium)

#### Task 8.1: Add Notification Settings to Settings Page

**File**: `src/pages/SettingsPage.tsx`

Add a new tab for "Notifications" that links to the notification settings page.

#### Task 8.2: Create Notification Settings Component

**File**: `src/components/NotificationSettings.tsx`

Features:
- Grouped toggle switches by category
- Save button with confirmation
- "Test notification" button
- Visual indication of what each setting controls

---

## Database Schema Changes

### New Collections

#### 1. `notificationPreferences` Collection

```typescript
{
  userId: string;
  bugReports: { ... };
  chat: { ... };
  community: { ... };
  system: { ... };
  learning: { ... };
  security: { ... };
  emailNotifications: boolean;
  pushNotifications: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. `knownDevices` Collection (for login security)

```typescript
{
  userId: string;
  deviceFingerprint: string;
  deviceType: string;
  browser: string;
  os: string;
  lastUsed: Timestamp;
  location: {
    country: string;
    city: string;
  };
  trusted: boolean;
  addedAt: Timestamp;
}
```

### Modified Collections

#### Update `notifications` collection structure

Migrate from two separate collections to one unified:
```typescript
{
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  body: string; // For FCM compatibility
  read: boolean;
  readAt?: Timestamp;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;

  // FCM specific
  fcmSent: boolean;
  fcmSentAt?: Timestamp;
}
```

---

## Firestore Rules Updates

### Add rules for new collections

```javascript
// Notification Preferences
match /notificationPreferences/{userId} {
  allow read, write: if isAuthenticated() && request.auth.uid == userId;
}

// Known Devices
match /knownDevices/{deviceId} {
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}

// Unified Notifications
match /notifications/{notificationId} {
  allow read, update: if isAuthenticated() && (
    resource.data.userId == request.auth.uid ||
    isStaff()
  );
  allow create: if isAuthenticated();
  allow delete: if isGovernor();
}
```

---

## Migration Strategy

### Step 1: Create new unified service (non-breaking)

Create `unifiedNotificationService.ts` without removing old services.

### Step 2: Migrate notification creation

Update all notification creation points to use the new service.

### Step 3: Initialize user preferences

Create a migration script or automatic initialization on first load.

### Step 4: Update UI components

Switch NotificationBell and NotificationsPage to use unified service.

### Step 5: Test thoroughly

- Test each notification type
- Test role-based filtering
- Test preference controls
- Test real-time updates

### Step 6: Deprecate old services

Once everything is working, mark old services as deprecated.

---

## Testing Checklist

### Bug Report Notifications
- [ ] Status change notifies reporter
- [ ] Comment notifies reporter and other commenters
- [ ] Doesn't notify if preference is disabled
- [ ] Governor sees all bug notifications

### Chat Notifications
- [ ] New private chat notifies recipient
- [ ] Group message notifies all members except sender
- [ ] Community chat only notifies opted-in users
- [ ] Mentions trigger notifications

### Community Notifications
- [ ] New post notifies relevant users based on role
- [ ] Comment on post notifies post author
- [ ] Comment notifies other commenters
- [ ] Reactions don't spam (batched or threshold)
- [ ] User can disable community notifications

### System Notifications
- [ ] Feature releases notify all users
- [ ] Feature shutdowns notify all users
- [ ] New courses notify students/crew/mentors
- [ ] New modules notify enrolled users
- [ ] System announcements notify all users

### Security Notifications
- [ ] Unknown device triggers notification
- [ ] Unknown location triggers notification
- [ ] Account restrictions always notify (bypass preferences)
- [ ] Password changes notify user

### Real-time Updates
- [ ] Notification bell updates immediately
- [ ] Unread count is accurate
- [ ] Notifications page updates in real-time
- [ ] Marking as read updates across all devices

### Role-based Filtering
- [ ] Students only see student-relevant notifications
- [ ] Mentors see mentor-specific notifications
- [ ] Governor sees all notifications
- [ ] Finance only sees finance-related notifications

### User Preferences
- [ ] Settings page loads current preferences
- [ ] Toggling preferences saves correctly
- [ ] Disabled notifications are not sent
- [ ] Critical notifications bypass preferences

---

## Performance Considerations

### Optimization Strategies

1. **Batch Notifications**: When notifying many users, use batch writes (max 500 per batch)

2. **Indexing**: Ensure Firestore indexes exist for:
   - `userId` + `createdAt`
   - `userId` + `read` + `createdAt`
   - `type` + `createdAt`

3. **Pagination**: Limit notification queries to 50 most recent

4. **Caching**: Cache user preferences in memory for the session

5. **Debouncing**: Debounce frequent notification triggers (e.g., reactions)

6. **Background Processing**: Use Cloud Functions for heavy notification distribution

---

## Security Considerations

1. **Validate all inputs**: Check notification content for XSS
2. **Rate limiting**: Prevent notification spam
3. **Authentication**: Verify user identity before sending notifications
4. **Privacy**: Don't expose sensitive data in notification messages
5. **Audit trail**: Log all notification creation for debugging

---

## Future Enhancements

1. **Email notifications**: Send email digests
2. **Push notifications**: Implement FCM properly
3. **Notification grouping**: Group similar notifications
4. **Notification scheduling**: Schedule notifications for later
5. **Rich notifications**: Add images, actions, buttons
6. **Notification analytics**: Track open rates, click rates
7. **Smart notifications**: AI-powered notification timing

---

## Timeline Estimate

- **Phase 1** (Core Infrastructure): 2-3 days
- **Phase 2** (Bug Reports): 1 day
- **Phase 3** (Chat): 1-2 days
- **Phase 4** (Community): 1-2 days
- **Phase 5** (System): 1 day
- **Phase 6** (Security): 2 days
- **Phase 7** (Real-time): 1 day
- **Phase 8** (UI): 2 days

**Total**: 11-14 days for full implementation and testing

---

## Success Metrics

- ✅ All 6 issues from requirements are resolved
- ✅ 100% of notification triggers are implemented
- ✅ Real-time updates working across all pages
- ✅ Role-based filtering working correctly
- ✅ User preferences respected
- ✅ Security notifications functional
- ✅ Zero notification spam complaints
- ✅ < 500ms notification delivery time

---

## Conclusion

This plan provides a comprehensive roadmap to fix and enhance the notification system. The phased approach ensures critical functionality is implemented first while maintaining system stability. The unified architecture eliminates duplication and provides a solid foundation for future enhancements.

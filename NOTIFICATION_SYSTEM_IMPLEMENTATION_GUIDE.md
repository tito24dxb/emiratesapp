# Notification System Implementation Guide

## Overview

This guide provides step-by-step instructions for completing the notification system enhancement. The foundation has been built with:

✅ Supabase database tables created
✅ Unified notification service implemented
✅ User preferences system ready
✅ Real-time updates configured
✅ Notification settings page created
✅ UI components updated

## What's Been Completed

### 1. Database Schema (Supabase)

Three new tables have been created:

- **`notifications`** - Stores all user notifications with real-time updates
- **`notification_preferences`** - User-specific notification settings
- **`known_devices`** - Tracks trusted devices for security alerts

All tables have Row Level Security (RLS) enabled with appropriate policies.

### 2. Unified Notification Service

**File:** `src/services/unifiedNotificationService.ts`

Features:
- Single source of truth for all notifications
- Role-based filtering built-in
- Preference checking before sending
- Real-time Supabase subscriptions
- Helper functions for all notification types

### 3. User Interface

- **NotificationBell** - Updated to use Supabase real-time
- **NotificationsPage** - Updated to use Supabase real-time
- **NotificationSettingsPage** - New comprehensive settings interface
- **Route Added:** `/settings/notifications`

---

## Next Steps: Integration Points

You now need to integrate the notification service at various trigger points throughout your application.

### Phase 1: Bug Report Notifications

**File to modify:** `src/services/bugReportService.ts`

#### When Status Changes

Find the function that updates bug report status and add:

```typescript
import { notifyBugReportStatusChange } from './unifiedNotificationService';

// After successful status update
await notifyBugReportStatusChange(
  bugReport.reportedBy,
  reportId,
  bugReport.title,
  newStatus,
  changerName // currentUser.name
);
```

#### When Comments Are Added

Find the function that adds comments to bug reports and add:

```typescript
import { notifyBugReportComment } from './unifiedNotificationService';

// Notify reporter
if (bugReport.reportedBy !== currentUser.uid) {
  await notifyBugReportComment(
    [bugReport.reportedBy],
    reportId,
    bugReport.title,
    currentUser.name
  );
}

// Optionally: notify other commenters
const otherCommenters = getUniqueCommenters(bugReport.responses);
if (otherCommenters.length > 0) {
  await notifyBugReportComment(
    otherCommenters.filter(id => id !== currentUser.uid),
    reportId,
    bugReport.title,
    currentUser.name
  );
}
```

---

### Phase 2: Chat Notifications

**Files to modify:**
- `src/services/enhancedChatService.ts`
- `src/services/communityChatService.ts`

#### Private Messages

Find where private conversations are created or messages sent:

```typescript
import { notifyNewPrivateChat } from './unifiedNotificationService';

// When creating new conversation or sending message
const recipientIds = conversation.members.filter(id => id !== senderId);

for (const recipientId of recipientIds) {
  await notifyNewPrivateChat(
    recipientId,
    senderName,
    conversationId
  );
}
```

#### Group Messages

Find where group messages are sent:

```typescript
import { notifyGroupMessage } from './unifiedNotificationService';

// Get all group members except sender
const recipientIds = groupMembers.filter(id => id !== senderId);

await notifyGroupMessage(
  recipientIds,
  groupName,
  senderName,
  message.substring(0, 100),
  conversationId
);
```

---

### Phase 3: Community Post Notifications

**File to modify:** `src/services/communityFeedService.ts`

#### New Posts

Find the `createPost` function and add:

```typescript
import { notifyNewCommunityPost } from './unifiedNotificationService';

// After post is created successfully
await notifyNewCommunityPost(
  postId,
  userName,
  content,
  channel,
  userId // exclude the poster
);
```

#### Comments on Posts

Find the `addComment` function and add:

```typescript
import { notifyPostComment } from './unifiedNotificationService';

// Notify post author
if (post.userId !== commentAuthorId) {
  await notifyPostComment(
    post.userId,
    postId,
    commentAuthorName,
    commentContent
  );
}

// Optional: Notify other commenters
const comments = await getPostComments(postId);
const uniqueCommenters = [...new Set(comments.map(c => c.userId))];
const otherCommenters = uniqueCommenters.filter(
  id => id !== commentAuthorId && id !== post.userId
);

for (const commenterId of otherCommenters) {
  await notifyPostComment(
    commenterId,
    postId,
    commentAuthorName,
    'new comment on a post you commented on'
  );
}
```

---

### Phase 4: System Notifications

#### New Courses

**File to modify:** `src/services/courseService.ts` or wherever courses are created

```typescript
import { notifyNewCourse } from './unifiedNotificationService';

// After course is created
await notifyNewCourse(
  courseTitle,
  courseId,
  mentorName
);
```

#### New Modules

**File to modify:** `src/services/mainModuleService.ts` or `src/services/moduleService.ts`

```typescript
import { notifyNewModule } from './unifiedNotificationService';

// After module is created
await notifyNewModule(
  moduleTitle,
  moduleId,
  parentCourseName
);
```

#### Feature Releases

**File to modify:** Governor control panels where features are managed

```typescript
import { notifyFeatureRelease } from './unifiedNotificationService';

await notifyFeatureRelease(
  featureName,
  description
);
```

#### Feature Shutdowns

**File to modify:** `src/services/featureShutdownService.ts`

```typescript
import { notifyFeatureShutdown } from './unifiedNotificationService';

// When shutting down a feature
await notifyFeatureShutdown(
  featureName,
  reason
);
```

---

### Phase 5: Security Notifications

#### Unknown Login Detection

**File to modify:** `src/services/loginActivityService.ts`

Add this to the `recordLoginActivity` function:

```typescript
import { supabase } from '../lib/supabase';
import { notifyUnknownLogin } from './unifiedNotificationService';

export async function recordLoginActivity(userId: string, success: boolean = true) {
  const deviceInfo = getDeviceInfo();
  const ipInfo = await getIPInfo();

  // Create device fingerprint
  const deviceFingerprint = `${deviceInfo.browser}-${deviceInfo.os}-${deviceInfo.deviceType}`;

  // Check if this is a known device
  const { data: knownDevice } = await supabase
    .from('known_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('device_fingerprint', deviceFingerprint)
    .maybeSingle();

  const isNewDevice = !knownDevice;

  // If new device and successful login, notify
  if (isNewDevice && success) {
    await notifyUnknownLogin(userId, deviceInfo, ipInfo.location || {});

    // Save the new device
    await supabase.from('known_devices').insert({
      user_id: userId,
      device_fingerprint: deviceFingerprint,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ip_address: ipInfo.ip,
      location: ipInfo.location || {},
      trusted: false,
    });
  } else if (knownDevice) {
    // Update last_used_at
    await supabase
      .from('known_devices')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', knownDevice.id);
  }

  // Continue with existing login activity recording...
}
```

#### Account Restrictions

**File to modify:** Governor control panels where user restrictions are applied

```typescript
import { notifyAccountRestriction } from './unifiedNotificationService';

// When restricting a user
await notifyAccountRestriction(
  userId,
  'banned' | 'suspended' | 'restricted',
  reason
);
```

---

## User Preference Initialization

Users need to have their preferences initialized. Add this to your registration or first-login flow:

**File to modify:** `src/pages/auth/RegisterPage.tsx` or wherever users are created

```typescript
import { initializeUserPreferences } from '../services/unifiedNotificationService';

// After user is successfully created in Firebase
await initializeUserPreferences(user.uid);
```

Or for existing users, you can initialize on first app load:

**File to modify:** `src/context/AppContext.tsx`

```typescript
import { initializeUserPreferences, getUserPreferences } from '../services/unifiedNotificationService';

// In useEffect after user loads
useEffect(() => {
  if (currentUser) {
    getUserPreferences(currentUser.uid).then(prefs => {
      if (!prefs) {
        initializeUserPreferences(currentUser.uid);
      }
    });
  }
}, [currentUser]);
```

---

## Adding Link to Settings

**File to modify:** `src/pages/SettingsPage.tsx`

Add a button or link to the notification settings:

```typescript
<button
  onClick={() => navigate('/settings/notifications')}
  className="w-full flex items-center justify-between p-4 glass-card rounded-xl hover:shadow-lg transition"
>
  <div className="flex items-center gap-3">
    <Bell className="w-5 h-5 text-[#D71920]" />
    <div className="text-left">
      <h3 className="font-bold text-gray-900">Notification Settings</h3>
      <p className="text-sm text-gray-600">Manage what notifications you receive</p>
    </div>
  </div>
  <ChevronRight className="w-5 h-5 text-gray-400" />
</button>
```

---

## Testing Checklist

### Real-time Updates
- [ ] Open app in two tabs
- [ ] Create a notification in one tab
- [ ] Verify it appears immediately in the other tab
- [ ] Verify unread count updates in real-time

### Bug Report Notifications
- [ ] Change bug report status → Reporter receives notification
- [ ] Add comment to bug report → Reporter receives notification
- [ ] Verify action URLs work correctly

### Chat Notifications
- [ ] Send private message → Recipient receives notification
- [ ] Send group message → All members receive notification
- [ ] Verify community chat respects preferences

### Community Notifications
- [ ] Create new post → Users receive notification based on role
- [ ] Comment on post → Post author receives notification
- [ ] Verify preferences control what's sent

### System Notifications
- [ ] Create new course → Students/crew/mentors notified
- [ ] Create new module → Appropriate users notified
- [ ] Shutdown feature → All users notified

### Security Notifications
- [ ] Login from new device → User receives alert
- [ ] Restrict user → User receives notification
- [ ] Verify security notifications bypass preferences

### User Preferences
- [ ] Can save preferences successfully
- [ ] Disabling notification type stops those notifications
- [ ] Security notifications always come through

### Role-Based Filtering
- [ ] Students only see relevant notifications
- [ ] Mentors see appropriate notifications
- [ ] Governor sees all system notifications

---

## Debugging Tips

### Check if Notification Was Created

```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);

console.log('Recent notifications:', data);
```

### Check User Preferences

```typescript
const { data } = await supabase
  .from('notification_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

console.log('User preferences:', data);
```

### Monitor Real-time Events

```typescript
const channel = supabase
  .channel('debug-notifications')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'notifications',
    },
    (payload) => {
      console.log('Notification event:', payload);
    }
  )
  .subscribe();
```

---

## Performance Optimization

### Batch Notifications

When notifying many users, the service already uses batch inserts. Verify this is working:

```typescript
// This batches automatically
await createNotificationsForMultipleUsers(
  userIds, // array of 100+ users
  notification,
  true
);
```

### Limit Real-time Queries

The service already limits to 50 most recent notifications. If you need pagination:

```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(0, 49); // First page
```

---

## Migration from Firebase Notifications

If you have existing notifications in Firebase that you want to migrate:

1. Export Firebase notifications
2. Transform to Supabase format
3. Bulk insert using Supabase client

**Migration script template:**

```typescript
import { db } from './lib/firebase';
import { supabase } from './lib/supabase';
import { collection, getDocs } from 'firebase/firestore';

async function migrateNotifications() {
  const firebaseNotifs = await getDocs(collection(db, 'notifications'));

  const supabaseNotifs = firebaseNotifs.docs.map(doc => {
    const data = doc.data();
    return {
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || 'medium',
      read: data.read,
      action_url: data.actionUrl,
      metadata: data.metadata || {},
      created_at: data.createdAt?.toDate()?.toISOString(),
    };
  });

  // Insert in batches of 100
  for (let i = 0; i < supabaseNotifs.length; i += 100) {
    const batch = supabaseNotifs.slice(i, i + 100);
    await supabase.from('notifications').insert(batch);
    console.log(`Migrated ${i + batch.length}/${supabaseNotifs.length}`);
  }
}
```

---

## Supabase Dashboard Configuration

### Enable Real-time for Tables

1. Go to Supabase Dashboard
2. Navigate to Database → Replication
3. Enable replication for:
   - `notifications`
   - `notification_preferences`
   - `known_devices`

### Monitor Performance

1. Go to Database → Query Performance
2. Check for slow queries on notifications table
3. Verify indexes are being used

---

## Future Enhancements

### Email Notifications

When `email_notifications` is true in preferences, send emails:

```typescript
// Use Supabase Edge Functions or external service
await supabase.functions.invoke('send-email-notification', {
  body: {
    userId,
    notification: notificationData,
  },
});
```

### Push Notifications

Implement browser push using Firebase Cloud Messaging (already set up):

```typescript
// In fcmNotificationService.ts
import { getMessaging, sendNotification } from 'firebase/messaging';

// Send push notification
await sendPushNotification(fcmToken, {
  title: notification.title,
  body: notification.message,
  icon: '/logo.png',
});
```

### Notification Grouping

Group similar notifications to reduce spam:

```typescript
// Instead of: "Alice commented" "Bob commented" "Charlie commented"
// Show: "Alice, Bob, and Charlie commented on your post"
```

---

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Verify RLS policies are correct
4. Test with a new user account

---

## Summary

The notification system foundation is complete. Follow the integration steps above to connect it to your application's trigger points. The system will automatically:

✅ Check user preferences before sending
✅ Filter by user role
✅ Update in real-time across all devices
✅ Maintain performance with proper indexing
✅ Enforce security with RLS policies

Start with Phase 1 (Bug Reports) and work through each phase systematically. Test thoroughly after each integration!

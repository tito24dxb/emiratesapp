# Crews Academy - Complete Role System Guide

## Overview

The Crews Academy platform has a sophisticated multi-role system where each role has specific dashboards, permissions, and features. The **Governor** role has complete access to ALL features across ALL roles.

---

## Role Hierarchy & Access

### 1. Governor (Super Admin) 👑

**Access Level:** EVERYTHING

**Exclusive Features:**
- **Control Nexus** - Main command center at `/governor/nexus`
- System-wide feature toggles
- User management (suspend, downgrade, force logout)
- Maintenance mode control
- System announcements
- Backup management
- AI Assistant for operations
- Audit log viewing
- Command console (terminal-style system control)

**Also Has Access To:**
- ALL Student features
- ALL Mentor features
- ALL Coach features
- ALL Finance features
- ALL Support Manager features

**Sidebar Navigation:**
```
✨ Control Nexus (Governor exclusive)
📊 Dashboard
📚 Courses (view/edit ALL)
🧠 AI Trainer (no restrictions)
✈️ Open Day Simulator (no restrictions)
💬 Chat (all conversations)
💼 Recruiters (full management)
📅 Open Days (full management)
🎓 Coach Dashboard
💬 Support Manager
👥 Students
👤 Profile
❓ Support
```

**What Governor Dashboard Shows:**
1. **Metrics Cards** - Real-time system statistics
   - Total users by role
   - Total courses
   - Active sessions
   - System health

2. **Finance Panel** - Full billing access 💰
   - Monthly Recurring Revenue (MRR)
   - Today's revenue
   - Active subscriptions
   - Failed payments
   - Customer list
   - Subscription management
   - Invoice history
   - Export capabilities

3. **Realtime Logs** - Live activity feed
   - User actions
   - System events
   - Payment events
   - Security events

4. **Command Console** - Terminal interface
   - Execute system commands
   - Feature toggles
   - User management
   - System control

5. **Backup Control** - Data management
   - Manual backup triggers
   - Backup history
   - Restore options

6. **AI Assistant** - Operations helper
   - Ask questions about system
   - Get insights and recommendations
   - Analyze trends

7. **User Manager** - User administration
   - View all users
   - Quick actions (suspend, downgrade, promote)
   - Filter by role, plan, status

8. **System Flags** - Feature toggles
   - Enable/disable features globally
   - See feature status
   - Quick toggles

9. **Course Manager** - Content control
   - View all courses
   - Lock/unlock courses
   - Moderate content

10. **Support Chat Manager** - Ticket system
    - View all support tickets
    - Assign tickets
    - Escalate issues
    - Respond to users

---

### 2. Finance Role 💰

**Primary Dashboard:** Finance Panel (embedded in Governor dashboard)

**Access:**
- View all financial data
- Stripe customer management
- Subscription tracking
- Invoice management
- Revenue analytics
- Payment failure monitoring
- Export financial reports

**Permissions:**
```json
{
  "manageUsers": false,
  "manageContent": false,
  "manageBilling": true,
  "manageSystem": false,
  "viewAudit": true
}
```

**What They See:**
- Finance Panel with full billing data
- Customer list with payment history
- Active and canceled subscriptions
- Invoice history
- MRR and revenue metrics
- Failed payment alerts

**Sidebar Navigation:**
```
📊 Dashboard
💰 Finance Panel
📈 Reports
👤 Profile
```

---

### 3. Mentor/Coach Role 🎓

**Primary Dashboard:** Coach Dashboard at `/coach-dashboard`

**Access:**
- View assigned students
- Monitor student progress
- Manage courses
- Create/edit content
- Access all training materials
- Support ticket management

**Permissions:**
```json
{
  "manageUsers": false,
  "manageContent": true,
  "manageBilling": false,
  "manageSystem": false,
  "viewAudit": false
}
```

**What They See:**
- Student roster
- Course creation tools
- Progress tracking
- Chat with students
- Support ticket interface
- Recruiter information
- Open days schedule

**Sidebar Navigation:**
```
📊 Dashboard
🎓 Coach Dashboard
👥 Students
💬 Chat
💼 Recruiters
📅 Open Days
💬 Support Manager
👤 Profile
```

---

### 4. Moderator Role 🛡️

**Primary Access:** Content moderation tools

**Access:**
- Moderate chat messages
- Review reported content
- Delete inappropriate content
- View user reports
- Support ticket management

**Permissions:**
```json
{
  "manageUsers": false,
  "manageContent": true,
  "manageBilling": false,
  "manageSystem": false,
  "viewAudit": false
}
```

**What They See:**
- Content moderation queue
- Reported messages
- User reports
- Support tickets
- Chat rooms

---

### 5. Student Role 🎓

**Primary Dashboard:** Student Dashboard at `/dashboard`

**Access (varies by subscription plan):**

**Free Plan:**
- Basic dashboard
- Limited courses
- No AI Trainer
- No Open Day Simulator
- No Chat
- No Recruiters access

**Pro Plan:**
- All Free features +
- Chat access
- Recruiters access
- Open Days access
- Extended courses

**VIP Plan:**
- All Pro features +
- AI Trainer (unlimited)
- Open Day Simulator (unlimited)
- All premium courses
- Priority support

**What They See:**
```
📊 Dashboard
📚 Courses (based on plan)
🧠 AI Trainer (Pro/VIP only) 🔒
✈️ Open Day Sim (VIP only) 🔒
💬 Chat (Pro/VIP only) 🔒
💼 Recruiters (Pro/VIP only) 🔒
📅 Open Days (Pro/VIP only) 🔒
👤 Profile
❓ Support
⭐ Upgrade Plan
```

---

## Dashboard Comparison

### Governor Dashboard (`/governor/nexus`)

**Dark Theme** - Professional command center aesthetic

**Sections:**
1. System Health Header
2. Metrics Cards (4 stat cards)
3. **Finance Panel** (full-width, tabbed interface)
4. Realtime Logs + Command Console (side-by-side)
5. Backup Control + AI Assistant (side-by-side)
6. User Manager + System Flags (side-by-side)
7. Course Manager (full-width)
8. Support Chat Manager (full-width)

**Color Scheme:**
- Background: Slate 900 gradient
- Cards: Slate 800 with borders
- Accents: Feature-specific colors
- Finance: Green theme
- Backup: Blue theme
- AI: Purple theme

---

### Coach Dashboard (`/coach-dashboard`)

**Light Theme** - Educational, approachable

**Sections:**
1. Welcome header
2. Quick stats (students, courses)
3. Recent students list
4. Upcoming sessions
5. Quick actions

---

### Student Dashboard (`/dashboard`)

**Light Theme** - Clean, modern

**Sections:**
1. Welcome banner with name
2. Progress overview
3. Recommended courses
4. Recent activity
5. Quick links to features

---

## How Roles Work Behind the Scenes

### 1. Firestore Security Rules

Each collection has role-based access:

```javascript
// Governor has universal access
function isGovernor() {
  return getUserData().role == 'governor';
}

// Check specific permissions
function hasPermission(permission) {
  return exists(/governorRoles/$(getUserData().role)) &&
         get(/governorRoles/$(getUserData().role)).permissions[permission] == true;
}

// Example: Finance can read Stripe data
match /stripe/{collection}/{docId} {
  allow read: if isGovernor() ||
                 hasPermission('manageBilling') ||
                 hasRole('finance');
}
```

### 2. Frontend Route Protection

Routes check user roles:

```typescript
{currentUser.role === 'governor' && (
  <Route path="/governor/nexus" element={<GovernorControlNexus />} />
)}

{currentUser.role !== 'student' && (
  <Route path="/support-manager" element={<SupportChatManagerPage />} />
)}
```

### 3. UI Element Visibility

Components check permissions:

```typescript
{currentUser.role === 'governor' || currentUser.role === 'finance' ? (
  <FinancePanel />
) : null}
```

### 4. Cloud Functions Validation

Server-side checks:

```typescript
async function hasPermission(uid: string, permission: string): Promise<boolean> {
  const userData = await getUserData(uid);
  if (userData.role === 'governor') return true;

  const roleDoc = await db.collection('governorRoles').doc(userData.role).get();
  return roleDoc.data()?.permissions?.[permission] === true;
}
```

---

## Creating Custom Roles

### Step 1: Create Role Document

In Firestore `governorRoles` collection:

```javascript
{
  "id": "custom_role",
  "name": "Custom Role Name",
  "permissions": {
    "manageUsers": false,
    "manageContent": false,
    "manageBilling": false,
    "manageSystem": false,
    "viewAudit": false
  }
}
```

### Step 2: Assign to User

Update user document:

```javascript
db.collection('users').doc(userId).update({
  role: 'custom_role'
});
```

### Step 3: Add to Sidebar (Optional)

Edit `Sidebar.tsx` to add role-specific links:

```typescript
const customRoleLinks = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  // Add custom links
];
```

---

## Governor Command Reference

Available in Command Console:

```bash
# Feature Management
enable aiTrainer
disable downloads
enable stripePayments

# Announcements
announce message="System updated!" type="success"

# Maintenance
maintenance on Scheduled maintenance
maintenance off

# User Management
downgradeUser uid="USER_ID" toPlan="free"
suspendUser uid="USER_ID"
forceLogout uid="USER_ID"

# Content Control
lockContent courseId="COURSE_ID"
unlockContent courseId="COURSE_ID"
```

---

## Testing Role Access

### Test as Governor

1. Log in as governor
2. Navigate to `/governor/nexus`
3. Verify you see:
   - Finance Panel with data
   - All system controls
   - Command console
   - User management
4. Navigate to other pages:
   - `/coach-dashboard` - Should work
   - `/ai-trainer` - Should work (no locks)
   - `/support-manager` - Should work
   - All features should be accessible

### Test as Finance

1. Log in as finance role
2. Should see Finance Panel
3. Should NOT see system controls
4. Should NOT access governor commands

### Test as Student

1. Log in as student
2. Features locked based on plan
3. No access to:
   - Governor nexus
   - Support manager
   - Coach dashboard
   - Finance panel

---

## Governor Dashboard Features Explained

### Finance Panel Features

**Overview Tab:**
- MRR calculation (monthly recurring revenue)
- Today's revenue (since midnight)
- Active subscription count
- Failed payment alerts

**Customers Tab:**
- List of all Stripe customers
- Email and signup date
- Click for details

**Subscriptions Tab:**
- Active subscriptions
- Plan and pricing
- Renewal dates
- Status badges

**Invoices Tab:**
- Payment history
- Status (paid/failed)
- Amounts and dates

**Export Button:**
- Download CSV of financial data
- Useful for accounting

### Real-time Updates

All Governor dashboard components use Firestore `onSnapshot` listeners:
- Metrics update live
- Logs stream in real-time
- Finance data syncs automatically
- No page refresh needed

---

## Troubleshooting

### Governor can't access certain features

1. Check user role in Firestore:
   ```javascript
   db.collection('users').doc(uid).get()
   // Should show: role: 'governor'
   ```

2. Check Firestore rules deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. Clear browser cache and reload

### Finance Panel shows "No data"

1. Verify Stripe webhook configured
2. Check Cloud Functions deployed:
   ```bash
   firebase functions:list
   ```

3. Test webhook:
   ```bash
   stripe trigger invoice.payment_succeeded
   ```

4. Check `stripe` collections in Firestore

### Commands not working

1. Verify Cloud Functions deployed
2. Check function logs:
   ```bash
   firebase functions:log --only runGovernorCommand
   ```

3. Verify user has `manageSystem` permission

---

## Best Practices

### For Governors

✅ Use Command Console for bulk operations
✅ Monitor audit logs regularly
✅ Set up announcements for system changes
✅ Review failed payments weekly
✅ Back up system before major changes

### For Finance Users

✅ Export reports monthly
✅ Monitor failed payments daily
✅ Review MRR trends weekly
✅ Keep Stripe webhooks active

### For Mentors/Coaches

✅ Check student progress regularly
✅ Respond to support tickets promptly
✅ Update course content frequently
✅ Use chat for direct communication

---

## Summary

The **Governor role is the ultimate administrator** with access to:
- ✅ Complete system control via Control Nexus
- ✅ Finance panel with full billing data
- ✅ All user management capabilities
- ✅ All content management features
- ✅ All student features (unrestricted)
- ✅ All mentor/coach features
- ✅ Command console for power operations
- ✅ AI assistant for decision making
- ✅ Backup and recovery tools
- ✅ Audit log viewing
- ✅ Real-time system monitoring

**If you're a Governor and don't see these features:**
1. Verify `role: 'governor'` in Firestore users collection
2. Clear cache and hard reload
3. Check Firebase deployment completed
4. Review browser console for errors

---

**Version:** 2.0.0 - Level 2 Enhanced System
**Last Updated:** November 2025

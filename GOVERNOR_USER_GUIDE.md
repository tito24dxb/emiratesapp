# Governor User Guide - Your Command Center

## 🎯 Welcome, Governor!

You have complete control over the Crews Academy platform. This guide shows you exactly what you can do and where to find everything.

---

## 🚀 Your Main Dashboard

**URL:** `/governor/nexus`

When you log in and visit your Control Nexus, you see **10 major sections** in this order:

### 1. Metrics Cards (Top Row)
Four key statistics:
- **Total Users** - Everyone registered
- **Active Students** - Currently learning
- **Total Courses** - All content
- **System Health** - Green = good

### 2. Finance Panel (Full Width) 💰
**NEW! Complete billing visibility**

**Four Tabs:**

**Overview Tab:**
- MRR (Monthly Recurring Revenue)
- Today's Revenue
- Active Subscriptions Count
- Failed Payments Alert

**Customers Tab:**
- List of all Stripe customers
- Email addresses
- Signup dates

**Subscriptions Tab:**
- Active subscription details
- Plan types and pricing
- Renewal dates
- Status indicators

**Invoices Tab:**
- All payment history
- Paid/failed status
- Amounts and dates

**Export Button:**
- Download financial reports as CSV

### 3. Realtime Logs (Left Side)
- Live activity feed
- What users are doing right now
- Payment events
- System events
- Auto-scrolls with new activity

### 4. Command Console (Right Side)
Terminal-style interface where you type commands:
```
enable aiTrainer
disable downloads
announce message="System updated!"
maintenance on
```

### 5. Backup Control (Left Side)
- Trigger manual backups
- View backup history
- Restore data

### 6. AI Assistant (Right Side)
- Ask questions about your system
- Get recommendations
- Analyze trends
- Powered by DeepSeek AI

### 7. User Manager (Left Side)
- See all users
- Filter by role, plan, status
- Quick actions:
  - Suspend user
  - Downgrade plan
  - Promote role
  - Force logout

### 8. System Flags (Right Side)
- Toggle features on/off
- See current status
- Quick switches for:
  - AI Trainer
  - Open Day
  - Chat
  - Courses
  - Downloads
  - Stripe Payments

### 9. Course Manager (Full Width)
- View all courses
- Lock/unlock courses
- Edit content
- Delete courses
- See enrollment numbers

### 10. Support Chat Manager (Full Width)
- All support tickets
- Assign to staff
- Respond to users
- Escalate complex issues
- Filter by status, department

---

## 🎛️ Complete Navigation

### Your Sidebar Shows:

```
✨ Control Nexus (Your main hub)
📊 Dashboard (Overview)
📚 Courses (All content - no locks!)
🧠 AI Trainer (Full access - badge: ALL)
✈️ Open Day Sim (Full access - badge: ALL)
💬 Chat (All conversations)
💼 Recruiters (Full management)
📅 Open Days (Full management)
🎓 Coach Dashboard (Mentor view)
💬 Support Manager (Ticket system)
👥 Students (User roster)
👤 Profile (Your account)
❓ Support (Help center)
```

**You can access EVERY page - nothing is locked!**

---

## 💰 Understanding the Finance Panel

### What Each Number Means

**MRR (Monthly Recurring Revenue)**
- Total monthly income from subscriptions
- Annual plans divided by 12
- Updates automatically as subscriptions change

**Today's Revenue**
- Money received since midnight (local time)
- Only successful payments counted
- Excludes refunds

**Active Subscriptions**
- Number of currently paying customers
- Excludes canceled or expired
- Live count

**Failed Payments**
- Payments that didn't go through
- **Action Required:** Follow up with customers
- Could indicate card expired or insufficient funds

### Using the Tabs

**Customers Tab:**
- Click any customer to see details (coming soon)
- Search by email
- See signup date

**Subscriptions Tab:**
- See what plan each customer has
- Check renewal dates
- Identify expiring soon

**Invoices Tab:**
- Payment history
- Failed payments highlighted in red
- Successful payments in green

**Export Button:**
- Click to download CSV
- Use for accounting software
- Monthly reports

---

## 🎮 Command Console Guide

### How to Use

1. Click in the console input box
2. Type a command (see list below)
3. Press Enter
4. See result instantly

### Available Commands

**Feature Management:**
```bash
enable aiTrainer       # Turn on AI Trainer
disable downloads      # Turn off downloads
enable stripePayments  # Enable Stripe
```

**System Announcements:**
```bash
announce message="Welcome to new features!" type="success"
announce message="Maintenance tonight" type="warning"
```

**Maintenance Mode:**
```bash
maintenance on System maintenance in progress
maintenance off
```

**User Management:**
```bash
downgradeUser uid="USER_ID" toPlan="free"
suspendUser uid="USER_ID"
forceLogout uid="USER_ID"
```

**Content Control:**
```bash
lockContent courseId="COURSE_ID"
unlockContent courseId="COURSE_ID"
```

### Tips

- Commands are case-sensitive
- Use quotes for messages with spaces
- Get USER_ID from User Manager
- Get COURSE_ID from Course Manager

---

## 👥 Managing Users

### In User Manager Section

**Actions You Can Take:**

1. **View All Users**
   - See every registered account
   - Their role, plan, status
   - Last login time

2. **Filter Users**
   - By role (student, mentor, etc.)
   - By plan (free, pro, vip)
   - By status (active, suspended)

3. **Quick Actions**
   - **Suspend:** Block user access immediately
   - **Downgrade:** Change to lower plan
   - **Promote:** Upgrade role (student → mentor)
   - **Force Logout:** Log them out now

4. **Search**
   - Find by name
   - Find by email
   - Find by ID

---

## 📚 Managing Courses

### What You Can Do

1. **View All Courses**
   - No restrictions - see everything
   - All layers (Free, Pro, VIP)

2. **Create New Course**
   - Upload PDF
   - Set title and description
   - Choose visibility (Free/Pro/VIP)

3. **Edit Existing**
   - Change any course details
   - Update materials
   - Modify access level

4. **Lock/Unlock**
   - Lock = temporarily disable
   - Unlock = re-enable
   - Users see "Coming Soon" if locked

5. **Delete Course**
   - Permanent removal
   - Confirm before deleting

---

## 💬 Support Ticket System

### How It Works

**When Student Creates Ticket:**
1. Student chooses department
2. Student chooses topic
3. Student writes message
4. Ticket appears in your Support Manager

**Your Actions:**

1. **View Ticket**
   - Click to open chat
   - See full conversation
   - See ticket details

2. **Assign to Staff**
   - Click "Assign to Me"
   - Or assign to other staff member
   - They get notified

3. **Respond**
   - Type in chat
   - Student sees reply instantly
   - Real-time conversation

4. **Escalate** (if complex)
   - Click "Escalate to Governor"
   - Governor joins conversation
   - System announces: "Governor has joined"

5. **Resolve**
   - Mark as resolved
   - Close ticket
   - Student notified

### Filter Tickets

- By status (open, in progress, resolved)
- By department (technical, billing, etc.)
- By topic (account, payment, etc.)
- Search by subject or user

---

## 🤖 AI Assistant Usage

### What You Can Ask

**System Questions:**
```
"How many users signed up this month?"
"What's our MRR trend?"
"Show me failed payments"
```

**Insights:**
```
"What features are most used?"
"Which courses are popular?"
"Are there any concerning patterns?"
```

**Recommendations:**
```
"Should I enable this feature?"
"How can I reduce churn?"
"What should I prioritize?"
```

### How It Works

1. Type your question
2. Click Send or press Enter
3. AI analyzes your system data
4. Provides helpful response
5. Logs the interaction

**Note:** Requires DeepSeek API key configured

---

## 🔄 Backup System

### Manual Backups

1. Click "Trigger Backup"
2. Backup starts immediately
3. Entry created in backup history
4. Status shown (pending → complete)

### Viewing Backup History

- See all past backups
- When triggered
- Who triggered it
- Status (success/failed)
- Location (if using GCS)

### Restoring

- Contact technical support
- Provide backup ID
- Specify restore point

**Important:** Automatic backups recommended via Cloud Scheduler

---

## 📊 System Health Monitoring

### What to Watch

**Daily:**
- ✅ All metrics cards green
- ✅ No failed payments
- ✅ Realtime logs normal activity
- ✅ No support tickets stuck

**Weekly:**
- ✅ MRR growing or stable
- ✅ User count increasing
- ✅ Course engagement high
- ✅ Few to no suspended users

**Monthly:**
- ✅ Export financial reports
- ✅ Review audit logs
- ✅ Check system flags
- ✅ Update announcements

---

## 🚨 Emergency Procedures

### If System Down

1. Enable maintenance mode:
   ```
   maintenance on Emergency maintenance
   ```

2. Disable non-essential features:
   ```
   disable aiTrainer
   disable chat
   ```

3. Check logs for errors

4. Fix issue

5. Re-enable:
   ```
   maintenance off
   enable aiTrainer
   enable chat
   ```

### If Security Incident

1. Suspend affected user:
   ```
   suspendUser uid="USER_ID"
   ```

2. Force logout:
   ```
   forceLogout uid="USER_ID"
   ```

3. Review audit logs

4. Check Realtime Logs for activity

5. Take appropriate action

---

## ✅ Daily Governor Checklist

**Morning:**
- [ ] Check Finance Panel for overnight revenue
- [ ] Review failed payments
- [ ] Check realtime logs for issues
- [ ] Respond to escalated support tickets

**Afternoon:**
- [ ] Review new support tickets
- [ ] Check system health metrics
- [ ] Respond to user inquiries

**Evening:**
- [ ] Review day's activity in logs
- [ ] Check MRR vs yesterday
- [ ] Plan any announcements
- [ ] Backup if needed

---

## 🎯 Pro Tips

### Make Money Decisions

Use Finance Panel to:
- See which plans convert best
- Identify churning customers (failed payments)
- Track revenue trends
- Export for tax/accounting

### Keep Users Happy

- Respond to support tickets fast
- Use announcements for updates
- Don't suspend without warning
- Monitor course feedback

### Optimize System

- Use AI Assistant for insights
- Check realtime logs daily
- Toggle features based on usage
- Back up before big changes

### Stay Secure

- Review audit logs weekly
- Monitor suspicious activity
- Use force logout carefully
- Keep backups current

---

## 📱 Mobile Access

**Yes! You can manage from your phone:**

- All sections work on mobile
- Sidebar becomes menu
- Cards stack vertically
- Command console adapted
- Finance Panel scrolls

**Good for:**
- Checking revenue
- Viewing alerts
- Quick commands
- Emergency actions

**Not ideal for:**
- Bulk user management
- Detailed analysis
- Long chat conversations

---

## 🆘 Getting Help

### Check Documentation

- `GOVERNOR_SETUP.md` - Deployment guide
- `ROLE_SYSTEM_GUIDE.md` - Complete role details
- `QUICK_DEPLOY.md` - Fast setup
- This guide - Daily usage

### Debug Issues

1. **Check realtime logs**
   - See what's happening
   - Find error messages

2. **Review audit logs**
   - In Firestore `audit` collection
   - See who did what

3. **Check Cloud Functions logs**
   ```bash
   firebase functions:log
   ```

4. **Clear cache**
   - Hard reload browser
   - Clear localStorage

### Common Problems

**Finance Panel empty:**
- Configure Stripe webhook
- Test with dummy payment
- Check Cloud Functions deployed

**Commands not working:**
- Verify role is 'governor' in Firestore
- Check Functions deployed
- See function logs

**Can't access page:**
- Check Firestore rules deployed
- Verify user role
- Clear cache

---

## 🎉 You're Ready!

**You have complete control of:**

✅ All finances (MRR, revenue, payments)
✅ All users (suspend, promote, manage)
✅ All content (courses, lock/unlock)
✅ All features (toggle on/off)
✅ All support (tickets, escalation)
✅ All system (maintenance, backups)
✅ All insights (AI assistant, logs)

**Your power:** Unlimited
**Your dashboard:** `/governor/nexus`
**Your status:** Command Level

**Welcome to the Control Nexus! 🚀**

---

**Version:** 2.0.0 Enhanced
**Role:** Governor
**Access:** Everything

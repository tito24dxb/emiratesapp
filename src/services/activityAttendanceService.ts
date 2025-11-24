import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import QRCode from 'qrcode';

export interface Activity {
  id: string;
  name: string;
  description: string;
  organizerId: string;
  organizerName: string;
  date: Timestamp;
  location: string;
  maxAttendees?: number;
  qrCode: string;
  qrCodeData: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  checkInEnabled: boolean;
  checkInStartTime?: Timestamp;
  checkInEndTime?: Timestamp;
  totalCheckIns: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Attendance {
  id: string;
  activityId: string;
  activityName: string;
  userId: string;
  userName: string;
  userEmail: string;
  checkInTime: Timestamp;
  checkInMethod: 'qr_scan' | 'manual' | 'organizer';
  location?: string;
  deviceInfo?: string;
  certificateGenerated: boolean;
  certificateUrl?: string;
  verified: boolean;
  createdAt: Timestamp;
}

export interface UserStreak {
  id: string;
  userId: string;
  userName: string;
  currentStreak: number;
  longestStreak: number;
  totalAttendance: number;
  lastAttendanceDate: Timestamp;
  streakStartDate: Timestamp;
  badges: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ParticipationBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'attendance' | 'streak' | 'milestone';
  color: string;
}

const PARTICIPATION_BADGES: ParticipationBadge[] = [
  {
    id: 'first_timer',
    name: 'First Timer',
    description: 'Attended your first activity',
    icon: '🎉',
    requirement: 1,
    type: 'attendance',
    color: 'blue'
  },
  {
    id: 'regular',
    name: 'Regular',
    description: 'Attended 5 activities',
    icon: '⭐',
    requirement: 5,
    type: 'attendance',
    color: 'yellow'
  },
  {
    id: 'frequent',
    name: 'Frequent Attendee',
    description: 'Attended 10 activities',
    icon: '🔥',
    requirement: 10,
    type: 'attendance',
    color: 'orange'
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Attended 25 activities',
    icon: '🏆',
    requirement: 25,
    type: 'attendance',
    color: 'gold'
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Attended 50 activities',
    icon: '👑',
    requirement: 50,
    type: 'attendance',
    color: 'purple'
  },
  {
    id: 'streak_3',
    name: '3-Day Streak',
    description: 'Attended activities 3 days in a row',
    icon: '🔥',
    requirement: 3,
    type: 'streak',
    color: 'red'
  },
  {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Attended activities 7 days in a row',
    icon: '🔥🔥',
    requirement: 7,
    type: 'streak',
    color: 'red'
  },
  {
    id: 'streak_30',
    name: '30-Day Streak',
    description: 'Attended activities 30 days in a row',
    icon: '🔥🔥🔥',
    requirement: 30,
    type: 'streak',
    color: 'red'
  }
];

export const activityAttendanceService = {
  async createActivity(
    name: string,
    description: string,
    organizerId: string,
    organizerName: string,
    date: Date,
    location: string,
    maxAttendees?: number
  ): Promise<Activity> {
    const activityRef = doc(collection(db, 'activities'));
    const qrCodeData = `check-in:${activityRef.id}`;

    const qrCode = await QRCode.toDataURL(qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#D71920',
        light: '#FFFFFF'
      }
    });

    const activity: Activity = {
      id: activityRef.id,
      name,
      description,
      organizerId,
      organizerName,
      date: Timestamp.fromDate(date),
      location,
      maxAttendees,
      qrCode,
      qrCodeData,
      status: 'upcoming',
      checkInEnabled: false,
      totalCheckIns: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(activityRef, activity);
    return activity;
  },

  async getActivity(activityId: string): Promise<Activity | null> {
    const activityRef = doc(db, 'activities', activityId);
    const snapshot = await getDoc(activityRef);

    if (snapshot.exists()) {
      return snapshot.data() as Activity;
    }

    return null;
  },

  async enableCheckIn(activityId: string, duration: number = 120): Promise<void> {
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60000);

    await updateDoc(doc(db, 'activities', activityId), {
      checkInEnabled: true,
      checkInStartTime: Timestamp.fromDate(now),
      checkInEndTime: Timestamp.fromDate(endTime),
      status: 'ongoing',
      updatedAt: Timestamp.now()
    });
  },

  async disableCheckIn(activityId: string): Promise<void> {
    await updateDoc(doc(db, 'activities', activityId), {
      checkInEnabled: false,
      updatedAt: Timestamp.now()
    });
  },

  async checkIn(
    activityId: string,
    userId: string,
    userName: string,
    userEmail: string,
    method: Attendance['checkInMethod'] = 'qr_scan'
  ): Promise<{ success: boolean; message: string; attendance?: Attendance }> {
    const activity = await this.getActivity(activityId);

    if (!activity) {
      return { success: false, message: 'Activity not found' };
    }

    if (!activity.checkInEnabled) {
      return { success: false, message: 'Check-in is not enabled for this activity' };
    }

    const now = Timestamp.now();
    if (activity.checkInEndTime && now.toMillis() > activity.checkInEndTime.toMillis()) {
      return { success: false, message: 'Check-in period has ended' };
    }

    const existingAttendanceQuery = query(
      collection(db, 'activity_attendance'),
      where('activityId', '==', activityId),
      where('userId', '==', userId)
    );
    const existingAttendance = await getDocs(existingAttendanceQuery);

    if (!existingAttendance.empty) {
      return { success: false, message: 'Already checked in to this activity' };
    }

    if (activity.maxAttendees && activity.totalCheckIns >= activity.maxAttendees) {
      return { success: false, message: 'Activity has reached maximum capacity' };
    }

    const attendanceRef = doc(collection(db, 'activity_attendance'));
    const attendance: Attendance = {
      id: attendanceRef.id,
      activityId,
      activityName: activity.name,
      userId,
      userName,
      userEmail,
      checkInTime: now,
      checkInMethod: method,
      certificateGenerated: false,
      verified: true,
      createdAt: now
    };

    await setDoc(attendanceRef, attendance);

    await updateDoc(doc(db, 'activities', activityId), {
      totalCheckIns: increment(1),
      updatedAt: Timestamp.now()
    });

    await this.updateUserStreak(userId, userName, now);

    return { success: true, message: 'Checked in successfully!', attendance };
  },

  async updateUserStreak(userId: string, userName: string, attendanceDate: Timestamp): Promise<void> {
    const streakRef = doc(db, 'user_streaks', userId);
    const streakSnapshot = await getDoc(streakRef);

    const today = new Date(attendanceDate.toDate());
    today.setHours(0, 0, 0, 0);

    if (!streakSnapshot.exists()) {
      const newStreak: UserStreak = {
        id: userId,
        userId,
        userName,
        currentStreak: 1,
        longestStreak: 1,
        totalAttendance: 1,
        lastAttendanceDate: Timestamp.fromDate(today),
        streakStartDate: Timestamp.fromDate(today),
        badges: ['first_timer'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(streakRef, newStreak);
      return;
    }

    const streak = streakSnapshot.data() as UserStreak;
    const lastDate = new Date(streak.lastAttendanceDate.toDate());
    lastDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      return;
    }

    let newCurrentStreak = streak.currentStreak;
    let newStreakStartDate = streak.streakStartDate;

    if (daysDiff === 1) {
      newCurrentStreak = streak.currentStreak + 1;
    } else {
      newCurrentStreak = 1;
      newStreakStartDate = Timestamp.fromDate(today);
    }

    const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);
    const newTotalAttendance = streak.totalAttendance + 1;

    const newBadges = await this.checkAndAwardBadges(
      newTotalAttendance,
      newCurrentStreak,
      streak.badges
    );

    await updateDoc(streakRef, {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalAttendance: newTotalAttendance,
      lastAttendanceDate: Timestamp.fromDate(today),
      streakStartDate: newStreakStartDate,
      badges: newBadges,
      updatedAt: Timestamp.now()
    });
  },

  async checkAndAwardBadges(
    totalAttendance: number,
    currentStreak: number,
    existingBadges: string[]
  ): Promise<string[]> {
    const newBadges = [...existingBadges];

    PARTICIPATION_BADGES.forEach(badge => {
      if (!newBadges.includes(badge.id)) {
        if (badge.type === 'attendance' && totalAttendance >= badge.requirement) {
          newBadges.push(badge.id);
        } else if (badge.type === 'streak' && currentStreak >= badge.requirement) {
          newBadges.push(badge.id);
        }
      }
    });

    return newBadges;
  },

  async getUserStreak(userId: string): Promise<UserStreak | null> {
    const streakRef = doc(db, 'user_streaks', userId);
    const snapshot = await getDoc(streakRef);

    if (snapshot.exists()) {
      return snapshot.data() as UserStreak;
    }

    return null;
  },

  async getUserAttendance(userId: string): Promise<Attendance[]> {
    const q = query(
      collection(db, 'activity_attendance'),
      where('userId', '==', userId),
      orderBy('checkInTime', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Attendance);
  },

  async getActivityAttendance(activityId: string): Promise<Attendance[]> {
    const q = query(
      collection(db, 'activity_attendance'),
      where('activityId', '==', activityId),
      orderBy('checkInTime', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Attendance);
  },

  async generateCertificate(attendanceId: string): Promise<string> {
    const attendanceRef = doc(db, 'activity_attendance', attendanceId);
    const attendanceSnapshot = await getDoc(attendanceRef);

    if (!attendanceSnapshot.exists()) {
      throw new Error('Attendance record not found');
    }

    const attendance = attendanceSnapshot.data() as Attendance;

    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: landscape; margin: 0; }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Georgia', serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .certificate {
            background: white;
            width: 800px;
            padding: 60px;
            text-align: center;
            border: 10px solid #D71920;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: #D71920;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 36px;
            font-weight: bold;
          }
          .title {
            font-size: 48px;
            color: #D71920;
            margin-bottom: 20px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 40px;
          }
          .recipient {
            font-size: 36px;
            color: #333;
            margin: 30px 0;
            font-style: italic;
          }
          .activity {
            font-size: 24px;
            color: #D71920;
            margin: 30px 0;
            font-weight: bold;
          }
          .date {
            font-size: 16px;
            color: #666;
            margin: 20px 0;
          }
          .signature {
            margin-top: 60px;
            border-top: 2px solid #333;
            padding-top: 10px;
            display: inline-block;
            font-size: 14px;
            color: #666;
          }
          .badge {
            display: inline-block;
            background: #FFD700;
            color: #333;
            padding: 10px 20px;
            border-radius: 50px;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="logo">🏆</div>
          <div class="title">Certificate of Participation</div>
          <div class="subtitle">This is to certify that</div>
          <div class="recipient">${attendance.userName}</div>
          <div class="subtitle">has successfully participated in</div>
          <div class="activity">${attendance.activityName}</div>
          <div class="date">Date: ${attendance.checkInTime.toDate().toLocaleDateString()}</div>
          <div class="badge">✓ Verified Attendance</div>
          <div class="signature">Emirates Academy Digital Certificate</div>
        </div>
      </body>
      </html>
    `;

    const certificateUrl = `data:text/html;base64,${btoa(certificateHtml)}`;

    await updateDoc(attendanceRef, {
      certificateGenerated: true,
      certificateUrl
    });

    return certificateUrl;
  },

  async getUpcomingActivities(limit: number = 10): Promise<Activity[]> {
    const q = query(
      collection(db, 'activities'),
      where('status', 'in', ['upcoming', 'ongoing']),
      orderBy('date', 'asc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Activity);
  },

  async getUserStats(userId: string): Promise<{
    totalActivities: number;
    currentStreak: number;
    longestStreak: number;
    badges: ParticipationBadge[];
    recentAttendance: Attendance[];
  }> {
    const streak = await this.getUserStreak(userId);
    const attendance = await this.getUserAttendance(userId);

    const userBadges = PARTICIPATION_BADGES.filter(badge =>
      streak?.badges.includes(badge.id)
    );

    return {
      totalActivities: streak?.totalAttendance || 0,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      badges: userBadges,
      recentAttendance: attendance.slice(0, 5)
    };
  },

  getBadgeById(badgeId: string): ParticipationBadge | undefined {
    return PARTICIPATION_BADGES.find(badge => badge.id === badgeId);
  },

  getAllBadges(): ParticipationBadge[] {
    return PARTICIPATION_BADGES;
  }
};

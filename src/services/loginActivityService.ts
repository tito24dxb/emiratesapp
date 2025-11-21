import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface LoginActivity {
  id?: string;
  userId: string;
  timestamp: Timestamp;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  userAgent: string;
  success: boolean;
}

const loginActivityCollection = 'loginActivity';

export async function recordLoginActivity(userId: string, success: boolean = true) {
  const deviceInfo = getDeviceInfo();
  const ipInfo = await getIPInfo();

  const activity: Omit<LoginActivity, 'id'> = {
    userId,
    timestamp: Timestamp.now(),
    deviceType: deviceInfo.deviceType,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    userAgent: navigator.userAgent,
    ipAddress: ipInfo.ip,
    location: ipInfo.location,
    success,
  };

  const docRef = await addDoc(collection(db, loginActivityCollection), activity);
  return docRef.id;
}

export async function getUserLoginHistory(userId: string, limitCount: number = 10): Promise<LoginActivity[]> {
  const q = query(
    collection(db, loginActivityCollection),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LoginActivity));
}

export async function getRecentLogins(limitCount: number = 50): Promise<LoginActivity[]> {
  const q = query(
    collection(db, loginActivityCollection),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LoginActivity));
}

export async function getFailedLoginAttempts(userId: string, since: Date): Promise<LoginActivity[]> {
  const sinceTimestamp = Timestamp.fromDate(since);
  const q = query(
    collection(db, loginActivityCollection),
    where('userId', '==', userId),
    where('success', '==', false),
    where('timestamp', '>=', sinceTimestamp),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LoginActivity));
}

export async function deleteLoginActivity(activityId: string) {
  const docRef = doc(db, loginActivityCollection, activityId);
  await deleteDoc(docRef);
}

export async function clearOldLoginActivity(userId: string, olderThanDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

  const q = query(
    collection(db, loginActivityCollection),
    where('userId', '==', userId),
    where('timestamp', '<', cutoffTimestamp)
  );

  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map((document) => deleteDoc(document.ref));
  await Promise.all(deletePromises);

  return snapshot.size;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;

  let deviceType = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    deviceType = 'mobile';
  }

  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  return { deviceType, browser, os };
}

async function getIPInfo(): Promise<{ ip?: string; location?: any }> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return { ip: data.ip };
  } catch (error) {
    console.error('Error fetching IP info:', error);
    return {};
  }
}

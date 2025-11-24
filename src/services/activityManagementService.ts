import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import QRCode from 'qrcode';

export interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  date: any;
  maxParticipants: number;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  type: 'free' | 'paid';
  price?: number;
  currency?: string;
  imageUrl?: string;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: any;
  updatedAt: any;
  marketplaceProductId?: string;
  joinedCount: number;
}

export interface Attendee {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: any;
  status: 'joined' | 'checked_in' | 'assisted';
  checkedInAt?: any;
  qrCode?: string;
  type: 'free' | 'paid';
  amountPaid?: number;
  orderId?: string;
  orderNumber?: string;
}

export const createActivity = async (
  userId: string,
  userName: string,
  userEmail: string,
  activityData: {
    title: string;
    description: string;
    location: string;
    date: string;
    maxParticipants: number;
    imageUrl?: string;
  }
): Promise<string> => {
  try {
    const activityRef = doc(collection(db, 'activities'));

    const activity: Omit<Activity, 'id'> = {
      title: activityData.title,
      description: activityData.description,
      location: activityData.location,
      date: Timestamp.fromDate(new Date(activityData.date)),
      maxParticipants: activityData.maxParticipants,
      creatorId: userId,
      creatorName: userName,
      creatorEmail: userEmail,
      type: 'free',
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      joinedCount: 0,
      ...(activityData.imageUrl && { imageUrl: activityData.imageUrl })
    };

    await setDoc(activityRef, activity);
    return activityRef.id;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

export const createPaidActivity = async (
  marketplaceProductId: string,
  productData: {
    title: string;
    description: string;
    location: string;
    date: string;
    maxParticipants: number;
    price: number;
    currency: string;
    imageUrl?: string;
    creatorId: string;
    creatorName: string;
    creatorEmail: string;
  }
): Promise<string> => {
  try {
    const activityRef = doc(collection(db, 'activities'));

    const activity: Omit<Activity, 'id'> = {
      title: productData.title,
      description: productData.description,
      location: productData.location,
      date: Timestamp.fromDate(new Date(productData.date)),
      maxParticipants: productData.maxParticipants,
      creatorId: productData.creatorId,
      creatorName: productData.creatorName,
      creatorEmail: productData.creatorEmail,
      type: 'paid',
      price: productData.price,
      currency: productData.currency,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      marketplaceProductId,
      joinedCount: 0,
      ...(productData.imageUrl && { imageUrl: productData.imageUrl })
    };

    await setDoc(activityRef, activity);
    return activityRef.id;
  } catch (error) {
    console.error('Error creating paid activity:', error);
    throw error;
  }
};

export const joinActivity = async (
  activityId: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<string> => {
  try {
    const attendeeRef = doc(collection(db, 'activity_attendees'));
    const activityRef = doc(db, 'activities', activityId);

    // Generate QR code
    const qrData = JSON.stringify({
      attendeeId: attendeeRef.id,
      activityId,
      userId,
      userName,
      timestamp: Date.now()
    });

    const qrCode = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    const attendee: Omit<Attendee, 'id'> = {
      activityId,
      userId,
      userName,
      userEmail,
      joinedAt: Timestamp.now(),
      status: 'joined',
      qrCode,
      type: 'free'
    };

    await setDoc(attendeeRef, attendee);

    // Increment joined count
    await updateDoc(activityRef, {
      joinedCount: increment(1)
    });

    return attendeeRef.id;
  } catch (error) {
    console.error('Error joining activity:', error);
    throw error;
  }
};

export const addPaidAttendee = async (
  activityId: string,
  userId: string,
  userName: string,
  userEmail: string,
  amountPaid: number,
  orderId: string,
  orderNumber: string,
  qrCode: string
): Promise<string> => {
  try {
    const attendeeRef = doc(collection(db, 'activity_attendees'));
    const activityRef = doc(db, 'activities', activityId);

    const attendee: Omit<Attendee, 'id'> = {
      activityId,
      userId,
      userName,
      userEmail,
      joinedAt: Timestamp.now(),
      status: 'joined',
      qrCode,
      type: 'paid',
      amountPaid,
      orderId,
      orderNumber
    };

    await setDoc(attendeeRef, attendee);

    // Increment joined count
    await updateDoc(activityRef, {
      joinedCount: increment(1)
    });

    return attendeeRef.id;
  } catch (error) {
    console.error('Error adding paid attendee:', error);
    throw error;
  }
};

export const checkInAttendee = async (attendeeId: string): Promise<void> => {
  try {
    const attendeeRef = doc(db, 'activity_attendees', attendeeId);
    await updateDoc(attendeeRef, {
      status: 'checked_in',
      checkedInAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error checking in attendee:', error);
    throw error;
  }
};

export const markAttendeeAssisted = async (attendeeId: string): Promise<void> => {
  try {
    const attendeeRef = doc(db, 'activity_attendees', attendeeId);
    await updateDoc(attendeeRef, {
      status: 'assisted'
    });
  } catch (error) {
    console.error('Error marking attendee as assisted:', error);
    throw error;
  }
};

export const getActivity = async (activityId: string): Promise<Activity | null> => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    const activitySnap = await getDoc(activityRef);

    if (activitySnap.exists()) {
      return { id: activitySnap.id, ...activitySnap.data() } as Activity;
    }
    return null;
  } catch (error) {
    console.error('Error getting activity:', error);
    return null;
  }
};

export const getActivitiesByCreator = async (creatorId: string): Promise<Activity[]> => {
  try {
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('creatorId', '==', creatorId),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Activity));
  } catch (error) {
    console.error('Error getting activities by creator:', error);
    return [];
  }
};

export const getActiveActivities = async (): Promise<Activity[]> => {
  try {
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('status', '==', 'active'),
      where('type', '==', 'free'),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Activity));
  } catch (error) {
    console.error('Error getting active activities:', error);
    return [];
  }
};

export const getActivityAttendees = async (activityId: string): Promise<Attendee[]> => {
  try {
    const attendeesRef = collection(db, 'activity_attendees');
    const q = query(
      attendeesRef,
      where('activityId', '==', activityId),
      orderBy('joinedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Attendee));
  } catch (error) {
    console.error('Error getting activity attendees:', error);
    return [];
  }
};

export const getUserAttendedActivities = async (userId: string): Promise<Attendee[]> => {
  try {
    const attendeesRef = collection(db, 'activity_attendees');
    const q = query(
      attendeesRef,
      where('userId', '==', userId),
      orderBy('joinedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Attendee));
  } catch (error) {
    console.error('Error getting user attended activities:', error);
    return [];
  }
};

export const updateActivity = async (
  activityId: string,
  updates: Partial<Activity>
): Promise<void> => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    await updateDoc(activityRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
};

export const deleteActivity = async (activityId: string): Promise<void> => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    await deleteDoc(activityRef);

    // Also delete all attendees
    const attendeesRef = collection(db, 'activity_attendees');
    const q = query(attendeesRef, where('activityId', '==', activityId));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
};

export const getAttendeeByQRData = async (qrData: {
  attendeeId: string;
  activityId: string;
  userId: string;
}): Promise<Attendee | null> => {
  try {
    const attendeeRef = doc(db, 'activity_attendees', qrData.attendeeId);
    const attendeeSnap = await getDoc(attendeeRef);

    if (attendeeSnap.exists()) {
      const data = attendeeSnap.data();
      if (data.activityId === qrData.activityId && data.userId === qrData.userId) {
        return { id: attendeeSnap.id, ...data } as Attendee;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting attendee by QR data:', error);
    return null;
  }
};

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface ActivityGallery {
  id: string;
  activityId: string;
  activityName: string;
  organizerId: string;
  organizerName: string;
  status: 'active' | 'archived';
  totalPhotos: number;
  totalReactions: number;
  totalComments: number;
  totalReviews: number;
  averageRating: number;
  attendeeCount: number;
  attendeeIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActivityPhoto {
  id: string;
  galleryId: string;
  activityId: string;
  uploadedBy: string;
  uploaderName: string;
  photoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  taggedUsers: string[];
  reactions: {
    like: number;
    love: number;
    celebrate: number;
    inspiring: number;
  };
  commentCount: number;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PhotoReaction {
  id: string;
  photoId: string;
  userId: string;
  userName: string;
  reactionType: 'like' | 'love' | 'celebrate' | 'inspiring';
  createdAt: Timestamp;
}

export interface PhotoComment {
  id: string;
  photoId: string;
  galleryId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  comment: string;
  mentions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActivityReview {
  id: string;
  galleryId: string;
  activityId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  review: string;
  attendedActivity: boolean;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EngagementAnalytics {
  galleryId: string;
  activityId: string;
  totalViews: number;
  totalPhotos: number;
  totalReactions: number;
  totalComments: number;
  totalReviews: number;
  averageRating: number;
  reactionBreakdown: {
    like: number;
    love: number;
    celebrate: number;
    inspiring: number;
  };
  topPhotos: Array<{
    photoId: string;
    photoUrl: string;
    reactions: number;
    comments: number;
  }>;
  engagementRate: number;
  attendeeEngagement: number;
  reviewDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export const activitySocialProofService = {
  async createGallery(
    activityId: string,
    activityName: string,
    organizerId: string,
    organizerName: string,
    attendeeIds: string[]
  ): Promise<ActivityGallery> {
    const galleryRef = doc(collection(db, 'activity_galleries'));

    const gallery: ActivityGallery = {
      id: galleryRef.id,
      activityId,
      activityName,
      organizerId,
      organizerName,
      status: 'active',
      totalPhotos: 0,
      totalReactions: 0,
      totalComments: 0,
      totalReviews: 0,
      averageRating: 0,
      attendeeCount: attendeeIds.length,
      attendeeIds,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(galleryRef, gallery);
    return gallery;
  },

  async getGallery(galleryId: string): Promise<ActivityGallery | null> {
    const galleryRef = doc(db, 'activity_galleries', galleryId);
    const snapshot = await getDoc(galleryRef);

    if (snapshot.exists()) {
      return snapshot.data() as ActivityGallery;
    }

    return null;
  },

  async getGalleriesByActivity(activityId: string): Promise<ActivityGallery[]> {
    const q = query(
      collection(db, 'activity_galleries'),
      where('activityId', '==', activityId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ActivityGallery);
  },

  async uploadPhoto(
    galleryId: string,
    activityId: string,
    uploaderId: string,
    uploaderName: string,
    photoFile: File,
    caption?: string,
    taggedUsers: string[] = []
  ): Promise<ActivityPhoto> {
    const photoId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const storageRef = ref(storage, `activity-photos/${activityId}/${photoId}`);

    await uploadBytes(storageRef, photoFile);
    const photoUrl = await getDownloadURL(storageRef);

    const photoRef = doc(collection(db, 'activity_media'));
    const photo: ActivityPhoto = {
      id: photoRef.id,
      galleryId,
      activityId,
      uploadedBy: uploaderId,
      uploaderName,
      photoUrl,
      caption,
      taggedUsers,
      reactions: {
        like: 0,
        love: 0,
        celebrate: 0,
        inspiring: 0
      },
      commentCount: 0,
      order: Date.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(photoRef, photo);

    const galleryRef = doc(db, 'activity_galleries', galleryId);
    await updateDoc(galleryRef, {
      totalPhotos: increment(1),
      updatedAt: Timestamp.now()
    });

    return photo;
  },

  async getGalleryPhotos(galleryId: string): Promise<ActivityPhoto[]> {
    const q = query(
      collection(db, 'activity_media'),
      where('galleryId', '==', galleryId),
      orderBy('order', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ActivityPhoto);
  },

  async deletePhoto(photoId: string, galleryId: string): Promise<void> {
    const photoRef = doc(db, 'activity_media', photoId);
    await deleteDoc(photoRef);

    const galleryRef = doc(db, 'activity_galleries', galleryId);
    await updateDoc(galleryRef, {
      totalPhotos: increment(-1),
      updatedAt: Timestamp.now()
    });
  },

  async addReaction(
    photoId: string,
    userId: string,
    userName: string,
    reactionType: PhotoReaction['reactionType']
  ): Promise<void> {
    const reactionId = `${photoId}-${userId}`;
    const reactionRef = doc(db, 'photo_reactions', reactionId);

    const existingReaction = await getDoc(reactionRef);

    if (existingReaction.exists()) {
      const oldType = (existingReaction.data() as PhotoReaction).reactionType;

      if (oldType === reactionType) {
        await deleteDoc(reactionRef);

        const photoRef = doc(db, 'activity_media', photoId);
        await updateDoc(photoRef, {
          [`reactions.${reactionType}`]: increment(-1)
        });

        const photo = await getDoc(photoRef);
        const photoData = photo.data() as ActivityPhoto;

        const galleryRef = doc(db, 'activity_galleries', photoData.galleryId);
        await updateDoc(galleryRef, {
          totalReactions: increment(-1)
        });

        return;
      }

      const photoRef = doc(db, 'activity_media', photoId);
      await updateDoc(photoRef, {
        [`reactions.${oldType}`]: increment(-1),
        [`reactions.${reactionType}`]: increment(1)
      });

      await updateDoc(reactionRef, {
        reactionType,
        createdAt: Timestamp.now()
      });
    } else {
      const reaction: PhotoReaction = {
        id: reactionId,
        photoId,
        userId,
        userName,
        reactionType,
        createdAt: Timestamp.now()
      };

      await setDoc(reactionRef, reaction);

      const photoRef = doc(db, 'activity_media', photoId);
      await updateDoc(photoRef, {
        [`reactions.${reactionType}`]: increment(1)
      });

      const photo = await getDoc(photoRef);
      const photoData = photo.data() as ActivityPhoto;

      const galleryRef = doc(db, 'activity_galleries', photoData.galleryId);
      await updateDoc(galleryRef, {
        totalReactions: increment(1)
      });
    }
  },

  async getUserReaction(photoId: string, userId: string): Promise<PhotoReaction | null> {
    const reactionId = `${photoId}-${userId}`;
    const reactionRef = doc(db, 'photo_reactions', reactionId);
    const snapshot = await getDoc(reactionRef);

    if (snapshot.exists()) {
      return snapshot.data() as PhotoReaction;
    }

    return null;
  },

  async addComment(
    photoId: string,
    galleryId: string,
    userId: string,
    userName: string,
    comment: string,
    userPhoto?: string
  ): Promise<PhotoComment> {
    const mentions = comment.match(/@(\w+)/g)?.map(m => m.substring(1)) || [];

    const commentRef = doc(collection(db, 'photo_comments'));
    const photoComment: PhotoComment = {
      id: commentRef.id,
      photoId,
      galleryId,
      userId,
      userName,
      userPhoto,
      comment,
      mentions,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(commentRef, photoComment);

    const photoRef = doc(db, 'activity_media', photoId);
    await updateDoc(photoRef, {
      commentCount: increment(1)
    });

    const galleryRef = doc(db, 'activity_galleries', galleryId);
    await updateDoc(galleryRef, {
      totalComments: increment(1)
    });

    return photoComment;
  },

  async getPhotoComments(photoId: string): Promise<PhotoComment[]> {
    const q = query(
      collection(db, 'photo_comments'),
      where('photoId', '==', photoId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PhotoComment);
  },

  async deleteComment(commentId: string, photoId: string, galleryId: string): Promise<void> {
    const commentRef = doc(db, 'photo_comments', commentId);
    await deleteDoc(commentRef);

    const photoRef = doc(db, 'activity_media', photoId);
    await updateDoc(photoRef, {
      commentCount: increment(-1)
    });

    const galleryRef = doc(db, 'activity_galleries', galleryId);
    await updateDoc(galleryRef, {
      totalComments: increment(-1)
    });
  },

  async addReview(
    galleryId: string,
    activityId: string,
    userId: string,
    userName: string,
    rating: number,
    review: string,
    attendedActivity: boolean,
    userPhoto?: string
  ): Promise<ActivityReview> {
    const reviewRef = doc(collection(db, 'activity_reviews'));
    const activityReview: ActivityReview = {
      id: reviewRef.id,
      galleryId,
      activityId,
      userId,
      userName,
      userPhoto,
      rating,
      review,
      attendedActivity,
      verified: attendedActivity,
      helpful: 0,
      notHelpful: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(reviewRef, activityReview);

    const gallery = await this.getGallery(galleryId);
    if (gallery) {
      const newTotal = gallery.totalReviews + 1;
      const newAverage = ((gallery.averageRating * gallery.totalReviews) + rating) / newTotal;

      const galleryRef = doc(db, 'activity_galleries', galleryId);
      await updateDoc(galleryRef, {
        totalReviews: increment(1),
        averageRating: newAverage
      });
    }

    return activityReview;
  },

  async getActivityReviews(galleryId: string): Promise<ActivityReview[]> {
    const q = query(
      collection(db, 'activity_reviews'),
      where('galleryId', '==', galleryId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ActivityReview);
  },

  async markReviewHelpful(reviewId: string, helpful: boolean): Promise<void> {
    const reviewRef = doc(db, 'activity_reviews', reviewId);
    await updateDoc(reviewRef, {
      [helpful ? 'helpful' : 'notHelpful']: increment(1)
    });
  },

  async getEngagementAnalytics(galleryId: string): Promise<EngagementAnalytics> {
    const gallery = await this.getGallery(galleryId);
    if (!gallery) {
      throw new Error('Gallery not found');
    }

    const photos = await this.getGalleryPhotos(galleryId);
    const reviews = await this.getActivityReviews(galleryId);

    const reactionBreakdown = photos.reduce((acc, photo) => ({
      like: acc.like + photo.reactions.like,
      love: acc.love + photo.reactions.love,
      celebrate: acc.celebrate + photo.reactions.celebrate,
      inspiring: acc.inspiring + photo.reactions.inspiring
    }), { like: 0, love: 0, celebrate: 0, inspiring: 0 });

    const topPhotos = photos
      .map(photo => ({
        photoId: photo.id,
        photoUrl: photo.photoUrl,
        reactions: Object.values(photo.reactions).reduce((a, b) => a + b, 0),
        comments: photo.commentCount
      }))
      .sort((a, b) => (b.reactions + b.comments) - (a.reactions + a.comments))
      .slice(0, 5);

    const reviewDistribution = reviews.reduce((acc, review) => {
      acc[review.rating as keyof typeof acc]++;
      return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    const totalEngagements = gallery.totalReactions + gallery.totalComments + gallery.totalReviews;
    const engagementRate = gallery.attendeeCount > 0
      ? (totalEngagements / gallery.attendeeCount) * 100
      : 0;

    const attendeeReactionsQuery = query(
      collection(db, 'photo_reactions'),
      where('userId', 'in', gallery.attendeeIds.slice(0, 10))
    );
    const attendeeReactions = await getDocs(attendeeReactionsQuery);
    const attendeeEngagement = gallery.attendeeCount > 0
      ? (attendeeReactions.size / gallery.attendeeCount) * 100
      : 0;

    return {
      galleryId,
      activityId: gallery.activityId,
      totalViews: 0,
      totalPhotos: gallery.totalPhotos,
      totalReactions: gallery.totalReactions,
      totalComments: gallery.totalComments,
      totalReviews: gallery.totalReviews,
      averageRating: gallery.averageRating,
      reactionBreakdown,
      topPhotos,
      engagementRate,
      attendeeEngagement,
      reviewDistribution
    };
  },

  async getRecentGalleries(limit: number = 10): Promise<ActivityGallery[]> {
    const q = query(
      collection(db, 'activity_galleries'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ActivityGallery);
  },

  async searchGalleries(searchTerm: string): Promise<ActivityGallery[]> {
    const q = query(
      collection(db, 'activity_galleries'),
      where('status', '==', 'active'),
      orderBy('activityName')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => doc.data() as ActivityGallery)
      .filter(gallery =>
        gallery.activityName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }
};

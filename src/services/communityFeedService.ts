import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  onSnapshot,
  increment,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  content: string;
  imageUrl?: string;
  channel: 'announcements' | 'general' | 'study-room';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  commentsCount: number;
  viewsCount: number;
  viewedBy: string[];
  reactionsCount: {
    fire: number;
    heart: number;
    thumbsUp: number;
    laugh: number;
    wow: number;
  };
  flagged: boolean;
  flaggedReason?: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  content: string;
  imageUrl?: string;
  replyTo?: string;
  replyToName?: string;
  reactions?: {
    heart: number;
    thumbsUp: number;
    laugh: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommunityReaction {
  id: string;
  postId: string;
  userId: string;
  reactionType: 'fire' | 'heart' | 'thumbsUp' | 'laugh' | 'wow';
  createdAt: Timestamp;
}

export const POSTS_PER_PAGE = 10;

export const communityFeedService = {
  async convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async createPost(
    userId: string,
    userName: string,
    userEmail: string,
    content: string,
    channel: 'announcements' | 'general' | 'study-room',
    imageFile?: File,
    userPhotoURL?: string
  ): Promise<string> {
    let imageUrl = '';

    if (imageFile) {
      imageUrl = await this.convertImageToBase64(imageFile);
    }

    const postData = {
      userId,
      userName,
      userEmail,
      userPhotoURL: userPhotoURL || '',
      content,
      imageUrl,
      channel,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      commentsCount: 0,
      viewsCount: 0,
      viewedBy: [],
      reactionsCount: {
        fire: 0,
        heart: 0,
        thumbsUp: 0,
        laugh: 0,
        wow: 0
      },
      flagged: false
    };

    const docRef = await addDoc(collection(db, 'community_posts'), postData);
    return docRef.id;
  },

  async updatePost(postId: string, content: string): Promise<void> {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      content,
      updatedAt: Timestamp.now()
    });
  },

  async deletePost(postId: string): Promise<void> {
    const postRef = doc(db, 'community_posts', postId);

    const commentsQuery = query(
      collection(db, 'community_comments'),
      where('postId', '==', postId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const deletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    const reactionsQuery = query(
      collection(db, 'community_reactions'),
      where('postId', '==', postId)
    );
    const reactionsSnapshot = await getDocs(reactionsQuery);
    const reactionDeletePromises = reactionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(reactionDeletePromises);

    await deleteDoc(postRef);
  },

  async getPosts(
    channel?: string,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    filters?: {
      imagesOnly?: boolean;
      userId?: string;
      hasMyReaction?: string;
    }
  ): Promise<{ posts: CommunityPost[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    let q = query(
      collection(db, 'community_posts'),
      orderBy('createdAt', 'desc'),
      limit(POSTS_PER_PAGE)
    );

    if (channel) {
      q = query(
        collection(db, 'community_posts'),
        where('channel', '==', channel),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      );
    }

    if (filters?.userId) {
      q = query(
        collection(db, 'community_posts'),
        where('userId', '==', filters.userId),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      );
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    let posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));

    if (filters?.imagesOnly) {
      posts = posts.filter(post => post.imageUrl);
    }

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
  },

  subscribeToPost(postId: string, callback: (post: CommunityPost | null) => void) {
    const postRef = doc(db, 'community_posts', postId);
    return onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as CommunityPost);
      } else {
        callback(null);
      }
    });
  },

  async addComment(
    postId: string,
    userId: string,
    userName: string,
    userEmail: string,
    content: string,
    options?: {
      imageUrl?: string;
      replyTo?: string;
      replyToName?: string;
      userPhotoURL?: string;
    }
  ): Promise<string> {
    const commentData = {
      postId,
      userId,
      userName,
      userEmail,
      userPhotoURL: options?.userPhotoURL || '',
      content,
      imageUrl: options?.imageUrl || '',
      replyTo: options?.replyTo || '',
      replyToName: options?.replyToName || '',
      reactions: {
        heart: 0,
        thumbsUp: 0,
        laugh: 0
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'community_comments'), commentData);

    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      commentsCount: increment(1)
    });

    return docRef.id;
  },

  async deleteComment(commentId: string, postId: string): Promise<void> {
    await deleteDoc(doc(db, 'community_comments', commentId));

    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      commentsCount: increment(-1)
    });
  },

  async getComments(postId: string): Promise<CommunityComment[]> {
    const q = query(
      collection(db, 'community_comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityComment));
  },

  subscribeToComments(postId: string, callback: (comments: CommunityComment[]) => void) {
    const q = query(
      collection(db, 'community_comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CommunityComment));
        callback(comments);
      },
      (error) => {
        console.error('❌ COMMENTS SUBSCRIPTION ERROR:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('PostId:', postId);
      }
    );
  },

  async toggleReaction(
    postId: string,
    userId: string,
    reactionType: 'fire' | 'heart' | 'thumbsUp' | 'laugh' | 'wow'
  ): Promise<void> {
    console.log('🔵 toggleReaction:', { postId, userId, reactionType });
    console.log('🔵 Auth user:', auth.currentUser?.uid);

    const reactionsQuery = query(
      collection(db, 'community_reactions'),
      where('postId', '==', postId),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(reactionsQuery);
    console.log('🔵 Found reactions:', snapshot.size);

    if (!snapshot.empty) {
      const existingReaction = snapshot.docs[0];
      const existingType = existingReaction.data().reactionType;

      console.log('🔵 Deleting:', existingReaction.id);
      try {
        await deleteDoc(existingReaction.ref);
        console.log('✅ DELETE OK');
      } catch (err: any) {
        console.error('❌ DELETE FAIL:', err.code, err.message);
        throw err;
      }

      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        [`reactionsCount.${existingType}`]: increment(-1)
      });

      if (existingType !== reactionType) {
        const newReactionData = {
          postId,
          userId,
          reactionType,
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'community_reactions'), newReactionData);
        await updateDoc(postRef, {
          [`reactionsCount.${reactionType}`]: increment(1)
        });
      }
    } else {
      console.log('🔵 Creating reaction');
      const reactionData = {
        postId,
        userId,
        reactionType,
        createdAt: Timestamp.now()
      };
      try {
        await addDoc(collection(db, 'community_reactions'), reactionData);
        console.log('✅ CREATE OK');
      } catch (err: any) {
        console.error('❌ CREATE FAIL:', err.code, err.message);
        throw err;
      }

      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        [`reactionsCount.${reactionType}`]: increment(1)
      });
    }
  },

  async getUserReaction(postId: string, userId: string): Promise<string | null> {
    const reactionsQuery = query(
      collection(db, 'community_reactions'),
      where('postId', '==', postId),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(reactionsQuery);
    if (!snapshot.empty) {
      return snapshot.docs[0].data().reactionType;
    }
    return null;
  },

  async flagPost(postId: string, reason: string): Promise<void> {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      flagged: true,
      flaggedReason: reason,
      updatedAt: Timestamp.now()
    });

    await addDoc(collection(db, 'community_flags'), {
      postId,
      reason,
      createdAt: Timestamp.now(),
      resolved: false
    });
  },

  async unflagPost(postId: string): Promise<void> {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      flagged: false,
      flaggedReason: null,
      updatedAt: Timestamp.now()
    });

    const flagsQuery = query(
      collection(db, 'community_flags'),
      where('postId', '==', postId),
      where('resolved', '==', false)
    );
    const snapshot = await getDocs(flagsQuery);
    const deletePromises = snapshot.docs.map(doc =>
      updateDoc(doc.ref, { resolved: true })
    );
    await Promise.all(deletePromises);
  },

  async getFlaggedPosts(): Promise<CommunityPost[]> {
    const q = query(
      collection(db, 'community_posts'),
      where('flagged', '==', true),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  }
};

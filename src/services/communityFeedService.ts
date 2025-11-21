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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  imageUrl?: string;
  imagePath?: string;
  channel: 'announcements' | 'general' | 'study-room';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  commentsCount: number;
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
  content: string;
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
  async createPost(
    userId: string,
    userName: string,
    userEmail: string,
    content: string,
    channel: 'announcements' | 'general' | 'study-room',
    imageFile?: File
  ): Promise<string> {
    let imageUrl = '';
    let imagePath = '';

    if (imageFile) {
      const timestamp = Date.now();
      imagePath = `community_images/${userId}/${timestamp}_${imageFile.name}`;
      const imageRef = ref(storage, imagePath);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    const postData = {
      userId,
      userName,
      userEmail,
      content,
      imageUrl,
      imagePath,
      channel,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      commentsCount: 0,
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
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      const postData = postDoc.data();

      if (postData.imagePath) {
        try {
          const imageRef = ref(storage, postData.imagePath);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }

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
    }
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
    content: string
  ): Promise<string> {
    const commentData = {
      postId,
      userId,
      userName,
      userEmail,
      content,
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

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CommunityComment));
      callback(comments);
    });
  },

  async toggleReaction(
    postId: string,
    userId: string,
    reactionType: 'fire' | 'heart' | 'thumbsUp' | 'laugh' | 'wow'
  ): Promise<void> {
    const reactionsQuery = query(
      collection(db, 'community_reactions'),
      where('postId', '==', postId),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(reactionsQuery);

    if (!snapshot.empty) {
      const existingReaction = snapshot.docs[0];
      const existingType = existingReaction.data().reactionType;

      await deleteDoc(existingReaction.ref);

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
      const reactionData = {
        postId,
        userId,
        reactionType,
        createdAt: Timestamp.now()
      };
      await addDoc(collection(db, 'community_reactions'), reactionData);

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

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import { communityChatService, Conversation } from '../services/communityChatService';
import { presenceService } from '../services/presenceService';
import { auth, db } from '../lib/firebase';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import CreateConversationModal from '../components/chat/CreateConversationModal';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function CommunityPage() {
  const { currentUser } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { messages, loading, hasMore, loadMoreMessages } = useChatMessages(
    selectedConversation?.id || null
  );

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    selectedConversation?.id || null,
    currentUser?.uid || '',
    currentUser?.name || ''
  );

  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId && conversations.length > 0) {
      const conversation = conversations.find((c) => c.id === chatId);
      if (conversation) {
        setSelectedConversation(conversation);
        setSearchParams({});
      }
    }
  }, [searchParams, conversations, setSearchParams]);

  useEffect(() => {
    const initCommunityChat = async () => {
      try {
        await communityChatService.ensureCommunityChat();
        const userId = auth.currentUser?.uid;
        if (userId) {
          await communityChatService.joinCommunityChat(userId);
        }
      } catch (error) {
        console.error('Error initializing community chat:', error);
      }
    };

    initCommunityChat();
    presenceService.initializePresence();

    const unsubscribeConversations = communityChatService.subscribeToConversations((convs) => {
      setConversations(convs);
    });

    return () => {
      presenceService.cleanup();
      unsubscribeConversations();
    };
  }, []);

  const handleSendMessage = async (message: string, file?: File) => {
    if (!currentUser || !selectedConversation || !message.trim()) return;

    setSending(true);
    try {
      await communityChatService.sendMessage(
        selectedConversation.id,
        message,
        file ? 'image' : 'text',
        file
      );
      stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleCreateConversation = () => {
    setShowCreateModal(true);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser || !selectedConversation) return;

    try {
      await communityChatService.addReaction(
        selectedConversation.id,
        messageId,
        emoji,
        currentUser.uid
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentUser || !selectedConversation) return;

    try {
      await communityChatService.editMessage(
        selectedConversation.id,
        messageId,
        newContent
      );
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  };

  const handleReportMessage = async (messageId: string) => {
    if (!currentUser || !selectedConversation) return;

    const reason = prompt('Please provide a reason for reporting this message:');
    if (!reason || !reason.trim()) return;

    try {
      await communityChatService.reportMessage(
        selectedConversation.id,
        messageId,
        reason.trim()
      );
      alert('Message reported successfully. Our team will review it.');
    } catch (error) {
      console.error('Error reporting message:', error);
      alert('Failed to report message');
    }
  };

  const handleCreateGroup = async (title: string, memberIds: string[]) => {
    if (!currentUser) return;

    try {
      const conversationId = await communityChatService.createConversation(
        'group',
        title,
        memberIds
      );
      const newConv = conversations.find((c) => c.id === conversationId);
      if (newConv) {
        setSelectedConversation(newConv);
      }
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  const handleCreatePrivate = async (memberId: string) => {
    if (!currentUser) return;

    try {
      const conversationId = await communityChatService.createConversation(
        'private',
        'Direct Message',
        [memberId]
      );
      const newConv = conversations.find((c) => c.id === conversationId);
      if (newConv) {
        setSelectedConversation(newConv);
      }
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating private chat:', error);
      alert('Failed to create private chat');
    }
  };

  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; photoURL?: string }>>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;

      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', '!=', currentUser.uid)
        );
        const snapshot = await getDocs(usersQuery);
        const users = snapshot.docs.map((doc) => ({
          id: doc.data().uid,
          name: doc.data().name || 'Unknown',
          photoURL: doc.data().photoURL,
        }));
        setAvailableUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  if (!currentUser) return null;

  const chatAccess = checkFeatureAccess(currentUser, 'chat');
  if (!chatAccess.allowed) {
    return (
      <FeatureLock
        requiredPlan={chatAccess.requiresPlan || 'pro'}
        featureName="Community Chat"
        description={chatAccess.message}
      />
    );
  }

  return (
    <div className="h-full">
      {!selectedConversation ? (
        <ChatSidebar
          conversations={conversations}
          selectedConversationId={null}
          currentUserId={currentUser.uid}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
        />
      ) : (
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          currentUserId={currentUser.uid}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMoreMessages}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          onTyping={startTyping}
          sending={sending}
          onBack={() => setSelectedConversation(null)}
          onReact={handleReaction}
          onEdit={handleEditMessage}
          onReport={handleReportMessage}
        />
      )}
      {showCreateModal && (
        <CreateConversationModal
          onClose={() => setShowCreateModal(false)}
          onCreateGroup={handleCreateGroup}
          onCreatePrivate={handleCreatePrivate}
          availableUsers={availableUsers}
        />
      )}
    </div>
  );
}

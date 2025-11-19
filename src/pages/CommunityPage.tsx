import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationList from '../components/community/ConversationList';
import MessageBubble from '../components/community/MessageBubble';
import MessageComposer from '../components/community/MessageComposer';
import { communityChatService, Message } from '../services/communityChatService';
import { presenceService, TypingData } from '../services/presenceService';
import { auth } from '../lib/firebase';

export default function CommunityPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>('publicRoom');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    return () => {
      presenceService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (!selectedConversationId) return;

    setLoading(true);
    const unsubscribe = communityChatService.subscribeToMessages(
      selectedConversationId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
        scrollToBottom();
      },
      (error) => {
        console.error('Error subscribing to messages:', error);
        setLoading(false);
      }
    );

    presenceService.setCurrentConversation(selectedConversationId);

    const unsubscribeTyping = presenceService.subscribeToTyping(
      selectedConversationId,
      setTypingUsers
    );

    return () => {
      unsubscribe();
      unsubscribeTyping();
      presenceService.clearTyping(selectedConversationId);
    };
  }, [selectedConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!selectedConversationId) return;

    const contentType = file
      ? file.type.startsWith('image/')
        ? 'image'
        : 'file'
      : 'text';

    await communityChatService.sendMessage(
      selectedConversationId,
      content,
      contentType,
      file
    );
  };

  const handleTyping = () => {
    if (!selectedConversationId) return;
    const userName = auth.currentUser?.displayName || 'User';
    presenceService.setTyping(selectedConversationId, userName);
  };

  const handleReaction = async (messageId: string, emoji: string, recipientId: string) => {
    if (!selectedConversationId) return;
    await communityChatService.addReaction(
      selectedConversationId,
      messageId,
      emoji,
      recipientId
    );
  };

  const handleLike = async (messageId: string, recipientId: string) => {
    if (!selectedConversationId) return;
    await communityChatService.likeMessage(selectedConversationId, messageId, recipientId);
  };

  const handleReport = async (messageId: string) => {
    if (!selectedConversationId) return;

    const reason = prompt('Please provide a reason for reporting this message:');
    if (!reason) return;

    try {
      await communityChatService.reportMessage(selectedConversationId, messageId, reason);
      alert('Message reported successfully');
    } catch (error) {
      alert('Failed to report message');
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 md:mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-[#D71921]" />
            <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D71921] to-[#B01419]">
            Community Chat
          </h1>
        </div>
        <p className="text-sm md:text-base text-gray-600 font-medium">
          Connect with mentors, students, and the community worldwide
        </p>
      </motion.div>

      <div className="flex-1 bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row">
        <AnimatePresence>
          {(showConversations || window.innerWidth >= 768) && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 bg-white/80 backdrop-blur-xl"
            >
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#D71921] to-[#B01419]">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">Conversations</h3>
                </div>
              </div>
              <ConversationList
                onSelectConversation={(id) => {
                  setSelectedConversationId(id);
                  setShowConversations(false);
                }}
                selectedConversationId={selectedConversationId || undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversationId ? (
            <>
              <div className="p-3 md:p-4 border-b border-gray-200 bg-gradient-to-r from-[#D71921] to-[#B01419] flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowConversations(true)}
                  className="md:hidden p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base md:text-lg font-bold text-white truncate">
                    {selectedConversationId === 'publicRoom' ? '🌍 Global Community' : 'Conversation'}
                  </h2>
                  <AnimatePresence mode="wait">
                    {typingUsers.length > 0 ? (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                      >
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <p className="text-xs md:text-sm text-white/90 font-medium truncate">
                          {typingUsers[0].userName} is typing
                        </p>
                      </motion.div>
                    ) : (
                      selectedConversationId === 'publicRoom' && (
                        <motion.p
                          key="subtitle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs md:text-sm text-white/80 font-medium"
                        >
                          Active community members online
                        </motion.p>
                      )
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
                      <div className="w-12 h-12 rounded-full border-4 border-[#D71921] border-t-transparent animate-spin absolute top-0"></div>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-[#D71921]/20 to-[#B01419]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-10 h-10 text-[#D71921]" />
                      </div>
                      <p className="text-lg font-bold text-gray-700 mb-2">No messages yet</p>
                      <p className="text-sm text-gray-500">Be the first to start the conversation!</p>
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.messageId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <MessageBubble
                          message={message}
                          onAddReaction={(emoji) =>
                            handleReaction(message.messageId, emoji, message.senderId)
                          }
                          onLike={() => handleLike(message.messageId, message.senderId)}
                          onReport={() => handleReport(message.messageId)}
                        />
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="border-t border-gray-200 bg-white flex-shrink-0">
                <MessageComposer onSendMessage={handleSendMessage} onTyping={handleTyping} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-white">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-8"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-[#D71921]/20 to-[#B01419]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-12 h-12 text-[#D71921]" />
                </div>
                <p className="text-xl font-bold text-gray-700 mb-2">Select a conversation</p>
                <p className="text-sm text-gray-500">Choose from the list to start chatting</p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

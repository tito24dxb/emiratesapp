import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, Send, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import MessageBubble from '../components/community/MessageBubble';
import { communityChatService, Message, Conversation } from '../services/communityChatService';
import { presenceService, TypingData } from '../services/presenceService';
import { auth } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';

export default function CommunityPage() {
  const { currentUser } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === chatId);
      if (conversation) {
        setSelectedConversation(conversation);
        setSearchParams({});
      }
    }
  }, [searchParams, conversations]);

  if (!currentUser) return null;

  const chatAccess = checkFeatureAccess(currentUser, 'chat');
  if (!chatAccess.allowed) {
    return (
      <FeatureLock
        requiredPlan={chatAccess.requiresPlan || 'pro'}
        featureName="Group Chat"
        description={chatAccess.message}
      />
    );
  }

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

  useEffect(() => {
    if (!selectedConversation?.id) return;

    const unsubscribe = communityChatService.subscribeToMessages(selectedConversation.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    communityChatService.markAsRead(selectedConversation.id, currentUser.uid);

    return unsubscribe;
  }, [selectedConversation?.id, currentUser.uid]);

  useEffect(() => {
    if (!selectedConversation?.id) return;

    const unsubscribe = presenceService.subscribeToTyping(selectedConversation.id, (typing) => {
      setTypingUsers(typing.filter(t => t.userId !== currentUser.uid));
    });

    return unsubscribe;
  }, [selectedConversation?.id, currentUser.uid]);

  const handleSendMessage = async () => {
    if (!currentUser || !selectedConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      await communityChatService.sendMessage(
        selectedConversation.id,
        currentUser.uid,
        currentUser.name,
        newMessage,
        'text'
      );

      setNewMessage('');
      presenceService.stopTyping(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (selectedConversation?.id) {
      presenceService.updateTyping(selectedConversation.id, currentUser.uid, currentUser.name);
    }
  };

  const groupChats = conversations.filter(c => c.type === 'group');
  const marketplaceChats = conversations.filter(c => c.type === 'marketplace');
  const privateChats = conversations.filter(c => c.type === 'private');

  const getUnreadCount = () => {
    return conversations.filter(c => {
      const unreadCount = c.unreadCount?.[currentUser.uid] || 0;
      return unreadCount > 0;
    }).length;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light border border-gray-200 rounded-xl shadow-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 p-6 border-b border-gray-200">
        <MessageCircle className="w-6 h-6 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-900">Community Chat</h2>
        {getUnreadCount() > 0 && (
          <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold border border-red-300">
            {getUnreadCount()} unread
          </span>
        )}
      </div>

      <div className="flex h-[600px]">
        <div className="w-80 border-r border-gray-200 overflow-y-auto glass-light">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-600">No conversations yet</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {groupChats.length > 0 && groupChats.map((conversation) => {
                const unreadCount = conversation.unreadCount?.[currentUser.uid] || 0;
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 cursor-pointer transition ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-100'
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          conversation.id === 'publicRoom'
                            ? 'bg-gradient-to-br from-[#FF6B35] to-[#FFA500] text-white text-xl'
                            : 'bg-[#0084FF] text-white'
                        }`}>
                          {conversation.id === 'publicRoom' ? '🌍' : <Users className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{conversation.title}</h4>
                          <p className="text-xs text-gray-600">Group Chat</p>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {marketplaceChats.length > 0 && marketplaceChats.map((conversation) => {
                const unreadCount = conversation.unreadCount?.[currentUser.uid] || 0;
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 cursor-pointer transition border-l-4 border-green-500 ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-100'
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                          🛒
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{conversation.title}</h4>
                          <p className="text-xs text-green-600 font-medium">Marketplace</p>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {privateChats.length > 0 && privateChats.map((conversation) => {
                const unreadCount = conversation.unreadCount?.[currentUser.uid] || 0;
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 cursor-pointer transition ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-100'
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {conversation.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{conversation.title}</h4>
                          <p className="text-xs text-gray-600">Private Chat</p>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-200 glass-light">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedConversation.id === 'publicRoom'
                        ? 'bg-gradient-to-br from-[#FF6B35] to-[#FFA500] text-white'
                        : selectedConversation.type === 'marketplace'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                        : selectedConversation.type === 'private'
                        ? 'bg-gray-700 text-white'
                        : 'bg-[#0084FF] text-white'
                    }`}>
                      {selectedConversation.id === 'publicRoom' ? '🌍' :
                       selectedConversation.type === 'marketplace' ? '🛒' :
                       selectedConversation.type === 'private' ? selectedConversation.title.charAt(0).toUpperCase() :
                       <Users className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedConversation.title}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedConversation.type === 'group' ? 'Group Chat' :
                         selectedConversation.type === 'marketplace' ? 'Marketplace Chat' :
                         'Private Chat'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto glass-light space-y-3">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} currentUserId={currentUser.uid} />
                ))}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-xs text-gray-600">{typingUsers[0].userName} is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 glass-light border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 glass-light border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#D71920] focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

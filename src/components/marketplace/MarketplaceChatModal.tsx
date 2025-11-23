import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Minus, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { communityChatService, Message } from '../../services/communityChatService';
import { createNotification } from '../../services/unifiedNotificationService';

interface MarketplaceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  productImage?: string;
  sellerId: string;
  sellerName: string;
  onConversationCreated?: (conversationId: string) => void;
}

export default function MarketplaceChatModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  productImage,
  sellerId,
  sellerName,
  onConversationCreated
}: MarketplaceChatModalProps) {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      const unsubscribe = communityChatService.subscribeToMessages(
        conversationId,
        (newMessages) => {
          setMessages(newMessages);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      );

      return unsubscribe;
    }
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!currentUser || !newMessage.trim()) return;

    setSending(true);
    try {
      let convId = conversationId;

      if (!convId) {
        // Create new conversation with marketplace category
        const title = `${currentUser.name} and ${sellerName} for ${productTitle}`;
        convId = await communityChatService.createConversation(
          'private',
          title,
          [currentUser.uid, sellerId],
          'marketplace'
        );

        setConversationId(convId);
        if (onConversationCreated) {
          onConversationCreated(convId);
        }
      }

      // Send the message
      await communityChatService.sendMessage(
        convId,
        currentUser.uid,
        newMessage,
        'text'
      );

      // Send notification to seller
      await createNotification({
        userId: sellerId,
        type: 'marketplace',
        title: 'New Message About Your Product',
        message: `${currentUser.name} sent you a message about "${productTitle}"`,
        link: `/community?chat=${convId}`,
        priority: 'high'
      });

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setConversationId(null);
    setMessages([]);
    setNewMessage('');
    onClose();
  };

  if (!currentUser) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
              style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
              onClick={handleClose}
            />
          )}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? '64px' : 'auto',
              maxHeight: isMinimized ? '64px' : 'calc(100vh - 120px)'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[9999] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="chat-header flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Contact Seller</h3>
                  <p className="text-xs text-gray-600 truncate max-w-[200px]">{sellerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/50 rounded-lg transition text-gray-600"
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/50 rounded-lg transition text-gray-600"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Product Info */}
                <div className="p-3 bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm border-b border-gray-200/50">
                  <div className="flex items-center gap-3">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={productTitle}
                        className="w-12 h-12 object-cover rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center shadow-md">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{productTitle}</p>
                      <p className="text-xs text-gray-600">Product Inquiry</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-white/50 via-transparent to-white/30 backdrop-blur-sm space-y-4 min-h-[300px] max-h-[400px]">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <MessageCircle className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-600 font-medium mb-2">Start a conversation</p>
                      <p className="text-sm text-gray-500 max-w-xs">
                        Send a message to {sellerName} about {productTitle}
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isUser = message.senderId === currentUser.uid;
                      const isSystemMessage = message.contentType === 'system';

                      if (isSystemMessage) {
                        return (
                          <div key={message.messageId} className="flex justify-center my-4">
                            <div className="chat-system-message">
                              {message.content}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={message.messageId}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={isUser ? 'chat-bubble-user' : 'chat-bubble-staff'}
                          >
                            <div className="chat-message-meta">
                              {isUser ? 'You' : sellerName}
                            </div>
                            <p className="chat-message-text">{message.content}</p>
                            <div className="chat-message-time">
                              {message.createdAt?.toDate?.()?.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="chat-input-container bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm border-t border-gray-200/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                      placeholder={conversationId ? "Type your message..." : `Ask ${sellerName} about this product...`}
                      className="flex-1 chat-input-field bg-white/90 backdrop-blur-sm"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

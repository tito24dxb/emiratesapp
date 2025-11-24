import { MessageCircle, ArrowLeft } from 'lucide-react';
import { Conversation, Message } from '../../services/communityChatService';
import ChatInput from './ChatInput';
import MessageList from './MessageList';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  typingUsers?: Array<{ userId: string; userName: string }>;
  onSendMessage: (message: string, file?: File) => void;
  onTyping: () => void;
  sending: boolean;
  onBack?: () => void;
}

export default function ChatWindow({
  conversation,
  messages,
  currentUserId,
  loading = false,
  hasMore = false,
  onLoadMore,
  typingUsers = [],
  onSendMessage,
  onTyping,
  sending,
  onBack,
}: ChatWindowProps) {
  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h2>
          <p className="text-gray-500 text-sm">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center gap-2 flex-shrink-0 bg-white">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base flex-shrink-0">
          {conversation.id === 'publicRoom' ? '🌍' :
           conversation.type === 'marketplace' ? '🛒' :
           conversation.type === 'private' ? conversation.title.charAt(0).toUpperCase() :
           '💬'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate text-sm">{conversation.title}</h2>
          <p className="text-xs text-gray-500">
            {conversation.type === 'group' && 'Group Chat'}
            {conversation.type === 'private' && 'Direct Message'}
            {conversation.type === 'marketplace' && 'Marketplace'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          typingUsers={typingUsers}
        />
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        <ChatInput
          onSend={onSendMessage}
          onTyping={onTyping}
          disabled={sending}
          placeholder={`Message ${conversation.title}`}
        />
      </div>
    </div>
  );
}

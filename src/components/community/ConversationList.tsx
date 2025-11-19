import React, { useEffect, useState } from 'react';
import { Users, MessageCircle, Search, Plus } from 'lucide-react';
import { communityChatService, Conversation } from '../../services/communityChatService';

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = communityChatService.subscribeToConversations((convs) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D71921]"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#000000]">Conversations</h2>
          <button
            onClick={() => alert('New Conversation feature coming soon! For now, conversations are created automatically when you start chatting.')}
            className="p-2 bg-[#D71921] hover:bg-[#B01419] rounded-lg transition-colors"
            title="New conversation"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D71921] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <MessageCircle className="w-12 h-12 mb-4" />
            <p>No conversations yet</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-all border-b border-gray-100 ${
                selectedConversationId === conversation.id
                  ? 'bg-red-50 border-l-4 border-l-[#D71921]'
                  : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D71921] to-[#B01419] flex items-center justify-center text-white font-semibold shadow">
                {conversation.type === 'group' ? (
                  <Users className="w-6 h-6" />
                ) : (
                  conversation.title.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{conversation.title}</h3>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-400">
                      {conversation.lastMessage.createdAt.toDate().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                {conversation.lastMessage && (
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage.text}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {conversation.members.length} members
                  </span>
                  {conversation.pinned && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                      Pinned
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

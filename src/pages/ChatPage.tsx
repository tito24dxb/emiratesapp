import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import GroupChat from '../components/chat/GroupChat';
import PrivateChat from '../components/chat/PrivateChat';
import { useApp } from '../context/AppContext';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';

export default function ChatPage() {
  const { currentUser } = useApp();
  const chatAccess = checkFeatureAccess(currentUser, 'chat');
  const messagesAccess = checkFeatureAccess(currentUser, 'messages');
  const [activeTab, setActiveTab] = useState<'group' | 'private'>('group');

  if (!chatAccess.allowed && activeTab === 'group') {
    return (
      <FeatureLock
        requiredPlan={chatAccess.requiresPlan || 'pro'}
        featureName="Group Chat"
        description={chatAccess.message || 'Upgrade to access group chat'}
      />
    );
  }

  if (!messagesAccess.allowed && activeTab === 'private') {
    return (
      <FeatureLock
        requiredPlan={messagesAccess.requiresPlan || 'pro'}
        featureName="Private Messages"
        description={messagesAccess.message || 'Upgrade to send private messages'}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 md:mb-6"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">Messages</h1>
        <p className="text-sm md:text-base text-gray-600">
          Connect with mentors, students, and the community
        </p>
      </motion.div>

      <div className="mb-4 flex gap-2 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('group')}
          className={`px-4 md:px-6 py-3 font-bold transition ${
            activeTab === 'group'
              ? 'text-[#D71921] border-b-4 border-[#D71921] -mb-0.5'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Group Chat</span>
            <span className="sm:hidden">Group</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('private')}
          className={`px-4 md:px-6 py-3 font-bold transition ${
            activeTab === 'private'
              ? 'text-[#D71921] border-b-4 border-[#D71921] -mb-0.5'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span className="hidden sm:inline">Private Chat</span>
            <span className="sm:hidden">Private</span>
          </div>
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
        {activeTab === 'group' ? <GroupChat /> : <PrivateChat />}
      </div>
    </div>
  );
}

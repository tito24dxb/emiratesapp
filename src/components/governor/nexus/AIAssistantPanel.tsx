import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistantPanel() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const statusDoc = await getDoc(doc(db, 'systemControl', 'status'));
        if (statusDoc.exists()) {
          const data = statusDoc.data();
          setAiEnabled(data.aiEnabled ?? true);
        }
      } catch (error) {
        console.error('Error checking AI status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkAIStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !aiEnabled) return;

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      // TODO: Replace with actual AI proxy endpoint
      // const response = await fetch('/api/aiAssistantProxy', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ prompt })
      // });
      // const data = await response.json();

      // Placeholder response until AI integration is implemented
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'AI Assistant integration pending. DeepSeek/OpenRouter endpoint needs to be configured.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-lg bg-white/80 rounded-xl shadow-lg border border-gray-200/50 p-6"
      >
        <div className="text-center py-8 text-gray-500">Checking AI status...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-lg bg-white/80 rounded-xl shadow-lg border border-gray-200/50 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
          aiEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {aiEnabled ? 'Online' : 'Offline'}
        </span>
      </div>

      {!aiEnabled && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-700 font-semibold">AI Assistant Disabled</p>
            <p className="text-xs text-red-600 mt-1">
              Enable AI in System Flags to use this feature.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 bg-gray-50/50 rounded-lg">
            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Ask the AI assistant for help</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-50 border border-blue-200 ml-8'
                  : 'bg-gray-50 border border-gray-200 mr-8'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600">
                  {message.role === 'user' ? 'You' : 'AI'}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{message.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </motion.div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            AI is thinking...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={aiEnabled ? "Ask the AI assistant..." : "AI disabled"}
            disabled={!aiEnabled || loading}
            rows={2}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
          <button
            type="submit"
            disabled={!aiEnabled || loading || !prompt.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 self-end"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> AI proxy endpoint (/aiAssistantProxy) needs to be configured with DeepSeek/OpenRouter.
        </p>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, AlertCircle, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { openaiClient } from '../../../utils/openaiClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
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
        const statusDoc = await getDoc(doc(db, 'systemControl', 'ai'));
        if (statusDoc.exists()) {
          const data = statusDoc.data();
          setAiEnabled(data.enabled !== false);
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
    if (!prompt.trim() || !aiEnabled || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const chatMessages = [
        {
          role: 'system' as const,
          content: 'You are an AI assistant for the Emirates Academy Governor Control Nexus. Provide helpful, concise responses about system operations, analytics, and management tasks.',
        },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        {
          role: 'user' as const,
          content: userMessage.content,
        },
      ];

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      let streamedContent = '';

      await openaiClient.streamChat(chatMessages, {
        userId,
        onChunk: (content) => {
          streamedContent += content;
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = streamedContent;
            }
            return updated;
          });
        },
        onComplete: (totalTokens) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.tokensUsed = totalTokens;
            }
            return updated;
          });
        },
        onError: (error) => {
          console.error('AI Assistant Error:', error);
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = error.message?.includes('disabled')
                ? 'AI features are currently disabled. Enable them in the AI Control Panel below.'
                : `Failed to get AI response: ${error.message}`;
            }
            return updated;
          });
        },
      });
    } catch (error: any) {
      console.error('AI Assistant Error:', error);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = 'Failed to get AI response. Please check your Cloudflare Worker configuration.';
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-lg p-6"
      >
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-slate-400">Checking AI status...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
    >
      <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">AI Assistant</h2>
              <p className="text-xs text-slate-400">Powered by OpenAI GPT-4</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
            aiEnabled
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {aiEnabled ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {!aiEnabled && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-semibold">AI Assistant Disabled</p>
            <p className="text-xs text-red-400 mt-1">
              Enable AI in the AI Control Panel below to use this feature.
            </p>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-700">
              <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">AI Assistant Ready</p>
              <p className="text-xs text-slate-500 mt-1">Ask me anything about system operations</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500/20 border border-blue-500/30 ml-8'
                    : 'bg-slate-900/50 border border-slate-700 mr-8'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-400">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                  {message.tokensUsed && (
                    <span className="text-xs text-purple-400">{message.tokensUsed} tokens</span>
                  )}
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </motion.div>
            ))
          )}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 rounded-lg p-3 border border-slate-700"
            >
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              AI is thinking...
            </motion.div>
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
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!aiEnabled || loading || !prompt.trim()}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 self-end"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </motion.div>
  );
}

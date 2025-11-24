import { useState, useEffect, useRef } from 'react';
import { Send, Bot, X, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhancedAIService, AIMode } from '../services/enhancedAIService';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actionItems?: Array<{
    title: string;
    action: string;
    icon: string;
  }>;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AIMode;
}

export default function AIAssistant({ isOpen, onClose, initialMode = 'coach' }: AIAssistantProps) {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMode>(initialMode);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modes: Array<{ id: AIMode; label: string }> = [
    { id: 'coach', label: 'Training Coach' },
    { id: 'cv-mentor', label: 'CV Mentor' },
    { id: 'tech-support', label: 'Tech Support' },
    { id: 'marketplace-advisor', label: 'Marketplace' },
    { id: 'content-instructor', label: 'Learning Guide' },
  ];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const personality = enhancedAIService.getPersonality(currentMode);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: personality.greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, currentMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModeChange = (mode: AIMode) => {
    setCurrentMode(mode);
    enhancedAIService.setMode(mode);
    const personality = enhancedAIService.getPersonality(mode);
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: personality.greeting,
        timestamp: new Date(),
      },
    ]);
    setShowModeSelector(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentUser || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await enhancedAIService.generateAIResponse(
        currentUser.uid,
        userMessage.content,
        currentMode
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actionItems: response.actionItems,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
  };

  const personality = enhancedAIService.getPersonality(currentMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col"
      >
        <div className={`${personality.color} text-white p-4 rounded-t-2xl flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              {personality.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Assistant</h2>
              <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                className="flex items-center gap-1 text-sm text-white/90 hover:text-white transition-colors"
              >
                <span>{modes.find((m) => m.id === currentMode)?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {showModeSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 overflow-hidden"
            >
              <div className="p-3 grid grid-cols-2 gap-2">
                {modes.map((mode) => {
                  const modePersonality = enhancedAIService.getPersonality(mode.id);
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeChange(mode.id)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        currentMode === mode.id
                          ? `${modePersonality.color} text-white`
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{modePersonality.icon}</span>
                        <span className="text-sm font-medium">{mode.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-medium text-gray-600">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600 font-medium">Suggestions:</p>
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left text-xs bg-white/50 hover:bg-white/80 p-2 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {message.actionItems && message.actionItems.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600 font-medium">Quick Actions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {message.actionItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(item.action)}
                          className="flex items-center gap-2 text-xs bg-white/50 hover:bg-white/80 p-2 rounded-lg transition-colors"
                        >
                          <span>{item.icon}</span>
                          <span className="truncate">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { Brain, Upload, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function AITrainerPage() {
  const { currentUser } = useApp();
  const isPro = currentUser?.plan === 'pro' || currentUser?.plan === 'vip';
  const isVip = currentUser?.plan === 'vip';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#000000]">AI Trainer</h1>
            <p className="text-gray-600">Your personal career coach</p>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-[#D71921]" />
            <h2 className="text-xl font-bold text-[#000000]">CV Optimization</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Get your CV reviewed and optimized for Emirates recruitment standards.
          </p>
          {isPro ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#D71921] transition cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop your CV
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, or DOCX (Max 5MB)</p>
              </div>
              <button className="w-full bg-gradient-to-r from-[#D71921] to-[#B91518] text-white py-3 rounded-xl font-bold hover:shadow-lg transition">
                Analyze CV
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
              <p className="text-gray-600 font-semibold mb-2">Pro Feature</p>
              <p className="text-sm text-gray-500">Upgrade to Pro or VIP to access CV Optimization</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-[#FFD700]" />
            <h2 className="text-xl font-bold text-[#000000]">AI Chat Coach</h2>
            {isVip && (
              <span className="ml-auto px-3 py-1 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-[#000000] text-xs font-bold rounded-full">
                VIP Only
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-6">
            Have a conversation with our AI about interview prep, grooming, mindset, and more.
          </p>
          {isVip ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] rounded-xl p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>AI Coach:</strong> Hello! I'm here to help you prepare for your Emirates cabin crew journey. What would you like to work on today?
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button className="px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg text-xs font-semibold transition">
                    Interview Tips
                  </button>
                  <button className="px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg text-xs font-semibold transition">
                    Grooming Standards
                  </button>
                  <button className="px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg text-xs font-semibold transition">
                    English Practice
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition">
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
              <p className="text-gray-600 font-semibold mb-2">VIP Exclusive</p>
              <p className="text-sm text-gray-500">Upgrade to VIP to access AI Chat Coach</p>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-gradient-to-r from-[#D71921] to-[#B91518] rounded-2xl shadow-lg p-6 text-white"
      >
        <h3 className="text-xl font-bold mb-3">Coming Soon</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
            Real-time CV feedback with Emirates-specific recommendations
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
            Mock interview sessions with AI voice interaction
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
            Personalized learning paths based on your progress
          </li>
        </ul>
      </motion.div>
    </div>
  );
}

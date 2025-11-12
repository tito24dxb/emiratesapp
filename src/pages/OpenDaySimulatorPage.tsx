import { Plane, CheckCircle, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function OpenDaySimulatorPage() {
  const { currentUser } = useApp();
  const isPro = currentUser?.plan === 'pro' || currentUser?.plan === 'vip';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#000000]">Open Day Simulator</h1>
            <p className="text-gray-600">Practice for the real assessment day</p>
          </div>
        </div>
      </motion.div>

      {!isPro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-blue-900 mb-2">Unlock Open Day Simulator</h3>
          <p className="text-blue-700 mb-4">
            Upgrade to Pro or VIP to access the full Open Day Simulator and practice with realistic scenarios.
          </p>
          <button className="px-6 py-2 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition">
            Upgrade Now
          </button>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-[#000000] mb-2">Group Assessment</h3>
          <p className="text-sm text-gray-600 mb-4">
            Practice teamwork exercises and group discussions
          </p>
          {isPro ? (
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
              Start Practice
            </button>
          ) : (
            <div className="w-full py-2 bg-gray-200 text-gray-500 rounded-lg font-semibold text-center cursor-not-allowed">
              Pro Required
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-[#000000] mb-2">English Test</h3>
          <p className="text-sm text-gray-600 mb-4">
            B2 level English proficiency assessment
          </p>
          {isPro ? (
            <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
              Take Test
            </button>
          ) : (
            <div className="w-full py-2 bg-gray-200 text-gray-500 rounded-lg font-semibold text-center cursor-not-allowed">
              Pro Required
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-[#000000] mb-2">Timed Scenarios</h3>
          <p className="text-sm text-gray-600 mb-4">
            Handle realistic cabin crew situations under time pressure
          </p>
          {isPro ? (
            <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition">
              Start Challenge
            </button>
          ) : (
            <div className="w-full py-2 bg-gray-200 text-gray-500 rounded-lg font-semibold text-center cursor-not-allowed">
              Pro Required
            </div>
          )}
        </motion.div>
      </div>

      {isPro && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-[#000000] mb-4">Your Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Completed Simulations</span>
                <span className="font-bold text-[#000000]">0/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-[#D71921] to-[#B91518] h-3 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Average Score</span>
                <span className="font-bold text-[#000000]">--</span>
              </div>
              <p className="text-xs text-gray-500">Complete at least one simulation to see your average</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-gradient-to-r from-[#EADBC8] to-[#F5E6D3] rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-xl font-bold text-[#000000] mb-3">What to Expect</h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Realistic scenarios based on actual Emirates assessment days</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Instant feedback on your performance and areas for improvement</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Multiple-choice questions and situation-based challenges</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Track your progress and identify strengths and weaknesses</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}

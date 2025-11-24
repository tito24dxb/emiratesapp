import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Key, Users, Shield, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function WaitlistGatePage() {
  const [view, setView] = useState<'gate' | 'waitlist' | 'staff'>('gate');
  const [staffCode, setStaffCode] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const navigate = useNavigate();

  const handleStaffCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: codeError } = await supabase
        .from('staff_access_codes')
        .select('*')
        .eq('code', staffCode)
        .eq('is_active', true)
        .maybeSingle();

      if (codeError || !data) {
        setError('Invalid staff code. Please try again.');
        setLoading(false);
        return;
      }

      await supabase
        .from('staff_access_codes')
        .update({ used_count: data.used_count + 1 })
        .eq('id', data.id);

      navigate('/login');
    } catch (err: any) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: waitlistError } = await supabase
        .from('waitlist')
        .insert({
          email: waitlistEmail,
          name: waitlistName
        });

      if (waitlistError) {
        if (waitlistError.code === '23505') {
          setError('This email is already on the waitlist.');
        } else {
          setError('Failed to join waitlist. Please try again.');
        }
        setLoading(false);
        return;
      }

      setWaitlistSuccess(true);
    } catch (err: any) {
      setError('Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'waitlist') {
    if (waitlistSuccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're on the list!</h2>
              <p className="text-gray-600 mb-6">
                We'll notify you via email when Emirates Academy launches. Thank you for your interest!
              </p>
              <button
                onClick={() => {
                  setView('gate');
                  setWaitlistSuccess(false);
                  setWaitlistEmail('');
                  setWaitlistName('');
                  setError('');
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-lg hover:opacity-90 shadow-lg"
              >
                Back
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
            >
              <Users className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join the Waitlist</h1>
            <p className="text-gray-600">Be the first to know when we launch</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={waitlistName}
                  onChange={(e) => setWaitlistName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Joining...' : 'Join Waitlist'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('gate');
                  setError('');
                }}
                className="w-full py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'staff') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
            >
              <Key className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Access</h1>
            <p className="text-gray-600">Enter your staff access code</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
            <form onSubmit={handleStaffCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder="Enter staff code"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Verifying...' : 'Access Portal'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('gate');
                  setError('');
                }}
                className="w-full py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
          >
            <Plane className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emirates Academy</h1>
          <p className="text-gray-600">Welcome! Choose an option to continue</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('staff')}
            className="w-full p-4 border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg hover:border-blue-600 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-sky-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">Staff Portal</h3>
                <p className="text-sm text-gray-600">Access with your staff code</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('waitlist')}
            className="w-full p-4 border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:border-green-600 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">Join Waitlist</h3>
                <p className="text-sm text-gray-600">Be notified when we launch</p>
              </div>
            </div>
          </motion.button>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-gray-500 mt-6"
        >
          Emirates Academy is launching soon!
        </motion.p>
      </motion.div>
    </div>
  );
}

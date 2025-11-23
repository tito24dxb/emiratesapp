import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, AlertTriangle, Shield } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { totpService } from '../services/totpService';

interface Disable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userId: string;
  onSuccess: () => void;
}

export default function Disable2FAModal({
  isOpen,
  onClose,
  userEmail,
  userId,
  onSuccess,
}: Disable2FAModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(false);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, userEmail, password);
      setConfirmationStep(true);
    } catch (err: any) {
      console.error('Password verification failed:', err);

      let errorMessage = 'Invalid password. Please try again.';

      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    setError('');

    try {
      await totpService.disable2FA(userId);
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Failed to disable 2FA:', err);
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setConfirmationStep(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card rounded-2xl p-6 max-w-md w-full border-2 border-red-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Disable Two-Factor Authentication
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">Security Warning</p>
                <p className="text-sm text-red-700">
                  Disabling 2FA will make your account less secure. You will only need your password to sign in.
                </p>
              </div>
            </div>
          </div>

          {!confirmationStep ? (
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Confirm Your Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Enter your account password to verify your identity
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Password'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-gray-900 font-bold mb-2">Are you absolutely sure?</p>
                <p className="text-sm text-gray-600">
                  This action will remove two-factor authentication from your account. You can re-enable it at any time from your security settings.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

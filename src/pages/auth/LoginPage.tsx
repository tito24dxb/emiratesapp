import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Plane, Lock, Mail, Shield, Key, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';
import { recordLoginActivity } from '../../services/loginActivityService';
import { totpService } from '../../services/totpService';

export default function LoginPage() {
  const [view, setView] = useState<'gate' | 'waitlist' | 'login'>('gate');
  const [staffCode, setStaffCode] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const { setCurrentUser } = useApp();
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

      setView('login');
      setError('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      sessionStorage.setItem('pending2FA', 'true');

      const tempCredential = await signInWithEmailAndPassword(auth, email, password);
      const tempUser = tempCredential.user;

      const has2FA = await totpService.check2FAStatus(tempUser.uid);

      if (has2FA) {
        const userDocRef = doc(db, 'users', tempUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        setPendingUserId(tempUser.uid);
        setPendingUserData({
          uid: tempUser.uid,
          email: userData?.email || tempUser.email,
          name: userData?.name || 'User',
          role: (userData?.role || 'student') as 'student' | 'mentor' | 'governor',
          plan: (userData?.plan || 'free') as 'free' | 'pro' | 'vip',
          country: userData?.country || '',
          bio: userData?.bio || '',
          expectations: userData?.expectations || '',
          photoURL: userData?.photo_base64 || '',
          hasCompletedOnboarding: userData?.hasCompletedOnboarding || false,
          hasSeenWelcomeBanner: userData?.hasSeenWelcomeBanner || false,
          onboardingCompletedAt: userData?.onboardingCompletedAt,
          welcomeBannerSeenAt: userData?.welcomeBannerSeenAt,
          createdAt: userData?.createdAt || new Date().toISOString(),
          updatedAt: userData?.updatedAt || new Date().toISOString(),
        });

        setShow2FA(true);
        setLoading(false);
        return;
      }

      sessionStorage.removeItem('pending2FA');

      const userDocRef = doc(db, 'users', tempUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User profile not found. Please contact support.');
      }

      const userData = userDoc.data();
      const currentUser = {
        uid: tempUser.uid,
        email: userData.email || tempUser.email,
        name: userData.name || 'User',
        role: (userData.role || 'student') as 'student' | 'mentor' | 'governor',
        plan: (userData.plan || 'free') as 'free' | 'pro' | 'vip',
        country: userData.country || '',
        bio: userData.bio || '',
        expectations: userData.expectations || '',
        photoURL: userData.photo_base64 || '',
        hasCompletedOnboarding: userData.hasCompletedOnboarding || false,
        hasSeenWelcomeBanner: userData.hasSeenWelcomeBanner || false,
        onboardingCompletedAt: userData.onboardingCompletedAt,
        welcomeBannerSeenAt: userData.welcomeBannerSeenAt,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
      };

      await recordLoginActivity(tempUser.uid);
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
      });

      setCurrentUser(currentUser);

      if (!currentUser.hasCompletedOnboarding) {
        navigate('/profile?onboarding=true');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!pendingUserId) {
        throw new Error('Session expired. Please login again.');
      }

      let isValid = false;

      if (useBackupCode) {
        isValid = await totpService.verifyBackupCode(pendingUserId, twoFactorCode.trim());
        if (!isValid) {
          throw new Error('Invalid backup code');
        }
      } else {
        isValid = await totpService.verifyTOTP(pendingUserId, twoFactorCode.trim());
        if (!isValid) {
          throw new Error('Invalid authentication code');
        }
      }

      sessionStorage.removeItem('pending2FA');

      await recordLoginActivity(pendingUserId);

      const userDocRef = doc(db, 'users', pendingUserId);
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
      });

      setCurrentUser(pendingUserData);

      if (!pendingUserData.hasCompletedOnboarding) {
        navigate('/profile?onboarding=true');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
      setLoading(false);
    }
  };

  if (view === 'gate') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Plane className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Emirates Academy</h1>
            <p className="text-gray-600">Welcome! Please choose an option</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 space-y-4">
            <form onSubmit={handleStaffCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Access Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter staff code"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Access Staff Portal'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <button
              onClick={() => setView('waitlist')}
              className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Join Waitlist
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'waitlist') {
    if (waitlistSuccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 text-center">
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
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join the Waitlist</h1>
            <p className="text-gray-600">Be the first to know when we launch</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={waitlistName}
                  onChange={(e) => setWaitlistName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join Waitlist'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('gate');
                  setError('');
                }}
                className="w-full py-2 text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-600">Enter your {useBackupCode ? 'backup code' : '6-digit code'}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
            <form onSubmit={handle2FAVerification} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {useBackupCode ? 'Backup Code' : 'Authentication Code'}
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
                  maxLength={useBackupCode ? 8 : 6}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>

              <button
                type="button"
                onClick={() => setUseBackupCode(!useBackupCode)}
                className="w-full text-sm text-blue-600 hover:text-blue-700"
              >
                {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Plane className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <button
          onClick={() => setView('gate')}
          className="w-full mt-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Back to Options
        </button>
      </motion.div>
    </div>
  );
}

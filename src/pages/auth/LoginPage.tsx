import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Plane, Lock, Mail, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { recordLoginActivity } from '../../services/loginActivityService';
import { totpService } from '../../services/totpService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { setCurrentUser } = useApp();
  const navigate = useNavigate();

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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          role: 'student',
          plan: 'free',
          country: '',
          bio: '',
          expectations: '',
          photo_base64: user.photoURL || '',
          points: 0,
          hasCompletedOnboarding: false,
          hasSeenWelcomeBanner: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const userData = userDoc.exists() ? userDoc.data() : {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'User',
        role: 'student',
        plan: 'free',
        country: '',
        bio: '',
        expectations: '',
        photo_base64: user.photoURL || '',
        hasCompletedOnboarding: false,
        hasSeenWelcomeBanner: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const currentUser = {
        uid: user.uid,
        email: userData.email || user.email,
        name: userData.name || user.displayName || 'User',
        role: (userData.role || 'student') as 'student' | 'mentor' | 'governor',
        plan: (userData.plan || 'free') as 'free' | 'pro' | 'vip',
        country: userData.country || '',
        bio: userData.bio || '',
        expectations: userData.expectations || '',
        photoURL: userData.photo_base64 || user.photoURL || '',
        hasCompletedOnboarding: userData.hasCompletedOnboarding || false,
        hasSeenWelcomeBanner: userData.hasSeenWelcomeBanner || false,
        onboardingCompletedAt: userData.onboardingCompletedAt,
        welcomeBannerSeenAt: userData.welcomeBannerSeenAt,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
      };

      await recordLoginActivity(user.uid);
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
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled');
      } else {
        setError(err.message || 'Google login failed');
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

  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-600">Enter your {useBackupCode ? 'backup code' : '6-digit code'}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
            <form onSubmit={handle2FAVerification} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {useBackupCode ? 'Backup Code' : 'Authentication Code'}
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest bg-white"
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
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Plane className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/70 text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">Sign in with Google</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

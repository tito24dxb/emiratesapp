import { useState } from 'react';
import { Plane, Lock, Mail, Shield, Key, Fingerprint, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  const VALID_ACCESS_CODE = 'Gigi171224@';

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === VALID_ACCESS_CODE) {
      setShowWaitlist(false);
      setError('');
    } else {
      setError('Invalid access code. Please try again.');
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      console.log('Waitlist submission:', { waitlistName, waitlistEmail, waitlistPhone });
      setWaitlistSuccess(true);
      setLoading(false);
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email === 'demo@example.com' && password === 'demo123') {
        setShow2FA(true);
        setLoading(false);
      } else {
        setError('Invalid email or password');
        setLoading(false);
      }
    }, 1000);
  };

  const handleGoogleSignIn = () => {
    setError('');
    setLoading(true);

    setTimeout(() => {
      console.log('Google Sign-In clicked');
      setLoading(false);
    }, 1000);
  };

  const handle2FAVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (useBackupCode ? twoFactorCode.length === 8 : twoFactorCode === '123456') {
        console.log('2FA verified, redirecting to dashboard...');
        setLoading(false);
      } else {
        setError('Invalid verification code');
        setLoading(false);
      }
    }, 1000);
  };

  if (showWaitlist) {
    if (waitlistSuccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
          <div className="max-w-md w-full">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">You're on the list!</h2>
                <p className="text-gray-600 mb-6">
                  We'll notify you at <span className="font-semibold">{waitlistEmail}</span> when access becomes available.
                </p>
                <button
                  onClick={() => {
                    setShowWaitlist(false);
                    setWaitlistSuccess(false);
                    setWaitlistName('');
                    setWaitlistEmail('');
                    setWaitlistPhone('');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl font-bold hover:opacity-90 transition"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="max-w-md w-full">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Plane className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Join the Waitlist
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Be the first to know when we launch
            </p>

            <form onSubmit={handleWaitlistSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none bg-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none bg-white"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <input
                    type="tel"
                    value={waitlistPhone}
                    onChange={(e) => setWaitlistPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none bg-white"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Submitting...' : 'Join Waitlist'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/70 text-gray-500">Have an access code?</span>
                </div>
              </div>

              <form onSubmit={handleAccessCodeSubmit} className="mt-4">
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none bg-white"
                    placeholder="Enter access code"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                )}
                <button
                  type="submit"
                  className="w-full mt-3 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Access Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <div className="max-w-md w-full">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Plane className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Sign in to The Crew Academy
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none bg-white"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none bg-white"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-400/40 text-gray-900 px-4 py-3 text-sm rounded-xl">
                {error}
              </div>
            )}

            {show2FA && (
              <div className="border-2 border-red-500/30 rounded-xl p-5 bg-gradient-to-br from-red-50 to-white">
                <div className="flex items-center gap-3 mb-4">
                  {useBackupCode ? (
                    <Key className="w-6 h-6 text-red-600" />
                  ) : (
                    <Shield className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-600">
                      {useBackupCode ? 'Enter a backup code' : 'Enter code from your authenticator app'}
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => {
                    if (useBackupCode) {
                      setTwoFactorCode(e.target.value.toUpperCase().slice(0, 8));
                    } else {
                      setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    }
                  }}
                  placeholder={useBackupCode ? 'ABC12345' : '000000'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-mono text-xl text-center tracking-widest focus:border-red-500 outline-none mb-3"
                  maxLength={useBackupCode ? 8 : 6}
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode('');
                    setError('');
                  }}
                  className="w-full text-xs text-red-600 hover:underline mb-3"
                >
                  {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShow2FA(false);
                      setTwoFactorCode('');
                      setError('');
                      setUseBackupCode(false);
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handle2FAVerification}
                    disabled={loading || (useBackupCode ? twoFactorCode.length !== 8 : twoFactorCode.length !== 6)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || show2FA}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Signing In...' : 'Sign In'}
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
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <button
              type="button"
              onClick={() => alert('Biometric authentication would be triggered here')}
              disabled={loading}
              className="mt-3 w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Fingerprint className="w-5 h-5" />
              Sign in with Face ID / Touch ID
            </button>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setShowWaitlist(true)}
                className="text-blue-600 font-bold hover:underline"
              >
                Join Waitlist
              </button>
            </p>
            <button
              type="button"
              onClick={() => setShowWaitlist(true)}
              className="text-gray-500 text-xs hover:text-gray-700 hover:underline"
            >
              Need an access code?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

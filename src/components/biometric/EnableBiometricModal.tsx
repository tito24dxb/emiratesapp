import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, Shield, Check, Copy, AlertCircle } from 'lucide-react';
import { useBiometric } from '../../hooks/useBiometric';

interface EnableBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnableBiometricModal({
  isOpen,
  onClose,
  onSuccess
}: EnableBiometricModalProps) {
  const [step, setStep] = useState<'intro' | 'setup' | 'backup'>('intro');
  const [deviceName, setDeviceName] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const { loading, error, isBiometricAvailable, registerBiometric } = useBiometric();

  useEffect(() => {
    if (isOpen) {
      checkAvailability();
      detectDeviceName();
    }
  }, [isOpen]);

  const checkAvailability = async () => {
    const available = await isBiometricAvailable();
    setIsAvailable(available);
  };

  const detectDeviceName = () => {
    const userAgent = navigator.userAgent;
    let device = 'This Device';

    if (/iPhone|iPad|iPod/.test(userAgent)) {
      device = 'iPhone';
    } else if (/Android/.test(userAgent)) {
      device = 'Android Device';
    } else if (/Macintosh/.test(userAgent)) {
      device = 'MacBook';
    } else if (/Windows/.test(userAgent)) {
      device = 'Windows PC';
    } else if (/Linux/.test(userAgent)) {
      device = 'Linux Device';
    }

    const browser = /Chrome/.test(userAgent) ? 'Chrome' :
                    /Safari/.test(userAgent) ? 'Safari' :
                    /Firefox/.test(userAgent) ? 'Firefox' :
                    /Edge/.test(userAgent) ? 'Edge' : 'Browser';

    setDeviceName(`${browser} on ${device}`);
  };

  const handleSetup = async () => {
    if (!deviceName.trim()) {
      return;
    }

    try {
      const codes = await registerBiometric(deviceName);
      setBackupCodes(codes);
      setStep('backup');
    } catch (err) {
      console.error('Failed to enable biometric:', err);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
    setStep('intro');
  };

  const handleClose = () => {
    if (step !== 'backup') {
      onClose();
      setStep('intro');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {step !== 'backup' && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {step === 'intro' && (
            <div className="p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Fingerprint className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Enable Biometric Login
              </h2>

              <p className="text-gray-600 text-center mb-6">
                Sign in securely using Face ID, Touch ID, or Windows Hello
              </p>

              {!isAvailable && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Biometric Not Available
                    </p>
                    <p className="text-sm text-amber-700">
                      Your device doesn't support biometric authentication or it's not enabled in your browser settings.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Secure & Fast</h3>
                    <p className="text-sm text-gray-600">
                      No more passwords. Just your face or fingerprint.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Device Bound</h3>
                    <p className="text-sm text-gray-600">
                      Your credentials never leave this device.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('setup')}
                disabled={!isAvailable}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'setup' && (
            <div className="p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Fingerprint className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Name Your Device
              </h2>

              <p className="text-gray-600 text-center mb-6">
                This helps you identify this device in your trusted devices list
              </p>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Device Name
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., Chrome on MacBook Pro"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleSetup}
                disabled={loading || !deviceName.trim()}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Enable Biometric Login'}
              </button>
            </div>
          )}

          {step === 'backup' && (
            <div className="p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Save Your Backup Codes
              </h2>

              <p className="text-gray-600 text-center mb-6">
                Store these codes in a safe place. Each can be used once to sign in if you lose access to your device.
              </p>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-white rounded-lg border border-gray-200 font-mono text-sm text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCopyBackupCodes}
                  className="w-full py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  {copiedCodes ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy All Codes</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-900 font-semibold mb-1">
                  Important: Save These Codes
                </p>
                <p className="text-sm text-amber-800">
                  You won't be able to see these codes again. Save them in a password manager or print them out.
                </p>
              </div>

              <button
                onClick={handleComplete}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition"
              >
                I've Saved My Backup Codes
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

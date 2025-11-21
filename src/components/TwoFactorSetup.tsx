import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Copy, Check, AlertCircle } from 'lucide-react';
import { twoFactorService } from '../services/twoFactorService';

interface TwoFactorSetupProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
}

export default function TwoFactorSetup({ userId, userEmail, onComplete }: TwoFactorSetupProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'qr' | 'verify' | 'backup' | 'complete'>('qr');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const { secret: generatedSecret, qrCode: generatedQRCode } = await twoFactorService.generateSecret(userId, userEmail);
      const codes = await twoFactorService.getBackupCodes(userId);

      setSecret(generatedSecret);
      setQrCode(generatedQRCode);
      setBackupCodes(codes);
      setLoading(false);
    } catch (err) {
      console.error('Error generating 2FA:', err);
      setError('Failed to generate 2FA setup. Please try again.');
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'backup') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const success = await twoFactorService.enableTwoFactor(userId, verificationCode);

      if (success) {
        setStep('backup');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-600">Secure your account with Google Authenticator</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {step === 'qr' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Step 1: Scan QR Code</h3>
              <p className="text-gray-600 mb-4">Open Google Authenticator app and scan this QR code:</p>

              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Can't scan? Enter this code manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded font-mono text-sm">
                    {secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(secret, 'secret')}
                    className="p-2 hover:bg-gray-200 rounded transition"
                  >
                    {copiedSecret ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
            >
              Continue to Verification
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Step 2: Verify Code</h3>
              <p className="text-gray-600 mb-4">Enter the 6-digit code from Google Authenticator:</p>

              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-mono text-2xl text-center tracking-widest focus:border-[#D71920] outline-none"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('qr')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={verifying || verificationCode.length !== 6}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Step 3: Save Backup Codes</h3>
              <p className="text-gray-600 mb-4">
                Store these backup codes in a safe place. Each code can be used once if you lose access to your authenticator.
              </p>

              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-center">
                      {code}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  {copiedBackup ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy All Codes</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> These codes won't be shown again. Save them now!
                </p>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:shadow-lg transition"
            >
              I've Saved My Backup Codes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

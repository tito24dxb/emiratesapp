import { useState, useEffect } from 'react';
import { Shield, Key, CheckCircle, XCircle, Copy, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { totpService } from '../services/totpService';

export default function TwoFactorSetup() {
  const { currentUser } = useApp();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkStatus();
  }, [currentUser]);

  const checkStatus = async () => {
    if (!currentUser) return;

    try {
      const status = await totpService.check2FAStatus(currentUser.uid);
      setEnabled(status);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleEnable = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const { secret: newSecret, uri } = totpService.generateSecret();
      const qrCodeUrl = await totpService.generateQRCode(uri);

      setSecret(newSecret);
      setQrCode(qrCodeUrl);
      setShowSetup(true);
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      setError('Failed to generate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!currentUser || !secret || !verificationCode) return;

    setLoading(true);
    setError('');

    try {
      const isValid = totpService.verifyToken(secret, verificationCode);

      if (!isValid) {
        setError('Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      const codes = await totpService.enable2FA(
        currentUser.uid,
        currentUser.email,
        secret
      );

      setBackupCodes(codes);
      setShowBackupCodes(true);
      setEnabled(true);
      setShowSetup(false);
      setSuccess('Two-factor authentication enabled successfully!');
      setVerificationCode('');
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to disable two-factor authentication?'))
      return;

    setLoading(true);
    setError('');

    try {
      await totpService.disable2FA(currentUser.uid);
      setEnabled(false);
      setSuccess('Two-factor authentication disabled');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setSuccess('Secret key copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const downloadBackupCodes = () => {
    const text = `Emirates Academy - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nBackup Codes:\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emirates-academy-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
          {success}
        </div>
      )}

      {!showSetup && !showBackupCodes && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Shield className={`w-6 h-6 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-semibold text-gray-900">
                Two-Factor Authentication
              </p>
              <p className="text-sm text-gray-600">
                {enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={enabled ? handleDisable : handleEnable}
            disabled={loading}
            className={`px-4 py-2 rounded-xl font-semibold transition disabled:opacity-50 ${
              enabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white hover:shadow-lg'
            }`}
          >
            {loading ? 'Processing...' : enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      )}

      {showSetup && (
        <div className="space-y-6">
          <div className="p-6 border-2 border-gray-300 rounded-xl bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Set Up Two-Factor Authentication
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-4">
                  Scan this QR code with your authenticator app (Google
                  Authenticator, Microsoft Authenticator, Authy, etc.)
                </p>
                {qrCode && (
                  <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-xl">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Or enter this key manually:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={secret}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={copySecret}
                    className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    <Copy className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter verification code from your app:
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, '').slice(0, 6)
                    )
                  }
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleVerifyAndEnable}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify and Enable'}
                </button>
                <button
                  onClick={() => {
                    setShowSetup(false);
                    setSecret('');
                    setQrCode('');
                    setVerificationCode('');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBackupCodes && (
        <div className="p-6 border-2 border-green-500 rounded-xl bg-green-50">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-green-900">
              Save Your Backup Codes
            </h3>
          </div>

          <p className="text-sm text-green-800 mb-4">
            Save these backup codes in a safe place. You can use them to access
            your account if you lose your authenticator device. Each code can
            only be used once.
          </p>

          <div className="grid grid-cols-2 gap-2 p-4 bg-white rounded-xl border border-green-200 mb-4">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="font-mono text-sm px-3 py-2 bg-gray-50 rounded border border-gray-200"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadBackupCodes}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Backup Codes
            </button>
            <button
              onClick={() => setShowBackupCodes(false)}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

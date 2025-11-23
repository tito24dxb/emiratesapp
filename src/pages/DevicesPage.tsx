import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Trash2, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBiometric } from '../hooks/useBiometric';
import { useApp } from '../context/AppContext';

interface BiometricDevice {
  id: string;
  deviceName: string;
  createdAt: Date;
  lastSeen: Date;
  revoked: boolean;
}

export default function DevicesPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { listDevices, revokeDevice, loading } = useBiometric();
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const deviceList = await listDevices();
      setDevices(deviceList);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const handleRevokeDevice = async (credentialId: string) => {
    if (!confirm('Are you sure you want to revoke this device? You will no longer be able to use biometric login on this device.')) {
      return;
    }

    setRevoking(credentialId);
    try {
      await revokeDevice(credentialId);
      await loadDevices();
      alert('Device revoked successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to revoke device');
    } finally {
      setRevoking(null);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Settings</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trusted Devices</h1>
              <p className="text-gray-600">Manage devices with biometric authentication</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">
              About Trusted Devices
            </p>
            <p className="text-sm text-blue-800">
              These devices have been registered for biometric login. You can use fingerprint, Face ID, or other biometric methods on these devices to quickly sign in.
            </p>
          </div>
        </div>

        {/* Devices List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Your Devices ({devices.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {loading && devices.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading devices...</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="p-8 text-center">
                <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No trusted devices</p>
                <p className="text-sm text-gray-500 mb-4">
                  Enable biometric login in Settings to add a device
                </p>
                <button
                  onClick={() => navigate('/settings')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Go to Settings
                </button>
              </div>
            ) : (
              devices.map((device) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                          {device.deviceName}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Added:</span>{' '}
                            {device.createdAt.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Last used:</span>{' '}
                            {device.lastSeen.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                          <Shield className="w-3 h-3" />
                          Active & Trusted
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeDevice(device.id)}
                      disabled={revoking === device.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      title="Revoke device"
                    >
                      {revoking === device.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Warning Section */}
        {devices.length > 0 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">
                Security Notice
              </p>
              <p className="text-sm text-amber-800">
                If you revoke a device, you will need to register it again to use biometric login. Make sure you have access to your password or backup codes before revoking all devices.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

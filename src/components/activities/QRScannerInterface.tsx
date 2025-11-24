import { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { activityAttendanceService } from '../../services/activityAttendanceService';

interface QRScannerInterfaceProps {
  activityId?: string;
  onScanSuccess?: (data: any) => void;
  onClose?: () => void;
}

export default function QRScannerInterface({ activityId, onScanSuccess, onClose }: QRScannerInterfaceProps) {
  const { currentUser } = useApp();
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Camera access denied. Please use manual code entry.'
      });
      setScanMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleManualCheckIn = async () => {
    if (!currentUser || !manualCode.trim()) return;

    setResult(null);
    const code = manualCode.trim();

    try {
      const match = code.match(/check-in:(.+)/);
      if (!match) {
        setResult({
          type: 'error',
          message: 'Invalid QR code format. Please scan a valid activity QR code.'
        });
        return;
      }

      const scannedActivityId = match[1];

      if (activityId && scannedActivityId !== activityId) {
        setResult({
          type: 'warning',
          message: 'This QR code is for a different activity.'
        });
        return;
      }

      const checkInResult = await activityAttendanceService.checkIn(
        scannedActivityId,
        currentUser.uid,
        currentUser.name,
        currentUser.email,
        'qr_scan'
      );

      if (checkInResult.success) {
        setResult({
          type: 'success',
          message: checkInResult.message
        });
        setManualCode('');

        if (onScanSuccess) {
          onScanSuccess({
            activityId: scannedActivityId,
            userId: currentUser.uid
          });
        }

        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setResult({
          type: 'error',
          message: checkInResult.message
        });
      }
    } catch (error: any) {
      setResult({
        type: 'error',
        message: error.message || 'Check-in failed. Please try again.'
      });
    }
  };

  const handleCameraCapture = () => {
    setResult({
      type: 'warning',
      message: 'Camera QR scanning is not yet implemented. Please use manual entry.'
    });
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full border border-white/50 overflow-hidden">
      <div className="bg-gradient-to-r from-[#D71920] to-[#B91518] text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">QR Code Scanner</h2>
              <p className="text-sm opacity-90">Check in to activity</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setScanMode('manual');
              stopCamera();
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              scanMode === 'manual'
                ? 'bg-[#D71920] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => {
              setScanMode('camera');
              startCamera();
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              scanMode === 'camera'
                ? 'bg-[#D71920] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera className="inline w-5 h-5 mr-2" />
            Camera Scan
          </button>
        </div>

        <AnimatePresence mode="wait">
          {scanMode === 'manual' ? (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter QR Code Manually
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                    placeholder="e.g., check-in:abc123"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                  />
                  <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Enter the code from the QR code or scan it with your device
                </p>
              </div>

              <button
                onClick={handleManualCheckIn}
                disabled={!manualCode.trim()}
                className="w-full py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Check In
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="camera"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-6">
                <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden">
                  {scanning ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-4 border-white rounded-xl opacity-50"></div>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                          Position QR code within the frame
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-sm opacity-75">Camera not started</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {scanning ? (
                  <>
                    <button
                      onClick={stopCamera}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                      Stop Camera
                    </button>
                    <button
                      onClick={handleCameraCapture}
                      className="flex-1 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Capture
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startCamera}
                    className="w-full py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
                result.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : result.type === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {result.type === 'success' ? (
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
              ) : result.type === 'warning' ? (
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{result.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How to check in:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Scan the QR code displayed at the activity venue</li>
                <li>Or manually enter the code from the QR image</li>
                <li>Make sure you're at the correct activity location</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Calendar, MapPin, Users, Clock, DollarSign, Check, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { activityAttendanceService } from '../../services/activityAttendanceService';
import { walletService } from '../../services/walletService';

interface Activity {
  id: string;
  name: string;
  description: string;
  type: string;
  date: Date;
  location: string;
  capacity: number;
  registered: number;
  price: number;
  duration: number;
  imageUrl?: string;
  organizerName: string;
  tags: string[];
}

interface ActivityJoinFlowProps {
  activity: Activity;
  onJoinSuccess?: () => void;
  onCancel?: () => void;
}

export default function ActivityJoinFlow({ activity, onJoinSuccess, onCancel }: ActivityJoinFlowProps) {
  const { currentUser } = useApp();
  const [step, setStep] = useState<'confirm' | 'payment' | 'success'>('confirm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  const isFree = activity.price === 0;
  const isFull = activity.registered >= activity.capacity;
  const spotsLeft = activity.capacity - activity.registered;

  useState(async () => {
    if (currentUser && activity.price > 0) {
      const wallet = await walletService.getWallet(currentUser.uid);
      if (wallet) {
        setWalletBalance(wallet.balance);
      }
    }
  });

  const handleJoin = async () => {
    if (!currentUser || isFull) return;

    setLoading(true);
    setError('');

    try {
      if (isFree) {
        const result = await activityAttendanceService.joinActivity(
          activity.id,
          currentUser.uid,
          currentUser.name,
          currentUser.email
        );

        if (result.success) {
          setStep('success');
          setTimeout(() => {
            if (onJoinSuccess) onJoinSuccess();
          }, 2000);
        } else {
          setError(result.message);
        }
      } else {
        setStep('payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join activity');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      if (useWallet && walletBalance >= activity.price) {
        await walletService.deductFromWallet(
          currentUser.uid,
          activity.price,
          'booking',
          `Joined activity: ${activity.name}`
        );

        const result = await activityAttendanceService.joinActivity(
          activity.id,
          currentUser.uid,
          currentUser.name,
          currentUser.email
        );

        if (result.success) {
          setStep('success');
          setTimeout(() => {
            if (onJoinSuccess) onJoinSuccess();
          }, 2000);
        } else {
          setError(result.message);
        }
      } else {
        setError('Insufficient wallet balance or payment method required');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full border border-white/50 overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {activity.imageUrl && (
              <div className="w-full h-48 overflow-hidden">
                <img
                  src={activity.imageUrl}
                  alt={activity.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-3xl font-bold text-gray-900">{activity.name}</h2>
                  {isFree ? (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                      FREE
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                      ${activity.price}
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{activity.description}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-semibold">
                      {activity.date.toLocaleDateString()} at {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold">{activity.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold">{activity.duration} minutes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="font-semibold">
                      {activity.registered} / {activity.capacity} registered
                      {!isFull && (
                        <span className="ml-2 text-sm text-green-600">
                          ({spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Organized by</p>
                    <p className="font-semibold">{activity.organizerName}</p>
                  </div>
                </div>
              </div>

              {activity.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {activity.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {error}
                </div>
              )}

              {isFull && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
                  This activity is fully booked. Please check back later for availability.
                </div>
              )}

              <div className="flex gap-4">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleJoin}
                  disabled={loading || isFull}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isFree ? 'Join Activity' : 'Continue to Payment'}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Payment Details</h2>

            <div className="mb-6 p-6 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Activity Fee</span>
                <span className="text-2xl font-bold text-gray-900">${activity.price}</span>
              </div>
              <div className="text-sm text-gray-500">{activity.name}</div>
            </div>

            <div className="space-y-4 mb-6">
              <button
                onClick={() => setUseWallet(true)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  useWallet
                    ? 'border-[#D71920] bg-[#D71920]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Wallet Balance</p>
                      <p className="text-sm text-gray-600">
                        Available: ${walletBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {useWallet && (
                    <div className="w-6 h-6 bg-[#D71920] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {walletBalance < activity.price && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                  Insufficient wallet balance. Please top up your wallet to continue.
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={loading || !useWallet || walletBalance < activity.price}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Payment
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Successfully Joined!</h2>
            <p className="text-gray-600 mb-6">
              You're all set for {activity.name}. Check your email for confirmation and QR code.
            </p>
            <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
              <p>📧 Confirmation email sent</p>
              <p>🎫 QR code for check-in generated</p>
              <p>📅 Event added to your calendar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

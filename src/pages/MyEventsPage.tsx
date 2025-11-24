import { useState, useEffect } from 'react';
import { Calendar, MapPin, QrCode, ChevronDown, ChevronUp, CheckCircle, Clock, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { getMyEventOrders, MarketplaceOrder } from '../services/orderService';
import { getProduct } from '../services/marketplaceService';
import { activityAttendanceService } from '../services/activityAttendanceService';
import { getActivity } from '../services/activityManagementService';

interface EventWithProduct extends MarketplaceOrder {
  eventDate?: Date;
  eventLocation?: string;
  source?: 'marketplace' | 'activity';
  activityName?: string;
  qrCode?: string;
}

export default function MyEventsPage() {
  const { currentUser } = useApp();
  const [events, setEvents] = useState<EventWithProduct[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser]);

  const loadEvents = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Load marketplace event orders
      const orders = await getMyEventOrders(currentUser.uid);
      const marketplaceEvents = await Promise.all(
        orders.map(async (order) => {
          const product = await getProduct(order.product_id);
          return {
            ...order,
            eventDate: product?.activity_date ? new Date(product.activity_date) : undefined,
            eventLocation: product?.activity_location,
            source: 'marketplace' as const
          };
        })
      );

      // Load activity registrations
      const attendance = await activityAttendanceService.getUserAttendance(currentUser.uid);
      const activityEvents = await Promise.all(
        attendance.map(async (att) => {
          const activity = await getActivity(att.activityId);
          return {
            id: att.id,
            order_number: att.id,
            product_title: activity?.title || 'Unknown Activity',
            product_image: activity?.imageUrl,
            amount: activity?.price || 0,
            status: 'completed' as const,
            attendance_status: att.checkInTime ? 'checked_in' as const : 'registered' as const,
            qr_code: att.qrCode,
            eventDate: activity?.date,
            eventLocation: activity?.location,
            source: 'activity' as const,
            activityName: activity?.title,
            qrCode: att.qrCode,
            created_at: att.joinedAt,
            buyer_id: currentUser.uid,
            seller_id: activity?.creatorId || '',
            product_id: att.activityId,
          } as EventWithProduct;
        })
      );

      // Combine and sort by date
      const allEvents = [...marketplaceEvents, ...activityEvents].sort((a, b) => {
        const dateA = a.eventDate || new Date(0);
        const dateB = b.eventDate || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (order: EventWithProduct) => {
    if (!order.qr_code) return;

    const link = document.createElement('a');
    link.href = order.qr_code;
    link.download = `event-qr-${order.order_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-gray-600">View your event tickets and check-in QR codes</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-gray-600">You haven't registered for any events yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => {
              const isExpanded = expandedOrder === event.id;
              const isPast = event.eventDate && event.eventDate < new Date();
              const isCheckedIn = event.attendance_status === 'checked_in';

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/60 backdrop-blur-xl rounded-xl overflow-hidden border border-white/30 shadow-lg"
                >
                  {event.product_image && (
                    <img
                      src={event.product_image}
                      alt={event.product_title}
                      className="w-full h-48 object-cover"
                    />
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{event.product_title}</h3>
                      </div>
                      {isCheckedIn ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Checked In
                        </span>
                      ) : isPast ? (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                          Ended
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Awaited
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {event.eventDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-[#D71920]" />
                          <span>
                            {event.eventDate.toLocaleDateString()} at{' '}
                            {event.eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      {event.eventLocation && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin className="w-4 h-4 text-[#D71920]" />
                          <span>{event.eventLocation}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Order #{event.order_number}</span>
                      {event.qr_code && !isPast && (
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : event.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg hover:opacity-90 transition-all"
                        >
                          <QrCode className="w-4 h-4" />
                          {isExpanded ? 'Hide' : 'Show'} QR Code
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {/* QR Code Section */}
                    <AnimatePresence>
                      {isExpanded && event.qr_code && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="bg-gradient-to-r from-[#D71920]/5 to-[#B91518]/5 rounded-xl p-6">
                              <h4 className="font-semibold text-gray-900 mb-3 text-center">Check-In QR Code</h4>
                              <div className="bg-white p-4 rounded-lg inline-block mx-auto flex flex-col items-center w-full">
                                <img
                                  src={event.qr_code}
                                  alt="Event QR Code"
                                  className="w-64 h-64 mx-auto"
                                />
                                <p className="text-xs text-gray-600 text-center mt-3 mb-3">
                                  Show this QR code at the event for check-in
                                </p>
                                <button
                                  onClick={() => downloadQRCode(event)}
                                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all text-sm"
                                >
                                  <Download className="w-4 h-4" />
                                  Download QR Code
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

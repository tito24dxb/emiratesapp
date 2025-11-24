import { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, QrCode, ChevronDown, ChevronUp, CheckCircle, Clock, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { eventOrderService, EventOrder } from '../services/eventOrderService';

export default function MyEventsPage() {
  const { currentUser } = useApp();
  const [upcomingEvents, setUpcomingEvents] = useState<EventOrder[]>([]);
  const [pastEvents, setPastEvents] = useState<EventOrder[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser]);

  const loadEvents = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const allOrders = await eventOrderService.getUserEventOrders(currentUser.uid);
      const now = new Date();

      const upcoming = allOrders.filter(
        order => order.payment_status === 'completed' && order.event_date.toDate() >= now
      );

      const past = allOrders.filter(
        order => order.payment_status === 'completed' && order.event_date.toDate() < now
      );

      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEventCard = (order: EventOrder) => {
    const isExpanded = expandedOrder === order.id;
    const eventDate = order.event_date.toDate();
    const isPast = eventDate < new Date();

    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-xl rounded-xl overflow-hidden border border-white/30 shadow-lg"
      >
        {order.product_image && (
          <img
            src={order.product_image}
            alt={order.event_title}
            className="w-full h-48 object-cover"
          />
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{order.event_title}</h3>
              <p className="text-sm text-gray-600 mb-4">{order.event_description}</p>
            </div>
            {order.check_in_status === 'checked_in' ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1 h-fit">
                <CheckCircle className="w-3 h-3" />
                Checked In
              </span>
            ) : isPast ? (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full h-fit">
                No Show
              </span>
            ) : (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1 h-fit">
                <Clock className="w-3 h-3" />
                Awaited
              </span>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-[#D71920]" />
              <span>
                {eventDate.toLocaleDateString()} at{' '}
                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-[#D71920]" />
              <span>{order.event_location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Ticket className="w-4 h-4 text-[#D71920]" />
              <span>{order.quantity} {order.quantity === 1 ? 'Ticket' : 'Tickets'}</span>
            </div>
          </div>

          <button
            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
            className="w-full px-4 py-2 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition font-semibold flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            {isExpanded ? 'Hide Details' : 'View QR Code & Details'}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#D71920]" />
                    Your Event QR Code
                  </h4>
                  <div className="bg-white p-4 rounded-lg border-4 border-[#D71920] flex flex-col items-center">
                    <img
                      src={order.qr_code}
                      alt="Event QR Code"
                      className="w-64 h-64"
                    />
                    <p className="text-xs text-gray-600 mt-3 text-center">
                      Show this QR code at the event entrance
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-mono break-all text-center max-w-xs">
                      {order.qr_code_data}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-mono font-semibold">{order.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tickets:</span>
                      <span className="font-semibold">{order.quantity} × ${(order.price_per_ticket / 100).toFixed(2)}</span>
                    </div>
                    {order.wallet_amount_used && order.wallet_amount_used > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Wallet className="w-4 h-4" />
                          Wallet Payment:
                        </span>
                        <span className="font-semibold">-${(order.wallet_amount_used / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {order.stripe_amount && order.stripe_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Card Payment:</span>
                        <span className="font-semibold">${(order.stripe_amount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="font-semibold text-gray-900">Total Paid:</span>
                      <span className="font-bold text-[#D71920]">${(order.total_amount / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-semibold capitalize">{order.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchase Date:</span>
                      <span className="font-semibold">{order.created_at.toDate().toLocaleDateString()}</span>
                    </div>
                    {order.check_in_status === 'checked_in' && order.checked_in_at && (
                      <div className="flex justify-between text-green-600">
                        <span>Checked in at:</span>
                        <span className="font-semibold">
                          {order.checked_in_at.toDate().toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {!isPast && order.check_in_status !== 'checked_in' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>📱 Check-In Instructions:</strong>
                      <br />
                      1. Arrive at the event venue
                      <br />
                      2. Show this QR code to the event staff
                      <br />
                      3. They will scan it to mark your attendance
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center">
              <Ticket className="w-7 h-7 text-white" />
            </div>
            My Events
          </h1>
          <p className="text-gray-600">Your purchased event tickets and QR codes</p>
        </motion.div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'upcoming'
                ? 'bg-[#D71920] text-white'
                : 'bg-white/60 text-gray-700 hover:bg-white/80'
            }`}
          >
            Upcoming Events ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'past'
                ? 'bg-[#D71920] text-white'
                : 'bg-white/60 text-gray-700 hover:bg-white/80'
            }`}
          >
            Past Events ({pastEvents.length})
          </button>
        </div>

        {activeTab === 'upcoming' && (
          <>
            {upcomingEvents.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-12 text-center border border-white/30 shadow-lg">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No upcoming events</p>
                <p className="text-sm text-gray-500">Purchase event tickets from the marketplace to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {upcomingEvents.map(renderEventCard)}
              </div>
            )}
          </>
        )}

        {activeTab === 'past' && (
          <>
            {pastEvents.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-12 text-center border border-white/30 shadow-lg">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No past events</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pastEvents.map(renderEventCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

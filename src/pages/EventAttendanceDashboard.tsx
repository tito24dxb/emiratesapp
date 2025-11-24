import { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, Clock, QrCode, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { eventOrderService, EventOrder } from '../services/eventOrderService';
import { getProduct, MarketplaceProduct } from '../services/marketplaceService';

interface EventWithOrders {
  product: MarketplaceProduct;
  orders: EventOrder[];
  stats: {
    total_sales: number;
    total_participants: number;
    checked_in: number;
    awaited: number;
    revenue: number;
  };
}

export default function EventAttendanceDashboard() {
  const { currentUser } = useApp();
  const [events, setEvents] = useState<EventWithOrders[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithOrders | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanInput, setScanInput] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser]);

  const loadEvents = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const orders = await eventOrderService.getSellerEvents(currentUser.uid);

      const uniqueProductIds = [...new Set(orders.map(o => o.product_id))];

      const eventsData: EventWithOrders[] = [];

      for (const productId of uniqueProductIds) {
        const product = await getProduct(productId);
        if (product && product.product_type === 'activity') {
          const productOrders = orders.filter(o => o.product_id === productId);
          const stats = await eventOrderService.getEventStats(productId);

          eventsData.push({
            product,
            orders: productOrders,
            stats
          });
        }
      }

      eventsData.sort((a, b) => {
        const dateA = a.product.activity_date?.toMillis() || 0;
        const dateB = b.product.activity_date?.toMillis() || 0;
        return dateB - dateA;
      });

      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;

    setScanning(true);
    try {
      const match = scanInput.match(/event-check-in:(.+)/);
      if (!match) {
        alert('Invalid QR code format');
        setScanning(false);
        return;
      }

      const orderId = match[1];
      const result = await eventOrderService.checkInAttendee(orderId, currentUser?.uid);

      if (result.success) {
        alert(result.message);
        setScanInput('');
        await loadEvents();
        if (selectedEvent) {
          const updatedEvent = events.find(e => e.product.id === selectedEvent.product.id);
          if (updatedEvent) {
            setSelectedEvent(updatedEvent);
          }
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error scanning:', error);
      alert('Scan failed: ' + (error as Error).message);
    } finally {
      setScanning(false);
    }
  };

  const handleCheckIn = async (orderId: string) => {
    try {
      const result = await eventOrderService.checkInAttendee(orderId, currentUser?.uid);
      alert(result.message);
      if (result.success) {
        await loadEvents();
        if (selectedEvent) {
          const updatedEvent = events.find(e => e.product.id === selectedEvent.product.id);
          if (updatedEvent) {
            setSelectedEvent(updatedEvent);
          }
        }
      }
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Check-in failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!selectedEvent) {
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
                <Calendar className="w-7 h-7 text-white" />
              </div>
              Event Attendance Dashboard
            </h1>
            <p className="text-gray-600">Manage your event attendees and check-ins</p>
          </motion.div>

          {events.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-12 text-center border border-white/30 shadow-lg">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No events found</p>
              <p className="text-sm text-gray-500">Create event products in the marketplace to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <motion.div
                  key={event.product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white/60 backdrop-blur-xl rounded-xl overflow-hidden border border-white/30 shadow-lg cursor-pointer hover:shadow-xl transition"
                >
                  {event.product.images && event.product.images[0] && (
                    <img
                      src={event.product.images[0]}
                      alt={event.product.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.product.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.product.description}</p>

                    {event.product.activity_date && (
                      <div className="text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {event.product.activity_date.toDate().toLocaleDateString()} at{' '}
                        {event.product.activity_date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600">Checked In</p>
                        <p className="text-lg font-bold text-green-600">{event.stats.checked_in}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Awaited</p>
                        <p className="text-lg font-bold text-orange-600">{event.stats.awaited}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="text-lg font-bold text-[#D71920]">{event.stats.total_participants}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Revenue</p>
                        <p className="text-lg font-bold text-gray-900">${(event.stats.revenue / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => setSelectedEvent(null)}
          className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold flex items-center gap-2"
        >
          ← Back to Events
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedEvent.product.title}</h2>
          <p className="text-gray-600 mb-4">{selectedEvent.product.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-2xl font-bold text-green-600">{selectedEvent.stats.checked_in}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-sm text-gray-600">Awaited</p>
              <p className="text-2xl font-bold text-orange-600">{selectedEvent.stats.awaited}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{selectedEvent.stats.total_participants}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <DollarSign className="w-6 h-6 text-gray-600 mb-2" />
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${(selectedEvent.stats.revenue / 100).toFixed(2)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#D71920]" />
            QR Code Scanner
          </h3>
          <p className="text-sm text-gray-600 mb-4">Scan attendee QR codes to check them in</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Paste QR code data (event-check-in:xxx)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]"
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
            />
            <button
              onClick={handleScan}
              disabled={scanning || !scanInput.trim()}
              className="px-6 py-3 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition font-semibold disabled:opacity-50"
            >
              {scanning ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Attendee List ({selectedEvent.orders.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tickets</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedEvent.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.buyer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.buyer_email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">${(order.total_amount / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {order.check_in_status === 'checked_in' ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Checked In
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          Awaited
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {order.check_in_status !== 'checked_in' && (
                        <button
                          onClick={() => handleCheckIn(order.id)}
                          className="text-[#D71920] hover:text-[#B91518] text-sm font-semibold"
                        >
                          Check In
                        </button>
                      )}
                      {order.check_in_status === 'checked_in' && order.checked_in_at && (
                        <span className="text-xs text-gray-500">
                          {order.checked_in_at.toDate().toLocaleTimeString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Clock, User, Activity } from 'lucide-react';
import { useFirestoreCollection } from '../../../hooks/useFirestoreRealtime';
import { orderBy, limit } from 'firebase/firestore';

interface AuditEvent {
  id: string;
  timestamp: any;
  eventType: string;
  userId: string;
  userName?: string;
  details?: string;
}

export default function RealtimeLogs() {
  const { data: events, loading } = useFirestoreCollection<AuditEvent>('auditEvents');

  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.timestamp?.toDate?.() || new Date(0);
    const timeB = b.timestamp?.toDate?.() || new Date(0);
    return timeB.getTime() - timeA.getTime();
  }).slice(0, 10);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getEventColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'login':
      case 'register':
        return 'text-green-400 bg-green-950 border-green-700';
      case 'logout':
        return 'text-slate-400 bg-slate-800 border-slate-600';
      case 'error':
      case 'failed':
        return 'text-red-400 bg-red-950 border-red-700';
      case 'warning':
        return 'text-yellow-400 bg-yellow-950 border-yellow-700';
      case 'command':
        return 'text-purple-400 bg-purple-950 border-purple-700';
      default:
        return 'text-blue-400 bg-blue-950 border-blue-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Real-time Audit Logs</h2>
        {!loading && (
          <span className="ml-auto text-xs text-slate-400 px-2 py-1 bg-slate-700 rounded border border-slate-600">{events.length} events</span>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading logs...</div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-700">
            <Activity className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No logs yet</p>
            <p className="text-xs text-slate-500 mt-1">Events will appear here in real-time</p>
          </div>
        ) : (
          sortedEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition"
            >
              <div className="flex items-start gap-3">
                <div className={`px-2 py-1 rounded border text-xs font-bold uppercase tracking-wide ${getEventColor(event.eventType)}`}>
                  {event.eventType}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3 h-3 text-slate-500" />
                    <span className="font-medium text-slate-300 truncate">
                      {event.userName || event.userId || 'Unknown'}
                    </span>
                  </div>
                  {event.details && (
                    <p className="text-xs text-slate-400 mt-1">{event.details}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(event.timestamp)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  subscribeToAllTickets,
  subscribeToTicketMessages,
  sendSupportMessage,
  updateTicketStatus,
  markMessagesAsRead,
  SupportTicket,
  SupportMessage
} from '../../../services/supportChatService';

export default function SupportChatManager() {
  const { currentUser } = useApp();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllTickets((newTickets) => {
      setTickets(newTickets);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedTicket?.id) return;

    const unsubscribe = subscribeToTicketMessages(selectedTicket.id, (newMessages) => {
      setMessages(newMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    markMessagesAsRead(selectedTicket.id, 'governor');

    return unsubscribe;
  }, [selectedTicket?.id]);

  const handleSendMessage = async () => {
    if (!currentUser || !selectedTicket || !newMessage.trim()) return;

    setSending(true);
    try {
      await sendSupportMessage(
        selectedTicket.id,
        currentUser.uid,
        currentUser.name,
        'governor',
        newMessage
      );

      setNewMessage('');

      if (selectedTicket.status === 'open') {
        await updateTicketStatus(selectedTicket.id, 'in_progress');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await updateTicketStatus(ticketId, status);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    const badges = {
      open: { color: 'bg-blue-900 text-blue-200', icon: Clock, label: 'Open' },
      in_progress: { color: 'bg-yellow-900 text-yellow-200', icon: AlertCircle, label: 'In Progress' },
      resolved: { color: 'bg-green-900 text-green-200', icon: CheckCircle, label: 'Resolved' },
      closed: { color: 'bg-slate-700 text-slate-300', icon: CheckCircle, label: 'Closed' },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 p-6 border-b border-slate-700">
        <MessageCircle className="w-6 h-6 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-100">Support Chat Manager</h2>
        <span className="ml-auto px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm font-bold">
          {tickets.filter(t => t.unreadByGovernor > 0).length} unread
        </span>
      </div>

      <div className="flex h-[600px]">
        <div className="w-80 border-r border-slate-700 overflow-y-auto bg-slate-900">
          {tickets.length === 0 ? (
            <div className="p-4 text-center text-slate-400">No support tickets yet</div>
          ) : (
            <div className="divide-y divide-slate-700">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 cursor-pointer transition ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-slate-700'
                      : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-100 truncate">{ticket.subject}</h4>
                      <p className="text-xs text-slate-400 truncate">{ticket.userName}</p>
                    </div>
                    {ticket.unreadByGovernor > 0 && (
                      <span className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                        {ticket.unreadByGovernor}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {getStatusBadge(ticket.status)}
                    <span className="text-xs text-slate-500">
                      {ticket.lastMessageAt?.toDate?.()?.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a ticket to view conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-700 bg-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-100">{selectedTicket.subject}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {selectedTicket.userName} • {selectedTicket.userEmail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as any)}
                      className="px-3 py-1 bg-slate-700 text-slate-100 rounded text-sm font-bold border border-slate-600 focus:outline-none focus:border-slate-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto bg-slate-900 space-y-3">
                {messages.map((message) => {
                  const isGovernor = message.senderRole === 'governor';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isGovernor ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isGovernor
                            ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-100'
                            : 'bg-slate-800 text-slate-100 border border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1 opacity-70">
                          {message.senderName}
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <div className="text-xs mt-1 opacity-50">
                          {message.timestamp?.toDate?.()?.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-slate-800 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

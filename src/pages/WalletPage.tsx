import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, DollarSign, Clock, Filter, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { walletService, Wallet, Transaction } from '../services/walletService';

export default function WalletPage() {
  const { currentUser } = useApp();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadWalletData();
  }, [currentUser]);

  const loadWalletData = async () => {
    if (!currentUser) return;

    try {
      let walletData = await walletService.getWallet(currentUser.uid);

      if (!walletData) {
        walletData = await walletService.createWallet(currentUser.uid, currentUser.name);
      }

      setWallet(walletData);

      const txHistory = await walletService.getTransactionHistory(currentUser.uid);
      setTransactions(txHistory);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
    return true;
  });

  const getCategoryIcon = (category: Transaction['category']) => {
    const icons: Record<Transaction['category'], string> = {
      referral: '👥',
      achievement: '🏆',
      cashback: '💰',
      purchase: '🛒',
      booking: '📅',
      admin_credit: '⚙️',
      refund: '↩️',
      bonus: '🎁'
    };
    return icons[category] || '💵';
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
              <WalletIcon className="w-7 h-7 text-white" />
            </div>
            My Wallet
          </h1>
          <p className="text-gray-600">Manage your credits and view transaction history</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-gradient-to-r from-[#D71920]/90 to-[#B91518]/90 backdrop-blur-xl rounded-2xl p-8 text-white shadow-xl border border-white/20">
              <p className="text-sm opacity-80 mb-2">Available Balance</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold">${wallet?.balance.toFixed(2) || '0.00'}</span>
                <span className="text-xl opacity-80">{wallet?.currency || 'USD'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm opacity-80">Total Earned</span>
                  </div>
                  <p className="text-2xl font-bold">${wallet?.totalEarned.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-sm opacity-80">Total Spent</span>
                  </div>
                  <p className="text-2xl font-bold">${wallet?.totalSpent.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wallet Status</p>
                  <p className="font-bold text-gray-900 capitalize">{wallet?.status || 'Active'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Transaction</p>
                  <p className="font-bold text-gray-900">
                    {wallet?.lastTransactionAt
                      ? new Date(wallet.lastTransactionAt.toDate()).toLocaleDateString()
                      : 'No transactions'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
              <div className="flex flex-wrap gap-3">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credits</option>
                  <option value="debit">Debits</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                >
                  <option value="all">All Categories</option>
                  <option value="referral">Referrals</option>
                  <option value="achievement">Achievements</option>
                  <option value="cashback">Cashback</option>
                  <option value="purchase">Purchases</option>
                  <option value="booking">Bookings</option>
                  <option value="bonus">Bonuses</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <WalletIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Earn credits through referrals, achievements, and cashback
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCategoryIcon(tx.category)}</span>
                          <div>
                            <p className="font-semibold text-gray-900 capitalize">{tx.category.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500 capitalize">{tx.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{tx.description}</p>
                        {tx.flaggedForReview && (
                          <p className="text-xs text-orange-600 mt-1">⚠️ Under review</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tx.createdAt.toDate().toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {tx.createdAt.toDate().toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-lg font-bold ${
                            tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-blue-50/60 backdrop-blur-xl rounded-xl p-6 border border-blue-200/30"
        >
          <h3 className="font-bold text-gray-900 mb-3">💡 Ways to Earn Credits</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D71920] rounded-full"></span>
              Invite friends and earn $10 per referral
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D71920] rounded-full"></span>
              Complete achievements and challenges
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D71920] rounded-full"></span>
              Get cashback on marketplace purchases
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D71920] rounded-full"></span>
              Participate in special events and promotions
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

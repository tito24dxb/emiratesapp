import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, Activity, Mail, MapPin, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface DashboardMetrics {
  currentMRR: string;
  currentCustomers: number;
  activeCustomers: number;
  churnRate: number;
  totalTransactions: number;
  supportTickets: {
    all: number;
    open: number;
    pending: number;
    closed: number;
  };
}

export default function GovernorControlNexus() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    currentMRR: '$12.4k',
    currentCustomers: 16601,
    activeCustomers: 33,
    churnRate: 2,
    totalTransactions: 342,
    supportTickets: {
      all: 4,
      open: 1,
      pending: 2,
      closed: 1
    }
  });

  const [trendData] = useState([
    { month: 'Jan', value: 78 },
    { month: 'Feb', value: 95 },
    { month: 'Mar', value: 65 },
    { month: 'Apr', value: 82 },
    { month: 'May', value: 110 },
    { month: 'Jun', value: 88 },
    { month: 'Jul', value: 105 }
  ]);

  const [salesData] = useState([
    { label: 'Mastercard', value: 35, color: '#2b4162' },
    { label: 'VISA A/c', value: 25, color: '#3e000c' },
    { label: 'Invoices flow', value: 40, color: '#e71d36' }
  ]);

  const [transactionData] = useState([
    { type: 'Withdraw', count: 145, change: 12 },
    { type: 'Refund', count: 89, change: -8 },
    { type: 'Pending', count: 67, change: 5 },
    { type: 'Hardware', count: 34, change: 3 },
    { type: 'Transfer', count: 23, change: -4 },
    { type: 'Fund', count: 87, change: 15 },
    { type: 'Sector', count: 56, change: 7 }
  ]);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const currentCustomers = usersSnapshot.size;

      const activeQuery = query(
        collection(db, 'users'),
        where('lastActive', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      );
      const activeSnapshot = await getDocs(activeQuery);
      const activeCustomers = activeSnapshot.size;

      setMetrics(prev => ({
        ...prev,
        currentCustomers,
        activeCustomers: Math.round((activeCustomers / currentCustomers) * 100)
      }));
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const maxTrendValue = Math.max(...trendData.map(d => d.value));

  return (
    <div className="min-h-screen p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <input
            type="search"
            placeholder="Search transactions, customers, invoices..."
            className="glass-input px-6 py-3 w-96 text-sm"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 parallax-hover"
          style={{background: 'var(--yale-glass)', backdropFilter: 'blur(24px)'}}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/80 font-medium">Current MRR</p>
          </div>
          <p className="text-4xl font-bold text-white">{metrics.currentMRR}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 parallax-hover"
          style={{background: 'var(--jasmine-glass)', backdropFilter: 'blur(24px)'}}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-800 font-medium">Current Customers</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">{metrics.currentCustomers.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 parallax-hover"
          style={{background: 'var(--primary-glass)', backdropFilter: 'blur(24px)'}}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/80 font-medium">Active Customers</p>
          </div>
          <p className="text-4xl font-bold text-white">{metrics.activeCustomers}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 parallax-hover"
          style={{background: 'var(--primary-glass-hover)', backdropFilter: 'blur(24px)'}}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/80 font-medium">Churn Rate</p>
          </div>
          <p className="text-4xl font-bold text-white">{metrics.churnRate}%</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Trend</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#e71d36]"></div>
                <span className="text-gray-600">Inbound</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600">Outbound</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-600">Grow</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-4">
            {trendData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-200 rounded-t-lg" style={{height: `${(data.value / maxTrendValue) * 100}%`}}>
                  <div className="w-full h-full bg-[#e71d36] rounded-t-lg"></div>
                </div>
                <span className="text-xs text-gray-600">{data.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sales</h2>
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="transform -rotate-90 w-full h-full">
              {salesData.reduce((acc, item, index) => {
                const previousTotal = salesData.slice(0, index).reduce((sum, d) => sum + d.value, 0);
                const circumference = 2 * Math.PI * 70;
                const offset = (previousTotal / 100) * circumference;
                const strokeDasharray = `${(item.value / 100) * circumference} ${circumference}`;

                return [...acc, (
                  <circle
                    key={index}
                    cx="96"
                    cy="96"
                    r="70"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="40"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={-offset}
                    className="transition-all duration-500"
                  />
                )];
              }, [] as JSX.Element[])}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{metrics.totalTransactions}</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {salesData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                  <span className="text-gray-700">{item.label}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
          <button className="glass-button-primary w-full mt-6 px-4 py-3 text-white font-semibold text-sm">
            View all transactions
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Transactions</h2>
          <div className="space-y-3">
            {transactionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#e71d36]"></div>
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    item.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Support Tickets</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-semibold rounded-full bg-[#e71d36] text-white">
                All
              </button>
              <button className="px-3 py-1 text-xs font-semibold rounded-full glass-button-secondary text-gray-700">
                Open
              </button>
              <button className="px-3 py-1 text-xs font-semibold rounded-full glass-button-secondary text-gray-700">
                Pending
              </button>
              <button className="px-3 py-1 text-xs font-semibold rounded-full glass-button-secondary text-gray-700">
                Closed
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { email: 'trisha.wilt72@yandrex.com', issue: 'Login Issue', priority: 'HIGH' },
              { email: 'dane.sert964@yandex.com', issue: 'Billing inquiry', priority: 'LOW' },
              { email: 'amy.smit11@8f6r59dcaus.uk', issue: 'Product Malfunction', priority: 'MEDIUM' },
              { email: 'yandeyp.innov@0w44tyfiv.org', issue: 'Feature Request', priority: 'LOW' }
            ].map((ticket, index) => (
              <div key={index} className="flex items-center justify-between p-3 glass-ultra-thin rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#e71d36]"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ticket.email}</p>
                    <p className="text-xs text-gray-600">{ticket.issue}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  ticket.priority === 'HIGH' ? 'bg-[#e71d36] text-white' :
                  ticket.priority === 'MEDIUM' ? 'bg-[#ffe882] text-gray-900' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {ticket.priority}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Customer Demographic</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#e71d36]"></div>
                <span className="text-gray-600">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600">Inactive</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <svg viewBox="0 0 1000 500" className="w-full h-full">
              <path d="M 50,250 Q 150,100 250,250 T 450,250 T 650,250 T 850,250 T 950,250"
                    fill="none"
                    stroke="#e71d36"
                    strokeWidth="120"
                    opacity="0.3"/>
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

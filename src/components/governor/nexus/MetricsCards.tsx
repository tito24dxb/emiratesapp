import { Users, MessageCircle, Activity, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFirestoreCollection } from '../../../hooks/useFirestoreRealtime';
import { where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface SystemStatus {
  chatEnabled?: boolean;
  quizEnabled?: boolean;
  aiEnabled?: boolean;
  downloadsEnabled?: boolean;
}

export default function MetricsCards() {
  const { data: allUsers } = useFirestoreCollection('users');
  const { data: conversations } = useFirestoreCollection('conversations');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const statusDoc = await getDoc(doc(db, 'systemControl', 'status'));
        if (statusDoc.exists()) {
          setSystemStatus(statusDoc.data() as SystemStatus);
        }
      } catch (error) {
        console.error('Error fetching system status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
  }, []);

  const activeUsers = allUsers.filter((user: any) => user.status === 'online').length;
  const totalUsers = allUsers.length;
  const activeConversations = conversations.length;

  const systemHealth = loading ? 100 : (
    (systemStatus.chatEnabled ? 25 : 0) +
    (systemStatus.quizEnabled ? 25 : 0) +
    (systemStatus.aiEnabled ? 25 : 0) +
    (systemStatus.downloadsEnabled ? 25 : 0)
  );

  const metrics = [
    {
      label: 'Active Users',
      value: loading ? '...' : `${activeUsers}/${totalUsers}`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : '0%',
    },
    {
      label: 'Conversations',
      value: loading ? '...' : activeConversations.toString(),
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      change: activeConversations > 0 ? 'Active' : 'None',
    },
    {
      label: 'System Health',
      value: `${systemHealth}%`,
      icon: Activity,
      color: 'from-emerald-500 to-emerald-600',
      change: systemHealth === 100 ? 'Optimal' : 'Degraded',
    },
    {
      label: 'AI Assistant',
      value: loading ? '...' : (systemStatus.aiEnabled ? 'Online' : 'Offline'),
      icon: Brain,
      color: 'from-orange-500 to-orange-600',
      change: systemStatus.aiEnabled ? 'Active' : 'Disabled',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="backdrop-blur-lg bg-white/80 rounded-xl p-6 shadow-lg border border-gray-200/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600 px-2 py-1 bg-gray-100 rounded-full">
                {metric.change}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
            <div className="text-sm text-gray-600">{metric.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

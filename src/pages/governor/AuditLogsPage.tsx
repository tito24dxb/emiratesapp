import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Search, X } from 'lucide-react';
import { auditLogService, AuditLog } from '../../services/auditLogService';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    category: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filterObj: any = {};
      if (filters.userId) filterObj.userId = filters.userId;
      if (filters.category) filterObj.category = filters.category;

      const fetchedLogs = await auditLogService.getLogs(filterObj, 100);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = await auditLogService.exportToCSV(logs);
      auditLogService.downloadCSV(csvContent, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs');
    }
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      category: '',
      startDate: '',
      endDate: ''
    });
  };

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    return (
      log.userEmail.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.category.toLowerCase().includes(query)
    );
  });

  const categories = ['role_change', 'feature_shutdown', 'moderation', 'admin_action', 'system'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#D71920] to-[#B91518] bg-clip-text text-transparent">
              Audit Logs
            </h1>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                <Filter className="w-5 h-5" />
                Filters
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                disabled={logs.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </motion.button>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none"
            />
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-gray-100 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#D71920] font-semibold hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">User ID</label>
                  <input
                    type="text"
                    value={filters.userId}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                    placeholder="Enter user ID"
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadLogs}
                className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
              >
                Apply Filters
              </motion.button>
            </motion.div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <h3 className="text-xl font-bold text-gray-700 mb-2">No audit logs found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date/Time</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">User</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Action</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>{log.createdAt.toDate().toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {log.createdAt.toDate().toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{log.userEmail}</div>
                        <div className="text-xs text-gray-500">{log.userId.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{log.action}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          log.category === 'role_change' ? 'bg-blue-100 text-blue-700' :
                          log.category === 'feature_shutdown' ? 'bg-orange-100 text-orange-700' :
                          log.category === 'moderation' ? 'bg-red-100 text-red-700' :
                          log.category === 'admin_action' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Send, AlertCircle } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface CommandResponse {
  success: boolean;
  message: string;
  timestamp: Date;
}

export default function CommandConsole() {
  const { currentUser } = useApp();
  const [command, setCommand] = useState('');
  const [responses, setResponses] = useState<CommandResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const isGovernor = currentUser?.role === 'governor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !isGovernor) return;

    setLoading(true);

    try {
      const commandResponse: CommandResponse = {
        success: true,
        message: `Command "${command}" received. Cloud Function integration pending.`,
        timestamp: new Date(),
      };

      setResponses((prev) => [commandResponse, ...prev]);
      setCommand('');
    } catch (error) {
      const errorResponse: CommandResponse = {
        success: false,
        message: `Error executing command: ${error}`,
        timestamp: new Date(),
      };
      setResponses((prev) => [errorResponse, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-5 h-5 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Command Console</h2>
        {!isGovernor && (
          <span className="ml-auto text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded border border-yellow-700 uppercase tracking-wide font-bold">
            View Only
          </span>
        )}
      </div>

      {!isGovernor && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-300">
            Sub-governors can view console logs but cannot execute commands.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={isGovernor ? "Enter command (e.g., /shutdown chat)" : "Command execution disabled"}
            disabled={!isGovernor || loading}
            className="flex-1 px-4 py-3 bg-slate-950 text-green-400 font-mono text-sm rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isGovernor || loading || !command.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 border border-blue-500 shadow-lg uppercase tracking-wide"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Execute
          </button>
        </div>
      </form>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {responses.length === 0 ? (
          <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-700">
            <Terminal className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No commands executed yet</p>
            <p className="text-xs text-slate-500 mt-1">Commands: /shutdown, /disable, /lock, /downgrade</p>
          </div>
        ) : (
          responses.map((response, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-lg border ${
                response.success
                  ? 'bg-green-950/50 border-green-700'
                  : 'bg-red-950/50 border-red-700'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-xs font-bold uppercase tracking-wide ${
                  response.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {response.success ? 'SUCCESS' : 'ERROR'}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">{response.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {response.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-950/30 border border-blue-800 rounded-lg">
        <p className="text-xs text-blue-300">
          <strong>Note:</strong> Cloud Function endpoint (/runGovernorCommand) needs to be implemented for live command execution.
        </p>
      </div>
    </motion.div>
  );
}

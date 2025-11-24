import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ActivityAccessGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  requireStaff?: boolean;
  fallbackPath?: string;
  showMessage?: boolean;
}

export default function ActivityAccessGuard({
  children,
  requiredRoles = [],
  requireStaff = false,
  fallbackPath = '/activities',
  showMessage = true
}: ActivityAccessGuardProps) {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const staffRoles = ['governor', 'mentor', 'coach', 'trainer', 'moderator'];
  const isStaff = currentUser.role && staffRoles.includes(currentUser.role);
  const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.includes(currentUser.role || '');

  if (requireStaff && !isStaff) {
    if (showMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl max-w-lg w-full p-8 border border-white/50">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Staff Access Required
            </h2>
            <p className="text-gray-600 text-center mb-6">
              You need staff privileges to access activity management features.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Required Roles:</p>
                  <p>{staffRoles.join(', ')}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = fallbackPath}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
            >
              Back to Activities
            </button>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  if (!hasRequiredRole) {
    if (showMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl max-w-lg w-full p-8 border border-white/50">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Insufficient Permissions
            </h2>
            <p className="text-gray-600 text-center mb-6">
              You don't have the required role to access this feature.
            </p>
            {requiredRoles.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Required Roles:</p>
                    <p>{requiredRoles.join(', ')}</p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => window.location.href = fallbackPath}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
            >
              Back to Activities
            </button>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

export function useActivityAccess() {
  const { currentUser } = useApp();

  const staffRoles = ['governor', 'mentor', 'coach', 'trainer', 'moderator'];
  const isStaff = currentUser?.role && staffRoles.includes(currentUser.role);
  const isGovernor = currentUser?.role === 'governor';

  const canCreateActivities = isStaff;
  const canManageActivities = isStaff;
  const canViewAllActivities = isStaff;
  const canDeleteActivities = isGovernor;
  const canExportData = isStaff;
  const canViewAttendance = isStaff;

  return {
    isStaff,
    isGovernor,
    canCreateActivities,
    canManageActivities,
    canViewAllActivities,
    canDeleteActivities,
    canExportData,
    canViewAttendance,
  };
}

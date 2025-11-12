import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  HelpCircle,
  Users,
  Upload,
  Bell,
  Settings,
  BarChart3,
  Shield,
  FolderOpen,
  MessagesSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) return null;

  const studentLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/courses', icon: BookOpen, label: 'Courses' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/support', icon: HelpCircle, label: 'Support' },
  ];

  const mentorLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
  ];

  const governorLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/maintenance', icon: Settings, label: 'Maintenance' },
    { path: '/hub', icon: FolderOpen, label: 'Hub' },
    { path: '/conversations', icon: MessagesSquare, label: 'Conversations' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const links =
    currentUser.role === 'governor' ? governorLinks :
    currentUser.role === 'mentor' ? mentorLinks :
    studentLinks;

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 shadow-sm md:h-[calc(100vh-4rem)] md:sticky md:top-16 overflow-y-auto">
      <div className="p-3 md:p-4">
        {currentUser.role === 'governor' && (
          <div className="mb-3 md:mb-4 p-2 md:p-3 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-[#000000] rounded-lg md:rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm font-bold">Governor Access</span>
            </div>
            <p className="text-xs text-yellow-900 hidden md:block">Full system control</p>
          </div>
        )}

        <nav className="flex md:flex-col gap-1 md:space-y-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl transition whitespace-nowrap md:whitespace-normal ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D71921] to-[#B91518] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#EADBC8]'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="font-medium text-xs md:text-base">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

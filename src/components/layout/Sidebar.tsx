import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  HelpCircle,
  Users,
  GraduationCap,
  Brain,
  Plane,
  Briefcase,
  Crown,
  Lock,
  Calendar,
  UserCircle,
  Zap,
  Shield,
  Trophy,
  TrendingUp,
  BarChart3,
  Flag,
  HardDrive,
  Clock,
  Rss,
  ShoppingBag,
  DollarSign,
  Package,
  ClipboardList
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { checkFeatureAccess, Feature } from '../../utils/featureAccess';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const { currentUser } = useApp();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentUser) return null;

  const getStudentLinks = () => {
    const aiTrainerAccess = checkFeatureAccess(currentUser, 'ai-trainer');
    const simulatorAccess = checkFeatureAccess(currentUser, 'simulator');
    const recruitersAccess = checkFeatureAccess(currentUser, 'recruiters');
    const openDaysAccess = checkFeatureAccess(currentUser, 'opendays');
    const chatAccess = checkFeatureAccess(currentUser, 'chat');

    const baseLinks = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', feature: null },
      { path: '/my-progress', icon: TrendingUp, label: 'My Progress', feature: null },
      { path: '/courses', icon: BookOpen, label: 'Courses', feature: null },
      {
        path: '/ai-trainer',
        icon: Brain,
        label: 'AI Trainer',
        locked: !aiTrainerAccess.allowed,
        feature: 'ai-trainer' as Feature
      },
      {
        path: '/open-day',
        icon: Plane,
        label: 'Open Day Sim',
        locked: !simulatorAccess.allowed,
        feature: 'simulator' as Feature
      },
      {
        path: '/chat',
        icon: MessageCircle,
        label: 'Chat',
        locked: !chatAccess.allowed,
        feature: 'chat' as Feature
      },
      {
        path: '/community-feed',
        icon: Rss,
        label: 'Community Feed',
        feature: null
      },
      {
        path: '/recruiters',
        icon: Briefcase,
        label: 'Recruiters',
        locked: !recruitersAccess.allowed,
        feature: 'recruiters' as Feature
      },
      {
        path: '/open-days',
        icon: Calendar,
        label: 'Open Days',
        locked: !openDaysAccess.allowed,
        feature: 'opendays' as Feature
      },
      { path: '/leaderboard', icon: Trophy, label: 'Leaderboard', feature: null },
      ...(currentUser.plan === 'pro' || currentUser.plan === 'vip' ? [
        { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace', feature: null, badge: 'PRO' },
        { path: '/storage', icon: HardDrive, label: 'My Files', feature: null, badge: 'PRO' },
        { path: '/login-activity', icon: Clock, label: 'Login Activity', feature: null, badge: 'PRO' }
      ] : []),
      { path: '/profile', icon: UserCircle, label: 'Profile', feature: null },
      { path: '/support', icon: HelpCircle, label: 'Support', feature: null },
      { path: '/upgrade', icon: Crown, label: 'Upgrade Plan', highlight: currentUser.plan !== 'vip', feature: null },
      ...(currentUser.role !== 'student' ? [{ path: '/support-manager', icon: MessageCircle, label: 'Support Manager', feature: null }] : [])
    ];

    return baseLinks;
  };

  const studentLinks = currentUser.role === 'student' ? getStudentLinks() : [];

  const mentorLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/coach-dashboard', icon: GraduationCap, label: 'Coach Dashboard', highlight: true },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/community-feed', icon: Rss, label: 'Community Feed' },
    { path: '/recruiters', icon: Briefcase, label: 'Recruiters' },
    { path: '/open-days', icon: Calendar, label: 'Open Days' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace', badge: 'NEW' },
    { path: '/seller/dashboard', icon: Package, label: 'Seller Dashboard', badge: 'NEW' },
    { path: '/seller/billing', icon: DollarSign, label: 'My Earnings', badge: 'NEW' },
    { path: '/attendance', icon: ClipboardList, label: 'Attendance', badge: 'NEW' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const financeLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/finance-dashboard', icon: DollarSign, label: 'Finance Dashboard', highlight: true, badge: 'NEW' },
    { path: '/seller/billing', icon: TrendingUp, label: 'Revenue Overview' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { path: '/community-feed', icon: Rss, label: 'Community Feed' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const moderatorLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/moderator-dashboard', icon: Shield, label: 'Moderator Dashboard', highlight: true, badge: 'NEW' },
    { path: '/community-feed', icon: Rss, label: 'Community Feed' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const governorLinks = [
    { path: '/governor/nexus', icon: Zap, label: 'Control Nexus', highlight: true },
    { path: '/governor/analytics', icon: BarChart3, label: 'Analytics', badge: 'NEW' },
    { path: '/governor/feature-flags', icon: Flag, label: 'Feature Flags', badge: 'NEW' },
    { path: '/governor/audit-logs', icon: Shield, label: 'Audit Logs', badge: 'NEW' },
    { path: '/moderator-dashboard', icon: Shield, label: 'Moderator Dashboard', badge: 'NEW' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/coach-dashboard', icon: GraduationCap, label: 'Coach Dashboard' },
    { path: '/ai-trainer', icon: Brain, label: 'AI Trainer', badge: 'ALL' },
    { path: '/open-day', icon: Plane, label: 'Open Day Sim', badge: 'ALL' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/community-feed', icon: Rss, label: 'Community Feed', badge: 'NEW' },
    { path: '/recruiters', icon: Briefcase, label: 'Recruiters' },
    { path: '/open-days', icon: Calendar, label: 'Open Days' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace', badge: 'NEW' },
    { path: '/seller/dashboard', icon: Package, label: 'Seller Dashboard', badge: 'NEW' },
    { path: '/seller/billing', icon: DollarSign, label: 'My Earnings', badge: 'NEW' },
    { path: '/attendance', icon: ClipboardList, label: 'Attendance', badge: 'NEW' },
    { path: '/support-manager', icon: MessageCircle, label: 'Support Manager' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/storage', icon: HardDrive, label: 'Storage Manager' },
    { path: '/login-activity', icon: Clock, label: 'Login Activity' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
    { path: '/support', icon: HelpCircle, label: 'Support' },
  ];

  const links =
    currentUser.role === 'governor' ? governorLinks :
    currentUser.role === 'mentor' ? mentorLinks :
    currentUser.role === 'finance' ? financeLinks :
    currentUser.role === 'moderator' ? moderatorLinks :
    studentLinks;

  return (
    <>
      {/* Horizontal Sidebar - Always show on all pages */}
      <aside className="w-full liquid-sidebar border-b border-white/20 relative z-40">
        <div className="p-3">
          <nav className="flex gap-1 overflow-x-auto pb-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              const isLocked = 'locked' in link && link.locked;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'glass-primary text-gray-900 shadow-xl'
                      : isLocked
                      ? 'text-gray-400 glass-ultra-thin opacity-60'
                      : 'text-gray-700 glass-button-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-xs">{link.label}</span>
                  {isLocked && <Lock className="w-3 h-3 flex-shrink-0" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Desktop Collapsible Sidebar - Hidden, replaced by horizontal bar */}
      <motion.aside
        className="hidden liquid-sidebar border-r border-white/20 min-h-screen h-full sticky top-0 overflow-y-auto overflow-x-visible z-40"
        style={{ scrollbarWidth: 'thin' }}
        initial={{ width: '5rem' }}
        animate={{ width: isExpanded ? '16rem' : '5rem' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="p-3 h-full flex flex-col">
          {currentUser.role === 'governor' && (
            <motion.div
              className="mb-3 p-3 glass-primary text-gray-900 rounded-2xl shadow-xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: isExpanded ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 flex-shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-bold whitespace-nowrap">Governor Access</span>
                )}
              </div>
              {isExpanded && (
                <p className="text-xs text-gray-600">Full system control</p>
              )}
            </motion.div>
          )}

          <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-visible scrollbar-thin scrollbar-thumb-gray-400/20 scrollbar-track-transparent py-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              const isLocked = 'locked' in link && link.locked;
              const badge = 'badge' in link ? link.badge : undefined;
              const highlight = 'highlight' in link && link.highlight;

              return (
                <div key={link.path} className="relative">
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl relative transition-all ${
                      isActive
                        ? 'glass-primary text-gray-900'
                        : highlight
                        ? 'glass-primary text-gray-900 font-bold'
                        : isLocked
                        ? 'text-gray-400 glass-ultra-thin opacity-60'
                        : 'text-gray-700 glass-button-secondary hover:glass-primary hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="flex items-center gap-2 flex-1 overflow-hidden"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="font-medium text-sm whitespace-nowrap">{link.label}</span>
                          {isLocked && <Lock className="w-3.5 h-3.5 flex-shrink-0" />}
                          {badge && (
                            <span
                              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                badge === 'VIP'
                                  ? 'bg-gradient-to-r from-[#3D4A52] to-[#2A3439] text-white'
                                  : 'bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white'
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>

                  {/* Tooltip on hover when collapsed */}
                  {!isExpanded && (
                    <motion.div
                      className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 z-50"
                      initial={{ opacity: 0, x: -10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'none' }}
                    >
                      {link.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </motion.aside>
    </>
  );
}
